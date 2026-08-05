# ChatterMate Widget Test

This is a test project for the ChatterMate chat widget integration.

## UI options gallery

`ui-options.html` has one card per widget placement/behaviour (floating left/right,
custom size and offsets, sidebar drawers, search-bar trigger, hidden launcher + own
button, custom z-index, dashboard defaults, page-overrides-beat-dashboard, mobile).
Each opens `ui-test.html` with that configuration plus buttons for the whole JS API
(`open/close/toggle/isOpen`, `open({message})`, `hide/showLauncher`, `setPosition`,
`data-chattermate-open`, `trigger` selector) and an event log.

Use it in **Stub** mode (fake widget, no backend needed) or **Real** mode (set your
widget ID + API URL on the gallery page). The Loader URL setting controls where
`chattermate.min.js` comes from — the frontend dev server by default.

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

1. Make sure the ChatterMate frontend development server is running (usually at http://localhost:5173)
2. Click the "Initialize Widget" button on the test page
3. Use the chat widget that appears in the bottom-right corner

## Development Notes

- The widget script is loaded from the local development server
- The test page uses a dummy widget ID ('test-widget-123')
- CORS is enabled to allow loading the widget script from a different origin
