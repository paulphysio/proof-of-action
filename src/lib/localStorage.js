/**
 * Local Storage Utilities for Filecoin UI Updates
 * Provides consistent localStorage operations across the application
 */

export function getFilecoinStorage() {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    return JSON.parse(localStorage.getItem('filecoinStorage') || '[]');
  } catch (error) {
    console.warn('Failed to read filecoinStorage from localStorage:', error);
    return [];
  }
}

export function saveFilecoinStorageRecord(record) {
  if (typeof window === 'undefined') {
    console.log('📝 Running on server-side - cannot update localStorage');
    return false;
  }
  
  try {
    const existingRecords = getFilecoinStorage();
    existingRecords.push(record);
    localStorage.setItem('filecoinStorage', JSON.stringify(existingRecords));
    console.log('💾 Filecoin storage record saved to localStorage');
    
    // Trigger UI update event
    window.dispatchEvent(new CustomEvent('filecoin-storage-updated', {
      detail: { record, totalRecords: existingRecords.length }
    }));
    console.log('🔄 Dispatched filecoin-storage-updated event');
    
    return true;
  } catch (error) {
    console.warn('Failed to save filecoinStorage record:', error);
    return false;
  }
}

export function createFilecoinStorageRecord(data, options = {}) {
  return {
    id: `storage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    pieceCid: `bafy${Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 32)}local`,
    network: 'filecoin_calibration',
    timestamp: new Date().toISOString(),
    type: options.type || 'identity-proof',
    category: options.category || 'agent-data',
    size: JSON.stringify(data).length,
    walletAddress: '0xD410eF12B007Bbcf452767d0dD858E6fC29A4fA5',
    method: 'localStorage_direct',
    metadata: {
      ...options.metadata,
      storageMethod: 'localStorage_direct',
      confidence: 0.85,
      urgencyLevel: options.metadata?.urgencyLevel || 'normal',
      note: 'Direct localStorage update for immediate UI refresh'
    }
  };
}
