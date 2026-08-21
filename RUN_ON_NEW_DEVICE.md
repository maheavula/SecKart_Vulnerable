# Run SecKart on a New Device

## 1. Install the prerequisite

Install Node.js 20 or newer from <https://nodejs.org/>. During Windows installation, keep **Add to PATH** enabled.

Verify it in a new PowerShell or terminal window:

```powershell
node --version
npm --version
```

## 2. Copy the application

Copy the complete `SecKart Application` folder to the new device. Keep `server.js`, `app.js`, `index.html`, `styles.css`, `assets`, `data`, `tests`, and `package.json` together.

Do not copy `data/runtime.json` if you want a clean catalogue, clean orders, and newly seeded users. The server creates it automatically on first start.

## 3. Start the application

Open PowerShell in the copied folder:

```powershell
cd "C:\path\to\SecKart Application"
npm start
```

No third-party runtime packages are required. A successful start prints:

```text
SecKart running at http://127.0.0.1:8090
```

Open <http://127.0.0.1:8090> in a browser. Keep the terminal running while using SecKart. Stop it with `Ctrl+C`.

## 4. Seeded credentials

The sign-in page intentionally does not display accounts, roles, or passwords.

| Username | Password | Role |
|---|---|---|
| `customer` | `Customer#Cart26` | Customer |
| `seller` | `Seller#Stock26` | Seller |
| `admin` | `Admin#Control26` | Admin |

Public sign-up always creates a Customer account.

## 5. Validate the installation

In a second terminal, from the same folder:

```powershell
npm test
```

Expected result: eight passing tests. Check the health endpoint with:

```powershell
Invoke-RestMethod http://127.0.0.1:8090/api/system/health
```

Expected response: `status` equals `ok`.

## 6. Data storage and reset

Runtime users, profiles, reviews, inventory, orders, wishlists, settings, audit events, and refunds are stored in `data/runtime.json`.

To reset a disposable installation, stop the server, back up `data/runtime.json` if needed, delete only that file, and start the server again. This recreates the three seeded accounts and clean runtime data. Never use real credentials, personal information, or payment-card data.

## 7. Network scope

By default SecKart binds to `127.0.0.1`, so it is reachable only from the same device. Opening it to other devices requires an explicit code/configuration change plus firewall review; do not expose this intentionally vulnerable training application to an untrusted network or the public internet.
