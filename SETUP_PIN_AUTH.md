# PIN-Based Authentication Setup

## Overview
Users now login with a **PIN only** (no email required). The system tracks all user activities and allows PIN changes.

## Setup Steps

### 1. Create/Update Google Sheet

Create a new Google Sheet with tab name: **`users`**

**Column Headers (Row 1):**
```
PIN | Name | Email | CreatedAt | LastLogin | Activities | States
```

- **PIN**: 6-digit user PIN for login
- **Name**: User's display name
- **Email**: User's email (for reference)
- **CreatedAt**: Account creation timestamp
- **LastLogin**: Last login timestamp
- **Activities**: JSON array of activity logs
- **States**: Compressed timetable progress state

### 2. Update & Deploy Apps Script

1. Go to your Google Sheet → **Extensions → Apps Script**
2. Replace **all** contents of `Code.gs` with the contents from `apps_script_nck_invites.gs`
3. Update these constants:
   ```
   const SHEET_ID = 'YOUR_SHEET_ID';  // Copy from Sheet URL: /d/{SHEET_ID}/edit
   const SHEET_NAME = 'users';        // Must match tab name exactly
   const OWNER_SECRET = 'YOUR_SECRET';  // Strong password for admin operations
   ```
4. Click **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Your account**
   - Who has access: **Anyone** (or "Anyone with link")
5. Copy the **Web App URL** (looks like: `https://script.google.com/macros/s/...`)

### 3. Configure Client Page

1. Open `index.html` in a browser
2. Click **⚙️ Admin** button in navbar
3. Paste the **Web App URL** and click **Save URL**

### 4. Create User Accounts

**Admin only:**
1. Click **⚙️ Admin**
2. Enter user's **Email** and **Name**
3. Click **Create User (PIN)**
4. When prompted, enter your **OWNER_SECRET**
5. The system generates a random **6-digit PIN** - share this securely with the user

### 5. User Login

Users will see:
- **Login banner** at top: "Enter your PIN to unlock full access"
- Click **🔓 Login** button
- Enter their **6-digit PIN** on the keypad
- After valid PIN:
  - Timetable becomes editable
  - **📊 Activities** button shows action history
  - **🔐 PIN** button lets them change their PIN
  - **🚪 Logout** button to logout

## Features

### For Users
- ✅ **Login with PIN** - 6-digit PIN entry via keypad
- ✅ **View Activities** - See all topics they marked as done/in-progress + timestamps
- ✅ **Change PIN** - Users can change their own PIN
- ✅ **Auto-Login** - PIN saved in browser, auto-login on return
- ✅ **Export Activities** - Download activity history as CSV
- ✅ **Timetable Sync** - Progress synced to Google Sheets

### For Admin
- ✅ **Create Users** - Generate PIN accounts with email/name
- ✅ **Reset PIN** - Force-reset user PIN via Admin modal (requires OWNER_SECRET)
- ✅ **View All Data** - All user data visible in Google Sheet

## Activity Tracking

Every time a user:
- Marks a topic as **In Progress** (›)
- Marks a topic as **Done** (✓)

The system logs:
```json
{
  "topic": "Topic Name",
  "state": "progress" or "done",
  "timestamp": "2026-06-19T14:30:00Z"
}
```

Activities are stored in the **Activities** column (as JSON) and shown in:
- **Activities Modal** (📊 button) - last 50 activities displayed
- **CSV Export** - download all activities with timestamps

## API Endpoints

### GET
```
?pin=USER_PIN
```
Returns: `{ok, name, email, activities[], states}`

### POST - Create User (Admin)
```json
{
  "action": "create_user",
  "secret": "OWNER_SECRET",
  "email": "user@example.com",
  "name": "User Name"
}
```
Returns: `{ok, pin, name, email}`

### POST - Log Activity
```json
{
  "action": "log_activity",
  "pin": "USER_PIN",
  "topic": "Topic Name",
  "state": "done" or "progress"
}
```

### POST - Change PIN
```json
{
  "action": "change_pin",
  "pin": "CURRENT_PIN",
  "newPin": "NEW_PIN"
}
```

### POST - Save States
```json
{
  "action": "save_states",
  "pin": "USER_PIN",
  "states": "compressed_state_data"
}
```

### POST - Reset PIN (Admin)
```json
{
  "action": "reset_pin",
  "secret": "OWNER_SECRET",
  "pin": "USER_OLD_PIN"
}
```
Returns: `{ok, newPin}`

## Security Notes

- ⚠️ **OWNER_SECRET** should be strong and kept private
- ⚠️ PINs are stored in plain text in Google Sheet (not hashed)
- ✅ Activities & progress are stored server-side (Google Sheets)
- ✅ PINs are NOT sent to analytics/third parties
- ✅ Each user's data is isolated by their PIN

## Troubleshooting

**"Web App URL not configured"**
- Go to Admin → paste Web App URL → Save

**"Invalid PIN"**
- Ensure the PIN is correct (6 digits)
- Check that the user account exists in the Google Sheet

**Activities not showing**
- Activities sync after each topic state change
- Check that the Web App URL is correct
- Verify the Google Sheet "Activities" column is accessible

**PIN changes aren't saving**
- Ensure you're logged in (🔓 Login first)
- Enter current PIN correctly when prompted

## Example User Workflow

1. User receives PIN: **`482619`**
2. Opens timetable page
3. Sees login banner, clicks **🔓 Login**
4. Enters PIN `482619` on keypad
5. Dashboard loads, can now:
   - Mark topics as In Progress / Done
   - Click **📊 Activities** to see history
   - Click **🔐 PIN** to change PIN to something memorable
   - Click **🚪 Logout** when done

That's it! 🎉
