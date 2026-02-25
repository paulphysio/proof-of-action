import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function logSupabaseError(context, error) {
  if (!error) return;

  const payload = {
    name: error?.name,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    status: error?.status,
    statusText: error?.statusText,
    stack: error?.stack
  };

  // Some Supabase/PostgREST errors have non-enumerable fields; log metadata too.
  const meta = {
    ownPropertyNames: Object.getOwnPropertyNames(error || {}),
    ownKeys: Reflect.ownKeys(error || {}),
  };

  console.error(context, payload);
  console.error(`${context} (raw error)`, error);
  console.error(`${context} (meta)`, meta);
  try {
    console.error(`${context} (stringified)`, JSON.stringify(error));
  } catch {
    // ignore
  }
}

// Create a mock client for build time when env vars are missing
const createMockClient = () => ({
  from: () => ({
    select: () => ({ data: null, error: null, single: async () => ({ data: null, error: null }) }),
    insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }), data: null, error: null }),
    update: () => ({ eq: () => ({ data: null, error: null }) }),
    or: () => ({ data: [], error: null }),
    eq: () => ({ data: [], error: null, single: async () => ({ data: null, error: null }) }),
    order: () => ({ data: [], error: null })
  })
});

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : createMockClient();


export async function getOrCreateUser(walletAddress) {
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();
  
  if (existing) return existing;
  
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({ wallet_address: walletAddress, reputation: 0 })
    .select()
    .single();
  
  if (error) {
    logSupabaseError('Error creating user', error);
    return null;
  }
  
  return newUser;
}

export async function createEmergencyRequest(
  requesterWallet,
  requestType,
  description,
  geohash
) {
  const { data, error } = await supabase
    .from('emergency_requests')
    .insert({
      requester_wallet: requesterWallet,
      request_type: requestType,
      description,
      geohash,
      status: 'open'
    })
    .select()
    .single();
  
  if (error) {
    logSupabaseError('Error creating request', error);
    return null;
  }
  
  return data;
}

export async function getNearbyRequests(geohash) {
  const prefixes = Array.isArray(geohash) ? geohash : [geohash];
  const cleaned = prefixes
    .filter((p) => typeof p === 'string' && p.trim().length > 0)
    .map((p) => p.trim());

  if (cleaned.length === 0) return [];

  const orClause = cleaned.map((p) => `geohash.like.${p}%`).join(',');

  const { data, error } = await supabase
    .from('emergency_requests')
    .select('*')
    .eq('status', 'open')
    .or(orClause);
  
  if (error) {
    logSupabaseError('Error fetching requests', error);
    return [];
  }
  
  return data || [];
}

export async function createResponse(
  requestId,
  responderWallet
) {
  const { data, error } = await supabase
    .from('responses')
    .insert({
      request_id: requestId,
      responder_wallet: responderWallet,
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) {
    logSupabaseError('Error creating response', error);
    return null;
  }
  
  await supabase
    .from('emergency_requests')
    .update({ status: 'in_progress' })
    .eq('id', requestId);
  
  return data;
}

export async function createVerification(
  requestId,
  responderWallet,
  confidenceScore,
  verified
) {
  const { data, error } = await supabase
    .from('action_verifications')
    .insert({
      request_id: requestId,
      responder_wallet: responderWallet,
      confidence_score: confidenceScore,
      verified
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating verification:', error);
    return null;
  }
  
  if (verified) {
    await createReward(responderWallet, 10, 'Verified helpful action');
    await updateReputation(responderWallet, 5);
  }
  
  return data;
}

export async function createReward(
  walletAddress,
  amount,
  reason
) {
  const { data, error } = await supabase
    .from('rewards')
    .insert({
      wallet_address: walletAddress,
      amount,
      reason
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating reward:', error);
    return null;
  }
  
  return data;
}

export async function updateReputation(walletAddress, points) {
  const { data: user } = await supabase
    .from('users')
    .select('reputation')
    .eq('wallet_address', walletAddress)
    .single();
  
  if (user) {
    await supabase
      .from('users')
      .update({ reputation: user.reputation + points })
      .eq('wallet_address', walletAddress);
  }
}

export async function getUserReputation(walletAddress) {
  const { data } = await supabase
    .from('users')
    .select('reputation')
    .eq('wallet_address', walletAddress)
    .single();
  
  return data?.reputation || 0;
}

export async function getUserRewards(walletAddress) {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('wallet_address', walletAddress)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching rewards:', error);
    return [];
  }
  
  return data || [];
}

export async function getMyRequests(walletAddress) {
  const { data, error } = await supabase
    .from('emergency_requests')
    .select('*')
    .eq('requester_wallet', walletAddress)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching my requests:', error);
    return [];
  }
  
  return data || [];
}

export async function getMyResponses(walletAddress) {
  const { data, error } = await supabase
    .from('responses')
    .select(`
      *,
      request:emergency_requests(*)
    `)
    .eq('responder_wallet', walletAddress)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching my responses:', error);
    return [];
  }
  
  return data || [];
}
