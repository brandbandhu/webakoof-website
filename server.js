const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const PRIVYR_WEBHOOK_URL = process.env.PRIVYR_WEBHOOK_URL || "https://www.privyr.com/api/v1/incoming-leads/0vZfjMQw/cgVVSiYW";
const sendPage = (res, ...segments) => res.sendFile(path.join(__dirname, ...segments));

app.use(express.json({ limit: "1mb" }));

app.get("/landing/page", (_req, res) => {
  sendPage(res, "landing", "page", "index.html");
});

app.use(express.static(__dirname));

const validSource = (source) => (source === "premium" ? "premium" : "basic");
const crmTagBySource = (source) => (
  validSource(source) === "premium" ? "[Webakoof - Premium Whale]" : "[Webakoof - Basic]"
);
const toText = (value) => String(value || "").trim();
const firstName = (name) => toText(name).split(/\s+/)[0] || "";

app.post("/api/privyr-lead", async (req, res) => {
  const source = validSource(req.body?.source);
  const fullName = toText(req.body?.full_name || req.body?.name);
  const businessName = toText(req.body?.business_name);
  const businessType = toText(req.body?.business_type);
  const timeline = toText(req.body?.timeline);
  const whatsappNumber = toText(req.body?.whatsapp_number || req.body?.phone);
  const email = toText(req.body?.email);
  const submittedAt = req.body?.submitted_at || new Date().toISOString();

  if (!fullName || !businessName || !whatsappNumber) {
    return res.status(400).json({ ok: false, message: "Missing required fields." });
  }

  const payload = {
    name: fullName,
    phone: whatsappNumber,
    display_name: firstName(fullName),
    other_fields: {
      business_name: businessName,
      business_type: businessType,
      timeline,
      source,
      captured_from: toText(req.body?.captured_from) || "Webakoof Landing Page",
      source_page: toText(req.body?.source_page) || "/landing/page",
      crm_tag: crmTagBySource(source),
      submitted_at: submittedAt
    }
  };
  if (email) {
    payload.email = email;
  }

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
  sendPage(res, "calculator.html");
});

app.listen(PORT, () => {
  console.log(`Calculator server running on http://localhost:${PORT}`);
});
