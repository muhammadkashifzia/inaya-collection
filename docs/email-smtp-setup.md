# Order Emails: SMTP Setup (Local + Live)

This guide covers how to configure SMTP so the order emails work, both locally and on the live server.

## Which emails get sent

| Email | When it sends | Subject |
|---|---|---|
| Order Confirmation (COD) | When the customer places an order | Your Cash on Delivery Order is Confirmed (#GW-…) |
| Order Processing | Admin sets status → **Processing** | We're Preparing Your Order #… |
| Order Shipped | Admin sets status → **Shipped** (it goes again after the tracking number is saved) | Your Order #… Has Been Shipped |
| Out for Delivery | Admin sets status → **Out for Delivery** | Your Order #… is Out for Delivery Today |
| Order Delivered | Admin sets status → **Delivered** | Your Order #… Has Been Delivered |

Code reference:

- `backend/app/Mail/OrderStatusMail.php`: subject and text for each status
- `backend/app/Services/OrderMailer.php`: sends the email (after the DB commit)
- `backend/resources/views/emails/orders/status.blade.php`: HTML template
- `backend/resources/views/emails/orders/status-text.blade.php`: plain-text version

Emails are sent **synchronously**, so you don't need a queue worker or cron job. If SMTP fails, the order still saves and the error is written to `storage/logs/laravel.log`.

---

## 1. Local development

The default `.env` has `MAIL_MAILER=log`, so emails are not sent. Their full HTML is written to `backend/storage/logs/laravel.log` instead.

```env
MAIL_MAILER=log
```

To view emails in a real inbox locally, use [Mailpit](https://mailpit.axllent.org/) (optional):

```env
MAIL_MAILER=smtp
MAIL_SCHEME=null
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS="orders@anaya.local"
MAIL_FROM_NAME="Anaya Collection"
```

Open Mailpit at `http://localhost:8025`. After changing `.env`, run `php artisan config:clear`.

---

## 2. Live server (cPanel: eastlogic.com)

### Step 1: Create an email account

1. Go to cPanel → **Email Accounts** → **Create**.
2. Create an address such as `orders@anaya.eastlogic.com` (or one on your main domain).
3. Set a strong password and save it somewhere safe.
4. Open **Connect Devices** for that account to see the **Outgoing server** host and port. It's usually `mail.eastlogic.com`, with ports 465 (SSL) and 587 (TLS).

### Step 2: Update the server `.env`

In cPanel → **File Manager**, edit `/home/eastlogic/anaya-api.eastlogic.com/.env`.

**Option A: Port 465 (SSL), recommended**

```env
MAIL_MAILER=smtp
MAIL_SCHEME=smtps
MAIL_HOST=mail.eastlogic.com
MAIL_PORT=465
MAIL_USERNAME=orders@anaya.eastlogic.com
MAIL_PASSWORD="your-email-password"
MAIL_FROM_ADDRESS="orders@anaya.eastlogic.com"
MAIL_FROM_NAME="Anaya Collection"
MAIL_EHLO_DOMAIN=anaya-api.eastlogic.com
```

**Option B: Port 587 (STARTTLS)**

```env
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=mail.eastlogic.com
MAIL_PORT=587
MAIL_USERNAME=orders@anaya.eastlogic.com
MAIL_PASSWORD="your-email-password"
MAIL_FROM_ADDRESS="orders@anaya.eastlogic.com"
MAIL_FROM_NAME="Anaya Collection"
```

Also check these URLs, because the email links and images are built from them:

```env
APP_URL=https://anaya-api.eastlogic.com
FRONTEND_URL=https://anaya.eastlogic.com
```

> **Important**
> - `MAIL_USERNAME` and `MAIL_FROM_ADDRESS` should be the **same** address. Otherwise the server may reject the email or it may land in spam.
> - Wrap the password in double quotes (`"..."`) if it contains `#`, a space or `$`.
> - Never commit `.env` to Git.

### Step 3: Refresh the config cache

Live runs `config:cache`, so the new `.env` values won't apply until the cache refreshes. Use either option:

- **GitHub** → Actions → **Deploy Backend (Laravel API)** → **Run workflow**. The deploy runs `optimize:clear` and `config:cache` again.
- Or, if you have cPanel **Terminal** access:

  ```bash
  cd ~/anaya-api.eastlogic.com
  php artisan config:clear && php artisan config:cache
  ```

### Step 4: Deliverability (to keep emails out of spam)

1. cPanel → **Email Deliverability**: make sure **SPF** and **DKIM** show "Valid" for your domain. If they don't, click **Repair**.
2. Add a DMARC TXT record in DNS (start with `p=none`):

   ```
   Name:  _dmarc
   Type:  TXT
   Value: v=DMARC1; p=none; rua=mailto:orders@anaya.eastlogic.com
   ```

3. The `MAIL_FROM_ADDRESS` domain must match the domain that has SPF and DKIM set up.

### Step 5: Store details in admin settings

The email header and footer pull from **Admin → Settings → Store**. Fill these in before going live, because the defaults (`support@example.com`, `+92 300 0000000`) are placeholders:

- **Store name**: shown in the header
- **Logo** (image): shown in the header. Leave it empty to show the store name as text.
- **Email**: used as the reply-to, so customer replies arrive here
- **Phone / WhatsApp / Hours / Address**: shown in the "Need help?" section
- **Social links**: shown in the footer

---

## 3. Gmail / Google Workspace (alternative)

If you'd rather use Gmail than cPanel email:

1. Turn on 2-Step Verification for the Google account.
2. Create a 16-character password at <https://myaccount.google.com/apppasswords>.

```env
MAIL_MAILER=smtp
MAIL_SCHEME=smtps
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USERNAME=yourstore@gmail.com
MAIL_PASSWORD="abcd efgh ijkl mnop"
MAIL_FROM_ADDRESS="yourstore@gmail.com"
MAIL_FROM_NAME="Anaya Collection"
```

Gmail allows roughly 500 emails a day, which is fine for a small store. For more volume, use a transactional provider such as Brevo, Mailgun, Amazon SES or Postmark. Those only need different SMTP host and credentials; no code changes are required.

---

## 4. Testing

**Quick test (via Terminal):**

```bash
php artisan tinker --execute 'Mail::raw("SMTP test from Anaya", fn ($m) => $m->to("you@example.com")->subject("SMTP test"));'
```

If this arrives, SMTP is working.

**Full flow test:**

1. Place a COD order on the storefront with your own email. You should get the **Confirmation** email.
2. In admin, open the order and go through Confirm → Start processing → Mark as shipped. You should get the **Processing** and **Shipped** emails.
3. Save a tracking number in the Shipment section. The **Shipped** email goes again, this time with tracking.
4. Mark out for delivery, then Mark as delivered. You should get the **Out for Delivery** and **Delivered** emails.

> The **Confirmed** status doesn't send a separate email, because the confirmation email already goes out when the order is placed.

---

## 5. Troubleshooting

All errors are written to `storage/logs/laravel.log` (in cPanel File Manager: `anaya-api.eastlogic.com/storage/logs/`).

| Problem | Fix |
|---|---|
| No email arrives and there's no error in the log | `MAIL_MAILER` may still be `log`, or the config cache is stale. Re-run step 3. |
| `Connection could not be established` / timeout | Wrong host or port. Check the scheme: 465 needs `smtps`, 587 needs `smtp`. |
| `Authentication failed` / `535` | Wrong username or password. The username must be the full email address. |
| `Sender address rejected` | `MAIL_FROM_ADDRESS` doesn't match `MAIL_USERNAME`. |
| Email lands in spam | Fix SPF/DKIM (step 4), add DMARC, and use a From domain that matches. |
| Logo or product images don't show | `APP_URL` is wrong, or `storage:link` hasn't run (the deploy runs it). |
| The "Track your order" link goes to localhost | Set `FRONTEND_URL` to the live storefront URL. |

---

## Go-live checklist

- [ ] Email account created in cPanel
- [ ] `MAIL_*` values set in the server `.env`
- [ ] `APP_URL` and `FRONTEND_URL` point to the live URLs
- [ ] Config cache refreshed (re-run the deploy workflow)
- [ ] SPF and DKIM valid, DMARC added
- [ ] Store email, phone and logo updated in admin settings
- [ ] Test order placed and all 5 emails received
