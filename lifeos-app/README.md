# LifeOS

LifeOS is a local-first personal tracking app for finance, habits, goals, tasks, health, learning, travel, and other parts of daily life. Multiple testers can create accounts and use the same running installation. Each account has its own records.

The app does not use a cloud service. The Next.js app runs on one host computer and stores accounts and records in a SQLite database file in the project directory.

## Requirements

- Node.js 22.13 or later. LifeOS uses Node's built-in `node:sqlite` module; no separate database server or SQLite package is needed.
- npm, included with Node.js.
- Git, if cloning the project.

The built-in SQLite module may print an experimental-feature warning depending on the Node.js release. The project currently targets Node.js 22.

## Install

From the repository root:

```bash
cd lifeos-app
npm ci
```

`npm ci` installs the locked dependency versions from `package-lock.json`. Use it for a clean clone or reproducible install. `npm install` can be used when intentionally changing dependencies.

## Run Locally

From `lifeos-app`:

```bash
npm run dev
```

Open <http://localhost:3000>.

To let testers on the same local network use the same app and database, run:

```bash
npm run dev -- --hostname 0.0.0.0
```

Keep this terminal and the host computer running while testers use the app. In the terminal output, find the host's network address and share that address with testers, for example `http://192.168.0.109:3000`. Do not use `0.0.0.0` as the address in the browser. All testers must use the same running LifeOS instance to share its accounts and records.

For a local production-style run:

```bash
npm run build
npm run start -- --hostname 0.0.0.0
```

## Accounts and Data

1. Select **Create an account** from the sign-in screen.
2. Enter a display name, a unique username, and a password of at least 6 characters.
3. Sign in with that username and password. Each tester can create multiple finance accounts inside their own LifeOS account.
4. Use **Sign out** before another tester signs in on the same device.
5. To change a password, use Settings. To reset a forgotten password, use **Forgot password?** on the sign-in screen and enter the account username and a new password.

The first account created can import any records from the previous browser-storage version if signup is done in the browser that contains those records. After import, the old browser copies are removed. Other testers' browser-only data is not imported automatically.

The local database is created automatically at:

```text
data/lifeos.sqlite
```

This path is relative to `lifeos-app`. It contains the tester accounts and their records. The app's `.gitignore` excludes this folder, so the database is not included in normal Git changes. To preserve data, stop the app and back up the `data` folder separately. Do not commit the database to the shared source repository.

Deleting data from Settings resets only the signed-in account's records and restores its default categories and Cash account. It does not delete that account or other testers' records.

## Dependencies

Production dependencies:

| Package | Version | Purpose |
| --- | --- | --- |
| `next` | `16.3.4` | App framework and local server/API routes |
| `react` | `19.2.8` | UI components |
| `react-dom` | `19.2.8` | Browser rendering |

Development dependencies:

| Package | Version | Purpose |
| --- | --- | --- |
| `@tailwindcss/postcss` | `^4` | Tailwind CSS build integration |
| `@types/node` | `^20` | Node.js TypeScript definitions |
| `@types/react` | `^19` | React TypeScript definitions |
| `@types/react-dom` | `^19` | React DOM TypeScript definitions |
| `eslint` | `^9` | Code linting |
| `eslint-config-next` | `16.3.4` | Next.js lint rules |
| `tailwindcss` | `^4` | Utility CSS framework |
| `typescript` | `^5` | TypeScript compiler |

SQLite and password-hashing functions come from Node.js built-in modules. No external database, authentication, chart, or form package is currently required. The lockfile also contains the exact versions of transitive dependencies installed by npm.

## Useful Commands

Run these from `lifeos-app`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the app |
| `npm run start` | Start the built app |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit --incremental false` | Check TypeScript types |

There is currently no test script configured in `package.json`.

## Project Structure

```text
lifeos-app/
  src/
    app/
      api/          Local account and data API routes
      globals.css   App styles
      layout.tsx    Root layout and metadata
      page.tsx      Session restore and app navigation
    components/     Login, tracking modules, and shared views
    lib/
      server/       Local SQLite database and account/session helpers
      data-service.ts
                    LifeOS record operations and calculations
      storage.ts    Client cache and local API adapter
      types.ts      Shared data types
  data/             Created at runtime; local SQLite database; ignored by Git
```

## Configuration

No environment variables are required for local development. `.env*` files are ignored by Git. The database path is `lifeos-app/data/lifeos.sqlite`.
