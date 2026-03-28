<div align="center">

# Orthodox Korea Calendar

Liturgical calendar web app for the Orthodox Metropolis of Korea.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
![Svelte 5](https://img.shields.io/badge/Svelte-5-ff3e00?logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)
![Vite 7](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-f38020?logo=cloudflare&logoColor=white)

</div>

---

## Overview

Orthodox Korea Calendar is a bilingual Svelte app that provides:

- Daily liturgical celebrations
- Fasting indicators and liturgical flags
- Scripture readings
- Parish event management (staff mode)
- Web push notifications via OneSignal

It is designed for standalone use and iframe embedding.

---

## Current Feature Set

### Calendar and Navigation

- Month grid with day drill-down modal
- Infinite year navigation for years that have data
- Today highlighting and quick return button
- Sunday/feast visual distinction
- Full day panel with celebrations, readings, and liturgical metadata

### Bilingual UX

- English and Korean in one build
- Header language toggle when language is not URL-locked
- URL language lock via query parameter
- Localized weekday/month formatting

### Embedding

- Full calendar mode
- Compact today widget mode
- Query-parameter driven behavior

### Parish Events (Staff)

- Passcode-protected staff mode
- Create/edit/delete events
- Recurrence support:
  - none
  - daily
  - weekly
  - monthly
  - yearly
- Event deep links via URL query parameters

### Bilingual Parish Event Content

Each parish event supports bilingual fields:

- titleEn (optional)
- titleKo (optional)
- descriptionEn (optional)
- descriptionKo (optional)

Validation rule:

- At least one title is required (English or Korean)

Display fallback logic:

- English UI prefers English, then Korean, then legacy title/description
- Korean UI prefers Korean, then English, then legacy title/description

### Push Notifications (OneSignal)

On event creation (when notify is enabled):

1. Immediate notification is sent
2. If the event is more than 1 day away, a reminder is scheduled for 9:00 AM KST on the previous day

Audience targeting options per new event:

- all subscribers
- English only
- Korean only

Current targeting implementation:

- all: OneSignal included segments
- English only: OneSignal filters by tag language=en
- Korean only: OneSignal filters by tag language=ko

Subscriber language tagging:

- Browser subscription user is tagged language=en or language=ko
- Tag is refreshed when app language changes

---

## Tech Stack

- Svelte 5 (runes)
- TypeScript
- Vite 7
- Cloudflare Pages + Pages Functions
- Cloudflare KV (event storage)
- OneSignal Web SDK v16 + REST API

---

## Quick Start

```bash
git clone https://github.com/CyberSystema/orthodox-korea-calendar.git
cd orthodox-korea-calendar
npm install
npm run dev
```

Open http://localhost:5173

---

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run check
```

- check runs svelte-check and TypeScript checks

---

## Deployment (Cloudflare Pages)

Use these build settings:

- Build command: npm run build
- Output directory: dist
- Framework preset: None

Static behavior files:

- public/_headers
- public/_redirects

---

## Environment Variables

Set in Cloudflare Pages dashboard (Production/Preview as needed):

- ADMIN_PASSCODE
- ONESIGNAL_APP_ID
- ONESIGNAL_API_KEY
- VITE_ONESIGNAL_APP_ID

Notes:

- VITE_ONESIGNAL_APP_ID must match ONESIGNAL_APP_ID
- Never expose ONESIGNAL_API_KEY in client-side code

---

## OneSignal Setup (Aligned With Current Code)

### 1) App and Origin

- Create one OneSignal app for your web origin
- Ensure Site URL in OneSignal matches your deployed origin exactly (protocol + host)

### 2) Service Worker

This project uses:

- serviceWorkerPath: /OneSignalSDKWorker.js
- serviceWorkerParam.scope: /

Required file content at that URL:

```js
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
```

Also ensure:

- HTTPS
- same-origin hosting
- correct MIME type for JS
- no redirects on worker URL

### 3) Subscription and Resubscription

Current code enables:

- autoResubscribe: true
- restore flow for permission-granted but unsubscribed state after cache/site-data changes

### 4) Language Tags

Current app writes these tags:

- language=en
- language=ko

These tags are used by backend push targeting filters.

---

## URL Parameters

Supported query params:

- view: calendar | today
- lang: en | ko | kr
- event: event id for deep-link open
- date: ISO date for deep-link resolution

Behavior:

- lang=en locks English
- lang=ko or lang=kr locks Korean
- view=today renders compact widget mode

---

## API Endpoints

Cloudflare Pages Function: functions/api/events.ts

- GET /api/events?year=YYYY
- PATCH /api/events (verify passcode)
- POST /api/events (create event, optional push)
- PUT /api/events (update event)
- DELETE /api/events (delete event)

Write endpoints require passcode.

---

## Data and Storage

### Liturgical Data

Year files live in public/data with naming:

- YYYY_en.json
- YYYY_kr.json

### Parish Events

Stored in Cloudflare KV:

- year-scoped events
- recurring event storage
- year index for event lookup optimization

---

## Project Structure

```text
orthodox-korea-calendar/
├── functions/
│   └── api/
│       └── events.ts
├── public/
│   ├── _headers
│   ├── _redirects
│   ├── OneSignalSDKWorker.js
│   └── data/
├── src/
│   ├── App.svelte
│   ├── app.css
│   ├── main.ts
│   ├── components/
│   │   ├── AdminPanel.svelte
│   │   ├── DayCell.svelte
│   │   ├── DayPanel.svelte
│   │   ├── EventPanel.svelte
│   │   ├── Modal.svelte
│   │   ├── MonthGrid.svelte
│   │   └── TodayWidget.svelte
│   └── lib/
│       ├── api.ts
│       ├── date.ts
│       ├── eventText.ts
│       ├── events.ts
│       ├── i18n.ts
│       ├── onesignal.ts
│       ├── params.ts
│       ├── store.ts
│       └── types.d.ts
├── OneSignalSDKWorker.js
├── wrangler.toml
├── package.json
└── README.md
```

---

## Embedding Examples

### Full Calendar

```html
<iframe src="https://your-site.pages.dev/" width="100%" height="900" style="border:none;"></iframe>
```

### Korean-Locked Full Calendar

```html
<iframe
  src="https://your-site.pages.dev/?lang=ko"
  width="100%"
  height="900"
  style="border:none;"
></iframe>
```

### Today Widget

```html
<iframe
  src="https://your-site.pages.dev/?view=today&lang=en"
  width="480"
  height="600"
  style="border:none;"
></iframe>
```

---

## Adding a New Liturgical Year

Add two files:

- public/data/YYYY_en.json
- public/data/YYYY_kr.json

No code change is required when schema is consistent.

---

## License

AGPL-3.0. See LICENSE.
