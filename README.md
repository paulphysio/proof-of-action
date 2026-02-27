# Proof-of-Action

> **When someone nearby desperately needs help, will you answer?**

## The Story That Drives Us

Imagine it's 2 AM. Your neighbor's child needs insulin. The pharmacies are closed. They're terrified, desperate, reaching out into the void hoping someone nearby can help.

Now imagine you get a notification: *"Someone needs medical supplies 200 meters away. Can you help?"* You have extra supplies. You walk over. You save a life. And the world knows your kindness—not your name, not your face, just your action. Verified. Trusted. Rewarded.

**Proof-of-Action** is not just an app. It's a bridge between human desperation and human generosity. It's a guarantee that when help arrives, it's real. It's a promise that kindness doesn't go unnoticed.

---

## What We Built

A **privacy-first, AI-verified community emergency response platform** that connects people in need with nearby helpers, validates genuine assistance through intelligent movement tracking and multi-factor verification, and rewards pro-social behavior with blockchain-based reputation and tokens.

### Core Promise

| For Those in Need | For Those Who Help | For the Community |
|-------------------|-------------------|-------------------|
| Post emergencies privately | Get notified of nearby needs | See trust being built |
| See help coming in real-time | Track your movement toward them | Know your neighborhood cares |
| Receive verified assistance | Earn rewards & reputation | Build resilient communities |

---

## Why This Matters

### The Problem

Traditional emergency response is **centralized, slow, and impersonal**:
- Emergency services are overwhelmed
- Social media pleas get lost in noise
- No verification = scams erode trust
- Good Samaritans go unrewarded
- Communities are disconnected

### Our Solution

**Decentralized, immediate, verified mutual aid**:
- Geo-fenced emergency alerts within 1km
- AI verification ensures help actually happened
- Movement tracking proves responders genuinely traveled
- Privacy-preserving reputation system
- Tokenized rewards incentivize participation
- Push notifications reach people instantly

### The Emotional Impact

> *"Every verified help action is a story of human connection—someone choosing to care, crossing the distance, making a difference. We're not just verifying actions. We're validating the best of humanity."*

---

## How It Works

### 1. Emergency Request (Requester)
```
User needs help → Posts request (geohash location only)
                     ↓
            Push notifications sent to nearby helpers
```

### 2. Real-Time Response (Responder)
```
Helper receives alert → Clicks "I Can Help"
                           ↓
              Movement tracking begins (30-sec intervals)
                           ↓
              Helper sees requester's location on map
              Requester sees helper's real-time movement
```

### 3. AI Verification Engine
The system analyzes 5 weighted factors:

| Factor | Weight | How It Works |
|--------|--------|--------------|
| **Time Proximity** | 25% | Response time after request |
| **Location Match** | 30% | Geohash proximity (privacy-safe) |
| **Movement Pattern** | 20% | Real-time tracking proves travel |
| **Mutual Confirmation** | 15% | Both parties confirm completion |
| **Reputation Score** | 10% | Historical trustworthiness |

**Anti-Fraud Protections:**
- Self-response detection (prevent gaming)
- Speed analysis (catch bots)
- Circular pattern detection (prevent collusion)
- Movement confidence scoring (0-100%)

### 4. Community Celebration
```
Help verified → Both users earn Proof Points
                    ↓
          Nearby neighbors notified: "Someone helped nearby!"
                    ↓
         Reputation scores updated on-chain
                    ↓
         Community trust grows
```

---

## Key Features

### Real-Time Location Intelligence

**ResponderLiveMap** — For Requesters
- Canvas-based real-time tracking
- Watch your helper approach
- Animated pulsing indicators
- Distance and ETA updates
- Live connection status

**RequesterStaticMap** — For Responders
- See exact destination at time of request
- Distance reference rings (100m, 200m, 300m)
- Geohash privacy boundary
- Navigation-ready visualization

### Movement Verification System

Every response triggers a tracking session:
- Captures GPS every 30 seconds
- Haversine distance calculations
- Bearing consistency analysis (are they moving toward the requester?)
- Speed validation (walking: 0.5-50 km/h realistic range)
- Confidence score 0-100% based on movement patterns

