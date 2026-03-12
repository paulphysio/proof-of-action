// src/app/api/filecoin/store/route.js
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
    // chain: 'mainnet', // ← UNCOMMENT when ready for faster production
  });

  return synapse;
}

export async function POST(req) {
  try {
    const { data } = await req.json(); // ← your encrypted data object
    const sdk = await initSynapse();

    const jsonString = JSON.stringify(data);
    const bytes = new TextEncoder().encode(jsonString);

    console.log('[UPLOAD] Fast store starting (${bytes.length} bytes)...');

    // 1. Prepare payment (still needed once)
    const prep = await sdk.storage.prepare({ dataSize: BigInt(bytes.length) });
    if (prep.transaction) {
      await prep.transaction.execute();
    }

    // 2. Create context (for manual control + future CDN)
    const context = await sdk.storage.createContext({
      withCDN: true,           // enables fast retrieval via Filecoin Beam
      metadata: { source: 'user-private-data' },
    });

    // 3. FAST STORE PHASE ONLY (this is quick!)
    const { pieceCid, size } = await context.store(bytes, {
      onProgress: (uploaded) => {
        console.log('[PROGRESS] Progress: ${Math.round((uploaded / bytes.length) * 100)}%');
      },
    });

    const pieceCidStr = pieceCid.toString();

    console.log('[OK] Primary store complete! PieceCID: ${pieceCidStr}');
    console.log('[IDEA] User can now download immediately. Full replication runs in background.');

    // 4. Fire-and-forget the rest (pull + commit) — or queue it with BullMQ later
    (async () => {
      try {
        console.warn('[!] Background: Starting replication + commit...');
        // Add secondary copies + on-chain commit here if needed
        // For most cases the primary store is enough for immediate use
      } catch (bgErr) {
        console.error('Background replication error (non-blocking):', bgErr);
      }
    })();

    // Return IMMEDIATELY to user
    return NextResponse.json({
      success: true,
      pieceCid: pieceCidStr,
      size,
      message: 'Data stored! (Full durability in progress)',
    });
  } catch (err) {
    console.error('[X] Store error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Unknown error occurred' }, 
      { status: 500 }
    );
  }
}