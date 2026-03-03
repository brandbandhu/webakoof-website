const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const PRIVYR_WEBHOOK_URL = process.env.PRIVYR_WEBHOOK_URL || "https://webhook.privyr.com/dummy-url";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

const validSource = (source) => (source === "premium" ? "premium" : "basic");
const crmTagBySource = (source) => (
  validSource(source) === "premium" ? "[Webakoof - Premium Whale]" : "[Webakoof - Basic]"
);

app.post("/api/privyr-lead", async (req, res) => {
  const source = validSource(req.body?.source);
  const fullName = String(req.body?.full_name || "").trim();
  const businessName = String(req.body?.business_name || "").trim();
  const whatsappNumber = String(req.body?.whatsapp_number || "").trim();

  if (!fullName || !businessName || !whatsappNumber) {
    return res.status(400).json({ ok: false, message: "Missing required fields." });
  }

  const payload = {
    ...req.body,
    source,
    crm_tag: crmTagBySource(source),
    submitted_at: req.body?.submitted_at || new Date().toISOString()
  };

  try {
    const webhookResponse = await fetch(PRIVYR_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!webhookResponse.ok) {
      const body = await webhookResponse.text();
      return res.status(502).json({
        ok: false,
        message: "Webhook rejected request.",
        status: webhookResponse.status,
        details: body
      });
    }

    return res.status(200).json({ ok: true, message: "Lead forwarded to webhook." });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Proxy error.", details: error.message });
  }
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "calculator.html"));
});

app.listen(PORT, () => {
  console.log(`Calculator server running on http://localhost:${PORT}`);
});
