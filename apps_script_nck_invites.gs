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
        return ContentService.createTextOutput(JSON.stringify({ok:true,email:rows[i][0],name:rows[i][1],states:rows[i][4]||''})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ok:false})).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ok:false})).setMimeType(ContentService.MimeType.JSON);
}



function parsePayload(e){
  if(e && e.postData && e.postData.type && e.postData.type.indexOf('application/json') !== -1){
    return JSON.parse(e.postData.contents || '{}');
  }
  return (e && e.parameter) || {};
}

// Allow saving/loading of per-invite states via POST (action=save_states) and GET (token)
function doPost(e){
  try{
    const payload = parsePayload(e);
    // Admin-only: create invite when secret provided
    if(payload.secret){
      if(payload.secret !== OWNER_SECRET) return ContentService.createTextOutput(JSON.stringify({ok:false,err:'unauthorized'})).setMimeType(ContentService.MimeType.JSON);
      const sheetResult = getSheet();
      if(sheetResult.error) return sendJson(sheetResult.payload);
      const sheet = sheetResult.sheet;
      const token = payload.token || Utilities.getUuid();
      sheet.appendRow([payload.email||'', payload.name||'', token, new Date(), '']);
      return sendJson({ok:true,token:token});
    }

    // Save states using token (invite holder may save their own progress)
    if(payload.action === 'save_states' && payload.token){
      const sheetResult = getSheet();
      if(sheetResult.error) return sendJson(sheetResult.payload);
      const sheet = sheetResult.sheet;
      const rows = sheet.getDataRange().getValues();
      for(let i=1;i<rows.length;i++){
        if(String(rows[i][2]) === String(payload.token)){
          // column 5 (1-based) = states
          // enforce size limit to protect sheet (approx 50k cell limit)
          if(payload.states && String(payload.states).length > 40000){
            return sendJson({ok:false,err:'states_too_large'});
          }
          sheet.getRange(i+1,5).setValue(payload.states || '');
          return sendJson({ok:true});
        }
      }
      return sendJson({ok:false,err:'token_not_found'});
    }

    return sendJson({ok:false,err:'invalid_request'});
  }catch(err){
    return sendJson({ok:false,err:err.message});
  }
}
