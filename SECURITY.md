# SecKart Security Baseline

SecKart is configured as a security-hardened ecommerce prototype. The deliberately vulnerable behaviors from the earlier training build have been removed.

## Remediated areas

| Area | Enforced behavior |
|---|---|
| Authorization | Customer profile input is allow-listed and cannot modify roles; privileged APIs enforce Seller/Admin roles |
| Configuration | The `/debug` route and diagnostic file are removed; generic errors contain no stack traces |
| Image processing | Customer image metadata is restricted to PNG, JPEG, or WebP names and a 5 MB maximum; no vulnerable processor is invoked or disclosed |
| Password reset | A 256-bit random token is generated, only its SHA-256 hash is stored, it expires after 15 minutes, and responses never expose it |
| Reviews | Product IDs and ratings are validated, text is length-limited and HTML-encoded before storage |
| Coupons | Duplicate, hidden, and additional coupons are rejected by selecting at most one public offer |
| Sessions | Every normal and Remember-Me session uses a fresh 256-bit random token; cookies are HttpOnly, SameSite=Strict, Path-scoped, and high priority |
| Checkout integrity | Product name, availability, and price are recalculated from the server catalogue; client prices are ignored |
| Monitoring | Failed logins, declined payments, invalid payments, account creation, profile changes, reviews, refunds, and administrative changes are audited |
| Imports | Saved-product imports use a bounded schema and return generic validation errors without implementation details |

## Additional controls

- Login attempts are throttled after five failures for 15 minutes per source/account pair.
- New passwords require at least 12 characters with uppercase, lowercase, number, and symbol.
- Cross-origin browser mutation requests are rejected.
- Responses include a Content Security Policy, clickjacking protection, MIME sniffing protection, restrictive browser permissions, no-referrer policy, and same-origin resource policy.
- Order detail access checks Customer ownership on the server.
- Refunds are idempotent and audited.

## Verification

Run `npm test`. The security regression suite confirms that former exploit paths are rejected and normal role, catalogue, and payment behavior remains operational.

## Deployment limitations

The JSON persistence layer is intended for a single-process local prototype. Before an internet or multi-user deployment, migrate to a transactional database, terminate TLS at a trusted reverse proxy, use a managed email provider for password-reset delivery, store secrets outside the repository, and use a shared session/rate-limit store.
