const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const PRIVYR_WEBHOOK_URL = process.env.PRIVYR_WEBHOOK_URL || "https://webhook.privyr.com/dummy-url";

// Frontend and API payload parsing middleware.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const SOURCE_META = {
  basic: {
    tag: "[Webakoof - Basic]",
    label: "Basic Build Cost Estimator"
  },
  premium: {
    tag: "[Webakoof - Premium Whale]",
    label: "Lost Revenue Calculator"
  }
};

const toNonNegativeNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
};

const sanitizeBasicCalculator = (raw = {}) => {
  const additionalPages = Math.min(10, Math.max(0, Math.floor(toNonNegativeNumber(raw.additionalPages))));
  const addOns = Array.isArray(raw.addOns) ? raw.addOns : [];

  return {
    calculator: "Basic Build Cost Estimator",
    basePrice: toNonNegativeNumber(raw.basePrice || 15000),
    addOns: addOns.map((addOn) => ({
      name: typeof addOn.name === "string" ? addOn.name : "Unknown",
      price: toNonNegativeNumber(addOn.price)
    })),
    addOnsTotal: toNonNegativeNumber(raw.addOnsTotal),
    additionalPages,
    additionalPagesCost: toNonNegativeNumber(raw.additionalPagesCost),
    total: toNonNegativeNumber(raw.total)
  };
};

const sanitizePremiumCalculator = (raw = {}) => ({
  calculator: "Lost Revenue Calculator",
  traffic: toNonNegativeNumber(raw.traffic),
  ticketPrice: toNonNegativeNumber(raw.ticketPrice),
  conversionRate: toNonNegativeNumber(raw.conversionRate),
  currentRevenue: toNonNegativeNumber(raw.currentRevenue),
  projectedRevenue: toNonNegativeNumber(raw.projectedRevenue),
  lostRevenue: toNonNegativeNumber(raw.lostRevenue),
  paybackDays: raw.paybackDays && Number.isFinite(Number(raw.paybackDays))
    ? Number(raw.paybackDays)
    : null,
  calculated: Boolean(raw.calculated)
});

const sanitizeCalculatorBySource = (source, rawCalculator) => (
  source === "premium"
    ? sanitizePremiumCalculator(rawCalculator)
    : sanitizeBasicCalculator(rawCalculator)
);

app.post("/api/lead", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const businessName = String(req.body?.businessName || "").trim();
    const whatsapp = String(req.body?.whatsapp || "").trim();
    const source = req.body?.source === "premium" ? "premium" : "basic";
    const calculator = req.body?.calculator;

    if (!name || !businessName || !whatsapp) {
      return res.status(400).json({
        message: "Name, business name, and WhatsApp number are required."
      });
    }

    const sourceMeta = SOURCE_META[source];
    const sanitizedCalculator = sanitizeCalculatorBySource(source, calculator);

    // JSON payload with lead profile + calculator context + required tag.
    const privyrPayload = {
      lead: {
        name,
        businessName,
        whatsapp
      },
      calculator: {
        source,
        label: sourceMeta.label,
        results: sanitizedCalculator
      },
      tags: [sourceMeta.tag],
      submittedAt: new Date().toISOString()
    };

    // Node.js 18+ includes global fetch. If you are on older Node, add node-fetch.
    const webhookResponse = await fetch(PRIVYR_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(privyrPayload)
    });

    if (!webhookResponse.ok) {
      const webhookError = await webhookResponse.text();
      console.error("Privyr webhook failed:", webhookResponse.status, webhookError);
      return res.status(502).json({
        message: "Lead captured but webhook delivery failed.",
        status: webhookResponse.status
      });
    }

    return res.status(200).json({
      message: "Lead submitted successfully."
    });
  } catch (error) {
    console.error("Lead submission error:", error);
    return res.status(500).json({
      message: "Internal server error."
    });
  }
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Webakoof calculator server running at http://localhost:${PORT}`);
});
