# Agenti Marketplace Deployment Guide

## Prerequisites

- Node.js 20+
- npm or yarn
- PostgreSQL database (Supabase recommended)
- Arc Network wallet with testnet USDC

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/your-org/agenti.git
cd agenti/marketplace-app
npm install
cp .env.local.example .env.local
```

### 2. Database Setup

1. Create a Supabase project at https://supabase.com
2. Get your connection string from Settings > Database
3. Update `DATABASE_URL` in `.env.local`

```bash
npx prisma migrate dev
npx prisma generate
```

### 3. Get Testnet USDC

1. Go to https://faucet.circle.com
2. Connect your wallet (MetaMask)
3. Request USDC on Arc testnet
4. Confirm balance at https://testnet.arcscan.app

### 4. Deploy Contracts

```bash
cd ../contracts
npm install
cp .env.example .env

# Add to .env:
# ARC_RPC_URL=https://rpc.testnet.arc.network
# ACCOUNT_PRIVATE_KEY=your-private-key

npx hardhat compile
npx hardhat run scripts/deploy-arc.ts --network arc-testnet
npx hardhat run scripts/deploy-escrow-arc.ts --network arc-testnet
npx hardhat run scripts/set-operator.ts --network arc-testnet
```

Copy the deployed contract addresses into `.env.local`:
- `NEXT_PUBLIC_MARKETPLACE_ADDRESS`
- `NEXT_PUBLIC_LICENSE_ADDRESS`
- `NEXT_PUBLIC_ESCROW_ADDRESS`

### 5. Run the App

```bash
cd ../marketplace-app
npm run dev
```

Open http://localhost:3001

## Testing the Full Flow

### Creator Flow

1. Go to /login, sign up or sign in
2. Go to /dashboard/creator
3. Upload a skill zip containing:
   - `skill.json` with pricing_model: "per_call"
   - `entrypoint.py` or `entrypoint.js`
   - `README.md`
4. The skill goes to PENDING_REVIEW

### Admin Flow

1. Sign in as admin (email in ADMIN_EMAILS)
2. Go to /dashboard/admin
3. Review the skill, click Approve
4. The skill is automatically registered in escrow contract (for per_call skills)

### Buyer Flow

1. Sign in with wallet (SIWE)
2. Go to /marketplace?itemType=SKILL
3. Find a per_call skill
4. Go to /skill/[slug]/deposit
5. Deposit USDC
6. Call the skill via API: POST /api/skills/[id]/call
7. Check usage at /dashboard/buyer

### Creator Earnings Flow

1. As skill creator, go to /dashboard/creator/analytics
2. See earnings from per_call skill usages
3. Click "Withdraw" to withdraw from escrow

## Troubleshooting

### "Contract call failed on approval"
- Check escrow registration failed
- Use retry endpoint: POST /api/admin/skills/[id]/register-escrow

### "Rate limit 429 on /call"
- Wait 10 seconds
- Default: 10 calls per 10 seconds, 1000 per day

### "USDC balance shows 0"
- Ensure wallet is on Arc testnet (chainId: 5042002)
- Get testnet USDC from https://faucet.circle.com

### "Skill execution timeout"
- Skill took >30s
- Check entrypoint logic, simplify for MVP

### Database connection failed
- Check DATABASE_URL format
- Ensure Supabase project is active

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| NEXTAUTH_SECRET | NextAuth secret (32+ chars) | Yes |
| ARC_TESTNET_RPC_URL | Arc testnet RPC | Yes (Arc features) |
| PLATFORM_PRIVATE_KEY | Platform wallet key | Yes (Arc features) |
| AGENTI_MARKETPLACE_CONTRACT | Marketplace contract | Yes (Arc features) |
| AGENTI_SKILL_ESCROW_CONTRACT | Escrow contract | Yes (per_call skills) |
| R2_* | Cloudflare R2 config | Yes (storage) |
| STRIPE_SECRET_KEY | Stripe for fiat | No |

## Production Notes

1. Replace testnet URLs with mainnet equivalents
2. Set up proper CORS origins
3. Configure SSL/TLS
4. Set up monitoring/logging
5. Review and customize rate limits
6. Enable email notifications

## Support

- GitHub Issues: https://github.com/your-org/agenti/issues
- Discord: https://discord.gg/agenti