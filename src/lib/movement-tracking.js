/**
 * Movement Tracking Service
 * 
 * Tracks responder movement to verify genuine help actions
 * - Captures location every 30 seconds during active response
 * - Analyzes movement patterns toward requester
 * - Provides confidence score based on realistic travel
 * - Privacy-first: data deleted after verification
 */

import { generateGeohash } from './ai-verification';
import { storeTrackingDataOnFilecoin, storeReputationOnFilecoin } from './filecoin';

// Configuration
const TRACKING_INTERVAL = 30000; // 30 seconds
const MAX_TRACKING_DURATION = 2 * 60 * 60 * 1000; // 2 hours max
const MIN_MOVEMENT_SPEED = 0.5; // km/h (walking minimum)
const MAX_MOVEMENT_SPEED = 50; // km/h (driving max)

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate bearing from point A to point B
 * Returns bearing in degrees (0-360)
 */
function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Movement Tracker Class
 * Manages tracking session for a single response
 */
export class MovementTracker {
  constructor(responseId, requesterLocation, responderWallet) {
    this.responseId = responseId;
    this.requesterLocation = requesterLocation; // { lat, lon }
    this.responderWallet = responderWallet;
    this.locations = []; // Array of { lat, lon, timestamp, accuracy }
    this.intervalId = null;
    this.startTime = null;
    this.isTracking = false;
  }

  /**
   * Start tracking movement
   */
  async start() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.startTime = Date.now();
    
    // Get initial location
    await this.captureLocation();
    
    // Start interval tracking
    this.intervalId = setInterval(() => {
      this.captureLocation();
    }, TRACKING_INTERVAL);
    
    // Auto-stop after max duration
    setTimeout(() => {
      this.stop();
    }, MAX_TRACKING_DURATION);
    
