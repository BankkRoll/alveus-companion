# Alveus Companion

A Chrome browser extension that keeps you connected to [Alveus Sanctuary](https://www.alveussanctuary.org) — live stream status, ambassador animals, schedule, and announcements, all in a side panel.

![Alveus Companion](public/icon.svg)

## Features

- **Live** — Real-time Twitch stream status for AlveusSanctuary and Maya. Badge on the extension icon when someone is live. Desktop notifications when streams go live or change title.
- **Schedule** — Upcoming events from the Alveus calendar. Responsive: list view in the default side panel, full monthly grid when you widen the panel. Add to Google Calendar or subscribe via iCal/webcal.
- **Ambassadors** — Browse all Alveus ambassador animals with photos, species data, IUCN conservation status, did-you-know facts, and YouTube clips. Filter by animal class.
- **Settings** — Toggle notifications per type (stream live, title change, videos, announcements).

## Tech stack

| Layer      | Choice                                                       |
| ---------- | ------------------------------------------------------------ |
| Framework  | [WXT](https://wxt.dev) v0.20 — MV3, file-based entrypoints   |
| UI         | React 19 + Tailwind CSS v4                                   |
| Validation | Zod v4                                                       |
| Storage    | `@wxt-dev/storage` typed items                               |
| Data       | Twitch GQL (unauthenticated) · Alveus tRPC · GitHub raw JSON |
| CI         | GitHub Actions — daily ambassador data sync                  |

## Getting started

### Prerequisites

- Node.js ≥ 22.12
- pnpm ≥ 10

### Install

```sh
git clone https://github.com/BankkRoll/alveus-companion
cd alveus-companion
pnpm install
```

### Development

```sh
pnpm dev          # Chrome (hot-reload via WXT)
pnpm dev:firefox  # Firefox
```

Load the extension in Chrome:

1. Navigate to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `.output/chrome-mv3`

### Build

```sh
pnpm build        # Production build → .output/chrome-mv3
pnpm zip          # Packaged zip → .output/alveus-companion-*.zip
```

### Type-check & lint

```sh
pnpm typecheck
pnpm lint
```

## Ambassador data

Ambassador data is fetched at runtime from a generated JSON file in this repo and cached for 24 hours.

The JSON is produced by [`scripts/sync-data.mjs`](scripts/sync-data.mjs), which:

1. Fetches raw TypeScript source from [`alveusgg/data`](https://github.com/alveusgg/data) on GitHub
2. Evaluates it in a Node `vm` sandbox to extract ambassador, species, and enclosure data
3. Queries the GitHub tree API to discover exactly which numbered images exist per ambassador
4. Writes [`data/ambassadors.json`](data/ambassadors.json) with raw GitHub asset URLs (`https://raw.githubusercontent.com/alveusgg/data/main/src/assets/ambassadors/{slug}/01.jpg`, etc.)

Images are served directly from the `alveusgg/data` repository — no Next.js proxy, no CDN dependency. The JSON includes the full `images` array per ambassador, `slugKebab` for correct Alveus website URLs, and enriched species, lifespan, clips, and plush data.

To regenerate locally:

```sh
node scripts/sync-data.mjs
```

A [GitHub Actions workflow](.github/workflows/sync-data.yml) runs this daily at 06:00 UTC and commits any changes automatically, so the extension always has fresh data without requiring a new release.

## Project structure

```
src/
  entrypoints/
    background.ts          # Service worker — polling, notifications, badge
    sidepanel/             # Side panel React app
  components/
    LiveView.tsx           # Twitch live status
    ScheduleView.tsx       # Calendar (list + monthly grid)
    AmbassadorsView.tsx    # Ambassador grid + detail panel
    SettingsView.tsx       # Notification toggles
    ChannelCard.tsx        # Individual Twitch channel card
    Header.tsx             # App header with enable toggle
    NavBar.tsx             # Bottom tab navigation
    hooks/
      useStorage.ts        # Typed WXT storage hook
  lib/
    twitch/                # Twitch GQL client, types, constants
    alveus/                # Alveus tRPC client, ambassador fetch, types
    storage.ts             # All WXT storage item definitions
    notifications.ts       # Chrome notifications helpers
  styles/
    tailwind.css           # Tailwind v4 + topo background utility
    alveus-data.css        # Vendored Alveus OKLCH color tokens
scripts/
  sync-data.mjs            # Ambassador data sync script
  generate-icons.mjs       # SVG → PNG icon generator
data/
  ambassadors.json         # Generated ambassador data (auto-updated)
.github/
  workflows/
    sync-data.yml          # Daily ambassador data sync workflow
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

- Bug reports and feature requests → [GitHub Issues](https://github.com/BankkRoll/alveus-companion/issues)
- Pull requests → please open an issue first to discuss larger changes

This project is not affiliated with or endorsed by Alveus Sanctuary.

## License

MIT — see [LICENSE](LICENSE).
