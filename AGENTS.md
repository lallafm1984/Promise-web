# Repository Boundary

The Promise mobile app and Promise public response web app are intentionally stored in separate GitHub repositories.

## Repositories

- Mobile app repo: `https://github.com/lallafm1984/Promise.git`
- Web response repo: `https://github.com/lallafm1984/Promise-web.git`

## Working Directories

- Mobile app local path: `E:\LimProjects\Promise\mobile`
- Web response local path: `E:\LimProjects\Promise\web`

## Rules

- Commit and push web changes from `E:\LimProjects\Promise\web` to `lallafm1984/Promise-web`.
- Commit and push mobile app changes from `E:\LimProjects\Promise\mobile` to `lallafm1984/Promise`.
- Do not assume the parent folder `E:\LimProjects\Promise` is a Git repository.
- Do not copy `.env.local`, service-role keys, build outputs, or `node_modules` between repositories.
- The web repo owns `GET /c/[token]` and `POST /api/cards/[token]/responses`.
- The mobile repo owns card creation and `EXPO_PUBLIC_CARD_BASE_URL`.
