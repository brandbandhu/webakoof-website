const express = require("express");
const path = require("path");
const { forwardLeadToPrivyr } = require("./lib/lead-webhook");

const app = express();
const PORT = process.env.PORT || 3000;
const sendPage = (res, ...segments) => res.sendFile(path.join(__dirname, ...segments));

app.use(express.json({ limit: "1mb" }));

app.get("/landing/page", (_req, res) => {
  sendPage(res, "landing", "page", "index.html");
});

app.use(express.static(__dirname));

async function handleLeadWebhook(req, res) {
  const result = await forwardLeadToPrivyr(req.body);
  return res.status(result.status).json(result.body);
}

app.post("/api/privyr-lead", handleLeadWebhook);
app.post("/api/webhooks/leads/webakoof", handleLeadWebhook);

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/", (_req, res) => {
  sendPage(res, "calculator.html");
});

app.listen(PORT, () => {
  console.log(`Calculator server running on http://localhost:${PORT}`);
});
