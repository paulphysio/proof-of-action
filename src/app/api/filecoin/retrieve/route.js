// src/app/api/filecoin/retrieve/route.js
import { NextResponse } from 'next/server';
import { Synapse } from '@filoz/synapse-sdk';
import { privateKeyToAccount } from 'viem/accounts';

let synapse = null;

async function initSynapse() {
  if (synapse) return synapse;

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('PRIVATE_KEY not set in .env');

  synapse = await Synapse.create({
    account: privateKeyToAccount(privateKey),
    rpcURL: process.env.FILECOIN_RPC_URL || 'https://api.calibration.node.glif.io/rpc/v1',
    source: 'nextjs-filecoin-app',
  });

  return synapse;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let pieceCid = searchParams.get('pieceCid');
    if (!pieceCid) throw new Error('pieceCid is required');

    // Extra safety (in case old bad URL lingers)
    if (pieceCid.includes('object')) {
      throw new Error('Invalid PieceCID format received');
    }

    console.log('🔄 Downloading PieceCID:', pieceCid);

    const sdk = await initSynapse();
    const bytes = await sdk.storage.download({ pieceCid });
    const text = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(text);

    return NextResponse.json({ success: true, data: parsed });
  } catch (err) {
    console.error('❌ Retrieve error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}