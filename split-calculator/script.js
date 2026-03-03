/* global window, document */

document.addEventListener("DOMContentLoaded", () => {
  // Core pricing constants used by both calculators.
  const BASIC_BASE_PRICE = 15000;
  const BASIC_PAGE_PRICE = 2500;
  const PREMIUM_BUILD_PRICE = 85000;
  const PREMIUM_CONVERSION_LIFT = 0.015;

  // One currency formatter keeps output style consistent everywhere.
  const inrFormatter = new Intl.NumberFormat("en-IN");
  const formatINR = (amount) => `\u20B9${inrFormatter.format(Math.round(amount))}`;

  // Numeric sanitization helper that blocks NaN and negative values.
  const toNonNegativeNumber = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }
    return parsed;
  };

  // Hard clamp for slider/input ranges.
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const elements = {
    basicBasePrice: document.getElementById("basicBasePrice"),
    basicAddOns: document.querySelectorAll(".basic-addon"),
    basicPages: document.getElementById("basicPages"),
    basicPageCount: document.getElementById("basicPageCount"),
    basicPageCost: document.getElementById("basicPageCost"),
    basicTotal: document.getElementById("basicTotal"),
    basicCta: document.getElementById("basicCta"),

    premiumTraffic: document.getElementById("premiumTraffic"),
    premiumTicket: document.getElementById("premiumTicket"),
    premiumRate: document.getElementById("premiumRate"),
    premiumCalcBtn: document.getElementById("premiumCalcBtn"),
    premiumResults: document.getElementById("premiumResults"),
    premiumLossText: document.getElementById("premiumLossText"),
    premiumPaybackText: document.getElementById("premiumPaybackText"),
    premiumCta: document.getElementById("premiumCta"),

    leadModal: document.getElementById("leadModal"),
    modalClose: document.getElementById("modalClose"),
    leadForm: document.getElementById("leadForm"),
    leadSubmitBtn: document.getElementById("leadSubmitBtn"),
    downloadPdfBtn: document.getElementById("downloadPdfBtn"),
    leadSource: document.getElementById("leadSource"),
    calculatorSnapshot: document.getElementById("calculatorSnapshot"),
    leadName: document.getElementById("leadName"),
    leadBusiness: document.getElementById("leadBusiness"),
    leadWhatsapp: document.getElementById("leadWhatsapp"),
    formStatus: document.getElementById("formStatus")
  };

  // Shared in-memory state to keep snapshots accurate when modal opens.
  const state = {
    basic: {
      basePrice: BASIC_BASE_PRICE,
      addOns: [],
      addOnsTotal: 0,
      additionalPages: 0,
      additionalPagesCost: 0,
      total: BASIC_BASE_PRICE
    },
    premium: {
      traffic: 0,
      ticketPrice: 0,
      conversionRate: 0.005,
      currentRevenue: 0,
      projectedRevenue: 0,
      lostRevenue: 0,
      paybackDays: null,
      calculated: false
    }
  };

  // Recalculate the basic estimator whenever toggles or slider changes.
  const updateBasicEstimator = () => {
    const basePrice = toNonNegativeNumber(elements.basicBasePrice.value) || BASIC_BASE_PRICE;
    const additionalPages = clamp(Math.floor(toNonNegativeNumber(elements.basicPages.value)), 0, 10);

    // Enforce sanitized slider value back to the UI.
    elements.basicPages.value = String(additionalPages);
    elements.basicPageCount.textContent = String(additionalPages);

    const selectedAddOns = [];
    let addOnsTotal = 0;

    elements.basicAddOns.forEach((checkbox) => {
      if (!checkbox.checked) {
        return;
      }
      const addOnName = checkbox.dataset.name || "Unknown Add-On";
      const addOnPrice = toNonNegativeNumber(checkbox.dataset.price);
      selectedAddOns.push({ name: addOnName, price: addOnPrice });
      addOnsTotal += addOnPrice;
    });

    const additionalPagesCost = additionalPages * BASIC_PAGE_PRICE;
    const total = basePrice + addOnsTotal + additionalPagesCost;

    state.basic = {
      basePrice,
      addOns: selectedAddOns,
      addOnsTotal,
      additionalPages,
      additionalPagesCost,
      total
    };

    elements.basicPageCost.textContent = `Page add-on: ${formatINR(additionalPagesCost)}`;
    elements.basicTotal.textContent = `Estimated Build Cost: ${formatINR(total)}`;
  };

  const computePremiumMetrics = (traffic, ticketPrice, conversionRate) => {
    const currentRevenue = traffic * conversionRate * ticketPrice;
    const projectedRevenue = traffic * (conversionRate + PREMIUM_CONVERSION_LIFT) * ticketPrice;
    const lostRevenue = Math.max(0, projectedRevenue - currentRevenue);
    const paybackDays = lostRevenue > 0 ? PREMIUM_BUILD_PRICE / (lostRevenue / 30) : null;

    return {
      traffic,
      ticketPrice,
      conversionRate,
      currentRevenue,
      projectedRevenue,
      lostRevenue,
      paybackDays
    };
  };

  // Compute premium ROI values only when user explicitly clicks the reveal button.
  const calculatePremiumROI = () => {
    const traffic = toNonNegativeNumber(elements.premiumTraffic.value);
    const ticketPrice = toNonNegativeNumber(elements.premiumTicket.value);
    const conversionRate = toNonNegativeNumber(elements.premiumRate.value);

    // Write back sanitized values to prevent negative numbers staying in inputs.
    elements.premiumTraffic.value = String(traffic);
    elements.premiumTicket.value = String(ticketPrice);

    const metrics = computePremiumMetrics(traffic, ticketPrice, conversionRate);

    state.premium = {
      ...metrics,
      calculated: true
    };

    elements.premiumLossText.textContent = `You are losing an estimated ${formatINR(metrics.lostRevenue)} every month.`;

    if (metrics.paybackDays && Number.isFinite(metrics.paybackDays)) {
      elements.premiumPaybackText.textContent =
        `A Premium Webakoof Build (\u20B985,000) will pay for itself in exactly ${metrics.paybackDays.toFixed(1)} days.`;
    } else {
      elements.premiumPaybackText.textContent =
        "A Premium Webakoof Build (\u20B985,000) needs positive traffic and ticket values to estimate payback days.";
    }

    elements.premiumResults.classList.remove("hidden");
  };

  // Snapshot is sent to backend so CRM gets context-rich lead metadata.
  const getCalculatorSnapshot = (source) => {
    if (source === "premium") {
      // Keep the snapshot current even if user did not click "Reveal My ROI" yet.
      const traffic = toNonNegativeNumber(elements.premiumTraffic.value);
      const ticketPrice = toNonNegativeNumber(elements.premiumTicket.value);
      const conversionRate = toNonNegativeNumber(elements.premiumRate.value);
      const liveMetrics = computePremiumMetrics(traffic, ticketPrice, conversionRate);

      return {
        calculator: "Lost Revenue Calculator",
        ...liveMetrics,
        calculated: state.premium.calculated
      };
    }
    return {
      calculator: "Basic Build Cost Estimator",
      ...state.basic
    };
  };

  const safeText = (value, fallback) => {
    const text = String(value || "").trim();
    return text || fallback;
  };

  const drawCard = (doc, options) => {
    doc.setDrawColor(...options.stroke);
    doc.setFillColor(...options.fill);
    doc.roundedRect(options.x, options.y, options.w, options.h, 14, 14, "FD");
  };

  const drawMultilineText = (doc, text, x, y, maxWidth, lineHeight) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * lineHeight;
  };

  const createBentoProposalPDF = ({ source, lead, calculator }) => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error("PDF library could not be loaded.");
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 26;
    const gap = 12;
    const contentWidth = pageWidth - margin * 2;
    const halfWidth = (contentWidth - gap) / 2;

    // Palette aligned with Webakoof premium brand tones.
    const colors = {
      dark: [7, 9, 13],
      slate: [243, 246, 251],
      ink: [15, 23, 42],
      muted: [100, 116, 139],
      white: [255, 255, 255],
      gold: [212, 177, 105],
      neon: [140, 255, 63],
      red: [239, 68, 68]
    };

    const today = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const title = source === "premium" ? "Premium ROI Strategy Snapshot" : "Standard Website Proposal Snapshot";
    const subtitle = source === "premium"
      ? "Bento report for revenue leak recovery."
      : "Bento report for your website build estimate.";

    // Header card.
    const headerY = margin;
    const headerH = 98;
    drawCard(doc, {
      x: margin,
      y: headerY,
      w: contentWidth,
      h: headerH,
      fill: colors.dark,
      stroke: colors.dark
    });

    doc.setFillColor(...colors.neon);
    doc.roundedRect(pageWidth - margin - 112, headerY + 14, 84, 8, 4, 4, "F");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.gold);
    doc.setFontSize(10);
    doc.text("WEBAKOOF", margin + 18, headerY + 25);
    doc.setTextColor(...colors.white);
    doc.setFontSize(24);
    doc.text(title, margin + 18, headerY + 55);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(210, 220, 235);
    doc.text(`${subtitle}  |  ${today}`, margin + 18, headerY + 75);

    const row1Y = headerY + headerH + gap;
    const row1H = 156;

    // Left hero KPI card.
    drawCard(doc, {
      x: margin,
      y: row1Y,
      w: halfWidth,
      h: row1H,
      fill: source === "premium" ? [12, 16, 24] : colors.slate,
      stroke: source === "premium" ? [35, 43, 55] : [221, 228, 237]
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...(source === "premium" ? colors.gold : colors.ink));
    doc.text(source === "premium" ? "MONTHLY REVENUE LEAK" : "ESTIMATED BUILD COST", margin + 16, row1Y + 24);

    doc.setFontSize(28);
    doc.setTextColor(...(source === "premium" ? colors.red : colors.ink));
    const heroValue = source === "premium"
      ? formatINR(calculator.lostRevenue || 0)
      : formatINR(calculator.total || 0);
    doc.text(heroValue, margin + 16, row1Y + 62);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...(source === "premium" ? [195, 206, 219] : colors.muted));
    const heroSubline = source === "premium"
      ? "Estimated missed opportunity each month."
      : "Current estimate including selected add-ons.";
    doc.text(heroSubline, margin + 16, row1Y + 80);

    if (source === "premium") {
      const paybackText = calculator.paybackDays && Number.isFinite(calculator.paybackDays)
        ? `${calculator.paybackDays.toFixed(1)} days payback on an ${formatINR(PREMIUM_BUILD_PRICE)} build`
        : "Payback requires positive traffic and ticket values";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...colors.neon);
      drawMultilineText(doc, paybackText, margin + 16, row1Y + 108, halfWidth - 28, 13);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...colors.ink);
      doc.text(`Base: ${formatINR(calculator.basePrice || BASIC_BASE_PRICE)}`, margin + 16, row1Y + 108);
      doc.text(`Add-ons: ${formatINR(calculator.addOnsTotal || 0)}`, margin + 16, row1Y + 126);
      doc.text(`Pages: ${formatINR(calculator.additionalPagesCost || 0)}`, margin + 16, row1Y + 144);
    }

    // Right lead identity card.
    drawCard(doc, {
      x: margin + halfWidth + gap,
      y: row1Y,
      w: halfWidth,
      h: row1H,
      fill: colors.white,
      stroke: [221, 228, 237]
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...colors.ink);
    doc.text("LEAD DETAILS", margin + halfWidth + gap + 16, row1Y + 24);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...colors.muted);
    doc.text(`Name: ${safeText(lead.name, "Prospect")}`, margin + halfWidth + gap + 16, row1Y + 48);
    doc.text(`Business: ${safeText(lead.businessName, "Not provided")}`, margin + halfWidth + gap + 16, row1Y + 68);
    doc.text(`WhatsApp: ${safeText(lead.whatsapp, "Not provided")}`, margin + halfWidth + gap + 16, row1Y + 88);
    doc.text(`Track: ${source === "premium" ? "Webakoof Premium" : "Webakoof Basic"}`, margin + halfWidth + gap + 16, row1Y + 108);
    doc.text(`Generated: ${today}`, margin + halfWidth + gap + 16, row1Y + 128);

    // Full-width analysis card.
    const row2Y = row1Y + row1H + gap;
    const row2H = 188;
    drawCard(doc, {
      x: margin,
      y: row2Y,
      w: contentWidth,
      h: row2H,
      fill: colors.white,
      stroke: [221, 228, 237]
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...colors.ink);
    doc.text(source === "premium" ? "ROI BREAKDOWN" : "SCOPE BREAKDOWN", margin + 16, row2Y + 24);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...colors.muted);

    if (source === "premium") {
      const leftColX = margin + 16;
      const rightColX = margin + contentWidth / 2 + 8;
      doc.text(`Traffic: ${inrFormatter.format(calculator.traffic || 0)} visitors / month`, leftColX, row2Y + 50);
      doc.text(`Avg ticket: ${formatINR(calculator.ticketPrice || 0)}`, leftColX, row2Y + 70);
      doc.text(`Current CR: ${(((calculator.conversionRate || 0) * 100).toFixed(2))}%`, leftColX, row2Y + 90);

      doc.text(`Current revenue: ${formatINR(calculator.currentRevenue || 0)}`, rightColX, row2Y + 50);
      doc.text(`Projected revenue: ${formatINR(calculator.projectedRevenue || 0)}`, rightColX, row2Y + 70);
      doc.text(`Lost revenue: ${formatINR(calculator.lostRevenue || 0)}`, rightColX, row2Y + 90);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.ink);
      drawMultilineText(
        doc,
        "Recommendation: Shift to a premium conversion-focused build to recover leak and shorten payback window.",
        margin + 16,
        row2Y + 122,
        contentWidth - 32,
        13
      );
    } else {
      const addOnList = Array.isArray(calculator.addOns) && calculator.addOns.length > 0
        ? calculator.addOns.map((addOn) => `${addOn.name} (${formatINR(addOn.price || 0)})`).join(", ")
        : "No optional add-ons selected";

      doc.text(`Base website package: ${formatINR(calculator.basePrice || BASIC_BASE_PRICE)}`, margin + 16, row2Y + 50);
      doc.text(`Selected add-ons: ${formatINR(calculator.addOnsTotal || 0)}`, margin + 16, row2Y + 70);
      doc.text(`Additional pages: ${calculator.additionalPages || 0} (${formatINR(calculator.additionalPagesCost || 0)})`, margin + 16, row2Y + 90);
      doc.text(`Total proposal: ${formatINR(calculator.total || 0)}`, margin + 16, row2Y + 110);

      drawMultilineText(doc, `Included add-ons: ${addOnList}`, margin + 16, row2Y + 138, contentWidth - 32, 13);
    }

    // Bottom bento row.
    const row3Y = row2Y + row2H + gap;
    const row3H = 174;

    drawCard(doc, {
      x: margin,
      y: row3Y,
      w: halfWidth,
      h: row3H,
      fill: [250, 252, 255],
      stroke: [221, 228, 237]
    });
    drawCard(doc, {
      x: margin + halfWidth + gap,
      y: row3Y,
      w: halfWidth,
      h: row3H,
      fill: [250, 252, 255],
      stroke: [221, 228, 237]
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...colors.ink);
    doc.text("DELIVERY OUTCOME", margin + 16, row3Y + 24);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.muted);
    const outcomeText = source === "premium"
      ? "Premium track focuses on authority UX, conversion systems, and ROI instrumentation."
      : "Basic track focuses on launch speed, clean structure, and lead capture readiness.";
    drawMultilineText(doc, outcomeText, margin + 16, row3Y + 46, halfWidth - 28, 13);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.ink);
    doc.text("NEXT STEPS", margin + halfWidth + gap + 16, row3Y + 24);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.muted);
    drawMultilineText(
      doc,
      "1) Share this PDF with decision makers.\n2) Confirm scope and timeline with Webakoof.\n3) Start execution with onboarding call.",
      margin + halfWidth + gap + 16,
      row3Y + 46,
      halfWidth - 28,
      13
    );

    // Footer.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(138, 152, 173);
    doc.text("Webakoof | Build websites that recover revenue and accelerate growth.", margin, pageHeight - 20);

    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = source === "premium"
      ? `webakoof-premium-strategy-${dateStamp}.pdf`
      : `webakoof-basic-proposal-${dateStamp}.pdf`;
    doc.save(fileName);
  };

  const downloadBentoPdf = () => {
    const source = elements.leadSource.value === "premium" ? "premium" : "basic";
    const lead = {
      name: elements.leadName.value,
      businessName: elements.leadBusiness.value,
      whatsapp: elements.leadWhatsapp.value
    };

    let calculator = {};
    try {
      calculator = JSON.parse(elements.calculatorSnapshot.value || "{}");
    } catch (_error) {
      calculator = {};
    }

    if (!calculator || typeof calculator !== "object" || !calculator.calculator) {
      calculator = getCalculatorSnapshot(source);
    }

    try {
      createBentoProposalPDF({ source, lead, calculator });
      setFormStatus("Branded bento PDF downloaded.", "success");
    } catch (error) {
      setFormStatus(error.message || "Could not generate PDF right now.", "error");
    }
  };

  const setFormStatus = (message, type) => {
    const colorClass = type === "success" ? "text-emerald-600" : "text-red-600";
    elements.formStatus.className = `min-h-[1.25rem] text-sm font-semibold ${colorClass}`;
    elements.formStatus.textContent = message;
  };

  const openLeadModal = (source) => {
    const normalizedSource = source === "premium" ? "premium" : "basic";
    const snapshot = getCalculatorSnapshot(normalizedSource);

    elements.leadSource.value = normalizedSource;
    elements.calculatorSnapshot.value = JSON.stringify(snapshot);
    elements.downloadPdfBtn.textContent = normalizedSource === "premium"
      ? "Download Premium Bento PDF"
      : "Download Basic Bento PDF";
    elements.formStatus.textContent = "";
    elements.leadModal.classList.remove("hidden");
    elements.leadModal.classList.add("flex");
  };

  const closeLeadModal = () => {
    elements.leadModal.classList.add("hidden");
    elements.leadModal.classList.remove("flex");
  };

  const isValidWhatsApp = (value) => /^[+0-9][0-9\s-]{6,19}$/.test(value.trim());

  // Send lead + calculator context to the backend webhook route.
  const submitLeadForm = async (event) => {
    event.preventDefault();

    const name = elements.leadName.value.trim();
    const businessName = elements.leadBusiness.value.trim();
    const whatsapp = elements.leadWhatsapp.value.trim();

    if (!name || !businessName || !whatsapp) {
      setFormStatus("Please fill in all required fields.", "error");
      return;
    }

    if (!isValidWhatsApp(whatsapp)) {
      setFormStatus("Please enter a valid WhatsApp number.", "error");
      return;
    }

    let calculatorData = {};
    try {
      calculatorData = JSON.parse(elements.calculatorSnapshot.value || "{}");
    } catch (_error) {
      calculatorData = {};
    }

    const payload = {
      name,
      businessName,
      whatsapp,
      source: elements.leadSource.value || "basic",
      calculator: calculatorData
    };

    elements.leadSubmitBtn.disabled = true;
    elements.leadSubmitBtn.classList.add("opacity-70", "cursor-not-allowed");
    setFormStatus("Submitting...", "success");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Submission failed.");
      }

      setFormStatus("Thank you. Your proposal request has been submitted.", "success");
      elements.leadForm.reset();
      setTimeout(closeLeadModal, 900);
    } catch (error) {
      setFormStatus(error.message || "Could not submit your request. Please try again.", "error");
    } finally {
      elements.leadSubmitBtn.disabled = false;
      elements.leadSubmitBtn.classList.remove("opacity-70", "cursor-not-allowed");
    }
  };

  // Keep numeric fields non-negative as users type.
  const enforceNonNegativeInput = (inputElement) => {
    inputElement.addEventListener("input", () => {
      const sanitized = toNonNegativeNumber(inputElement.value);
      if (String(sanitized) !== inputElement.value) {
        inputElement.value = String(sanitized);
      }
    });
  };

  // Wire up events.
  elements.basicAddOns.forEach((checkbox) => {
    checkbox.addEventListener("change", updateBasicEstimator);
  });
  elements.basicPages.addEventListener("input", updateBasicEstimator);

  elements.premiumCalcBtn.addEventListener("click", calculatePremiumROI);
  elements.basicCta.addEventListener("click", () => openLeadModal("basic"));
  elements.premiumCta.addEventListener("click", () => openLeadModal("premium"));

  elements.modalClose.addEventListener("click", closeLeadModal);
  elements.leadModal.addEventListener("click", (event) => {
    if (event.target === elements.leadModal) {
      closeLeadModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.leadModal.classList.contains("hidden")) {
      closeLeadModal();
    }
  });

  elements.leadForm.addEventListener("submit", submitLeadForm);
  elements.downloadPdfBtn.addEventListener("click", downloadBentoPdf);
  enforceNonNegativeInput(elements.premiumTraffic);
  enforceNonNegativeInput(elements.premiumTicket);

  // Initial render for left calculator with default base amount.
  updateBasicEstimator();
});
