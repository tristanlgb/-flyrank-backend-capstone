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

export async function checkRobots(baseUrl, fetcher) {
  const url = new URL('/robots.txt', baseUrl);
  try { const response = await fetcher.get(url, 'robots.txt'); return { allowed: isAllowedByRobots(response.text, '/catalogue/', fetcher.userAgent), note: 'robots.txt checked' }; }
  catch (error) { if (error.message === 'HTTP 404') return { allowed: true, note: 'no robots file found' }; throw error; }
}
