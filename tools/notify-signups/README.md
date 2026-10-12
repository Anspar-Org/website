# "Notify me" signups → Google Sheet

The "Notify me" box on `/curehht-journal/` posts the visitor's email to a
Google Apps Script web app, which appends it to a Google Sheet
(`Timestamp | Email | Source`). Duplicates are skipped. Until the endpoint is
configured, the page falls back to opening a `mailto:info@anspar.org` email.

## One-time setup (~5 minutes)

1. Sign in to the Google account that should own the list and create a new
   Google Sheet (e.g. "Cure HHT Journal – launch signups").
2. In the sheet: **Extensions → Apps Script**. Delete the placeholder code and
   paste in the contents of [`Code.gs`](Code.gs). Save.
3. **Deploy → New deployment** → gear icon → **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   
   Click **Deploy**, approve the permissions prompt (it only needs access to
   this spreadsheet), and copy the **Web app URL** (ends in `/exec`).
4. In `curehht-journal/index.html`, set `NOTIFY_ENDPOINT` to that URL and push.
5. Test it: submit your own email on the live page and confirm a row appears
   in the **Signups** tab.

If you later edit `Code.gs`, use **Deploy → Manage deployments → Edit → New
version** so the URL stays the same.

## Emailing the list

- Small announcement: copy the Email column and paste it into the **BCC**
  field of a normal email (never To/CC — that exposes everyone's address).
- Personalised or larger sends: Gmail's built-in mail merge, or **File →
  Download → CSV** and import into Mailchimp / Buttondown / listmonk etc.
  when the list outgrows this.

Remember to honour unsubscribe requests by deleting the row.

## Spam protection

`Code.gs` quietly drops a submission if:

- the hidden "website" honeypot field is filled in (bots fill every field);
- it arrives less than 2 seconds after the page loaded, or without the page's
  timing field (i.e. a bot posting straight to the endpoint);
- the address is invalid or already on the list.

It also stops accepting signups after `MAX_SIGNUPS` (500) rows, so a flood
can't grow the sheet without limit. Skim new rows before sending to the list.
If junk still gets through, add [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/)
(free, invisible CAPTCHA). It needs a site key on the page and a server-side
verification call in `doPost` using `UrlFetchApp`.
