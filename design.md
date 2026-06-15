# T3 MedAgent — Design System

## Brand Identity
**T3 MedAgent** — Privacy-Preserving AI Health Navigator
Tagline: *"Your Health, Verified On-Chain"*

## Color Palette
```css
--primary: #00D4FF;        /* Cyan — T3/tech accent */
--primary-dark: #0099CC;
--secondary: #7C3AED;      /* Violet — medical/intelligence */
--accent: #10B981;         /* Emerald — health positive */
--danger: #EF4444;         /* Red — alerts */
--warning: #F59E0B;        /* Amber — caution */
--bg-base: #0A0F1E;        /* Deep navy — dark base */
--bg-surface: #111827;     /* Slate card surface */
--bg-elevated: #1F2937;    /* Elevated panels */
--text-primary: #F9FAFB;   /* Near white */
--text-secondary: #9CA3AF; /* Muted gray */
--text-accent: #00D4FF;    /* Cyan labels */
--border: #1E2A3A;         /* Subtle border */
--border-glow: rgba(0, 212, 255, 0.3);
```

## Typography
- **Display:** `Syne` (700, 800) — headers, hero
- **Body:** `Inter` (400, 500, 600) — all text
- **Mono:** `JetBrains Mono` — addresses, hashes, code
- Base: 16px / 1.5 line height

## Layout
- Max content width: 1280px, centered
- Sidebar: 260px (dashboard)
- Grid: 12-col with 24px gutter
- Card border-radius: 12px
- Section padding: 80px vertical

## Components
- **GlassCard:** `bg-bg-surface/60 backdrop-blur-xl border border-border` 
- **PrimaryButton:** `bg-primary text-bg-base font-semibold hover:bg-primary-dark`
- **StatusBadge:** color-coded pill (verified=emerald, pending=amber, failed=red)
- **HashDisplay:** monospace truncated address with copy button
- **DKGBadge:** animated pulse ring — green when attested, red when failed
- **TerminalBlock:** dark code block for audit logs + on-chain data

## Motion
- Page load: stagger-reveal bottom-to-top (0.05s delay per item)
- Tab switch: fade + slight translate
- Status updates: pulse animation on badge
- Chat: slide-in messages from bottom

## Visual Motifs
- Hexagonal grid pattern on hero (SVG, 5% opacity)
- Gradient mesh blob backgrounds
- Glowing cyan lines on nav
- Lock icon with green checkmark for "verified" states

## Dark Theme Rules
- All backgrounds: dark navy/slate variants
- All text: white/gray scale only
- All accents: cyan (#00D4FF) or violet (#7C3AED)
- Avoid pure black backgrounds — use #0A0F1E

## Page-specific Design

### Landing
- Full-width hero with animated hex grid
- Bold headline: "AI Health Agent with On-Chain Privacy"
- 3 feature cards (OTP Identity, TEE Execution, Agent Delegation)
- CTA: "Start Health Session" → /onboard

### Onboard
- Step wizard (3 steps): Contact → OTP → Profile
- Phone/email input with animated verification
- Progress bar top

### Dashboard
- Split layout: chat left (2/3), stats right (1/3)
- Chat: message bubbles, loading dots, agent avatar
- Right panel: DID, session status, contract count

### Audit Log
- Full-width table with tx hash, timestamp, contract, function
- Expandable rows with raw JSON
- Export button

### Delegation
- Agent cards with public key, granted functions list
- "Grant Delegation" modal with function selector

### Verify (DKG)
- Large status card: TEE attestation result
- Peer list with individual quote results
- Animated checkmarks
