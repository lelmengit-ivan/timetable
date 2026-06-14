Setup: Google Sheet + Apps Script (Invite-only sharing)

1) Create the Google Sheet
- Create a new Google Sheet and rename the tab to `friends`.
- Add header row: `Email | Name | Token | AddedAt`.
- Copy the Sheet ID from the URL (between `/d/` and `/edit`).

2) Create Apps Script project
- In the same spreadsheet choose Extensions → Apps Script.
- Replace the default `Code.gs` contents with the contents of `apps_script_nck_invites.gs`.
- Update `SHEET_ID` with your Sheet ID and set `OWNER_SECRET` to a strong secret.

3) Deploy the Apps Script as Web App
- Click Deploy → New deployment.
- Select `Web app`.
- Execute as: `Me` (your account)
- Who has access: `Anyone` (or `Anyone with link`) — this allows the client page to request validation without auth.
- Deploy and copy the Web App URL.

4) Configure the client page (your owner copy)
- Open `nck_revision_timetable.html` in a text editor (owner copy).
- Open the admin modal (⚙️ Admin) and paste the Web App URL, then click Save URL.
- To add a friend: enter email & name, click Add invite. You'll be prompted for the `OWNER_SECRET` (not stored). After success you'll get a token and link.

5) Share with friends
- Send each friend the invite link: `https://.../nck_revision_timetable.html?invite=TOKEN` (use the same hosted page URL or file path that you host).
- When friends open the link, the page will validate the token with the Apps Script and store their progress under a per-invite `localStorage` key so their actions won't affect your owner data.

Security notes
- Keep `OWNER_SECRET` private. Do not commit it into public repos or the hosted HTML.
- If the secret is compromised, change it in Apps Script and re-deploy.

Troubleshooting
- If validation fails, ensure the Web App URL saved in the admin modal matches the deployed Web App URL and that `SHEET_ID` is correct.
- If Apps Script returns `no_sheet`, verify the `friends` sheet exists and the script has permission to access the spreadsheet.
