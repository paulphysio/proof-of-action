/**
 * Action Verification Engine
 * 
 * This module implements a rule-based AI verification system that:
 * - Checks time proximity
 * - Validates location proximity
 * - Analyzes mutual confirmation patterns
 * - Assigns confidence scores
 * - Flags suspicious behavior
 * 
 * Designed to be modular - can be replaced with ML models later
 */

// Configuration for verification weights
const VERIFICATION_WEIGHTS = {
  TIME_PROXIMITY: 0.25,
  LOCATION_PROXIMITY: 0.30,
  MUTUAL_CONFIRMATION: 0.25,
  REPUTATION_BONUS: 0.10,
  PATTERN_ANALYSIS: 0.10
};

// Time thresholds (in minutes)
const TIME_THRESHOLDS = {
  IMMEDIATE: 15,      // 15 minutes - high confidence
  STANDARD: 60,       // 1 hour - medium confidence
  EXTENDED: 180,      // 3 hours - low confidence
  MAXIMUM: 1440       // 24 hours - minimum acceptable
};

// Distance thresholds (in kilometers)
const DISTANCE_THRESHOLDS = {
  VERY_CLOSE: 0.5,    // 500m - high confidence
  NEARBY: 2.0,        // 2km - medium confidence
  AREA: 5.0,          // 5km - low confidence
  MAXIMUM: 20.0       // 20km - minimum acceptable
};

/**
 * Calculate geohash distance approximation
 * Uses geohash precision for privacy-preserving location check
 */
function calculateGeohashProximity(requestGeohash, responseGeohash) {
  if (!requestGeohash || !responseGeohash) return 0;
  
  // Compare geohash prefixes for privacy-preserving proximity
  let commonPrefixLength = 0;
  const minLength = Math.min(requestGeohash.length, responseGeohash.length);
  
  for (let i = 0; i < minLength; i++) {
    if (requestGeohash[i] === responseGeohash[i]) {
      commonPrefixLength++;
    } else {
      break;
    }
  }
  
  // Convert prefix match to approximate distance score
  // More matching characters = closer proximity
  if (commonPrefixLength >= 7) return 1.0;      // ~150m
  if (commonPrefixLength >= 6) return 0.9;      // ~600m
  if (commonPrefixLength >= 5) return 0.7;      // ~2.4km
  if (commonPrefixLength >= 4) return 0.5;      // ~20km
  if (commonPrefixLength >= 3) return 0.3;      // ~100km
  return 0.1;
}

/**
 * Calculate time proximity score
 */
function calculateTimeProximity(requestTime, responseTime) {
  const requestDate = new Date(requestTime);
  const responseDate = new Date(responseTime);
  const diffMinutes = (responseDate - requestDate) / (1000 * 60);
  
  if (diffMinutes <= TIME_THRESHOLDS.IMMEDIATE) return 1.0;
  if (diffMinutes <= TIME_THRESHOLDS.STANDARD) return 0.8;
  if (diffMinutes <= TIME_THRESHOLDS.EXTENDED) return 0.6;
  if (diffMinutes <= TIME_THRESHOLDS.MAXIMUM) return 0.3;
  return 0;
}

/**
 * Calculate reputation-based trust score
 */
function calculateReputationScore(requesterRep, responderRep) {
  const avgReputation = ((requesterRep || 0) + (responderRep || 0)) / 2;
  
  // Normalize to 0-1 scale (assuming max reputation ~100)
  const normalizedRep = Math.min(avgReputation / 100, 1);
  
  // Higher reputation = more trust
  return 0.5 + (normalizedRep * 0.5);
}

/**
 * Pattern analysis - check for suspicious behavior
 */
function analyzePatterns(request, response, userHistory) {
  let flags = [];
  let score = 1.0;
  
  // Check for self-response (suspicious)
  if (request.requester_wallet === response.responder_wallet) {
    flags.push('SELF_RESPONSE');
    score -= 0.8;
  }
  
  // Check for too-fast response (potential bot)
  const requestTime = new Date(request.created_at);
  const responseTime = new Date(response.created_at);
  const responseSpeed = (responseTime - requestTime) / 1000; // seconds
  
  if (responseSpeed < 30) { // Less than 30 seconds
    flags.push('SUSPICIOUS_SPEED');
    score -= 0.3;
  }
  
  // Check for repeated patterns
  if (userHistory && userHistory.recentRequests > 10) {
    flags.push('HIGH_VOLUME_REQUESTER');
    score -= 0.2;
  }
  
  if (userHistory && userHistory.recentResponses > 10) {
    flags.push('HIGH_VOLUME_RESPONDER');
    score -= 0.1;
  }
  
  return { score: Math.max(0, score), flags };
}

/**
 * Main verification function
 * Returns a confidence score (0-1) and verification status
 */
