import express from "express";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// The current loader build, straight from the frontend. Any stale copy sitting in
// this folder is ignored — serving one silently tests yesterday's widget.
const BUILT_LOADER = join(__dirname, "..", "frontend", "public", "webclient", "chattermate.min.js");

// Enable CORS for the widget script
app.use(cors());

// Serve chattermate.min.js with proper headers. Registered BEFORE express.static so
// it wins over any chattermate.min.js sitting in this directory.
app.get("/chattermate.min.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Access-Control-Allow-Origin", "*");
  // No caching — a rebuilt loader must show up on the next reload.
  res.setHeader("Cache-Control", "no-store");
  if (existsSync(BUILT_LOADER)) {
    res.sendFile(BUILT_LOADER);
  } else {
    res
      .status(404)
      .send("// Loader not built. Run: cd ../frontend && npm run build:webclient:prod");
  }
});

// Serve static files
app.use(express.static(__dirname));

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
  console.log(`UI options gallery:  http://localhost:${port}/ui-options.html`);
  console.log(`Loader served from:  ${existsSync(BUILT_LOADER) ? BUILT_LOADER : "(NOT BUILT YET)"}`);
});
