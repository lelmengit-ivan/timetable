// Apps Script for NCK PIN-based Access
// Paste into a new Apps Script project (Extensions → Apps Script)
// Update SHEET_ID and OWNER_SECRET before deploying.

const SHEET_ID = 'REPLACE_WITH_SHEET_ID';
const SHEET_NAME = 'users'; // Sheet columns: PIN | Name | Email | CreatedAt | LastLogin | Activities | States
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

function parsePayload(e){
  if(e && e.postData && e.postData.type && e.postData.type.indexOf('application/json') !== -1){
    return JSON.parse(e.postData.contents || '{}');
  }
  return (e && e.parameter) || {};
}

// Validate PIN and return user info
function doGet(e){
  const pin = e.parameter.pin;
  const sheetResult = getSheet();
  if(sheetResult.error){
    return sendJson(sheetResult.payload);
  }
  
  const sheet = sheetResult.sheet;
  if(pin){
    const rows = sheet.getDataRange().getValues();
    for(let i=1; i<rows.length; i++){
      if(String(rows[i][0]) === String(pin)){ // Column 1: PIN
        const name = rows[i][1] || '';
        const email = rows[i][2] || '';
        const activities = rows[i][5] ? JSON.parse(rows[i][5]) : [];
        const states = rows[i][6] || '';
        
        // Update LastLogin
        sheet.getRange(i+1, 5).setValue(new Date());
        
        return sendJson({ ok:true, name, email, activities, states });
      }
    }
  }
  return sendJson({ ok:false, err:'invalid_pin' });
}

// Handle actions: logActivity, changePin, resetPin, saveStates
function doPost(e){
  try{
    const payload = parsePayload(e);
    
    // Admin: Create new user
    if(payload.action === 'create_user' && payload.secret){
      if(payload.secret !== OWNER_SECRET) return sendJson({ok:false, err:'unauthorized'});
      const sheetResult = getSheet();
      if(sheetResult.error) return sendJson(sheetResult.payload);
      
      const pin = payload.pin || Utilities.getUuid().replace(/-/g,'').substr(0,6);
      const name = payload.name || '';
      const email = payload.email || '';
      const sheet = sheetResult.sheet;
      
      sheet.appendRow([pin, name, email, new Date(), new Date(), JSON.stringify([]), '']);
      return sendJson({ok:true, pin, name, email});
    }
    
    // Log activity (when user clicks topic)
    if(payload.action === 'log_activity' && payload.pin){
      const sheetResult = getSheet();
      if(sheetResult.error) return sendJson(sheetResult.payload);
      
      const sheet = sheetResult.sheet;
      const rows = sheet.getDataRange().getValues();
      
      for(let i=1; i<rows.length; i++){
        if(String(rows[i][0]) === String(payload.pin)){
          let activities = [];
          try{
            activities = rows[i][5] ? JSON.parse(rows[i][5]) : [];
          }catch(e){}
          
          activities.push({
            topic: payload.topic || '',
            state: payload.state || '',
            timestamp: new Date().toISOString()
          });
          
          if(String(activities).length > 30000){
            return sendJson({ok:false, err:'activities_too_large'});
          }
          
          sheet.getRange(i+1, 6).setValue(JSON.stringify(activities));
          sheet.getRange(i+1, 5).setValue(new Date());
          return sendJson({ok:true, activities});
        }
      }
      return sendJson({ok:false, err:'pin_not_found'});
    }
    
    // Save states (timetable progress)
    if(payload.action === 'save_states' && payload.pin){
      const sheetResult = getSheet();
      if(sheetResult.error) return sendJson(sheetResult.payload);
      
      const sheet = sheetResult.sheet;
      const rows = sheet.getDataRange().getValues();
      
      for(let i=1; i<rows.length; i++){
        if(String(rows[i][0]) === String(payload.pin)){
          if(payload.states && String(payload.states).length > 40000){
            return sendJson({ok:false, err:'states_too_large'});
          }
          
          sheet.getRange(i+1, 7).setValue(payload.states || '');
          sheet.getRange(i+1, 5).setValue(new Date());
          return sendJson({ok:true});
        }
      }
      return sendJson({ok:false, err:'pin_not_found'});
    }
    
    // Change PIN
    if(payload.action === 'change_pin' && payload.pin && payload.newPin){
      const sheetResult = getSheet();
      if(sheetResult.error) return sendJson(sheetResult.payload);
      
      const sheet = sheetResult.sheet;
      const rows = sheet.getDataRange().getValues();
      
      for(let i=1; i<rows.length; i++){
        if(String(rows[i][0]) === String(payload.pin)){
          sheet.getRange(i+1, 1).setValue(payload.newPin);
          return sendJson({ok:true, newPin: payload.newPin});
        }
      }
      return sendJson({ok:false, err:'pin_not_found'});
    }
    
    // Admin: Reset PIN
    if(payload.action === 'reset_pin' && payload.secret && payload.pin){
      if(payload.secret !== OWNER_SECRET) return sendJson({ok:false, err:'unauthorized'});
      const sheetResult = getSheet();
      if(sheetResult.error) return sendJson(sheetResult.payload);
      
      const newPin = Utilities.getUuid().replace(/-/g,'').substr(0,6);
      const sheet = sheetResult.sheet;
      const rows = sheet.getDataRange().getValues();
      
      for(let i=1; i<rows.length; i++){
        if(String(rows[i][0]) === String(payload.pin)){
          sheet.getRange(i+1, 1).setValue(newPin);
          return sendJson({ok:true, newPin});
        }
      }
      return sendJson({ok:false, err:'pin_not_found'});
    }
    
    return sendJson({ok:false, err:'invalid_request'});
  }catch(err){
    return sendJson({ok:false, err:err.message});
  }
}
