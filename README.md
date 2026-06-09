# SEOWallet Web

Next.js web application for the SEOWallet suite. This is the SaaS-facing frontend that shares identity with SEO Debate and the Chrome extension through the local API gateway and user service.

## What It Contains

- Auth screens for signup, login, email verification, forgot/reset password, Google SSO, and Keycloak callback handling.
- Account setup flows for business, agency, and SEO expert profiles.
- Dashboard, tools, marketplace, wallet, and profile screens.
- Credit balance and transaction history backed by `wallet-service`.
- Native `fetch` API client in `src/lib/api-client.ts`.

## Local URLs

When running through the root compose stack:

- App through nginx: `http://localhost:8080/`
- Direct Next.js dev server: `http://localhost:3000/`
- API gateway: `http://localhost:8080/api/v1`
- Keycloak: `http://localhost:8081`

SEO Debate is served separately under `http://localhost:8080/hub/`.

## Environment

Copy the example file when running outside Docker:

```bash
cp .env.local.example .env.local
```

Current variables:

```bash
NEXT_PUBLIC_SSO_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8081
NEXT_PUBLIC_KEYCLOAK_REALM=seowallet
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=seowallet-web
```

Use the nginx/gateway URL for `NEXT_PUBLIC_SSO_API_BASE_URL` in normal local development so auth, profile, wallet, and SEO Debate integration all go through the same entrypoint.

## Run With Docker Compose

From the workspace root:

```bash
docker compose -f docker-compose.local.yml up -d seowallet-web nginx api-gateway wallet-service
```

The compose service mounts this folder into `/app` and runs:

```bash
npm install && npm run dev -- -p 3000 -H 0.0.0.0
```

Use `http://localhost:8080/` for the full local suite route.

## Run Directly

```bash
npm install
npm run dev
```

Then open `http://localhost:3000/`.

The direct mode still expects the API gateway and dependent services to be running unless you point `NEXT_PUBLIC_SSO_API_BASE_URL` somewhere else.

## Scripts

```bash
npm run dev        # Start Next.js dev server
npm run build      # Production build
npm run start      # Start production server after build
npm run lint       # Next lint
npm run typecheck  # TypeScript check
```

## Important Paths

- `src/app/(auth)/auth/*` - auth and onboarding screens.
- `src/app/dashboard/page.tsx` - dashboard, tools, wallet, and profile UI.
- `src/lib/api-client.ts` - API gateway client for auth, profile, and wallet endpoints.
- `src/lib/keycloak-auth.ts` - Keycloak OIDC login/callback helpers.
- `src/lib/session.ts` - browser session storage.
- `src/lib/seo-tools.ts` - tool definitions and local tool execution logic.

## Auth Flow

The web app currently supports:

- Local username/email + password login through `google-sso-user-service`.
- Google SSO through the user service.
- Keycloak OIDC login and callback handling.

All authenticated API calls send `Authorization: Bearer <token>` to the API gateway. The gateway validates the token and forwards identity context to downstream services.

## Wallet/Credits

The dashboard reads wallet data from:

```text
GET /api/v1/wallet
```

Tool runs spend credits through:

```text
POST /api/v1/wallet/spend
```

Credit top-ups currently create real ledger rows but do not yet integrate with a payment provider:

```text
POST /api/v1/wallet/grant
```

Each grant/spend call includes an `idempotencyKey` so retries do not double-apply credits.

## Notes

- Keep generated files out of git: `.next`, `node_modules`, `*.tsbuildinfo`, logs, and local env files are ignored.
- Do not add `axios`; this workspace uses native `fetch` or approved existing clients only.
