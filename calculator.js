(() => {
  "use strict";

  const wrapper = document.querySelector(".webakoof-calculator-wrapper");
  if (!wrapper) {
    return;
  }

  const nodes = {
    basicType: wrapper.querySelector("[data-wkf-basic-type]"),
    extraPages: wrapper.querySelector("[data-wkf-extra-pages]"),
    pageCount: wrapper.querySelector("[data-wkf-page-count]"),
    addOns: Array.from(wrapper.querySelectorAll("[data-wkf-addon]")),
    basicTotal: wrapper.querySelector("[data-wkf-basic-total]"),

    premiumType: wrapper.querySelector("[data-wkf-premium-type]"),
    traffic: wrapper.querySelector("[data-wkf-traffic]"),
    ticket: wrapper.querySelector("[data-wkf-ticket]"),
    currentCr: wrapper.querySelector("[data-wkf-current-cr]"),
    revealRoi: wrapper.querySelector("[data-wkf-reveal-roi]"),
    premiumOutput: wrapper.querySelector("[data-wkf-premium-output]"),
    lossText: wrapper.querySelector("[data-wkf-loss-text]"),
    paybackText: wrapper.querySelector("[data-wkf-payback-text]"),

    openModalButtons: Array.from(wrapper.querySelectorAll("[data-wkf-open-modal]")),
    modal: wrapper.querySelector("[data-wkf-modal]"),
    closeModal: wrapper.querySelector("[data-wkf-close-modal]"),
    leadForm: wrapper.querySelector("[data-wkf-lead-form]"),
    leadOrigin: wrapper.querySelector("[data-wkf-origin]"),
    leadName: wrapper.querySelector("[data-wkf-name]"),
    leadBusiness: wrapper.querySelector("[data-wkf-business]"),
    leadWhatsapp: wrapper.querySelector("[data-wkf-whatsapp]"),
    submitButton: wrapper.querySelector("[data-wkf-submit]"),
    formStatus: wrapper.querySelector("[data-wkf-form-status]")
  };

  const webhookUrl = wrapper.getAttribute("data-webhook-url") || "https://webhook.privyr.com/dummy-url";

  const inrFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  const formatInr = (value) => `\u20B9${inrFormatter.format(Math.round(Math.max(0, Number(value) || 0)))}`;
  const toPositiveNumber = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }
    return parsed;
  };

  let lastBasicEstimate = 8000;
  let lastPremiumSnapshot = null;

  const getSelectedPremiumConfig = () => {
    const selectedOption = nodes.premiumType?.selectedOptions?.[0];
    const projectType = selectedOption?.value || "Corporate / Lead-Gen";
    const baseCost = toPositiveNumber(selectedOption?.dataset?.baseCost);
    const conversionLift = toPositiveNumber(selectedOption?.dataset?.lift);

    return { projectType, baseCost, conversionLift };
  };

  const updateBasicCalculator = () => {
    const basePrice = toPositiveNumber(nodes.basicType?.value);
    const extraPages = Math.min(15, Math.max(0, Math.floor(toPositiveNumber(nodes.extraPages?.value))));
    if (nodes.extraPages) {
      nodes.extraPages.value = String(extraPages);
    }
    if (nodes.pageCount) {
      nodes.pageCount.textContent = String(extraPages);
    }

    const addOnsTotal = nodes.addOns.reduce((sum, checkbox) => (
      checkbox.checked ? sum + toPositiveNumber(checkbox.value) : sum
    ), 0);

    const total = basePrice + (extraPages * 2000) + addOnsTotal;
    lastBasicEstimate = total;

    if (nodes.basicTotal) {
      nodes.basicTotal.textContent = `Estimated Build Cost: ${formatInr(total)}`;
    }
  };

  const revealPremiumOutput = () => {
    if (!nodes.premiumOutput) {
      return;
    }

    nodes.premiumOutput.classList.remove("opacity-0", "-translate-y-2", "max-h-0", "overflow-hidden", "border-white/0", "bg-black/0");
    nodes.premiumOutput.classList.add("opacity-100", "translate-y-0", "max-h-80", "border-white/15", "bg-black/35");
  };

  const calculatePremiumRoi = () => {
    const traffic = toPositiveNumber(nodes.traffic?.value);
    const ticketPrice = toPositiveNumber(nodes.ticket?.value);
    const currentRate = toPositiveNumber(nodes.currentCr?.value);
    const config = getSelectedPremiumConfig();

    const currentRevenue = traffic * currentRate * ticketPrice;
    const projectedRevenue = traffic * (currentRate + config.conversionLift) * ticketPrice;
    const lostRevenue = projectedRevenue - currentRevenue;
    const paybackPeriodDays = lostRevenue > 0 ? config.baseCost / (lostRevenue / 30) : null;

    lastPremiumSnapshot = {
      projectType: config.projectType,
      baseCost: config.baseCost,
      conversionLift: config.conversionLift,
      traffic,
      ticketPrice,
      currentRate,
      currentRevenue,
      projectedRevenue,
      lostRevenue,
      paybackPeriodDays
    };

    if (nodes.lossText) {
      nodes.lossText.textContent = `You are losing an estimated ${formatInr(lostRevenue)} every month.`;
    }

    if (nodes.paybackText) {
      if (paybackPeriodDays && Number.isFinite(paybackPeriodDays)) {
        nodes.paybackText.textContent = `A ${config.projectType} will completely pay for itself in exactly ${paybackPeriodDays.toFixed(1)} days.`;
      } else {
        nodes.paybackText.textContent = `A ${config.projectType} needs valid traffic and ticket values to calculate payback days.`;
      }
    }

    revealPremiumOutput();
  };

  const openModal = (origin) => {
    if (!nodes.modal || !nodes.leadOrigin) {
      return;
    }
    nodes.leadOrigin.value = origin === "premium" ? "premium" : "basic";
    nodes.formStatus.textContent = "";
    nodes.modal.classList.remove("hidden");
    nodes.modal.classList.add("flex");
  };

  const closeModal = () => {
    if (!nodes.modal) {
      return;
    }
    nodes.modal.classList.add("hidden");
    nodes.modal.classList.remove("flex");
  };

  const setFormStatus = (message, isError = false) => {
    if (!nodes.formStatus) {
      return;
    }
    nodes.formStatus.textContent = message;
    nodes.formStatus.classList.toggle("text-red-300", isError);
    nodes.formStatus.classList.toggle("text-emerald-300", !isError);
  };

  const getCrmTag = (origin) => (
    origin === "premium" ? "[Webakoof - Premium Whale]" : "[Webakoof - Basic]"
  );

  const validateWhatsApp = (value) => /^[+]?[0-9][0-9\s-]{7,18}$/.test(value.trim());

  const submitLead = async (event) => {
    event.preventDefault();
    if (!nodes.submitButton) {
      return;
    }

    const fullName = nodes.leadName?.value.trim() || "";
    const businessName = nodes.leadBusiness?.value.trim() || "";
    const whatsappNumber = nodes.leadWhatsapp?.value.trim() || "";
    const origin = nodes.leadOrigin?.value === "premium" ? "premium" : "basic";

    if (!fullName || !businessName || !whatsappNumber) {
      setFormStatus("Please fill all required fields.", true);
      return;
    }

    if (!validateWhatsApp(whatsappNumber)) {
      setFormStatus("Please enter a valid WhatsApp number.", true);
      return;
    }

    const payload = {
      full_name: fullName,
      business_name: businessName,
      whatsapp_number: whatsappNumber,
      crm_tag: getCrmTag(origin),
      source: origin,
      captured_from: "Webakoof Split Calculator",
      calculator_data: origin === "premium"
        ? (lastPremiumSnapshot || { note: "ROI not calculated before submit." })
        : { estimated_build_cost: lastBasicEstimate },
      submitted_at: new Date().toISOString()
    };

    nodes.submitButton.disabled = true;
    setFormStatus("Submitting...", false);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook error (${response.status})`);
      }

      setFormStatus("Request submitted successfully.", false);
      nodes.leadForm?.reset();
      if (nodes.leadOrigin) {
        nodes.leadOrigin.value = origin;
      }
      setTimeout(closeModal, 900);
    } catch (_error) {
      setFormStatus("Submission failed. Please try again.", true);
    } finally {
      nodes.submitButton.disabled = false;
    }
  };

  nodes.basicType?.addEventListener("change", updateBasicCalculator);
  nodes.extraPages?.addEventListener("input", updateBasicCalculator);
  nodes.addOns.forEach((checkbox) => checkbox.addEventListener("change", updateBasicCalculator));
  nodes.revealRoi?.addEventListener("click", calculatePremiumRoi);

  nodes.openModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openModal(button.getAttribute("data-wkf-open-modal") || "basic");
    });
  });

  nodes.closeModal?.addEventListener("click", closeModal);
  nodes.modal?.addEventListener("click", (event) => {
    if (event.target === nodes.modal) {
      closeModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nodes.modal && !nodes.modal.classList.contains("hidden")) {
      closeModal();
    }
  });
  nodes.leadForm?.addEventListener("submit", submitLead);

  updateBasicCalculator();
})();
