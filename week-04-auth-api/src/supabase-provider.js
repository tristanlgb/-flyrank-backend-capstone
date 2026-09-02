import { createClient } from '@supabase/supabase-js';

export class SupabaseAuthProvider {
  constructor(url, anonKey) {
    if (!url || !anonKey) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
    this.url = url; this.anonKey = anonKey;
    this.mode = 'supabase';
    this.client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  async signup(email, password) {
    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error) throw error;
    return data.user;
  }
  async login(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw Object.assign(error, { code: 'INVALID_LOGIN' });
    return { access_token: data.session.access_token, refresh_token: data.session.refresh_token, user: data.user };
  }
  async verify(token) {
    const { data, error } = await this.client.auth.getUser(token);
    if (error || !data.user) throw Object.assign(error || new Error('Invalid token'), { code: 'INVALID_TOKEN' });
    return data.user;
  }
  async logout(token) {
    const scoped = createClient(this.url, this.anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await scoped.auth.signOut();
    if (error) throw error;
  }
}
