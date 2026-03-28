<div align="center">

# ♱ Orthodox Korea Calendar

**Liturgical calendar for the Orthodox Metropolis of Korea**

A bilingual web application displaying daily celebrations, fasting rules, scripture readings, and liturgical notes for the Orthodox Christian calendar — built for embedding on parish websites and standalone use.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
![Svelte 5](https://img.shields.io/badge/Svelte-5-ff3e00?logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)
![Vite 7](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-f38020?logo=cloudflare&logoColor=white)

</div>

---

## Overview

Orthodox Korea Calendar serves the **Orthodox Metropolis of Korea and Exarchate of Japan** with a liturgical calendar covering all 365 days of the year. It supports **English and Korean** in a single build, with a design inspired by Byzantine manuscript tradition — warm parchment tones, gold-leaf accents, and elegant serif typography.

The app runs as a **Cloudflare Pages** static site and can be embedded as an **iframe** on any website (Wix, WordPress, Squarespace, custom HTML) with URL parameters controlling the view mode and language.

---

## Features

**Calendar**

- Infinite year navigation — browse any year with available data, no hard limits
- Monthly grid with clickable day cells showing celebration titles, fasting indicators, and liturgical flags
- Today highlighting with gold accent border and indicator dot
- "Go to Today" floating button appears when navigated away from the current month
- Sundays and high-rank feasts visually distinguished with color
- Modal day panel with full celebration details, scripture readings, tone, and matins gospel

**Bilingual**

- English and Korean translations in a single build — no separate branches
- Language toggle button in the header, or lock to a specific language via URL parameter
- All UI labels, weekday names, month names, and section headings localize

**Embeddable**

- Full calendar view and compact "Today" card view for iframe embedding
- URL parameters control language and view mode
- `Content-Security-Policy: frame-ancestors *` header allows embedding on any domain
- SPA fallback via `_redirects` for clean URLs

**Parish Events**

- Staff members add, edit, and delete parish events via a shared passcode
- Events displayed on the calendar with a distinct blue accent — visually separate from liturgical data
- Blue dot indicator on calendar cells that have parish events
- OneSignal push notifications sent to all subscribers when a new event is created

**Technical**

- Svelte 5 with runes (`$state`, `$derived`, `$props`, `{@render}`)
- TypeScript throughout — strict types for calendar data, translations, and components
- Vite 7 for development and production builds
- Zero runtime dependencies — only Svelte and dev tooling
- Deployed to Cloudflare Pages with automatic builds from GitHub

---

## Quick Start

```bash
git clone https://github.com/CyberSystema/orthodox-korea-calendar.git
cd orthodox-korea-calendar
npm install
npm run dev
```

Open `http://localhost:5173` to see the calendar.

### Build for Production

```bash
npm run build
```

Output goes to `dist/`. This is what Cloudflare Pages serves.

---

## Deployment (Cloudflare Pages)

Connect the GitHub repository to Cloudflare Pages with these settings:

| Setting          | Value           |
| ---------------- | --------------- |
| Build command    | `npm run build` |
| Output directory | `dist`          |
| Framework preset | None            |

The `public/_headers` file configures security headers and iframe embedding permissions. The `public/_redirects` file provides SPA fallback routing.

---

## Iframe Embedding

### Full Calendar

```html
<!-- Toggleable language -->
<iframe src="https://your-site.pages.dev/" width="100%" height="900" style="border:none;"></iframe>

<!-- Locked to English -->
<iframe
  src="https://your-site.pages.dev/?lang=en"
  width="100%"
  height="900"
  style="border:none;"
></iframe>

<!-- Locked to Korean -->
<iframe
  src="https://your-site.pages.dev/?lang=ko"
  width="100%"
  height="900"
  style="border:none;"
></iframe>
```

### Today Card (Compact View)

```html
<!-- English today card -->
<iframe
  src="https://your-site.pages.dev/?view=today&lang=en"
  width="480"
  height="600"
  style="border:none;"
></iframe>

<!-- Korean today card -->
<iframe
  src="https://your-site.pages.dev/?view=today&lang=ko"
  width="480"
  height="600"
  style="border:none;"
></iframe>
```

### URL Parameters

| Parameter | Values              | Default    | Effect                                       |
| --------- | ------------------- | ---------- | -------------------------------------------- |
| `view`    | `calendar`, `today` | `calendar` | Full monthly grid or compact today-only card |
| `lang`    | `en`, `ko`, `kr`    | _(none)_   | Locks language and hides the toggle button   |

When no `lang` parameter is set, the user can freely toggle between English and Korean using the header button.

---

## Project Structure

```
orthodox-korea-calendar/
├── public/
│   ├── data/
│   │   ├── 2026_en.json        # English calendar — 2026
│   │   ├── 2026_kr.json        # Korean calendar — 2026
│   │   └── ...                 # Add future years here (2027_en.json, etc.)
│   ├── _headers                # Cloudflare Pages headers (iframe CSP)
│   ├── _redirects              # SPA fallback routing
│   ├── fast.jpeg               # Fasting icon
│   ├── cheese.jpeg             # Dairy permitted icon
│   ├── fish.jpeg               # Fish permitted icon
│   ├── pres.jpeg               # Presanctified Liturgy icon
│   ├── bas_lit.jpeg            # Liturgy of St. Basil icon
│   └── div_lit.jpeg            # Divine Liturgy icon
│
├── src/
│   ├── App.svelte              # Root component — routing, layout, header
│   ├── app.css                 # Design system — colors, typography, ornaments
│   ├── main.ts                 # Entry point
│   │
│   ├── components/
│   │   ├── AdminPanel.svelte   # Passcode auth + event creation form
│   │   ├── MonthGrid.svelte    # Calendar grid with weekday headers
│   │   ├── DayCell.svelte      # Individual day cell in the grid
│   │   ├── DayPanel.svelte     # Day detail view (inside modal)
│   │   ├── Modal.svelte        # Overlay modal with animations
│   │   └── TodayWidget.svelte  # Compact today card for iframe embedding
│   │
│   └── lib/
│       ├── types.d.ts          # TypeScript interfaces (DayData, Language)
│       ├── store.ts            # Svelte stores (data, language, selection, admin, events)
│       ├── api.ts              # Data fetching with remote/local fallback
│       ├── date.ts             # Date utilities and calendar grid generation
│       ├── events.ts           # Parish events API client
│       ├── i18n.ts             # Translation strings (EN/KR)
│       └── params.ts           # URL parameter parsing (view, lang)
│
├── functions/
│   └── api/
│       └── events.ts           # Cloudflare Pages Function — events CRUD + OneSignal
│
├── index.html                  # HTML shell with font preloads + OneSignal SDK
├── wrangler.toml               # Cloudflare project config (KV binding)
├── package.json
├── vite.config.ts
├── svelte.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── .prettierrc
├── .gitignore
└── LICENSE                     # AGPL-3.0
```

---

## Calendar Data Format

The app consumes JSON files where each entry represents one day:

```json
{
  "date": "2026-01-01",
  "fast": false,
  "cheese": false,
  "fish": false,
  "pres": false,
  "saint_basil": true,
  "dl": true,
  "readings": ["COL. 2:8-12", "LUKE 2:20-21, 40-52"],
  "content": [
    {
      "id": "0101_1",
      "fields": {
        "title": "The Circumcision of Our Lord",
        "high_rank": true,
        "celeb": false,
        "tone": "",
        "m_gosp": ""
      }
    }
  ]
}
```

| Field         | Type       | Description                                     |
| ------------- | ---------- | ----------------------------------------------- |
| `date`        | `string`   | ISO date (`YYYY-MM-DD`)                         |
| `fast`        | `boolean`  | Fasting day                                     |
| `cheese`      | `boolean`  | Dairy/cheese permitted                          |
| `fish`        | `boolean`  | Fish permitted                                  |
| `pres`        | `boolean`  | Presanctified Liturgy served                    |
| `saint_basil` | `boolean`  | Liturgy of St. Basil served                     |
| `dl`          | `boolean`  | Divine Liturgy served                           |
| `readings`    | `string[]` | Scripture readings for the day                  |
| `content`     | `array`    | Celebrations with title, rank, tone, and gospel |

---

## Parish Events & Push Notifications

Staff members can add parish events (homilies, celebrations, special services) directly through the calendar. Events appear alongside the liturgical data with a distinct blue accent. When an event is created, a push notification is sent to all subscribed users via OneSignal.

### How It Works

**For parishioners** — Push setup runs only in top-level (non-iframe) view. Permission prompt is requested on first user interaction (click/key), which is more browser-compatible than automatic prompts.

**For staff** — Click the lock icon in the header, enter the shared passcode, and you're in staff mode. Open any day and click "Add event" to create an event with a title, optional description, and date. Check "Send push notification" to notify everyone. Staff can edit or delete any event.

### Setup

**1. Create a Cloudflare KV namespace:**

```bash
npx wrangler kv namespace create EVENTS
```

Copy the returned namespace ID into `wrangler.toml`.

**2. Set environment variables in Cloudflare Dashboard → Pages → Settings → Environment Variables:**

| Variable                | Description                                                          |
| ----------------------- | -------------------------------------------------------------------- |
| `ADMIN_PASSCODE`        | Shared passcode for staff access (change anytime from the dashboard) |
| `ONESIGNAL_APP_ID`      | Your OneSignal Application ID                                        |
| `ONESIGNAL_API_KEY`     | Your OneSignal REST API Key                                          |
| `VITE_ONESIGNAL_APP_ID` | Frontend OneSignal App ID used by Vite client code                   |

Set `VITE_ONESIGNAL_APP_ID` to the same value as `ONESIGNAL_APP_ID` so browser subscriptions and server-side sends always target the same OneSignal app.

### Architecture

Events are stored in **Cloudflare KV** (free tier: 100K reads/day, 1K writes/day). The API runs as **Cloudflare Pages Functions** — serverless workers in the `/functions` directory. No external database or server required.

```
POST /api/events     → create event + send push notification
PATCH /api/events    → verify admin passcode
GET  /api/events     → list events by year
PUT  /api/events     → update event
DELETE /api/events   → delete event
```

All write operations require the admin passcode. The passcode is stored only in `sessionStorage` (cleared when the browser tab closes).

---

## Adding a New Year

When the Metropolis of Korea releases the next year's liturgical calendar (typically 3–4 months before the new year), transcribe it into two JSON files and drop them into the data folder:

```
public/data/2027_en.json
public/data/2027_kr.json
```

The filename convention is `{year}_{lang}.json` where lang is `en` or `kr`. The app automatically detects available years — no code changes required. On next deploy, users will be able to navigate into 2027 seamlessly.

If a year's data is not yet available and a user navigates to it, the app shows a graceful bilingual notice explaining that the calendar has not been published yet, with a button to return to the current month.

---

## Design

The visual identity draws from **Byzantine manuscript illumination**:

- **Typography** — EB Garamond (old-style serif) for display text and dates; Outfit (geometric sans) for UI elements
- **Palette** — Warm parchment base, deep wine header, liturgical crimson for feasts and Sundays, gold accents used sparingly for today highlights, section dividers, and reading tags
- **Ornaments** — Delicate gold gradient lines with centered italic labels as section dividers; ornamental crosses in modal footer and today widget
- **Grid** — Dark wine weekday header with gold bottom border; flush cells with 1px parchment gaps; gold inset border for today

---

## Tech Stack

| Layer     | Technology                         |
| --------- | ---------------------------------- |
| Framework | Svelte 5 (runes syntax)            |
| Language  | TypeScript 5.8                     |
| Bundler   | Vite 7                             |
| Hosting   | Cloudflare Pages                   |
| Fonts     | Google Fonts (EB Garamond, Outfit) |
| Editor    | VS Code (Svelte + Prettier)        |

---

## Scripts

| Command           | Description                            |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Start Vite dev server                  |
| `npm run build`   | Production build to `dist/`            |
| `npm run preview` | Preview production build locally       |
| `npm run check`   | Run svelte-check and TypeScript checks |

---

## Roadmap

- [ ] "Go to Today" floating button when navigated away from current month
- [ ] Pascha/Easter countdown banner
- [ ] Search celebrations by saint name or feast title
- [ ] Week view mode (`?view=week`) for horizontal iframe strips
- [ ] Dark mode (parchment-to-dark-vellum) toggle
- [ ] Share day link with `?date=YYYY-MM-DD` parameter
- [ ] Print-friendly monthly view stylesheet
- [ ] iCal (.ics) export for individual days or full months
- [ ] PWA / service worker for offline use

---

## Contributing

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes
4. Push and open a Pull Request

---

## License

This project is licensed under the **GNU Affero General Public License v3.0**.

You are free to use, modify, and distribute this software. If you run a modified version on a server or provide it as a service, you must make the source code of the modified version publicly available under the same license.

See [LICENSE](./LICENSE) or [gnu.org/licenses/agpl-3.0](https://www.gnu.org/licenses/agpl-3.0.html).

---

## Acknowledgments

Built for the **Orthodox Metropolis of Korea and Exarchate of Japan**.

All liturgical icons belong to the Orthodox Metropolis of Korea.

---

<div align="center">

♱

_Glory to God for all things._

</div>
