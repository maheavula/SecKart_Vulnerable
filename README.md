# SecKart Commerce

SecKart is a local full-stack premium ecommerce application with a liquid-glass interface, 49 products, persistent server data, role-aware workspaces, and a realistic test-payment flow.

## Run

```powershell
cd "C:\Users\2439819\codex_practice\SecKart Application"
npm start
```

Open <http://127.0.0.1:8090>.

## Demo identities

| Username | Password | Role | Functional access |
|---|---|---|---|
| `customer` | `Customer#Cart26` | Customer | Profile, address, wishlist, bag, checkout, own orders |
| `seller` | `Seller#Stock26` | Seller | Products, inventory, orders, refunds, manifest import |
| `admin` | `Admin#Control26` | Admin | Users, roles, account status, catalogue, settings, audit history |

Public registration creates Customer accounts only. Seller and Admin access is provisioned by an Admin. Frontend workspaces and backend APIs enforce the current role.

## Test payment gateway

Checkout follows delivery, payment, review, authorization, and order confirmation. It uses synthetic data and never contacts a real processor.

- Approved card: `4242 4242 4242 4242`
- Declined card: `4000 0000 0000 0002`
- Expiry: any future-looking `MM/YY`
- CVC: any three digits

## Security

The previously intentional OWASP weaknesses have been removed. Customer profile updates cannot change roles, debug routes are not published, reset and session tokens are cryptographically random, review content is encoded, coupon exclusivity and server-side pricing are enforced, failed payments are audited, imports are schema-validated, and API errors do not expose internals.

The server also applies role checks, login throttling, same-origin mutation checks, strict SameSite cookies, a Content Security Policy, restrictive browser permissions, and security response headers. See [SECURITY.md](SECURITY.md) for the remediation and verification summary.

## Data storage

Users, profiles, wishlists, products, inventory, orders, settings, audit records, and refunds persist in `data/runtime.json`. Passwords use salted `scrypt` hashes. Sessions live in memory behind an HttpOnly, SameSite cookie, so a restart signs users out without deleting commerce data.

## Validate

```powershell
npm test
npx cypress run --config-file cypress.config.js --browser electron
```
