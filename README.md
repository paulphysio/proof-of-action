# Proof-of-Action

**Privacy-first community emergency app with AI verification and on-chain rewards**

A hackathon-ready Web3 application that connects people in need with nearby helpers, verifies real-world actions using AI, and rewards helpful behavior with NEAR blockchain tokens.

## 🎯 One-Line Summary

> **Proof-of-Action** is a privacy-first community emergency app that rewards real-world helpful actions (like sharing critical meds nearby) with on-chain reputation and tokens, powered by AI verification and decentralized incentives.

## 🚀 Demo Flow (3 Minutes)

1. **Connect Wallet** - User connects NEAR wallet
2. **Post Emergency Request** - User posts a need (e.g., "Need insulin urgently")
3. **Nearby Response** - Another user sees and responds to help
4. **AI Verification** - System verifies time, location, and confirmation
5. **Earn Rewards** - Helper receives Proof Points and NEAR tokens
6. **Build Reputation** - Reputation score increases with each verified action

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14 (App Router) |
| UI Framework | Bootstrap 5 |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | NEAR Wallet |
| Blockchain | NEAR Protocol |
| AI Engine | Rule-based verification (ML-ready hooks) |
| Notifications | PWA Push Notifications |
| Hosting | Vercel |
| Storage | Supabase Storage |

## 📁 Project Structure

```
proof-of-action/
├── public/
│   ├── icons/              # PWA icons
│   ├── manifest.json       # PWA manifest
│   └── service-worker.js   # Service worker for offline/PWA
├── src/
│   ├── app/
│   │   ├── dashboard/      # User dashboard
│   │   ├── request/        # Create emergency request
│   │   ├── respond/        # Find and respond to requests
│   │   ├── verify/         # AI verification page
│   │   ├── layout.js       # Root layout
│   │   ├── page.js         # Home page
│   │   └── globals.css     # Global styles
│   └── lib/
│       ├── supabase.js     # Supabase client & queries
│       ├── near-wallet.js  # NEAR wallet integration
│       ├── ai-verification.js  # AI verification engine
│       └── notifications.js    # PWA notifications
├── supabase-schema.sql     # Database setup
└── package.json
```

## 🏁 Quick Start

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

## 🔐 Privacy Model

- **No real names required** - Wallet address = identity
- **Hashed location** - Uses geohash, not exact GPS coordinates
- **Medical details never public** - Only request type and brief description
- **AI verifies patterns, not personal data** - Privacy-preserving verification

## 🤖 AI Verification Engine

The verification system uses weighted scoring:

| Factor | Weight | Description |
|--------|--------|-------------|
| Time Proximity | 25% | Response time after request |
| Location Proximity | 30% | Geohash matching (privacy-safe) |
| Mutual Confirmation | 25% | Both parties confirm |
| Reputation Score | 10% | Historical trustworthiness |
| Pattern Analysis | 10% | Fraud detection |

**Anti-fraud checks:**
- Self-response detection
- Suspicious speed analysis
- Circular transaction detection
- Volume anomaly detection
- Geolocation consistency

## 💰 DeFi Rewards

- Each verified action mints **10 Proof Points**
- Points convert to NEAR-based reward tokens
- Reputation grows with each verified action (+5 rep)
- High reputation = higher trust + higher rewards
- Utility-based rewards (no speculation)

## 🧠 Neuro Design Principles

- **Minimal UI** - Clean, simple interface
- **Micro-helping** - Small actions, big impact
- **Clear success feedback** - Celebrate every action
- **Gentle nudges** - No pressure, just opportunities
- **Reduce decision fatigue** - Simple choices, clear outcomes

## 📱 PWA Features

- Works offline
- Installable on mobile/desktop
- Push notifications for nearby emergencies
- Background sync
- Responsive design

## 🗄️ Database Schema

### Tables

- `users` - Wallet-based identity, reputation
- `emergency_requests` - Privacy-first location (geohash)
- `responses` - Who responded to what
- `action_verifications` - AI verification results
- `rewards` - On-chain reward tracking
- `reports` - Anti-fraud community reporting

See `supabase-schema.sql` for full schema with RLS policies.

## 🎨 Bootstrap Components

This project uses Bootstrap 5 exclusively (no Tailwind). Key components:
- `navbar` - Navigation
- `card` - Content containers
- `btn` - Buttons (primary, success, danger, warning, info)
- `alert` - Notifications
- `badge` - Status indicators
- `progress` - Verification scores
- `spinner-border` - Loading states

## 🔌 NEAR Integration

Current implementation uses a mock wallet for demo purposes. To integrate real NEAR:

1. Install `@near-wallet-selector/core`
2. Replace `MOCK_WALLET` in `src/lib/near-wallet.js`
3. Add contract interaction for token minting

## 📊 Demo Data

To add sample data for demo, uncomment the INSERT statements at the bottom of `supabase-schema.sql`.

## 🚧 Roadmap

- [ ] Real NEAR wallet integration
- [ ] ML model for verification (TensorFlow.js)
- [ ] Token contract deployment
- [ ] Mobile app (React Native)
- [ ] Community governance

## 🤝 Contributing

This is a hackathon project. Feel free to fork and extend!

## 📄 License

MIT - Built for hackathons and community good.

---

**Built with ❤️ for the community**

*Proof-of-Action: Help others, earn rewards, build reputation.*
