# JobTracker Companion Extension

The JobTracker Companion is a standalone Chrome/Edge Manifest V3 extension for capturing a job posting while browsing and saving it to the signed-in JobTracker account.

It intentionally lives outside the Angular application and does not require changes to the existing frontend or backend source files.

## What it does

- Opens as a persistent browser side panel.
- Reads the active job page and refreshes when the job changes inside the same tab.
- Uses LinkedIn-aware extraction for title, company, location, description, and skills.
- Keeps the actual JobTracker application fields: company, title, application date, type, location, link, status, description, work mode, and required skills.
- Saves directly to `POST https://jobapptracker.tryasp.net/api/JobApp`.
- If the user is signed out, **Save to applications** preserves the completed form and opens the public JobTracker login page. After signing in, returning to the extension and clicking **Save to applications** completes the save.
- Provides **Save locally** for an offline shortlist and JSON export.

## Authentication model

The current JobTracker backend uses an HttpOnly ASP.NET Identity session cookie rather than an OAuth access token. The extension never asks for or stores a password. API requests are executed in the authenticated JobTracker tab so the existing project session is used.

## Install locally

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this `jobtracker-extension` folder.
5. Click the extension icon and open it in the browser side panel.
6. Open a job posting, review the captured fields, and choose **Save to applications**.

Reload the extension after changing its files. LinkedIn may require the job description to be expanded with **Show more** before it becomes available to the page extractor.

## Files

- `manifest.json` — Manifest V3 permissions, side-panel configuration, and content-script registration.
- `popup.html` — Side-panel markup.
- `popup.css` — JobTracker visual styling.
- `popup.js` — Capture, pending-save, local shortlist, and API workflow.
- `content.js` — Job-page extraction and dynamic-page change detection.
- `background.js` — Side-panel activation and extension initialization.
