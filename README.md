# Promise Public Response Web

Next.js public response site for Promise appointment cards.

## Routes

- `GET /c/[token]`: public card response page.
- `POST /api/cards/[token]/responses`: saves anonymous invitee responses through the server-side Supabase admin client.

## Production Domain

Recommended production domain:

```text
https://promise.4ltree.com
```

Mobile app production builds should use:

```env
EXPO_PUBLIC_CARD_BASE_URL=https://promise.4ltree.com
```

## Environment

Copy `.env.example` into the deployment environment and set real values in Vercel.

`SUPABASE_SERVICE_ROLE_KEY` must be configured only on the server-side web deployment. Do not put it in the mobile app or any client-visible environment variable.

## Commands

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
```
