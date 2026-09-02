export function isAllowedByRobots(text, pathname, userAgent = '*') {
  const lines = text.split(/\r?\n/).map((line) => line.split('#')[0].trim()).filter(Boolean);
  let applies = false; const disallowed = [];
  for (const line of lines) {
    const [keyRaw, ...rest] = line.split(':'); const key = keyRaw.toLowerCase(); const value = rest.join(':').trim();
    if (key === 'user-agent') applies = value === '*' || value.toLowerCase() === userAgent.toLowerCase();
    if (applies && key === 'disallow' && value) disallowed.push(value);
  }
  return !disallowed.some((rule) => pathname.startsWith(rule));
}

export async function checkRobots(baseUrl, fetchFn, userAgent) {
  const url = new URL('/robots.txt', baseUrl);
  const response = await fetchFn(url, { headers: { 'User-Agent': userAgent } });
  if (response.status === 404) return { allowed: true, note: 'robots.txt not published (404)' };
  if (!response.ok) throw new Error(`robots.txt request failed with ${response.status}`);
  return { allowed: isAllowedByRobots(await response.text(), new URL(baseUrl).pathname, userAgent), note: 'robots.txt checked' };
}