Data is **privacy-first**: Only geohashes stored, exact coordinates deleted after verification.

### Multi-Layer Notifications

| Type | Trigger | Purpose |
|------|---------|---------|
| Emergency Alerts | New request within 1km | Mobilize nearby helpers |
| Response Confirmation | Helper accepts | Notify requester help is coming |
| Movement Updates | Location captured | Real-time tracking feedback |
| Verification Success | Help completed & verified | Celebrate and reward |
| Neighbor Notifications | Help completed nearby | Build community awareness |

All notifications work via PWA push—even when the app is closed.

### Premium Medical+Web3 UI

Built with meticulous attention to experience:
- **Mobile-first** responsive design
- **Glassmorphism** aesthetic with cyan/rose/slate palette
- **Sophisticated animations**: pulse glows, reveal sequences, floating elements
- **Accessibility-first**: High contrast, semantic markup, clear hierarchy
- **Medical-grade clarity**: Clean, calm, professional feel
---

## Technical Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14 (App Router) | React framework with SSR |
| **Styling** | Bootstrap 5 + Custom CSS | Mobile-first responsive design |
| **Icons** | Lucide React | Consistent iconography |
| **Backend** | Next.js API Routes | Serverless functions |
| **Database** | Supabase (PostgreSQL) | Real-time data + Auth |
| **Blockchain** | NEAR Protocol | Wallet auth + token rewards |
| **AI Engine** | Rule-based (ML-ready) | Multi-factor verification |
| **Notifications** | Web Push API | PWA push notifications |
| **Hosting** | Vercel | Edge deployment |

### Database Schema

**Core Tables:**
- `users` — Wallet-based identity, reputation scores
- `emergency_requests` — Privacy-first geohash location, request type
- `responses` — Who responded, when, movement tracking reference
- `movement_tracking` — Anonymous geohash path, confidence score, verification data
- `action_verifications` — AI verification results with breakdown
- `rewards` — On-chain reward tracking, Proof Points
- `push_subscriptions` — Geohash-filtered notification targets
- `help_completed_notifications` — Community awareness events

**Row-Level Security:** Every table has RLS policies ensuring users only access their own data.

### Verification Algorithm

```javascript
// Confidence calculation (0-1 scale)
confidence = (
  timeScore * 0.25 +
  locationScore * 0.30 +
  movementScore * 0.20 +
  confirmationScore * 0.15 +
  reputationScore * 0.10
)

// Movement analysis
analyzeMovement() {
  - Distance delta (closer to requester?)
  - Average speed (realistic travel?)
  - Bearing consistency (moving in right direction?)
  - Time progression (no timestamp manipulation)
}
```

---

## Project Structure

```
proof-of-action/
├── public/
│   ├── icons/                 # PWA icons (192x192, 512x512)
│   ├── manifest.json           # PWA install manifest
│   └── service-worker.js      # Push notification handler
├── src/
│   ├── app/
│   │   ├── api/push/          # Notification API routes
│   │   │   ├── notify-neighbors/
│   │   │   ├── notify-requester/
│   │   │   ├── public-key/
│   │   │   └── subscribe/
│   │   ├── dashboard/         # User reputation & rewards
│   │   ├── request/           # Create emergency request
│   │   ├── respond/           # Find & respond to requests
│   │   ├── verify/           # AI verification results
│   │   ├── page.js           # Landing page
│   │   ├── layout.js         # Root layout with providers
│   │   └── globals.css       # Design system & animations
│   ├── components/
│   │   └── maps/
│   │       ├── ResponderLiveMap.js    # Real-time responder tracking
│   │       └── RequesterStaticMap.js  # Static requester location
│   └── lib/
│       ├── supabase.js          # Database client & queries
│       ├── near-wallet.js       # NEAR wallet integration
│       ├── ai-verification.js   # AI verification engine
│       ├── movement-tracking.js # GPS tracking & analysis
│       └── notifications.js     # PWA push notifications
├── supabase-schema.sql         # Full database setup
└── package.json
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- A Supabase account (free tier works)
- (Optional) NEAR testnet wallet

### 1. Clone and Install

```bash
cd proof-of-action
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Copy your `Project URL` and `anon key` from Settings > API
3. Run the SQL in `supabase-schema.sql` in the SQL Editor

