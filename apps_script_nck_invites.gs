// Apps Script for NCK invites
// Paste into a new Apps Script project (Extensions → Apps Script)
// Update SHEET_ID and OWNER_SECRET before deploying.

const SHEET_ID = 'REPLACE_WITH_SHEET_ID';
const SHEET_NAME = 'friends';
const OWNER_SECRET = 'REPLACE_WITH_A_STRONG_SECRET';

function sendJson(payload){
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet(){
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if(!sheet){
    return { error: true, payload: { ok:false, err:'no_sheet', expectedSheet:SHEET_NAME, availableSheets:ss.getSheets().map(s=>s.getName()) } };
  }
  return { error: false, sheet };
}

function doGet(e){
  const token = e.parameter.token;
  const sheetResult = getSheet();
  if(sheetResult.error){
    return sendJson(sheetResult.payload);
  }
  const sheet = sheetResult.sheet;
  if(token){
    const rows = sheet.getDataRange().getValues();
    for(let i=1;i<rows.length;i++){
      if(String(rows[i][2]) === String(token)){
        return ContentService.createTextOutput(JSON.stringify({ok:true,email:rows[i][0],name:rows[i][1]})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ok:false})).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ok:false})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e){
  try{
    const payload = parsePayload(e);
    if(payload.secret !== OWNER_SECRET) return ContentService.createTextOutput(JSON.stringify({ok:false,err:'unauthorized'})).setMimeType(ContentService.MimeType.JSON);
    const sheetResult = getSheet();
    if(sheetResult.error){
      return sendJson(sheetResult.payload);
    }
    const sheet = sheetResult.sheet;
    const token = payload.token || Utilities.getUuid();
    sheet.appendRow([payload.email||'', payload.name||'', token, new Date()]);
    if(payload.invitePageUrl){
      try{
        sendInviteEmail(payload.email, payload.name, token, payload.invitePageUrl);
      }catch(emailErr){
        return sendJson({ok:false,err:'email_failed',emailError:emailErr.message});
      }
    }
    return sendJson({ok:true,token:token});
  }catch(err){
    return sendJson({ok:false,err:err.message});
  }
}

function sendInviteEmail(email, name, token, invitePageUrl){
  const safeName = name || 'friend';
  const inviteUrl = invitePageUrl + (invitePageUrl.indexOf('?') === -1 ? '?' : '&') + 'invite=' + encodeURIComponent(token);
  const subject = 'Your NCK revision invite';
  const body = `Hello ${safeName},\n\n` +
    `You have been invited to use the NCK Nursing Revision Timetable. ` +
    `Open the following link to access your invite and save your progress:\n\n` +
    `${inviteUrl}\n\n` +
    `If the link does not work, paste it into your browser address bar.\n\n` +
    `Good luck with your revision!\n` +
    `- NCK Timetable`;
  MailApp.sendEmail(email, subject, body);
}

function parsePayload(e){
  if(e && e.postData && e.postData.type && e.postData.type.indexOf('application/json') !== -1){
    return JSON.parse(e.postData.contents || '{}');
  }
  return (e && e.parameter) || {};
}
