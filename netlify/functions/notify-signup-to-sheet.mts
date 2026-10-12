// Copies each verified "Notify me" submission (Netlify Forms, form
// "curehht-journal-notify") to the Google Sheet via the Apps Script web app in
// tools/notify-signups/. The sheet still handles duplicates, the row limit
// and formula-injection safety. Slack alerts come from the Netlify App for
// Slack, not from here. See tools/notify-signups/README.md.

// Override with a NOTIFY_SHEET_ENDPOINT env var if the Apps Script is redeployed
// under a new URL.
const DEFAULT_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbyJZFP5Veip6zCy_doXcBUal57dZQ2N6KNAgsKf93bzsod6c18tO2A5D5Qxwd-uzN3b/exec'

export default {
  async formSubmitted(event: { data: Record<string, string> }) {
    const data = event.data || {}
    // Only the launch signup form has these fields; ignore any other form.
    if (!data.email || data.source !== 'curehht-journal') return

    const endpoint = Netlify.env.get('NOTIFY_SHEET_ENDPOINT') || DEFAULT_ENDPOINT
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: new URLSearchParams({
          email: data.email,
          source: data.source,
          elapsed: data.elapsed || '',
          website: data.website || '',
        }),
      })
      const body = await res.json()
      if (!body.ok) console.error(`Sheet rejected signup: ${body.error}`)
    } catch (err) {
      console.error(`Could not copy signup to sheet: ${err}`)
    }
  },
}