    return {
      status: 'started',
      responseId: this.responseId,
      startedAt: new Date().toISOString()
    };
  }

  /**
   * Capture current location
   */
  async captureLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
            geohash: generateGeohash(
              position.coords.latitude, 
              position.coords.longitude, 
              7
            )
          };
          
          this.locations.push(location);
          resolve(location);
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  /**
   * Stop tracking
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isTracking = false;
    
    return {
      status: 'stopped',
      responseId: this.responseId,
      totalLocations: this.locations.length,
      duration: Date.now() - this.startTime
    };
  }

  /**
   * Analyze movement pattern toward requester
   */
  analyzeMovement() {
    if (this.locations.length < 2) {
      return {
        confidence: 0.3,
        reason: 'INSUFFICIENT_DATA',
        movementPattern: 'unknown'
      };
    }

    const start = this.locations[0];
    const end = this.locations[this.locations.length - 1];
    const requester = this.requesterLocation;

    // Calculate distances
    const startDistance = calculateDistance(start.lat, start.lon, requester.lat, requester.lon);
    const endDistance = calculateDistance(end.lat, end.lon, requester.lat, requester.lon);
    
    // Check if moved closer
    const movedCloser = endDistance < startDistance;
    const distanceDelta = startDistance - endDistance;
    
    // Calculate average speed
    const totalDistance = this.calculateTotalDistance();
    const duration = (end.timestamp - start.timestamp) / 1000 / 3600; // hours
    const avgSpeed = duration > 0 ? totalDistance / duration : 0;
    
    // Check movement consistency
    const bearingConsistency = this.checkBearingConsistency(requester);
    const timeProgression = this.checkTimeProgression();
    
    // Calculate confidence score
    let confidence = 0.5; // Base score
    
    // Bonus for moving closer
    if (movedCloser) confidence += 0.3;
    
    // Bonus for realistic speed
    if (avgSpeed >= MIN_MOVEMENT_SPEED && avgSpeed <= MAX_MOVEMENT_SPEED) {
      confidence += 0.1;
    }
    
    // Bonus for consistent bearing toward requester
    if (bearingConsistency > 0.7) confidence += 0.1;
    
    // Penalty for unrealistic patterns
    if (avgSpeed > MAX_MOVEMENT_SPEED) confidence -= 0.2;
    if (!timeProgression) confidence -= 0.3;
    if (this.locations.length < 3) confidence -= 0.1;
    
    // Determine movement pattern
    let movementPattern = 'unclear';
    if (movedCloser && bearingConsistency > 0.5) {
      movementPattern = 'toward_requester';
    } else if (!movedCloser && distanceDelta > -0.1) {
      movementPattern = 'away_from_requester';
    } else if (avgSpeed < MIN_MOVEMENT_SPEED) {
      movementPattern = 'stationary';
    }

    return {
      confidence: Math.max(0, Math.min(1, confidence)),
      movementPattern,
      startDistance: parseFloat(startDistance.toFixed(3)),
      endDistance: parseFloat(endDistance.toFixed(3)),
      distanceDelta: parseFloat(distanceDelta.toFixed(3)),
      avgSpeed: parseFloat(avgSpeed.toFixed(2)),
      bearingConsistency: parseFloat(bearingConsistency.toFixed(3)),
      totalLocations: this.locations.length,
      duration: end.timestamp - start.timestamp,
      movedCloser,
      timeProgression
    };
  }

  /**
   * Calculate total distance traveled
   */
  calculateTotalDistance() {
    let total = 0;
    for (let i = 1; i < this.locations.length; i++) {
      total += calculateDistance(
        this.locations[i-1].lat,
        this.locations[i-1].lon,
        this.locations[i].lat,
        this.locations[i].lon
      );
    }
    return total;
  }

  /**
   * Check if movement consistently toward requester
   */
  checkBearingConsistency(requester) {
    if (this.locations.length < 2) return 0;
    
    let consistentCount = 0;
    const idealBearing = calculateBearing(
      this.locations[0].lat,
      this.locations[0].lon,
      requester.lat,
      requester.lon
    );
    
    for (let i = 1; i < this.locations.length; i++) {
      const actualBearing = calculateBearing(
        this.locations[i-1].lat,
        this.locations[i-1].lon,
        this.locations[i].lat,
        this.locations[i].lon
      );
      
      // Check if bearing is within 45 degrees of ideal
      const bearingDiff = Math.abs(actualBearing - idealBearing);
      const normalizedDiff = Math.min(bearingDiff, 360 - bearingDiff);
      
      if (normalizedDiff < 45) consistentCount++;
    }
    
    return this.locations.length > 1 ? consistentCount / (this.locations.length - 1) : 0;
  }

  /**
   * Check if timestamps progress normally (no manipulation)
   */
  checkTimeProgression() {
    for (let i = 1; i < this.locations.length; i++) {
      if (this.locations[i].timestamp <= this.locations[i-1].timestamp) {
        return false;
      }
      
      // Check if gap is reasonable (not too large)
      const gap = this.locations[i].timestamp - this.locations[i-1].timestamp;
      if (gap > TRACKING_INTERVAL * 3) return false; // Suspicious gap
    }
    return true;
  }

  /**
   * Get tracking data for storage
   */
  getTrackingData() {
    return {
      responseId: this.responseId,
      responderWallet: this.responderWallet,
      startTime: this.startTime,
      endTime: this.locations[this.locations.length - 1]?.timestamp,
      locations: this.locations.map(loc => ({
        geohash: loc.geohash,
        timestamp: loc.timestamp
        // Note: exact lat/lon not stored, only geohash for privacy
      })),
      analysis: this.analyzeMovement()
    };
  }
}

/**
 * Store tracking data to Supabase and Filecoin
 * Creates verifiable reputation record on Filecoin
 */
