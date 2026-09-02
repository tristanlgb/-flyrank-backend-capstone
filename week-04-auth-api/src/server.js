import 'dotenv/config';
import { createApp } from './app.js';
import { LocalAuthProvider } from './local-auth-provider.js';
import { SupabaseAuthProvider } from './supabase-provider.js';

const hasSupabaseConfig = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
const provider = hasSupabaseConfig
  ? new SupabaseAuthProvider(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : new LocalAuthProvider();
const port = Number(process.env.PORT || 3002);
createApp(provider).listen(port, () => {
  console.log(`Auth API: http://localhost:${port} · Swagger: /docs · provider: ${provider.mode}`);
  if (!hasSupabaseConfig) console.warn('Local development auth is active. Add Supabase variables to .env for the real integration.');
});