export async function verifyAction(
  request,
  response,
  requesterProfile,
  responderProfile,
  options = {}
) {
  // Calculate component scores
  const timeScore = calculateTimeProximity(
    request.created_at,
    response.created_at
  );
  
  const locationScore = calculateGeohashProximity(
    request.geohash,
    response.geohash || request.geohash
  );
  
  const reputationScore = calculateReputationScore(
    requesterProfile?.reputation,
    responderProfile?.reputation
  );
  
  // Default mutual confirmation to 0.5 (will be updated when both parties confirm)
  const confirmationScore = options.mutualConfirmation ? 1.0 : 0.5;
  
  // Pattern analysis
  const patternAnalysis = analyzePatterns(
    request,
    response,
    options.userHistory
  );
  
  // Calculate weighted confidence score
  const confidenceScore = (
    (timeScore * VERIFICATION_WEIGHTS.TIME_PROXIMITY) +
    (locationScore * VERIFICATION_WEIGHTS.LOCATION_PROXIMITY) +
    (confirmationScore * VERIFICATION_WEIGHTS.MUTUAL_CONFIRMATION) +
    (reputationScore * VERIFICATION_WEIGHTS.REPUTATION_BONUS) +
    (patternAnalysis.score * VERIFICATION_WEIGHTS.PATTERN_ANALYSIS)
  );
  
  // Determine verification status
  // Threshold: 0.7 for automatic approval, 0.5 for manual review, below 0.5 reject
  let status;
  if (confidenceScore >= 0.7 && patternAnalysis.flags.length === 0) {
    status = 'VERIFIED';
  } else if (confidenceScore >= 0.5 && patternAnalysis.flags.length <= 1) {
    status = 'PENDING_REVIEW';
  } else {
    status = 'REJECTED';
  }
  
  // Prepare detailed result
  const result = {
    verified: status === 'VERIFIED',
    confidenceScore: parseFloat(confidenceScore.toFixed(3)),
    status,
    breakdown: {
      timeScore: parseFloat(timeScore.toFixed(3)),
      locationScore: parseFloat(locationScore.toFixed(3)),
      confirmationScore: parseFloat(confirmationScore.toFixed(3)),
      reputationScore: parseFloat(reputationScore.toFixed(3)),
      patternScore: parseFloat(patternAnalysis.score.toFixed(3))
    },
    flags: patternAnalysis.flags,
    timestamp: new Date().toISOString()
  };
  
  return result;
}

/**
 * Quick verification check for demo purposes
 */
export function quickVerify(request, response) {
  return verifyAction(
    request,
    response,
    { reputation: 10 },
    { reputation: 10 },
    { mutualConfirmation: true }
  );
}

/**
 * Generate geohash from coordinates (simplified implementation)
 * In production, use a proper geohash library
 */
export function generateGeohash(latitude, longitude, precision = 7) {
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let geohash = '';
  let minLat = -90, maxLat = 90;
  let minLon = -180, maxLon = 180;
  let isEven = true;
  let bit = 0;
  let ch = 0;
  
  while (geohash.length < precision) {
    if (isEven) {
      const mid = (minLon + maxLon) / 2;
      if (longitude >= mid) {
        ch |= (1 << (4 - bit));
        minLon = mid;
      } else {
        maxLon = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (latitude >= mid) {
        ch |= (1 << (4 - bit));
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    
    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += base32[ch];
      bit = 0;
      ch = 0;
    }
  }
  
  return geohash;
}

/**
 * Anti-fraud detection
 * Identifies potential Sybil attacks and other malicious patterns
 */
export function detectFraudPatterns(actions) {
  const warnings = [];
  
  // Check for rapid-fire actions
  const timeWindow = 3600000; // 1 hour in ms
  const recentActions = actions.filter(
    a => Date.now() - new Date(a.created_at).getTime() < timeWindow
  );
  
  if (recentActions.length > 20) {
    warnings.push({
      type: 'RAPID_ACTIONS',
      severity: 'high',
      message: 'Unusually high activity detected'
    });
  }
  
  // Check for circular transactions (A helps B, B helps C, C helps A)
  const walletInteractions = {};
  actions.forEach(action => {
    const pair = [action.requester_wallet, action.responder_wallet].sort().join('-');
    walletInteractions[pair] = (walletInteractions[pair] || 0) + 1;
  });
  
  const circularPatterns = Object.entries(walletInteractions)
    .filter(([_, count]) => count > 3);
  
  if (circularPatterns.length > 0) {
    warnings.push({
      type: 'CIRCULAR_PATTERN',
      severity: 'medium',
      message: 'Potential circular reward farming detected'
    });
  }
  
  return warnings;
}

export default {
  verifyAction,
  quickVerify,
  generateGeohash,
  detectFraudPatterns,
  VERIFICATION_WEIGHTS,
  TIME_THRESHOLDS,
  DISTANCE_THRESHOLDS
};
