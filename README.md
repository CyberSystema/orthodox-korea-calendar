<div align="center">

# Orthodox Korea Calendar

A bilingual liturgical calendar for the Orthodox Metropolis of Korea, built with Svelte 5 and deployed on Cloudflare Pages.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
![Svelte 5](https://img.shields.io/badge/Svelte-5-ff3e00?logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)
![Vite 7](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-f38020?logo=cloudflare&logoColor=white)

</div>

---

## Contents

- [Overview](#overview)
- [Highlights](#highlights)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Scripts](#scripts)
- [Cloudflare Deployment](#cloudflare-deployment)
- [Environment Variables](#environment-variables)
- [OneSignal Setup](#onesignal-setup)
- [URL Parameters](#url-parameters)
- [Events API](#events-api)
- [Data Model](#data-model)
- [Project Structure](#project-structure)
- [Embedding Examples](#embedding-examples)
- [Adding a New Liturgical Year](#adding-a-new-liturgical-year)
- [License](#license)

---

## Overview

Orthodox Korea Calendar is a production-ready web app that combines liturgical calendar data with parish event management and web push notifications.

It supports:

- English and Korean UI in one build
- Full calendar and compact today-widget views
- Passcode-protected staff mode for parish events
- OneSignal notifications with audience targeting

---

## Highlights

### Calendar Experience

- Monthly grid with modal day details
- Infinite year navigation for available datasets
- Reading and celebration details per day
- Fasting and liturgical indicators
- Deep-link support to specific events

### Bilingual UX

- Language toggle in unlocked mode
- URL language lock (`en`, `ko`, `kr`)
- Localized date/weekday/month formatting
- Bilingual parish event content with fallback rendering

### Parish Events (Staff)

- Shared passcode staff access
- Create, edit, delete events
- Recurrence support: none, daily, weekly, monthly, yearly
- Bilingual event fields:
  - `titleEn`, `titleKo`
  - `descriptionEn`, `descriptionKo`
- Validation: at least one title is required (English or Korean)

### Notifications (OneSignal)

When `notify` is enabled on event creation:

1. Immediate push is sent
2. If event is more than one day away, reminder is scheduled for 9:00 AM KST on the previous day

Audience options:

- All subscribers
- English only
- Korean only

Current targeting strategy:

- `all`: OneSignal included segments
- `english`: OneSignal filter `language=en` (tag)
- `korean`: OneSignal filter `language=ko` (tag)

---

## Architecture

```text
Svelte App (client)
  -> Cloudflare Pages Function (/api/events)
  -> Cloudflare KV (events storage)
  -> OneSignal REST API (message delivery)
```

Data split:

- Liturgical datasets: static JSON files in `public/data`
- Parish events: dynamic data in Cloudflare KV

---

## Quick Start

```bash
git clone https://github.com/CyberSystema/orthodox-korea-calendar.git
cd orthodox-korea-calendar
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run check
```

`npm run check` runs Svelte and TypeScript checks.

---

## Cloudflare Deployment

Use these Pages settings:

| Setting          | Value           |
| ---------------- | --------------- |
| Build command    | `npm run build` |
| Output directory | `dist`          |
| Framework preset | `None`          |

Static behavior files:

- `public/_headers`
- `public/_redirects`

---

## Environment Variables

Set these in Cloudflare Pages (Production and Preview as needed):

| Variable                | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `ADMIN_PASSCODE`        | Staff access passcode                       |
| `ONESIGNAL_APP_ID`      | OneSignal app ID used by backend sends      |
| `ONESIGNAL_API_KEY`     | OneSignal REST API key (server-only secret) |
| `VITE_ONESIGNAL_APP_ID` | OneSignal app ID used by frontend SDK init  |

Important:

- `VITE_ONESIGNAL_APP_ID` and `ONESIGNAL_APP_ID` must match.
- Never expose `ONESIGNAL_API_KEY` in client code.

---

## OneSignal Setup

### 1) Create and Configure App

- Create one OneSignal app for your web origin.
- Ensure Site URL exactly matches deployed origin (`https`, host, subdomain).

### 2) Service Worker

This project initializes OneSignal with:

- `serviceWorkerPath: /OneSignalSDKWorker.js`
- `serviceWorkerParam.scope: /`

Required worker file content:

```js
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
```

Worker requirements:

- HTTPS
- Same origin
- Valid JavaScript MIME type
- No redirects on worker URL

### 3) Subscription Recovery

Client setup includes:

- `autoResubscribe: true`
- Permission-granted recovery flow after cache/site-data clears

### 4) Language Tags

Client tags subscribers as:

- `language=en`
- `language=ko`

Backend uses these tags for English/Korean targeting filters.

---

## URL Parameters

| Parameter | Values              | Default    | Description                              |
| --------- | ------------------- | ---------- | ---------------------------------------- |
| `view`    | `calendar`, `today` | `calendar` | Full calendar or compact today widget    |
| `lang`    | `en`, `ko`, `kr`    | none       | Locks language when provided             |
| `event`   | event ID            | none       | Deep-link event open                     |
| `date`    | `YYYY-MM-DD`        | none       | Event date hint for deep-link resolution |

Language behavior:

- `lang=en` -> English
- `lang=ko` or `lang=kr` -> Korean

---

## Events API

Implemented in `functions/api/events.ts`.

| Method   | Route                   | Purpose                          |
| -------- | ----------------------- | -------------------------------- |
| `GET`    | `/api/events?year=YYYY` | Fetch events for year            |
| `PATCH`  | `/api/events`           | Verify admin passcode            |
| `POST`   | `/api/events`           | Create event, optional push send |
| `PUT`    | `/api/events`           | Update event                     |
| `DELETE` | `/api/events`           | Delete event                     |

All write operations require passcode.

---

## Data Model

### Liturgical Data

Static files in `public/data`:

- `YYYY_en.json`
- `YYYY_kr.json`

### Parish Events (KV)

Stored in Cloudflare KV with:

- Year-scoped event lists
- Recurring event pool
- Event-to-year index key for lookup optimization

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

### Korean Locked Calendar

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

Add:

- `public/data/YYYY_en.json`
- `public/data/YYYY_kr.json`

No code changes are needed if the schema is unchanged.

---

## License

AGPL-3.0. See `LICENSE`.
