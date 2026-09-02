import 'dotenv/config';
import { createApp } from './app.js';
import { SupabaseAuthProvider } from './supabase-provider.js';

const provider = new SupabaseAuthProvider(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const port = Number(process.env.PORT || 3002);
createApp(provider).listen(port, () => console.log(`Auth API: http://localhost:${port} · Swagger: /docs`));