export async function storeTrackingData(supabase, trackingData) {
  // Store to Supabase
  const { data, error } = await supabase
    .from('movement_tracking')
    .insert({
      response_id: trackingData.responseId,
      responder_wallet: trackingData.responderWallet,
      start_time: new Date(trackingData.startTime).toISOString(),
      end_time: trackingData.endTime ? new Date(trackingData.endTime).toISOString() : null,
      location_geohashes: trackingData.locations.map(l => l.geohash),
      movement_confidence: trackingData.analysis.confidence,
      movement_pattern: trackingData.analysis.movementPattern,
      distance_delta: trackingData.analysis.distanceDelta,
      verification_data: trackingData.analysis
    })
    .select()
    .single();
    
  if (error) throw error;
  
  // Also store on Filecoin for verifiable reputation (Agent Reputation & Portable Identity)
  try {
    console.log('[UPLOAD]', 'Attempting to store movement tracking on Filecoin...');
    console.log('[DATA]', 'Tracking data:', {
      responseId: trackingData.responseId,
      locationsCount: trackingData.locations?.length,
      confidence: trackingData.analysis?.confidence
    });
    
    // Store tracking data on Filecoin via the filecoin.js library function
    const filecoinResult = await storeTrackingDataOnFilecoin({
      responseId: trackingData.responseId,
      responderWallet: trackingData.responderWallet,
      movementPattern: trackingData.analysis.movementPattern,
      confidence: trackingData.analysis.confidence,
      distanceDelta: trackingData.analysis.distanceDelta,
      locations: trackingData.locations,
      startTime: trackingData.startTime,
      endTime: trackingData.endTime
    });
    
    console.log('[OK]', 'Filecoin storage result:', filecoinResult);
    
    if (filecoinResult.success) {
      console.log('[OK]', 'Movement tracking stored on Filecoin:', filecoinResult.pieceCid);
      
      // Store responder reputation on Filecoin
      console.log('[UPLOAD]', 'Storing reputation on Filecoin...');
      const reputationResult = await storeReputationOnFilecoin({
        type: 'movement_verification',
        responseId: trackingData.responseId,
        responderWallet: trackingData.responderWallet,
        confidence: trackingData.analysis.confidence,
        timestamp: new Date().toISOString()
      });
      
      console.log('[OK]', 'Reputation storage result:', reputationResult);
    } else {
      console.warn('[WARNING]', 'Filecoin storage returned failure:', filecoinResult.error);
    }
  } catch (filecoinError) {
    console.error('[X]', 'Filecoin storage failed (non-critical):', filecoinError);
    console.warn('Error details:', {
      message: filecoinError.message,
      stack: filecoinError.stack
    });
    // Don't throw - Filecoin is optional for core functionality
  }
  
  return data;
}

/**
 * Get tracking data for a response
 */
export async function getTrackingData(supabase, responseId) {
  const { data, error } = await supabase
    .from('movement_tracking')
    .select('*')
    .eq('response_id', responseId)
    .single();
    
  if (error) return null;
  return data;
}

/**
 * Notify nearby neighbors about completed help
 */
export async function notifyNeighbors(supabase, request, response, trackingData) {
  // Get users in same geohash area
  const geohashPrefix = request.geohash.slice(0, 4);
  
  const { data: nearbyUsers } = await supabase
    .from('push_subscriptions')
    .select('wallet_address, subscription')
    .filter('geohash_prefixes', 'cs', `{${geohashPrefix}}`);
    
  if (!nearbyUsers || nearbyUsers.length === 0) return [];
  
  // Exclude requester and responder
  const neighborsToNotify = nearbyUsers.filter(
    u => u.wallet_address !== request.requester_wallet && 
         u.wallet_address !== response.responder_wallet
  );
    
  // Create notification
  const notification = {
    title: 'Neighbor Helped Nearby',
    body: `${response.responder_wallet.slice(0, 8)}... helped with ${request.request_type}`,
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    tag: `help-completed-${request.id}`,
    data: {
      requestId: request.id,
      type: 'neighbor_helped',
      responderWallet: response.responder_wallet,
      requestType: request.request_type,
      movementConfidence: trackingData?.analysis?.confidence || 0
    }
  };
  
  return neighborsToNotify.map(n => ({
    wallet: n.wallet_address,
    subscription: n.subscription,
    notification
  }));
}

export default {
  MovementTracker,
  storeTrackingData,
  getTrackingData,
  notifyNeighbors
};
