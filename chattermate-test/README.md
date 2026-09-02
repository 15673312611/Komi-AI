# Komi AI Widget Test

This is a test project for the Komi AI chat widget integration.

## UI options gallery

`ui-options.html` has one card per widget placement/behaviour (floating left/right,
custom size and offsets, sidebar drawers, search-bar trigger, hidden launcher + own
button, custom z-index, dashboard defaults, page-overrides-beat-dashboard, mobile).
Each opens `ui-test.html` with that configuration plus buttons for the whole JS API
(`open/close/toggle/isOpen`, `open({message})`, `hide/showLauncher`, `setPosition`,
`data-komi-open`, `trigger` selector) and an event log.

Use it in **Stub** mode (fake widget, no backend needed) or **Real** mode (set your
widget ID + API URL on the gallery page). The Loader URL setting controls where
`komi.min.js` comes from — the frontend dev server by default.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the test server:

```bash
npm start
```

3. Open http://localhost:3000 in your browser

## Testing the Widget

1. Make sure the Komi AI frontend development server is running (usually at http://localhost:5173)
2. Click the "Initialize Widget" button on the test page
3. Use the chat widget that appears in the bottom-right corner

## Development Notes

- The widget script is loaded from the local development server
- The test page uses a dummy widget ID ('test-widget-123')
- CORS is enabled to allow loading the widget script from a different origin

## Where things are served from

- **Loader** (`komi.min.js`) — the **frontend** (`http://localhost:5173/webclient/…`),
  the same origin the dashboard's embed snippet points at. The backend does **not**
  serve it, and no copy is kept in this folder: a copy goes stale and you end up
  testing an old widget while the source looks correct.
  It is a build artifact — after editing `frontend/src/webclient/komi.js` run
  `cd ../frontend && npm run build:webclient:prod`.
- **Widget app** (`widget.js`) — the backend, from `backend/assets/`. Rebuild with
  `cd ../frontend && npm run build:widget:prod` after changing `WidgetBuilder.vue`
  or the widget composables.
- **API** — set `window.chattermateBaseUrl`. Without it the loader falls back to the URL
  baked in at build time, which for a production build is the cloud API, so a "local"
  test silently talks to api.komi.ai.

## Troubleshooting

- **"Chat can't load on 'localhost'"** — the origin isn't in your organization's allowed
  domains (Organization settings). The port matters: `localhost:3000` allowed does not
  permit `localhost:3010`.
- **Dashboard placement settings not applying** — almost always a stale loader. Check the
  served file has the newer features: `curl -s <loader-url> | grep -c sidebar-left`.
- **Buttons do nothing on the gallery pages** — the loader failed to load; the page shows
  a red banner saying so.
