import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// This server only hosts the test pages. The widget loader is NOT kept here — the
// pages load it from the frontend origin (vite dev server locally, the dashboard
// origin in production), exactly like the embed snippet the dashboard generates.
// A copy in this folder would go stale and silently test an old widget.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

// Enable CORS for the widget script
app.use(cors());

// Serve static files
app.use(express.static(__dirname));

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
  console.log(`UI options gallery:   http://localhost:${port}/ui-options.html`);
  console.log(`Widget loader from:   ${FRONTEND_ORIGIN}/webclient/komi.min.js`);
  console.log(`(rebuild it after loader changes: cd ../frontend && npm run build:webclient:prod)`);
});
