<div align="center">

<br>

# &#9766; Orthodox Korea Calendar

### A bilingual liturgical calendar for the Orthodox Metropolis of Korea

*Byzantine-inspired design &bull; English & Korean &bull; Push notifications &bull; Embeddable widgets*

<br>

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/agpl-3.0)
&nbsp;
![Svelte 5](https://img.shields.io/badge/Svelte_5-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
&nbsp;
![TypeScript](https://img.shields.io/badge/TypeScript_5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
&nbsp;
![Vite 7](https://img.shields.io/badge/Vite_7-646CFF?style=for-the-badge&logo=vite&logoColor=white)
&nbsp;
![Cloudflare](https://img.shields.io/badge/Cloudflare_Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
&nbsp;
![Firebase](https://img.shields.io/badge/Firebase-DD2C00?style=for-the-badge&logo=firebase&logoColor=white)

<br>

---

**[Live App](https://orthodox-korea-calendar.pages.dev)** &nbsp;&bull;&nbsp; **[Report a Bug](https://github.com/CyberSystema/orthodox-korea-calendar/issues)**

---

</div>

<br>

## Table of Contents

<details>
<summary>Click to expand</summary>

- [About](#about)
- [Features](#features)
  - [Calendar Experience](#-calendar-experience)
  - [Bilingual UX](#-bilingual-ux)
  - [Parish Event Management](#-parish-event-management)
  - [Push Notifications](#-push-notifications)
  - [Embeddable Views](#-embeddable-views)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Scripts](#scripts)
- [Deployment](#deployment)
  - [Cloudflare Pages](#cloudflare-pages)
  - [Environment Variables](#environment-variables)
- [URL Parameters & Deep Linking](#url-parameters--deep-linking)
- [Events API](#events-api)
- [Push Notification Setup](#push-notification-setup)
  - [Firebase Cloud Messaging](#firebase-cloud-messaging)
  - [OneSignal](#onesignal)
- [Data Sources](#data-sources)
  - [Liturgical Data](#liturgical-data-static)
  - [Parish Events](#parish-events-dynamic)
- [Project Structure](#project-structure)
- [Embedding Examples](#embedding-examples)
- [Adding a New Liturgical Year](#adding-a-new-liturgical-year)
- [License](#license)

</details>

<br>

---

## About

**Orthodox Korea Calendar** is a production-ready web application that serves as a comprehensive digital liturgical resource for the Orthodox Metropolis of Korea. It combines static ecclesiastical calendar data&mdash;readings, celebrations, fasting periods&mdash;with dynamic parish event management, staff administration, and web push notifications, all wrapped in a Byzantine manuscript-inspired design.

The app ships as a single build that supports both English and Korean, with the ability to lock language via URL for targeted embedding.

<br>

---

## Features

### &#128197; Calendar Experience

- **Monthly grid view** with infinite year navigation and modal day details
- **Liturgical indicators** for fasting, cheese week, fish allowed, Presanctified Liturgy, St. Basil Liturgy, and Divine Liturgy
- **High-rank celebration highlights** with visual distinction
- **Reading lists** and celebration details per day
- **Deep-link support** to open specific events via shareable URLs
- **"Go to Today"** quick-jump when navigating away from the current month
- **Byzantine splash screen** on initial load with animated Orthodox cross

### &#127760; Bilingual UX

- Full **English** and **Korean** interface in a single build
- **Language toggle** in the header (can be locked via URL)
- Localized dates, weekdays, months, and all UI strings
- **70+ translation keys** covering the entire interface
- Bilingual event content with **automatic fallback** (if one language is missing, the other is shown)

### &#9997; Parish Event Management

- **Passcode-protected staff access** (shared admin passcode)
- **Full CRUD** &mdash; create, edit, and delete parish events
- **Bilingual event fields**: separate English and Korean titles and descriptions
- **Recurrence support**: daily, weekly, or monthly with configurable interval and end date
- **Validation**: at least one title (English or Korean) is required
- **Rate-limited login**: 20 attempts per IP per 10-minute window

### &#128276; Push Notifications

- **Dual system**: Firebase Cloud Messaging (frontend) + OneSignal (backend dispatch)
- **Immediate notification** on event creation when enabled by admin
- **Scheduled reminders** at 9:00 AM KST on the day before distant events
- **Audience targeting**: all subscribers, English-only, or Korean-only
- **Permission recovery**: auto-resubscribe if browser data is cleared
- **Smart refresh**: token refresh on focus, online events, visibility change, and 30-minute intervals

### &#128187; Embeddable Views

- **Full calendar view** &mdash; the default experience
- **Compact today widget** (`?view=today`) &mdash; a standalone card for embedding in other websites
- **Language-locked embeds** (`?lang=ko`) for targeted audiences
- Cross-origin iframe support with permissive CSP headers
- Content-aware iframe auto-resizing (posts its height to the host page; no inner scroll bars)

<br>

---

## Architecture

```
                          +---------------------+
                          |   Svelte 5 Client   |
                          |  (Byzantine Design) |
                          +----------+----------+
                                     |
                    +----------------+----------------+
                    |                                 |
          +---------v----------+          +----------v-----------+
          |  Static JSON Data  |          |  Cloudflare Pages    |
          |  /public/data/     |          |  Functions (/api/)   |
          |  (Liturgical Cal.) |          +----------+-----------+
          +--------------------+                     |
                                        +------------+------------+
                                        |                         |
                                +-------v-------+        +--------v--------+
                                | Cloudflare KV |        | OneSignal REST  |
                                | (Events Store)|        | (Push Delivery) |
                                +---------------+        +-----------------+
```

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Frontend** | Svelte 5 + TypeScript | Reactive UI with runes-based state |
| **Styling** | Custom CSS design system | Byzantine manuscript aesthetic |
| **Build** | Vite 7 | Dev server, HMR, production bundling |
| **Backend** | Cloudflare Pages Functions | Serverless API for event CRUD |
| **Database** | Cloudflare KV | Key-value storage for parish events |
| **Push** | Firebase FCM + OneSignal | Token management + notification dispatch |
| **Hosting** | Cloudflare Pages | Global CDN with edge functions |

<br>

---

## Tech Stack

| Category | Technologies |
|:---------|:------------|
| **Framework** | Svelte 5 (Runes: `$state`, `$derived`, `$effect`, `$props`) |
| **Language** | TypeScript 5.8 |
| **Bundler** | Vite 7 |
| **Styling** | Custom Byzantine design system (EB Garamond + Outfit fonts, wine/gold/parchment palette) |
| **State** | Svelte stores with cursor-based sync engine |
| **Backend** | Cloudflare Pages Functions (serverless) |
| **Storage** | Cloudflare KV |
| **Notifications** | Firebase Cloud Messaging + OneSignal REST API |
| **Deployment** | Cloudflare Pages |
| **License** | AGPL-3.0 |

<br>

---

## Getting Started

### Prerequisites

- **Node.js** &ge; 18
- **npm** &ge; 9

### Installation

```bash
# Clone the repository
git clone https://github.com/CyberSystema/orthodox-korea-calendar.git

# Navigate to the project
cd orthodox-korea-calendar

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at **http://localhost:5173**.

### Scripts

| Command | Description |
|:--------|:------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run check` | Run Svelte and TypeScript type checks |

<br>

---

## Deployment

### Cloudflare Pages

| Setting | Value |
|:--------|:------|
| Build command | `npm run build` |
| Output directory | `dist` |
| Framework preset | None |

Static behavior is configured via:
- `public/_headers` &mdash; cache control and CSP (allows iframe embedding)
- `public/_redirects` &mdash; SPA fallback (`/* -> /index.html`)

### Environment Variables

Set these in the Cloudflare Pages dashboard (both Production and Preview):

| Variable | Scope | Description |
|:---------|:------|:------------|
| `ADMIN_PASSCODE` | Server | Shared staff access passcode |
| `ONESIGNAL_APP_ID` | Server | OneSignal app ID (backend sends) |
| `ONESIGNAL_API_KEY` | Server | OneSignal REST API key (secret&mdash;never expose to client) |
| `VITE_ONESIGNAL_APP_ID` | Public | OneSignal app ID (frontend SDK init&mdash;must match `ONESIGNAL_APP_ID`) |
| `VITE_FIREBASE_API_KEY` | Public | Firebase API key |
| `VITE_FIREBASE_PROJECT_ID` | Public | Firebase project ID |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Public | Firebase Cloud Messaging sender ID |
| `VITE_FIREBASE_VAPID_KEY` | Public | FCM VAPID public key |
| `VITE_BACKEND_BASE_URL` | Public | Backend API base URL (defaults to production) |

> **Security note**: Variables prefixed with `VITE_` are embedded in the client bundle. Never put secrets in `VITE_` variables.

<br>

---

## URL Parameters & Deep Linking

| Parameter | Values | Default | Description |
|:----------|:-------|:--------|:------------|
| `view` | `calendar`, `today` | `calendar` | Full calendar or compact today widget |
| `lang` | `en`, `ko`, `kr` | *none* | Locks language and hides the toggle |
| `event` | *event ID* | *none* | Deep-links to a specific event modal |
| `date` | `YYYY-MM-DD` | *none* | Date hint for resolving deep-linked events |

**Examples:**

```
# Korean-locked calendar
https://orthodox-korea-calendar.pages.dev/?lang=ko

# Deep-link to a specific event
https://orthodox-korea-calendar.pages.dev/?event=abc123&date=2026-04-19

# Embeddable today widget in English
https://orthodox-korea-calendar.pages.dev/?view=today&lang=en
```

<br>

---

## Events API

All endpoints are served from `functions/api/events.ts` via Cloudflare Pages Functions.

### Public Endpoints

| Method | Route | Description |
|:-------|:------|:------------|
| `GET` | `/api/events?from=YYYY-MM-DD&to=YYYY-MM-DD` | List events in a date range |
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/client-config` | Firebase configuration (public key) |
| `GET` | `/api/sync?cursor=N` | Cursor-based incremental event sync |

### Authentication

| Method | Route | Description |
|:-------|:------|:------------|
| `POST` | `/api/staff/login` | Login with passcode, receive bearer token |
| `GET` | `/api/admin/me` | Verify current session token |
| `POST` | `/api/admin/logout` | Revoke session token |

### Admin Endpoints (Bearer Token Required)

| Method | Route | Description |
|:-------|:------|:------------|
| `POST` | `/api/events` | Create event (optionally send push notification) |
| `PUT` | `/api/events/{id}` | Update event |
| `DELETE` | `/api/events/{id}` | Delete event |
| `POST` | `/api/notify` | Send push notification manually |

### Subscriptions

| Method | Route | Description |
|:-------|:------|:------------|
| `POST` | `/api/subscriptions` | Register FCM token with language tag |
| `DELETE` | `/api/subscriptions/{token}` | Unregister FCM token |

<br>

---

## Push Notification Setup

### Firebase Cloud Messaging

Firebase handles **client-side token management** and **foreground message display**.

1. Create a Firebase project and enable Cloud Messaging
2. Set `VITE_FIREBASE_*` environment variables
3. The service worker at `public/firebase-messaging-sw.js` handles background messages
4. Token refresh runs automatically on focus, online events, visibility change, and every 30 minutes

### OneSignal

OneSignal handles **backend dispatch** and **audience targeting**.

1. Create a OneSignal app matching your deployed web origin (must be `https`)
2. Set `ONESIGNAL_APP_ID` and `ONESIGNAL_API_KEY` in Cloudflare env
3. The service worker at `public/OneSignalSDKWorker.js` must be served from the same origin

**Language Tags:**

Subscribers are tagged with `language=en` or `language=ko`. The admin can target notifications to:

| Audience | OneSignal Strategy |
|:---------|:------------------|
| All subscribers | Included segments |
| English only | Filter: `language = en` |
| Korean only | Filter: `language = ko` |

**Notification Timing:**

- **Immediate**: sent on event creation when `notify` is enabled
- **Scheduled reminder**: 9:00 AM KST on the day before the event (if the event is more than 1 day away)

<br>

---

## Data Sources

### Liturgical Data (Static)

Static JSON files in `public/data/`:

```
public/data/2026_en.json    # English liturgical data
public/data/2026_kr.json    # Korean liturgical data
```

Each file contains an array of day entries with:

| Field | Type | Description |
|:------|:-----|:------------|
| `date` | `string` | ISO date (`YYYY-MM-DD`) |
| `fast` | `boolean` | Fasting day |
| `cheese` | `boolean` | Cheese week |
| `fish` | `boolean` | Fish allowed |
| `pres` | `boolean` | Presanctified Liturgy |
| `saint_basil` | `boolean` | St. Basil Liturgy |
| `dl` | `boolean` | Divine Liturgy |
| `readings` | `string[]` | Scripture readings |
| `content` | `array` | Celebrations with title, rank, tone, readings |

**Fetch strategy:** tries remote (GitHub main branch) first, falls back to local `/data/`, returns `null` if unavailable.

### Parish Events (Dynamic)

Stored in **Cloudflare KV** under the `EVENTS` namespace:

| Key Pattern | Value |
|:------------|:------|
| `event:{id}` | Single event record (JSON) |
| `year:{YYYY}` | Array of event IDs for that year |
| `events:recurring` | Pool of all recurring event templates |
| `event-to-year:{id}` | Year index for fast lookups |

Events support bilingual fields (`titleEn`, `titleKo`, `descriptionEn`, `descriptionKo`) and optional recurrence (`frequency`, `interval`, `until`).

<br>

---

## Project Structure

```
orthodox-korea-calendar/
│
├── functions/                        # Cloudflare Pages Functions (backend)
│   ├── api/
│   │   └── events.ts                # API handler: CRUD, auth, sync, push
│   └── types.d.ts                   # KV & Pages function type definitions
│
├── public/                           # Static assets (served as-is)
│   ├── data/
│   │   ├── 2026_en.json             # English liturgical data
│   │   └── 2026_kr.json             # Korean liturgical data
│   ├── firebase-messaging-sw.js     # FCM service worker
│   ├── OneSignalSDKWorker.js        # OneSignal service worker
│   ├── _headers                     # Cloudflare cache & CSP headers
│   ├── _redirects                   # SPA fallback redirect rules
│   └── *.jpeg                       # Liturgical indicator icons
│
├── src/                              # Frontend application
│   ├── App.svelte                   # Root component
│   ├── main.ts                      # Entry point (mount + FCM init)
│   ├── app.css                      # Byzantine design system
│   │
│   ├── components/
│   │   ├── AdminPanel.svelte        # Staff login & event form
│   │   ├── ByzantineSplashScreen.svelte  # Animated loading screen
│   │   ├── DayCell.svelte           # Individual calendar day cell
│   │   ├── DayPanel.svelte          # Day detail modal
│   │   ├── EventPanel.svelte        # Event detail + calendar export
│   │   ├── Modal.svelte             # Reusable modal wrapper
│   │   ├── MonthGrid.svelte         # Monthly calendar grid
│   │   └── TodayWidget.svelte       # Compact embeddable widget
│   │
│   └── lib/
│       ├── api.ts                   # Liturgical JSON fetch logic
│       ├── apiClient.ts             # Backend API client singleton
│       ├── backend.ts               # Backend URL resolution
│       ├── date.ts                  # Calendar math utilities
│       ├── eventText.ts             # Event text localization helpers
│       ├── events.ts                # Event API wrappers & sync logic
│       ├── fcm.ts                   # Firebase Cloud Messaging setup
│       ├── i18n.ts                  # Translation system (en/kr, 70+ keys)
│       ├── onesignal.ts             # OneSignal integration
│       ├── params.ts                # URL parameter parsing
│       ├── store.ts                 # Svelte stores (state management)
│       ├── types.d.ts               # Shared TypeScript interfaces
│       └── sdk/
│           ├── client.ts            # OrthodoxCalendarApiClient class
│           ├── contracts.ts         # API request/response types
│           ├── index.ts             # SDK barrel export
│           └── stores.ts            # Token & cursor persistence
│
├── index.html                       # HTML entry point
├── vite.config.ts                   # Vite build configuration
├── svelte.config.js                 # Svelte compiler options
├── wrangler.toml                    # Cloudflare Pages + KV config
├── tsconfig.json                    # Root TypeScript config
├── tsconfig.app.json                # App-specific TS config
├── tsconfig.node.json               # Node/build TS config
├── package.json                     # Dependencies & scripts
└── LICENSE                          # AGPL-3.0
```

<br>

---

## Embedding Examples

The embedded app is **content-aware**: it measures its own height and posts it to
the host page so the iframe can grow and shrink to fit — no inner scroll bars.
Add the small listener below **once** per page and use `scrolling="no"` on each
iframe. The listener matches each message to its iframe by source window, so a
single script handles any number of embeds (calendar, today widget, etc.).

```html
<script>
  // Resize Orthodox Korea Calendar iframes to fit their content.
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'okc:resize') return;
    var frames = document.getElementsByTagName('iframe');
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === e.source) {
        frames[i].style.height = e.data.height + 'px';
        break;
      }
    }
  });
</script>
```

> The message shape is `{ type: 'okc:resize', height: <px>, view: 'calendar' | 'today' }`.
> A host can also post `{ type: 'okc:request-size' }` to an iframe to force it to
> re-report its height (useful after re-attaching the frame). The `height` value
> still works as a sensible fallback for hosts that don't add the listener.

### Full Calendar

```html
<iframe
  src="https://orthodox-korea-calendar.pages.dev/"
  width="100%"
  height="900"
  scrolling="no"
  style="border: none; border-radius: 8px; width: 100%; display: block;"
  title="Orthodox Korea Calendar"
></iframe>
```

### Korean-Locked Calendar

```html
<iframe
  src="https://orthodox-korea-calendar.pages.dev/?lang=ko"
  width="100%"
  height="900"
  scrolling="no"
  style="border: none; border-radius: 8px; width: 100%; display: block;"
  title="Orthodox Korea Calendar (Korean)"
></iframe>
```

### English Today Widget

```html
<iframe
  src="https://orthodox-korea-calendar.pages.dev/?view=today&lang=en"
  width="480"
  height="600"
  scrolling="no"
  style="border: none; border-radius: 8px; display: block;"
  title="Today's Liturgical Info"
></iframe>
```

### Deep-Link to Event

```html
<a href="https://orthodox-korea-calendar.pages.dev/?event=EVENT_ID&date=2026-04-19">
  View Event Details
</a>
```

<br>

---

## Adding a New Liturgical Year

To add data for a new year, place two JSON files in `public/data/`:

```
public/data/YYYY_en.json
public/data/YYYY_kr.json
```

The app will automatically detect and load the new year&mdash;no code changes needed as long as the file schema matches the existing format.

<br>

---

## License

This project is licensed under the **GNU Affero General Public License v3.0**.

See [LICENSE](LICENSE) for the full text.

<br>

<div align="center">

---

*Built with prayer and code for the Orthodox Metropolis of Korea*

&#9766;

</div>
