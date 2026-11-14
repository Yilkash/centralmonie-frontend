# CentralMonie web app

**Money moves. Fraud doesn't.**

The web app for CentralMonie, live at **https://centralmonie.up.railway.app**. People hold dollars (USDC on Base) and
pay any Nigerian bank account by chatting or from the Send page, attach an invoice photo or PDF to pay it, and get
paid with payment links and checkout. **Before any naira leaves, CentralMonie Protect checks the payment with SERV
Reasoning**, and the approval card shows the verdict (pay, ask or block) with its reasons. Built for OpenServ SERV
Hackathon 02, Open Track.

**What CentralMonie is, how it uses SERV Reasoning, the evidence and how to run it are in the backend's README:
[Yilkash/centralmonie-backend](https://github.com/Yilkash/centralmonie-backend).**

## What Protect looks like in the app

| Part | What it does |
| --- | --- |
| Approval card | A green, amber or red box with SERV's verdict, the two most serious reasons and "See all reasons". **Block** disables Approve; **ask** needs "I have checked this and want to pay anyway" |
| 📎 in the chat | Attach an invoice photo or PDF. SERV reads it, any hidden text is shown in red, and the picture of the invoice opens full size |
| Protect page | Every check: how many passed, needed you, or were blocked, each with its reasons and time |

## Run it for development

Start the backend first (`npm run db:up && npm run dev` in the backend, on port 4010). Then:

```
cp .env.example .env.local
# For local work without Privy keys, add these two lines to .env.local:
#   NEXT_PUBLIC_IDENTITY=test
#   NEXT_PUBLIC_API_URL=http://localhost:4010
npm ci
npm run dev                  # http://localhost:3010
```

## Check it

```
npm test                     # unit tests (Vitest)
npm run typecheck
npm run build
./e2e/run.sh                 # browser tests in Chrome, against a throwaway backend and database
```

`e2e/protect.spec.ts` checks the approval card for pay, ask and block; `e2e/attachment.spec.ts` checks attaching an
invoice end to end against a backend with a SERV key.

## Where things are

| Part | Folder |
| --- | --- |
| The Protect box on the approval card | `components/cards.tsx` (`ProtectBanner`) |
| Attaching an invoice: picker, picture and hidden-text warning | `components/attachment.tsx` |
| The Protect page | `components/protect-panel.tsx` |
| Pages: home, `/docs`, `/pay/[id]`, `/p/[id]`, `/shop`, `/agent` | `app/` |
| The API client and every type the backend returns | `lib/api/client.ts` |
| Gas sponsorship for users' wallets (only USDC) | `app/api/aa/route.ts`, `lib/sponsorship.ts` |
| Browser tests | `e2e/` |

## Disclosure

- **Built on 10kobo.** This app starts from the code of
  [10kobo's web app](https://github.com/blockfuselabs/10kobo-frontend), our MIT-licensed project from an earlier
  hackathon. New for SERV Hackathon 02: the Protect box, attaching invoices, the Protect page and the CentralMonie name.
- **AI-written code.** Most of the code was written with **Claude Code** (Anthropic), directed, tested and reviewed
  by the team.
- **Libraries.** Next.js, React, Tailwind CSS, Privy, viem and permissionless. Tests: Vitest and Playwright. Fonts:
  Inter and IBM Plex Mono (SIL Open Font License, in `app/fonts`).

## License

MIT. See [LICENSE](LICENSE).
