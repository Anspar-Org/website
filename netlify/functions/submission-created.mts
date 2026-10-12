// Copies each verified "Notify me" submission (Netlify Forms, form
// "curehht-journal-notify") to the Google Sheet via the Apps Script web app in
// tools/notify-signups/. The sheet still handles duplicates, the row limit
// and formula-injection safety. Slack alerts come from the Netlify App for
// Slack, not from here. See tools/notify-signups/README.md.
//
// The filename matters: Netlify runs a function named "submission-created"
// for every verified form submission on the site.

// Override with a NOTIFY_SHEET_ENDPOINT env var if the Apps Script is redeployed
// under a new URL.
const DEFAULT_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbyJZFP5Veip6zCy_doXcBUal57dZQ2N6KNAgsKf93bzsod6c18tO2A5D5Qxwd-uzN3b/exec'

const FORM_NAME = 'curehht-journal-notify'

export default async (req: Request) => {
  const { payload } = (await req.json()) as {
    payload?: { form_name?: string; data?: Record<string, string> }
  }
  // Other forms on the site (e.g. curehht-journal-contact) are ignored.
  if (payload?.form_name !== FORM_NAME) return new Response('Ignored')

  const data = payload.data || {}
  if (!data.email) {
    console.error('Signup submission had no email field')
    return new Response('No email')
  }

  const endpoint = Netlify.env.get('NOTIFY_SHEET_ENDPOINT') || DEFAULT_ENDPOINT
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: new URLSearchParams({
        email: data.email,
        source: data.source || 'curehht-journal',
        elapsed: data.elapsed || '',
        website: data.website || '',
      }),
    })
    const body = await res.json()
    if (body.ok) console.log('Signup copied to sheet')
    else console.error(`Sheet rejected signup: ${body.error}`)
  } catch (err) {
    console.error(`Could not copy signup to sheet: ${err}`)
  }
  return new Response('OK')
}
