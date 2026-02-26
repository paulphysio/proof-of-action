import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

function getEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export function configureWebPush() {
  const publicKey = getEnv('VAPID_PUBLIC_KEY');
  const privateKey = getEnv('VAPID_PRIVATE_KEY');
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

  webpush.setVapidDetails(subject, publicKey, privateKey);

  return { webpush, publicKey };
}

export async function sendPush(subscription, payload) {
  const { webpush } = configureWebPush();

  const stringPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return webpush.sendNotification(subscription, stringPayload);
}
