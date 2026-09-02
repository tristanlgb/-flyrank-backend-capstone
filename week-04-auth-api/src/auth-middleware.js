export function createRequireAuth(provider) {
  return async function requireAuth(req, res, next) {
    const header = req.get('authorization');
    if (!header?.startsWith('Bearer ') || header.slice(7).trim() === '') return res.status(401).json({ error: 'Access token required' });
    const token = header.slice(7).trim();
    try {
      req.auth = { token, user: await provider.verify(token) };
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}
