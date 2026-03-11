// src/app/api/filecoin/get-balance/route.js
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const address = url.searchParams.get('address');
    if (!address) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const rpcRes = await fetch('https://api.calibration.node.glif.io/rpc/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    const data = await rpcRes.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message || 'RPC error' }, { status: 500 });
    }

    return NextResponse.json({ balance: data.result }); // attoFIL
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}