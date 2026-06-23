const { forwardLeadToPrivyr } = require("../lib/lead-webhook");

module.exports = async function privyrLeadWebhook(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed." });
  }

  const result = await forwardLeadToPrivyr(req.body);
  return res.status(result.status).json(result.body);
};
