# JobTracker Companion Extension

Standalone Chrome/Edge Manifest V3 extension for the JobAppTracker project. It intentionally lives outside `frontend/` and does not require changes to the Angular application.

## Features

- Captures title, company, location, description, and skills from the active job page using JSON-LD, Open Graph metadata, semantic selectors, and the JobTracker server parser.
- Saves a local offline shortlist in browser storage.
- Opens captured postings again, removes saved items, and exports the shortlist as JSON.
- Uses one-click authentication: saving an application opens the public login page only when needed, then the same Save action completes the application after sign-in.
- Parses postings through the public `POST https://jobapptracker.tryasp.net/api/job-postings/parse` endpoint.
- Syncs pending items with the public `POST https://jobapptracker.tryasp.net/api/JobApp` endpoint.
- Uses the existing JobTracker visual language: charcoal navigation, compact blue actions, square cards, restrained borders, and light grey workspace background.
- Opens as a persistent Chrome/Edge side panel so it stays available while switching between job tabs.

## Install locally

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this folder.
4. Click the extension icon and choose **Open in side panel** if the browser shows that option.
5. Switch between job tabs; the side panel stays open and refreshes the captured fields for the active tab.
6. Click **Save to applications**. If you are signed out, the extension opens the public login page and temporarily keeps the completed form.
7. Sign in, return to the extension, and click **Save to applications** again. No connection or token step is required.

The current backend uses an HttpOnly session cookie rather than an OAuth access token. This extension therefore connects through the existing project session and never asks for or stores your email/password.

The extension is intentionally self-contained. Existing project files were not modified.
