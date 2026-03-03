import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

/**
 * Filecoin Storage API Route
 * Stores data on Filecoin Calibration Testnet using filecoin-pin CLI
 * 
 * Required env vars:
 * - FILECOIN_WALLET_PRIVATE_KEY
 * - FILECOIN_RPC_URL (optional, defaults to calibration)
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const { data, type = 'data', metadata = {} } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'No data provided' },
        { status: 400 }
      );
    }

    // Check if filecoin-pin is installed
    try {
      execSync('filecoin-pin --version', { stdio: 'pipe' });
    } catch (e) {
      console.warn('filecoin-pin CLI not found, falling back to mock mode');
      return mockStore(data, type, metadata);
    }

    // Prepare data for storage
    const timestamp = Date.now();
    const dataWrapper = {
      type,
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        ...metadata,
        app: 'proof-of-action',
        version: '1.0.0'
      }
    };

    // Store using filecoin-pin
    const result = storeOnFilecoin(dataWrapper);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Filecoin storage error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to store on Filecoin',
        success: false 
      },
      { status: 500 }
    );
  }
}

/**
 * Store data using filecoin-pin CLI
 */
function storeOnFilecoin(dataWrapper) {
  try {
    // Create a temporary JSON file with the data
    const fs = require('fs');
    const os = require('os');
    
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `poa-data-${Date.now()}.json`);
    
    fs.writeFileSync(tempFile, JSON.stringify(dataWrapper, null, 2));

    // Upload to Filecoin using filecoin-pin
    const result = execSync(
      `filecoin-pin upload "${tempFile}" --json`,
      { 
        encoding: 'utf-8',
        timeout: 120000, // 2 minutes timeout
        env: {
          ...process.env,
          // Ensure calibration testnet
          FILECOIN_NETWORK: 'calibration'
        }
      }
    );

    // Clean up temp file
    fs.unlinkSync(tempFile);

    // Parse the result
    const uploadResult = JSON.parse(result);
    
    return {
      success: true,
      cid: uploadResult.cid || uploadResult.root,
      url: `https://calibration.filscan.io/en/cid/${uploadResult.cid || uploadResult.root}`,
      timestamp: dataWrapper.timestamp,
      type: dataWrapper.type,
      network: 'filecoin_calibration',
      explorer: `https://calibration.filscan.io/en/cid/${uploadResult.cid || uploadResult.root}`,
      ipfs: `https://ipfs.io/ipfs/${uploadResult.cid || uploadResult.root}`
    };

  } catch (error) {
    console.error('filecoin-pin execution error:', error);
    throw new Error(`Filecoin storage failed: ${error.message}`);
  }
}

/**
 * Mock storage fallback (for development without CLI)
 */
function mockStore(data, type, metadata) {
  const timestamp = Date.now();
  const mockCid = `bafybei${Math.random().toString(36).substring(2, 15)}${timestamp.toString(36)}`;
  
  return NextResponse.json({
    success: true,
    cid: mockCid,
    url: `https://calibration.filscan.io/en/cid/${mockCid}`,
    timestamp: new Date().toISOString(),
    type,
    network: 'mock_local',
    isMock: true,
    message: 'Running in mock mode. Install filecoin-pin CLI for real storage: npm install -g filecoin-pin'
  });
}

/**
 * GET: Check Filecoin storage status
 */
export async function GET() {
  try {
    execSync('filecoin-pin --version', { stdio: 'pipe' });
    return NextResponse.json({
      available: true,
      network: 'calibration',
      message: 'Filecoin Pin CLI is ready'
    });
  } catch (e) {
    return NextResponse.json({
      available: false,
      network: null,
      message: 'Filecoin Pin CLI not installed. Run: npm install -g filecoin-pin'
    });
  }
}
