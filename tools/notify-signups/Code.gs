/**
 * "Notify me" signup collector for anspar.org.
 *
 * Bound to a Google Sheet. The website POSTs an email address here and it is
 * appended as a row: Timestamp | Email | Source. Duplicate emails are ignored.
 * See README.md in this folder for setup.
 */

var SHEET_NAME = 'Signups';

function doPost(e) {
  var p = (e && e.parameter) || {};

  // Honeypot: real visitors never fill this hidden field; bots often do.
  if (p.website) return json_({ ok: true });

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
