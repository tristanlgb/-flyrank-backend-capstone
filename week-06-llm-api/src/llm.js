import OpenAI from 'openai';
import { readFile, mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { outputSchema } from './schema.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PROMPT_VERSION = 'enrich-book-v1';

export function stub(input) {
  const text = `${input.title} ${input.description}`.toLowerCase();
  const category = /node|javascript|code|software/.test(text) ? 'technology'
    : /business|market|startup/.test(text) ? 'business'
      : /history|biography|science|nonfiction/.test(text) ? 'nonfiction'
        : /novel|story|fiction/.test(text) ? 'fiction' : 'other';
  const flags = [input.description.length < 20 && 'missing_context', input.price > 500 && 'suspicious_price', input.rating <= 2 && 'low_rating'].filter(Boolean);
  return { category, summary: `${input.title} is classified from the supplied catalogue information.`.slice(0, 160), quality_flags: flags.length ? flags : ['none'], confidence: category === 'other' ? 0.35 : 0.9 };
}

export function isTimeout(error) {
  return error?.name === 'AbortError' || error?.name === 'APIConnectionTimeoutError' || ['ETIMEDOUT', 'ECONNABORTED'].includes(error?.code);
}

function canRetry(error) { return isTimeout(error) || error?.status === 429 || error?.status >= 500; }

function retryAfterMs(error) {
  const value = error?.headers?.get?.('retry-after') ?? error?.headers?.['retry-after'];
  if (value == null) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

export async function callWithRetry(client, params, options = {}) {
  const sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  const random = options.random ?? Math.random;
  const logger = options.logger ?? console;
  const maxAttempts = options.maxAttempts ?? 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const started = performance.now();
    try {
      const response = await client.chat.completions.create(params);
      logger.info(JSON.stringify({ event: 'llm_transport', attempt, outcome: 'success', model: params.model, inputTokens: response.usage?.prompt_tokens ?? null, outputTokens: response.usage?.completion_tokens ?? null, durationMs: Math.round(performance.now() - started) }));
      return response;
    } catch (error) {
      const retryable = canRetry(error);
      logger.warn?.(JSON.stringify({ event: 'llm_transport', attempt, outcome: 'error', model: params.model, status: error?.status ?? null, timeout: isTimeout(error), retryable, durationMs: Math.round(performance.now() - started) }));
      if (!retryable || attempt === maxAttempts) throw error;
      await sleep(retryAfterMs(error) ?? (1000 * (2 ** (attempt - 1)) + Math.round(random() * 250)));
    }
  }
}

function estimateCost(usage, env) {
  const input = (usage?.prompt_tokens ?? 0) * Number(env.LLM_INPUT_USD_PER_MILLION || 0);
  const output = (usage?.completion_tokens ?? 0) * Number(env.LLM_OUTPUT_USD_PER_MILLION || 0);
  return Number(((input + output) / 1_000_000).toFixed(8));
}

async function writeQuarantine(record) {
  const directory = path.join(root, 'logs');
  await mkdir(directory, { recursive: true });
  await appendFile(path.join(directory, 'quarantine.jsonl'), `${JSON.stringify(record)}\n`);
}

export async function enrichBook(input, env = process.env, dependencies = {}) {
  if (env.LLM_ENABLED === 'false') return { data: stub(input), meta: { provider: 'fallback', promptVersion: PROMPT_VERSION, repairs: 0 } };
  if (env.LLM_STUB === '1' || !env.LLM_API_KEY) return { data: stub(input), meta: { provider: 'stub', promptVersion: PROMPT_VERSION, repairs: 0 } };

  const prompt = await readFile(path.join(root, 'prompts', `${PROMPT_VERSION}.md`), 'utf8');
  const model = env.LLM_MODEL || 'openrouter/free';
  const client = dependencies.client ?? new OpenAI({ apiKey: env.LLM_API_KEY, baseURL: env.LLM_BASE_URL, timeout: Math.min(Number(env.LLM_TIMEOUT_MS) || 30000, 60000), maxRetries: 0 });
  const logger = dependencies.logger ?? console;
  const transport = dependencies.call ?? (params => callWithRetry(client, params, { sleep: dependencies.sleep, random: dependencies.random, logger }));
  const quarantine = dependencies.quarantine ?? writeQuarantine;
  const started = performance.now();
  const messages = [{ role: 'system', content: prompt }, { role: 'user', content: JSON.stringify(input) }];
  let raw = '';

  for (let repairs = 0; repairs <= 1; repairs += 1) {
    const response = await transport({ model, temperature: 0, messages: repairs === 0 ? messages : [...messages, { role: 'assistant', content: raw }, { role: 'user', content: 'Return corrected JSON only. It must satisfy the schema exactly.' }] });
    raw = response.choices[0]?.message?.content ?? '';
    try {
      const data = outputSchema.parse(JSON.parse(raw));
      logger.info(JSON.stringify({ event: 'llm_result', promptVersion: PROMPT_VERSION, model, inputTokens: response.usage?.prompt_tokens ?? null, outputTokens: response.usage?.completion_tokens ?? null, estimatedCostUsd: estimateCost(response.usage, env), durationMs: Math.round(performance.now() - started), repairs }));
      return { data, meta: { provider: 'model', promptVersion: PROMPT_VERSION, repairs } };
    } catch (error) {
      if (repairs === 1) {
        await quarantine({ at: new Date().toISOString(), input, error: error.message, promptVersion: PROMPT_VERSION, model, raw });
        return null;
      }
    }
  }
}
