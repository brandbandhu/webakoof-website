const PRIVYR_WEBHOOK_URL = process.env.PRIVYR_WEBHOOK_URL || "https://www.privyr.com/api/v1/incoming-leads/0vZfjMQw/cgVVSiYW";

const toText = (value) => String(value || "").trim();
const firstName = (name) => toText(name).split(/\s+/)[0] || "";
const crmTagBySource = (source) => {
  const normalized = toText(source).toLowerCase();
  return normalized === "premium" ? "[Webakoof - Premium Whale]" : "[Webakoof - Basic]";
};

function normalizeBody(body) {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch (_error) {
      return {};
    }
  }

  return body && typeof body === "object" ? body : {};
}

function buildPrivyrPayload(body) {
  const data = normalizeBody(body);
  const fullName = toText(data.full_name || data.name);
  const businessName = toText(data.business_name || data.company_name);
  const businessType = toText(data.business_type);
  const timeline = toText(data.timeline || data.start_timeline);
  const whatsappNumber = toText(data.whatsapp_number || data.phone);
  const email = toText(data.email);
  const source = toText(data.source || data.provider || "webakoof");
  const submittedAt = toText(data.submitted_at) || new Date().toISOString();

  if (!fullName || !businessName || !whatsappNumber) {
    return {
      ok: false,
      status: 400,
      body: { ok: false, message: "Missing required fields." }
    };
  }

  const payload = {
    name: fullName,
    phone: whatsappNumber,
    display_name: firstName(fullName),
    other_fields: {
      provider: toText(data.provider) || "webakoof",
      source,
      company_slug: toText(data.company_slug),
      business_name: businessName,
      company_name: businessName,
      business_type: businessType,
      timeline,
      start_timeline: timeline,
      notes: toText(data.notes),
      captured_from: toText(data.captured_from) || "Webakoof Landing Page",
      source_page: toText(data.source_page) || "/landing/page",
      crm_tag: toText(data.crm_tag) || crmTagBySource(source),
      submitted_at: submittedAt
    }
  };

  if (email) {
    payload.email = email;
  }

  return { ok: true, payload };
}

async function forwardLeadToPrivyr(body) {
  const built = buildPrivyrPayload(body);
  if (!built.ok) {
    return { status: built.status, body: built.body };
  }

  try {
    const webhookResponse = await fetch(PRIVYR_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(built.payload)
    });

    if (!webhookResponse.ok) {
      const responseBody = await webhookResponse.text();
      return {
        status: 502,
        body: {
          ok: false,
          message: "Webhook rejected request.",
          status: webhookResponse.status,
          details: responseBody
        }
      };
    }

    return { status: 200, body: { ok: true, message: "Lead forwarded to webhook." } };
  } catch (error) {
    return {
      status: 500,
      body: { ok: false, message: "Proxy error.", details: error.message }
    };
  }
}

module.exports = {
  PRIVYR_WEBHOOK_URL,
  buildPrivyrPayload,
  forwardLeadToPrivyr
};
