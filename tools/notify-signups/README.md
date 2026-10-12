# "Notify me" signups → Google Sheet

The "Notify me" box on `/curehht-journal/` is a Netlify Form
(`curehht-journal-notify`). For each verified submission:

1. It appears in the Netlify dashboard under **Forms** (exportable as CSV).
2. The Netlify function `netlify/functions/notify-signup-to-sheet.mts` sends
   the email to a Google Apps Script web app, which appends it to a Google
   Sheet (`Timestamp | Email | Source`). Duplicates are skipped.
3. The Netlify App for Slack posts it to #marketing (see below).

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
4. Set `DEFAULT_ENDPOINT` in `netlify/functions/notify-signup-to-sheet.mts`
   to that URL and push, or set it as the `NOTIFY_SHEET_ENDPOINT`
   environment variable in Netlify (it overrides the default).
5. Test it: submit your own email on the live page and confirm a row appears
   in the **Signups** tab.

If you later edit `Code.gs`, use **Deploy → Manage deployments → Edit → New
version** so the URL stays the same.

If a submission shows in Netlify but not in the sheet, check the
`notify-signup-to-sheet` function logs in Netlify (**Logs → Functions**).

## Slack alerts (#marketing)

Slack alerts come from Netlify's official Slack app, so no token is stored in
this repo or in the script. One-time setup, done by a Netlify Team Owner who
can install apps in the Slack workspace:

1. Netlify: **Team settings → Notifications → Slack notifications → Select
   workspace**, and authorise the Netlify app in Slack.
2. In Slack, open #marketing and add the app: `@Netlify` (or
   `/invite @Netlify` if the channel is private).
3. In #marketing, run `/netlify`, choose **Form submissions**, and pick the
   `anspar` site. You can also do this in Netlify under **Project
   configuration → Notifications → Slack notifications → Add subscription**.
4. Submit a test address on the live page and check #marketing.

Slack is notified of every verified submission. That includes repeat
sign-ups, which the sheet skips. Netlify's spam filter and the honeypot
field run before the Slack alert.

## Emailing the list

- Small announcement: copy the Email column and paste it into the **BCC**
  field of a normal email (never To/CC — that exposes everyone's address).
- Personalised or larger sends: Gmail's built-in mail merge, or **File →
  Download → CSV** and import into Mailchimp / Buttondown / listmonk etc.
  when the list outgrows this.

Remember to honour unsubscribe requests by deleting the row.

## Spam protection

Netlify discards submissions that fill in the hidden "website" honeypot
field, and its spam filter flags others; neither reaches Slack or the sheet.
On top of that, `Code.gs` quietly drops a submission if:

- the hidden "website" honeypot field is filled in (bots fill every field);
- it arrives less than 2 seconds after the page loaded, or without the page's
  timing field (i.e. a bot posting straight to the endpoint);
- the address is invalid or already on the list.

It also stops accepting signups after `MAX_SIGNUPS` (500) rows, so a flood
can't grow the sheet without limit. Skim new rows before sending to the list.
If junk still gets through, add [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/)
(free, invisible CAPTCHA). It needs a site key on the page and a server-side
verification call in `doPost` using `UrlFetchApp`.

## Security notes

The web app runs as you, but it only ever appends text to its own sheet. It
never evaluates input, reads other files, or returns sheet contents.

- `@OnlyCurrentDoc` limits its access to this one spreadsheet, not your
  whole Drive.
- Formula injection: emails must match a strict pattern with no `=`, `(`, `"`
  and so on. Values are also written with a leading `'`, so Sheets always
  stores them as plain text. The `source` field is reduced to letters,
  digits and `-`.
- The response is the same whether or not an address is already on the list,
  so the endpoint can't be used to check who signed up.