### 3. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the App

```bash
npm run dev
```

Open http://localhost:3000

### 5. Build for Production

```bash
npm run build
```

## Privacy & Security

### Privacy-First Design

| Feature | Implementation |
|---------|----------------|
| **Identity** | Wallet address only—no real names required |
| **Location** | Geohash precision (7 chars = ~150m), never exact GPS |
| **Medical Data** | Request type only, no details stored |
| **Tracking Data** | Geohashes only, auto-deleted post-verification |
| **Verification** | Pattern-based, no personal data analyzed |

### Anti-Fraud Measures

- **Self-Response Detection**: Prevents users from helping themselves
- **Speed Analysis**: Flags responses faster than humanly possible
- **Circular Pattern Detection**: Catches groups gaming the system
- **Volume Anomaly Detection**: Flags suspicious activity spikes
- **Movement Confidence**: GPS tracking proves physical presence

## Demo Flow (3 Minutes)

1. **Connect Wallet** — User connects NEAR wallet (or uses mock for demo)
2. **Post Request** — User creates emergency need with location
3. **Nearby Alert** — Push notification sent to users within 1km
4. **Respond** — Helper accepts, sees requester location on map
5. **Track Movement** — Real-time GPS tracking begins, both parties see progress
6. **Complete** — Helper marks complete, both confirm
7. **Verify** — AI engine analyzes time, location, movement, confirmation
8. **Reward** — Both users earn 10 Proof Points, reputation increases
9. **Celebrate** — Nearby neighbors notified, community awareness grows

---

## Design Philosophy: Neuro-Inclusive UX

Every decision prioritizes cognitive ease:

- **Minimal UI** — No clutter, clear focus
- **Micro-helping** — Small actions, immediate feedback
- **Success Celebration** — Visual rewards for every good deed
- **Gentle Nudges** — Optional participation, no pressure
- **Clear Outcomes** — Users always know what happens next
- **Medical Aesthetic** — Calm, professional, trustworthy

---

## The Vision

### Immediate Impact
- Reduce emergency response time in dense communities
- Incentivize pro-social behavior
- Build verifiable trust between strangers
- Create resilient neighborhood networks

### Future Roadmap
- [ ] TensorFlow.js ML model for advanced verification
- [ ] NEAR mainnet token contract deployment
- [ ] React Native mobile app
- [ ] DAO governance for community parameters
- [ ] Integration with emergency services
- [ ] Multi-language support

---

## Why Judges Should Care

### Innovation
We didn't just build a help app—we built a **trust infrastructure**:
- Real-time movement verification (not just location check-in)
- Privacy-preserving AI that proves humanity without exposing identity
- Blockchain rewards tied to verified real-world action

### Technical Sophistication
- Canvas-based real-time maps with custom animations
- Multi-factor AI verification engine
- PWA push with geofencing
- Haversine distance + bearing analysis
- Privacy-first geohash architecture

### Social Impact
- Addresses real human need (emergency medical shortages)
- Incentivizes the best of humanity
- Builds community resilience
- Privacy-preserving by design

### Completeness
- Full-stack implementation
- Production-ready PWA
- Real-time notifications
- Movement tracking
- AI verification
- Blockchain integration
- Responsive mobile-first UI

---

## Acknowledgments

Built with love for communities everywhere.

**Core Team:** Dedicated developers who believe technology should bring people together.

**Inspiration:** Every stranger who ever helped another without asking for recognition. This is for you.

---

**MIT License** — Built for hackathons and community good.

*Proof-of-Action: When words aren't enough, prove it with action.*

---

## Connect With Us

- [Live Demo](http://localhost:3000)
- [GitHub Repository](#)
- [Documentation](#)

*Help others. Earn rewards. Build reputation. Change the world—one action at a time.*
