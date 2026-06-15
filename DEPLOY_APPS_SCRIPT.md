Deployment checklist for Apps Script Web App (invite + state storage)

1. Create the Google Sheet
   - Create a new Google Sheet.
   - Rename the first sheet/tab to: `friends`.
   - Add a header row (row 1): `email | name | token | created_date | states`.

2. Apps Script project
   - Open Extensions → Apps Script in the Sheet or go to script.google.com and create a new project.
   - Replace the default code with the contents of `apps_script_nck_invites.gs` from this repo.
   - Update the constants at top of the file:
     - `SHEET_ID` = the sheet ID from the spreadsheet URL (the long id between `/d/` and `/edit`).
     - `OWNER_SECRET` = pick a strong secret (store it safely).

3. Save and deploy
   - Save the project.
   - Click Deploy → New deployment.
   - Choose "Web app".
   - Set "Execute as" to: `Me` (your account).
   - Set "Who has access" to: `Anyone` or `Anyone with the link`.
   - Click Deploy and authorize the required Google account scopes.
   - Copy the Web App URL from the deployment dialog.

4. Configure `index.html` admin
   - Open the site and open the Admin modal.
   - Paste the Web App URL into "Web App URL" and click Save URL.
   - Enter an Admin contact email and click Save.

5. Create invites
   - In Admin modal, enter your friend email and name, click "Add invite".
   - You will be prompted for the `OWNER_SECRET` (enter the same secret you set in the script).
   - The UI returns a short `invite` token and a link: `...?invite=TOKEN`.
   - Share that link with the invited user.

6. Test invite flow
   - Open the invite link in a different browser or incognito window.
   - The page should validate the token with the web app; if valid, it will restore any saved progress.
   - Toggle some topics to change progress. The client will persist the state to the Apps Script (subject to size limits).
   - Re-open the invite link in a different browser — the saved progress should be restored.

7. Troubleshooting
   - If you see `no_sheet` error: ensure the `friends` sheet exists and `SHEET_ID` is correct.
   - If saving states fails with `states_too_large`: the saved compressed string exceeds the server limit (Apps Script enforces ~40k chars). Consider pruning or exporting/importing manually.
   - Check the Apps Script Execution Log (Executions) in the Apps Script console for errors.

Security notes
- Keep `OWNER_SECRET` private. The Add-in flow prompts for it and does not store it.
- Invite tokens are UUIDs; do not publish invite links on public pages.

Optional improvements
- Move storage to a proper database (Firestore / Firebase / Cloud SQL) for larger state and better security.
- Add server-side rate limiting or authentication if the web app becomes public.

