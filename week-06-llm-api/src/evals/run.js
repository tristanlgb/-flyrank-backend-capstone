import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { enrichBook, PROMPT_VERSION } from '../llm.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(await readFile(path.join(here, '..', '..', 'evals', 'cases.json')));
const real = process.env.EVAL_USE_REAL === '1';
const env = real ? { ...process.env, LLM_STUB: '0' } : { ...process.env, LLM_STUB: '1' };
let passed = 0;

console.log(`Evaluation mode: ${real ? 'real provider' : 'deterministic stub'}`);
for (const item of cases) {
  const result = await enrichBook(item.input, env);
  const ok = Boolean(result?.data && result.data.category === item.expected && (!item.flag || result.data.quality_flags.includes(item.flag)));
  passed += Number(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${item.label}`);
}

const score = Math.round((passed / cases.length) * 100);
console.log(`Score: ${passed}/${cases.length} (${score}%) · prompt ${PROMPT_VERSION} · ${new Date().toISOString().slice(0, 10)}`);
if (passed !== cases.length) process.exitCode = 1;
