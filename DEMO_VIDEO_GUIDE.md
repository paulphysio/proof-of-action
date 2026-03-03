# Proof-of-Action Demo Video Guide

## 🎬 Demo Video Script & Shot List

**Duration**: 3-5 minutes
**Format**: Screen recording with voiceover
**Target**: Hackathon judges (technical + non-technical)

---

## 📋 Scene Breakdown

### Scene 1: Introduction (0:00 - 0:30)
**Visual**: Home page with animated hero section
**Voiceover**: 
> "Proof-of-Action is a human-only emergency coordination network that combines World ID verification, AI-powered action verification, and Filecoin-backed reputation to create the world's first trustless help marketplace."

**Key Points**:
- Problem: Fake requests, unverified help, no reputation
- Solution: Real humans helping real humans with cryptographic proof
- Tech: World ID + AI Verification + Filecoin

---

### Scene 2: World ID Verification (0:30 - 1:00)
**Visual**: Dashboard → World ID verification flow
**Actions**:
1. Click "Verify with World ID"
2. Show QR code scan (or Device verification)
3. Show success state with verification badge

**Voiceover**:
> "Every user must verify with World ID, ensuring 100% real humans. No bots, no fake accounts. This is the foundation of our Sybil-resistant network."

**Technical Highlight**: 
- Incognito Actions for privacy
- Orb or Device verification levels
- 38M+ World App users potential

---

### Scene 3: Creating Emergency Request (1:00 - 1:30)
**Visual**: Request form with location capture
**Actions**:
1. Select "Medication" emergency type
2. Enter brief description
3. Click "Get My Location"
4. Submit request
5. Show success confirmation

**Voiceover**:
> "When someone needs help, they post an emergency request. Location is hashed for privacy using geohashes. The request is immediately visible to nearby verified humans."

**Technical Highlights**:
- Privacy-preserving geohash (not exact GPS)
- Categories: Medication, Medical Supplies, Food, Shelter, Transport
- Instant posting to nearby area

---

### Scene 4: Responding to Request (1:30 - 2:00)
**Visual**: Switch to helper view → Respond page
**Actions**:
1. Show map with nearby requests
2. Click "I Can Help" on medication request
3. Show movement tracking starting
4. Show journey toward requester

**Voiceover**:
> "Nearby helpers see the request and can respond. Once they click 'I Can Help', our AI starts tracking their movement to verify they actually traveled to help. This prevents fraud and ensures genuine assistance."

**Technical Highlights**:
- Real-time movement tracking
- AI analyzes: speed, direction, distance
- Geohash-based privacy
- Fraud detection patterns

---

### Scene 5: AI Verification Engine (2:00 - 2:30)
**Visual**: Verify page with verification results
**Actions**:
1. Show verification dashboard
2. Click "Verify Action"
3. Show AI confidence score breakdown:
   - Time proximity: 95%
   - Location proximity: 88%
   - Mutual confirmation: 100%
   - Reputation bonus: 75%
   - Pattern analysis: 90%
4. Show final score: 92% confidence

**Voiceover**:
> "Our AI verification engine analyzes multiple factors: time to respond, distance traveled, movement patterns, and both parties' confirmation. Only actions with high confidence scores get verified and rewarded."

**Technical Highlights**:
- 5-factor scoring algorithm
- Anti-fraud: self-response detection, speed checks
- Weighted scoring system
- Immutable verification records

---

### Scene 6: Filecoin Storage (2:30 - 3:00)
**Visual**: Proof of History page
**Actions**:
1. Navigate to /proof-of-history
2. Show Filecoin storage records
3. Click on CID link → Open Filecoin explorer
4. Show real Calibration testnet data
5. Show IPFS gateway link

**Voiceover**:
> "Every verification is permanently stored on Filecoin Calibration Testnet. This creates an immutable, censorship-resistant proof of history. Your reputation is backed by decentralized storage, not a centralized database."

**Technical Highlights**:
- CID-rooted identity objects
- Calibration Testnet deployment
- Filecoin Pin CLI integration
- Permanent, verifiable storage
- IPFS availability

**Show Real Data**:
```
CID: bafybei...xyz
Network: filecoin_calibration
Explorer: calibration.filscan.io
Type: verification_proof
```

---

### Scene 7: Reputation & Rewards (3:00 - 3:30)
**Visual**: Dashboard with rewards
**Actions**:
1. Show 10 Proof Points awarded
2. Show reputation increase (+5)
3. Show skill badges earned
4. Navigate to Proof of History
5. Show verification timeline

**Voiceover**:
> "Verified helpers earn Proof Points and reputation. This creates a trustless reputation system where your helpful actions are permanently recorded. Higher reputation gives priority access to high-value emergency requests."

**Technical Highlights**:
- Soulbound tokens (non-transferable)
- Automatic badge awards
- Proof Points system
- Reputation-based prioritization

---

### Scene 8: Identity Portability (3:30 - 3:50)
**Visual**: Identity Portability component
**Actions**:
1. Click "Export Identity"
2. Download JSON file
3. Show file contents: World ID + Filecoin records
4. Show QR code sharing option

**Voiceover**:
> "Your identity and reputation are portable. Export your verification history and import it on any device. Cross-environment identity portability ensures your reputation follows you anywhere."

**Technical Highlights**:
- JSON export/import
- QR code sharing
- Cross-device portability
- Verifier tooling ready

---

### Scene 9: World Chain Integration (3:50 - 4:10)
**Visual**: SBT contract interaction (if deployed)
**Actions**:
1. Show World Chain network in MetaMask
2. Show minted SBT in wallet
3. Show gas-free transaction
4. Link to World Chain explorer

