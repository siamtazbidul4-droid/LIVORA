# Novara Commerce

Novara Commerce is a React storefront and Express API for retail, catalog, cart,
orders, and payment workflows. It uses MongoDB for persistent data.

## Local development

Prerequisites: Node.js and npm.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Set `MONGODB_URI`, a private `JWT_SECRET` of at least 32 characters, and the
   administrator credentials described below.
4. Start the app with `npm run dev`.

Demo catalog and account seeding is available only outside production.

## Checks and production build

- `npm test` runs the Vitest suite.
- `npm run lint` runs the TypeScript check.
- `npm run build` builds the browser app and server bundle.
- `npm start` starts the built server.

The build scripts intentionally avoid PowerShell-only syntax so they remain
compatible with Linux Render builds while keeping the repo's Windows PowerShell
workflow intact for local development. When deploying on Render, set
`NPM_CONFIG_SCRIPT_SHELL=/bin/bash` (or pass it in the Build Command) to
override the repo-local Windows PowerShell setting for the build environment.

Production startup requires a reachable MongoDB database and a configured
`JWT_SECRET`. Production does not seed demo users or catalog data. When both
administrator variables are configured, startup creates the administrator
record only if that email does not already exist. Existing staff records and
passwords are never changed automatically. If the email already belongs to a
customer, startup fails without promoting or changing that account.

Admin product and homepage image uploads use signed Cloudinary uploads through
the authenticated API. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
and `CLOUDINARY_API_SECRET` on the server. The API accepts JPEG, PNG, and WebP
images up to 5 MB, verifies file signatures, and never exposes the signing
secret to the browser. Existing external image URLs remain viewable when editing
older records; new images can be selected from the device and uploaded.

## Language and tenancy scope

The storefront interface is currently English. Product/category records can
include Bangla names, and search includes a limited English/Bangla synonym
expansion; this is not a complete localized interface and there is no language
switcher or localized route system. Novara currently operates as a single-vendor
storefront with staff roles, not as a multi-tenant SaaS product; tenant isolation,
workspace subscriptions, and subscription billing are not implemented.

## Authentication configuration

Email/password registration and sign-in require a connected MongoDB database.
The API validates inputs, hashes passwords, and issues bearer tokens. Configure
a private `JWT_SECRET` of at least 32 characters. Tokens are currently stored
in browser local storage. The server validates stored tokens against the current
user record; sign-out and password changes revoke prior tokens.
A future security improvement should migrate tokens to HttpOnly cookies with
CSRF protections.

Configure `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the server's private `.env` file
for the environment-managed administrator. Use a unique password of at least
12 characters; the password is compared only on the server and is never stored
in the browser bundle. Do not use `VITE_` names for either value. The
environment-managed account uses a random, non-login password in the user
database and authenticates through the staff portal with these environment
credentials. Other existing staff accounts continue to use their database
passwords. Staff-portal login attempts are rate limited per server process.

For local development, copy the safe placeholders from `.env.example` and set
real values in `.env`. For deployments (including Render or similar platforms),
add both values as private service environment variables in the server runtime,
then restart/redeploy the service. Never commit `.env` or put either value in
frontend build settings. If the configured email already belongs to a customer,
choose a different administrator email or resolve that account through an
approved operational process; startup will not silently promote it.

Google sign-in uses the Google Identity Services authorization-code flow. Set
`VITE_GOOGLE_CLIENT_ID` to the public web client ID and set the same value as
server-side `GOOGLE_CLIENT_ID`; set the corresponding OAuth client secret as
server-only `GOOGLE_CLIENT_SECRET`. `PUBLIC_APP_URL` must be the app's exact
origin (including `https` in production), and the Google Cloud console must
allow that origin as an authorized JavaScript origin. The backend exchanges
the one-time authorization code and verifies the resulting ID token; the
browser never receives the provider tokens.

Facebook sign-in uses the Facebook JavaScript SDK. Set
`VITE_FACEBOOK_APP_ID` to the public app ID and set the same value as
`FACEBOOK_APP_ID`; keep `FACEBOOK_APP_SECRET` server-side. Configure the
application domain and allowed OAuth origins in Meta for Developers. Facebook
accounts without an email are rejected because the current account schema
requires one. Existing email/password accounts are not silently linked to a
social identity; an authenticated account-linking flow is not implemented.

Social sign-in requires valid provider app configuration and has not been
verified with live provider credentials. Password reset is not configured.
Order creation and payment settlement use multi-document MongoDB transactions;
use a replica set or sharded cluster. A standalone MongoDB server is not
sufficient.

No payment success simulation is provided. bKash Tokenized Checkout v2 is only
shown at checkout when merchant credentials, the correct sandbox/production
endpoint, and `PUBLIC_API_URL` / `PUBLIC_APP_URL` are configured. Production URLs
must use HTTPS. The server verifies provider status before marking an order paid.
The gateway flow has not been verified against a merchant sandbox or production
account; configure valid merchant credentials and complete provider-side testing
before accepting payments.

Nagad and card checkout are disabled: the previous Nagad flow contained
placeholder cryptographic values and was not a valid merchant integration.
“Jitbit Cash” could not be identified as a supported payment provider. Do not
enable either method until the provider identity and its official merchant
integration requirements are verified.

Bangladesh address options use `bangladesh-location-data` 1.0.6 (MIT), with
stable IDs and parent relationships. The installed data contains 8 divisions,
64 districts, 504 Upazilas, and 4,964 unions. New orders and saved addresses are
validated against the same dataset. Existing label-only saved addresses remain
stored; they are not bulk-migrated, and ambiguous or unmatched legacy labels
must be corrected before reuse. The package is a community-maintained dataset,
not a live government registry, so administrative changes may lag.

Keep `.env` private and never commit credentials.
