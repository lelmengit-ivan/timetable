// Apps Script for NCK invites
// Paste into a new Apps Script project (Extensions → Apps Script)
// Update SHEET_ID and OWNER_SECRET before deploying.

const SHEET_ID = 'REPLACE_WITH_SHEET_ID';
const OWNER_SECRET = 'REPLACE_WITH_A_STRONG_SECRET';

function doGet(e){
  const token = e.parameter.token;
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('friends');
  if(!sheet){
    return ContentService.createTextOutput(JSON.stringify({ok:false,err:'no_sheet'})).setMimeType(ContentService.MimeType.JSON);
  }
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
    const payload = JSON.parse(e.postData.contents || '{}');
    if(payload.secret !== OWNER_SECRET) return ContentService.createTextOutput(JSON.stringify({ok:false,err:'unauthorized'})).setMimeType(ContentService.MimeType.JSON);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('friends');
    if(!sheet) return ContentService.createTextOutput(JSON.stringify({ok:false,err:'no_sheet'})).setMimeType(ContentService.MimeType.JSON);
    const token = payload.token || Utilities.getUuid();
    sheet.appendRow([payload.email||'', payload.name||'', token, new Date()]);
    return ContentService.createTextOutput(JSON.stringify({ok:true,token:token})).setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService.createTextOutput(JSON.stringify({ok:false,err:err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}