**Voiceover**:
> "We're deployed on World Chain, enabling gas-free transactions for verified humans. Soulbound tokens ensure your reputation cannot be transferred or sold—it's truly yours."

**Technical Highlights**:
- World Chain deployment
- Gas-free transactions
- Non-transferable SBTs
- On-chain reputation

---

### Scene 10: Conclusion (4:10 - 4:30)
**Visual**: Split screen showing both challenges
**Actions**:
Show side-by-side:
- Left: Filecoin Challenge features
- Right: World Build Challenge features

**Voiceover**:
> "Proof-of-Action demonstrates the power of combining Filecoin's permanent storage with World ID's human verification. We're building the infrastructure for a human-only, trustless coordination network—where real people help real people, with cryptographic proof."

**Call to Action**:
> "Join us in creating the future of human-centric, decentralized emergency response."

---

## 🛠️ Technical Setup for Recording

### Before Recording:
1. **Clear localStorage** for clean demo
2. **Reset Filecoin storage** (optional)
3. **Have test accounts ready**:
   - Requester wallet
   - Responder wallet
   - Both with World ID verification

### Required Environment:
```bash
# Filecoin CLI installed
filecoin-pin --version  # Should show version

# World ID App ID configured
NEXT_PUBLIC_WORLDCOIN_APP_ID=your-app-id

# World Chain contract deployed
NEXT_PUBLIC_WORLD_CHAIN_CONTRACT=0x...
```

### Demo Data Setup:
1. Create 2-3 sample requests
2. Complete 1-2 verifications (real or mock)
3. Have Filecoin storage records ready
4. Ensure World ID is verified

---

## 📝 Voiceover Tips

### Tone:
- **Enthusiastic but professional**
- **Technical when needed**, simple for main points
- **Emphasize the WHY** (human coordination, trustless help)

### Key Phrases to Include:
- "World ID proof of personhood"
- "AI-powered verification"
- "Filecoin-backed reputation"
- "Soulbound tokens"
- "Gas-free on World Chain"
- "Cross-environment portability"

### Avoid:
- Too much jargon without explanation
- Long pauses
- "Um" and "Uh"
- Reading directly from script (sound natural)

---

## 🎥 Recording Tools

### Recommended:
1. **OBS Studio** (free) - Screen + webcam
2. **Loom** (easy sharing)
3. **Camtasia** (editing)
4. **QuickTime** (Mac, simple)

### Settings:
- **Resolution**: 1920x1080 (1080p)
- **Frame Rate**: 30fps
- **Audio**: Clear, no background noise
- **Format**: MP4 or MOV

---

## ✂️ Post-Production

### Editing Checklist:
- [ ] Trim dead time (page loads, transitions)
- [ ] Add captions for technical terms
- [ ] Highlight mouse clicks (cursor spotlight)
- [ ] Add zoom on key UI elements
- [ ] Background music (optional, low volume)
- [ ] End card with project links

### Graphics to Add:
- [ ] Title card: "Proof-of-Action Demo"
- [ ] Challenge badges (Filecoin + World)
- [ ] Tech stack icons (Filecoin, World ID, AI)
- [ ] GitHub link QR code
- [ ] Live demo URL

---

## 🎯 Submission Checklist

### Video Requirements:
- [ ] 3-5 minutes duration
- [ ] Clear voiceover
- [ ] Shows all major features
- [ ] Demonstrates both challenges
- [ ] Shows real Filecoin CIDs (not mock)
- [ ] Shows World ID verification

### Platforms to Submit:
1. **YouTube** (unlisted or public)
2. **Loom** (shareable link)
3. **Google Drive** (if needed)

### Video Description Template:
```
Proof-of-Action: Human-Only Emergency Coordination Network

🏆 Filecoin Challenge #3: Agent Reputation & Portable Identity
🏆 World Build #5: Proof of Contribution (Human Capital)

Features:
✅ World ID verification (Orb/Device)
✅ AI-powered action verification
✅ Filecoin-backed permanent storage
✅ Soulbound reputation tokens
✅ Gas-free World Chain transactions
✅ Cross-environment identity portability

Live Demo: [your-url]
GitHub: [your-repo]

Built for PL Genesis Hackathon 2025
```

---

## 🚀 Quick Start for Recording

### 5-Minute Setup:
```bash
# 1. Start dev server
npm run dev

# 2. Open 3 browser windows:
# - Window 1: Requester account
# - Window 2: Responder account  
# - Window 3: Your recording view

# 3. Clear previous data
localStorage.clear() in browser console

# 4. Have World ID ready
# Ensure both accounts are verified

# 5. Start recording with OBS/Loom
```

### Emergency Backup Plan:
If live demo fails, have:
1. **Screenshots** of each step
2. **Pre-recorded segments** (Filecoin upload, verification)
3. **Mock data** ready to show
4. **Static slides** explaining architecture

---

## 💡 Pro Tips

1. **Record in segments**: Do each scene separately, edit together
2. **Have a backup voiceover**: Write script, read naturally
3. **Show real CIDs**: Even if mock, make them look real
4. **Emphasize the dual submission**: Mention both challenges clearly
5. **End with impact**: "This is how we build trustless human coordination"

---

## 📊 Success Metrics

Judges will look for:
- ✅ Clear problem statement (30 seconds)
- ✅ Technical implementation shown (2 minutes)
- ✅ Real integrations working (1 minute)
- ✅ Innovation/wow factor (30 seconds)
- ✅ Presentation quality (throughout)

**Goal**: Make judges say "Wow, this is production-ready" 🚀

---

Ready to record? Start with Scene 1 and work through each section. Good luck! 🎉
