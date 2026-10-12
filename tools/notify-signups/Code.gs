/**
 * "Notify me" signup collector for anspar.org.
 *
 * Bound to a Google Sheet. The website POSTs an email address here and it is
 * appended as a row: Timestamp | Email | Source. Duplicate emails are ignored.
 * See README.md in this folder for setup.
 */

var SHEET_NAME = 'Signups';
// Stop accepting signups past this many rows, so a bot flood can't fill the
// sheet. Well above the expected list size; raise it if you ever hit it.
var MAX_SIGNUPS = 500;
// Submissions sent sooner than this after page load are almost certainly bots.
var MIN_ELAPSED_MS = 2000;

function doPost(e) {
  var p = (e && e.parameter) || {};

  // Honeypot: real visitors never fill this hidden field; bots often do.
  if (p.website) return json_({ ok: true });
  // Too fast to be a person typing an address: drop it, but look successful.
  if (!(Number(p.elapsed) >= MIN_ELAPSED_MS)) return json_({ ok: true });

  var email = String(p.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) {
    return json_({ ok: false, error: 'invalid_email' });
  }
  var source = String(p.source || '').slice(0, 100);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();
    var last = sheet.getLastRow();
    if (last - 1 >= MAX_SIGNUPS) return json_({ ok: false, error: 'full' });
    if (last > 1) {
      var existing = sheet.getRange(2, 2, last - 1, 1).getValues();
      for (var i = 0; i < existing.length; i++) {
        if (String(existing[i][0]).toLowerCase() === email) {
          return json_({ ok: true, duplicate: true });
        }
      }
    }
    sheet.appendRow([new Date(), email, source]);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Email', 'Source']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
