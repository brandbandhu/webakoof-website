(function () {
  "use strict";

  function hasFbq() {
    return typeof window.fbq === "function";
  }

  function trackMeta(eventName, params) {
    if (!hasFbq()) return;
    window.fbq("track", eventName, params || {});
  }

  function trackMetaCustom(eventName, params) {
    if (!hasFbq()) return;
    window.fbq("trackCustom", eventName, params || {});
  }

  function markActiveNav() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll("[data-nav-link]");
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      if (href === path) link.classList.add("active");
    });
  }

  function initAmbientLayers() {
    if (document.querySelector(".ambient-root")) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isHome = (document.body.dataset.page || "") === "home";

    const root = document.createElement("div");
    root.className = "ambient-root";
    root.innerHTML = '<span class="ambient-blob b1"></span><span class="ambient-blob b2"></span><span class="ambient-blob b3"></span>';

    if (isHome) {
      const codeLayer = document.createElement("div");
      codeLayer.className = "ambient-code-root";
      codeLayer.setAttribute("aria-hidden", "true");
      codeLayer.innerHTML = [
        '<div class="ambient-code-row row-a"><span>const pipeline = intent * clarity * speed;</span><span>if (cvr &lt; target) iterateUX();</span><span>event("CTA_Click", { page: "home" });</span><span>kpi.sql_rate += 0.37;</span><span>ship("revenue-mode");</span></div>',
        '<div class="ambient-code-row row-b"><span>segment("high_intent_visitors");</span><span>optimize.copy("offer+proof+cta");</span><span>crm.sync(lead_payload);</span><span>score = behavior.depth * message.match;</span><span>launch.ready = true;</span></div>',
        '<div class="ambient-code-row row-c"><span>coreVitals.lcp = 2.1;</span><span>abTest("hero_v3");</span><span>funnel.push("qualified_call");</span><span>analytics.track("scroll_70");</span><span>return growth;</span></div>'
      ].join("");
      root.appendChild(codeLayer);
    }

    document.body.prepend(root);

    if (reduceMotion) return;

    const blobs = Array.from(root.querySelectorAll(".ambient-blob"));
    function onMove(event) {
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      blobs.forEach((blob, i) => {
        const depth = (i + 1) * 6;
        blob.style.transform = `translate(${(x - 0.5) * depth}px, ${(y - 0.5) * depth}px)`;
      });
    }

    document.addEventListener("mousemove", onMove, { passive: true });
  }

  function initPageTransitions() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    if (!document.querySelector(".page-wipe")) {
      const wipe = document.createElement("div");
      wipe.className = "page-wipe";
      document.body.appendChild(wipe);
    }

    document.body.classList.add("page-enter");
    window.setTimeout(() => document.body.classList.remove("page-enter"), 760);

    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;
      if (link.hasAttribute("download")) return;
      if (link.target && link.target !== "_self") return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const href = link.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (err) {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const samePath = url.pathname === window.location.pathname && url.search === window.location.search;
      if (samePath && url.hash) return;

      event.preventDefault();
      document.body.classList.add("page-leave");
      window.setTimeout(() => {
        window.location.href = url.href;
      }, 430);
    });
  }

  function initSciFiCursor() {
    document.body.classList.remove("sci-cursor-enabled");
    document.querySelectorAll(".sci-cursor, .sci-cursor-dot").forEach((node) => node.remove());
  }

  function inferTopicIcon(text) {
    const source = String(text || "").toLowerCase();
    const rules = [
      { icon: "fa-house", tokens: ["home", "hero"] },
      { icon: "fa-screwdriver-wrench", tokens: ["service", "build", "development", "engineer", "stack"] },
      { icon: "fa-briefcase", tokens: ["portfolio", "case study", "project", "work"] },
      { icon: "fa-users", tokens: ["about", "team", "client", "people"] },
      { icon: "fa-phone-volume", tokens: ["contact", "call", "book", "talk", "reach"] },
      { icon: "fa-bolt", tokens: ["fast", "quick", "speed", "start"] },
      { icon: "fa-chart-line", tokens: ["growth", "conversion", "cvr", "analytics", "kpi", "roi", "funnel", "performance"] },
      { icon: "fa-code", tokens: ["code", "dev", "engineering", "architecture", "terminal"] },
      { icon: "fa-rocket", tokens: ["launch", "scale", "go-live"] },
      { icon: "fa-indian-rupee-sign", tokens: ["price", "pricing", "budget", "investment", "revenue"] },
      { icon: "fa-circle-question", tokens: ["faq", "question"] },
      { icon: "fa-shield-halved", tokens: ["trust", "secure", "guarantee", "assurance"] },
      { icon: "fa-location-dot", tokens: ["pune", "location", "market"] }
    ];

    const found = rules.find((rule) => rule.tokens.some((token) => source.includes(token)));
    return found ? found.icon : "fa-bolt";
  }

  function buildIcon(className, iconName) {
    const icon = document.createElement("i");
    icon.className = `fa-solid ${iconName} ${className}`;
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  function initInfographicSystem() {
    const pageName = document.body.dataset.page || "";
    const navIconByHref = {
      "index.html": "fa-house",
      "services.html": "fa-screwdriver-wrench",
      "portfolio.html": "fa-briefcase",
      "about.html": "fa-users",
      "fast-start.html": "fa-bolt",
      "contact.html": "fa-phone-volume",
      "march-offer-pune.html": "fa-fire"
    };

    document.querySelectorAll("[data-nav-link], .drawer-link").forEach((link) => {
      if (link.querySelector(".nav-link-icon")) return;
      const href = String(link.getAttribute("href") || "").split("#")[0];
      const iconName = navIconByHref[href] || inferTopicIcon(`${href} ${link.textContent}`);
      link.prepend(buildIcon("nav-link-icon", iconName));
      if (link.classList.contains("drawer-link")) link.classList.add("drawer-link-iconized");
    });

    document.querySelectorAll(".section-head").forEach((head) => {
      head.classList.add("infographic-head");
    });

    document.querySelectorAll(".section-head h1, .section-head h2").forEach((heading) => {
      if (heading.querySelector(".section-topic-icon")) return;
      const section = heading.closest("section");
      const context = `${heading.textContent} ${(section && section.className) || ""} ${pageName}`;
      const iconWrap = document.createElement("span");
      iconWrap.className = "section-topic-icon";
      iconWrap.setAttribute("aria-hidden", "true");
      iconWrap.appendChild(buildIcon("section-topic-icon-glyph", inferTopicIcon(context)));
      heading.prepend(iconWrap);
    });

    document.querySelectorAll(".chip").forEach((chip) => {
      if (chip.querySelector(".chip-topic-icon")) return;
      chip.prepend(buildIcon("chip-topic-icon", inferTopicIcon(chip.textContent)));
    });

    const cardSelectors = [
      ".hero-proof-item",
      ".stat",
      ".fact",
      ".work-card",
      ".quote-card",
      ".pricing-card",
      ".calc-card",
      ".video-card",
      ".contact-panel",
      ".form-card"
    ];

    document.querySelectorAll(cardSelectors.join(",")).forEach((card) => {
      if (card.querySelector(".card-topic-icon")) return;
      if (card.querySelector(".icon-box, .step-icon")) return;

      const source = card.querySelector("h3, h4, strong, .plan, .badge, .package-badge, p");
      const context = `${(source && source.textContent) || card.textContent} ${pageName}`;
      const chip = document.createElement("span");
      chip.className = "card-topic-icon";
      chip.setAttribute("aria-hidden", "true");
      chip.appendChild(buildIcon("card-topic-icon-glyph", inferTopicIcon(context)));

      const anchor = Array.from(card.children).find((child) =>
        child.matches("h3, h4, strong, .plan, .badge, .package-badge, .video-meta")
      );
      if (anchor) card.insertBefore(chip, anchor);
      else card.prepend(chip);
    });

    const grids = document.querySelectorAll(
      ".grid-2, .grid-3, .grid-4, .stats-grid, .quick-facts, .pricing-grid, .portfolio-grid, .video-grid, .team-grid, .calc-grid, .path-grid, .hero-proof"
    );
    grids.forEach((grid) => {
      const itemCount = Array.from(grid.children).filter((el) => el.nodeType === 1).length;
      if (itemCount > 1) grid.classList.add("flow-grid");
    });
  }

  function initDrawer() {
    const menuBtn = document.getElementById("menuBtn");
    const closeBtn = document.getElementById("closeDrawer");
    const drawer = document.getElementById("drawer");
    const overlay = document.getElementById("drawerOverlay");
    const drawerLinks = document.querySelectorAll(".drawer-link");
    if (!menuBtn || !closeBtn || !drawer || !overlay) return;

    const open = () => {
      drawer.classList.add("open");
      overlay.classList.add("show");
      document.body.style.overflow = "hidden";
    };

    const close = () => {
      drawer.classList.remove("open");
      overlay.classList.remove("show");
      document.body.style.overflow = "";
    };

    menuBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", close);
    drawerLinks.forEach((link) => link.addEventListener("click", close));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  function initMagneticButtons() {
    const buttons = document.querySelectorAll(".btn, .ghost-btn");
    if (!buttons.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (reduceMotion || coarsePointer) return;

    let trail = document.querySelector(".btn-glow-trail");
    if (!trail) {
      trail = document.createElement("span");
      trail.className = "btn-glow-trail";
      document.body.appendChild(trail);
    }

    buttons.forEach((button) => {
      button.classList.add("magnetic");
      button.addEventListener("mousemove", (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        button.style.setProperty("--mx", `${x}px`);
        button.style.setProperty("--my", `${y}px`);
        trail.style.left = `${event.clientX}px`;
        trail.style.top = `${event.clientY}px`;
      });

      button.addEventListener("mouseenter", () => {
        trail.style.opacity = "0.95";
      });

      button.addEventListener("mouseleave", () => {
        trail.style.opacity = "0";
      });
    });
  }

  function initScrollReveal() {
    const targets = document.querySelectorAll(".reveal");
    if (!targets.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.14 }
    );

    targets.forEach((el) => observer.observe(el));
  }

  function initCounters() {
    const counters = document.querySelectorAll("[data-counter]");
    if (!counters.length) return;

    let hasAnimated = false;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function run() {
      if (hasAnimated) return;
      hasAnimated = true;

      counters.forEach((counter) => {
        const target = Number(counter.dataset.target || 0);
        const suffix = counter.dataset.suffix || "";
        const prefix = counter.dataset.prefix || "";
        const duration = Number(counter.dataset.duration || 1400);
        const decimals = Number(counter.dataset.decimals || 0);

        if (reduceMotion) {
          counter.textContent = `${prefix}${target}${suffix}`;
          return;
        }

        const start = performance.now();
        const from = Number(counter.dataset.from || 0);

        function update(now) {
          const progress = Math.min((now - start) / duration, 1);
          const value = from + (target - from) * progress;
          const out = decimals > 0 ? value.toFixed(decimals) : Math.floor(value);
          counter.textContent = `${prefix}${out}${suffix}`;
          if (progress < 1) requestAnimationFrame(update);
          else counter.textContent = `${prefix}${target}${suffix}`;
        }

        requestAnimationFrame(update);
      });
    }

    if (typeof IntersectionObserver === "undefined") {
      run();
      return;
    }

    const trigger = document.querySelector("[data-counter-section]") || counters[0];
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting) run();
      },
      { threshold: 0.4 }
    );
    observer.observe(trigger);
  }

  function initFaq() {
    const items = document.querySelectorAll(".faq-item");
    if (!items.length) return;

    items.forEach((item) => {
      const trigger = item.querySelector(".faq-trigger");
      if (!trigger) return;

      trigger.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        items.forEach((i) => i.classList.remove("open"));
        if (!isOpen) item.classList.add("open");
      });
    });
  }

  function initBlogModal() {
    const modal = document.querySelector("[data-blog-modal]");
    const triggers = Array.from(document.querySelectorAll("[data-blog-open]"));
    if (!modal || !triggers.length) return;

    const closeBtn = modal.querySelector("[data-blog-close]");
    const title = document.getElementById("blogModalTitle");
    const tag = document.getElementById("blogModalTag");
    const length = document.getElementById("blogModalLength");
    const image = document.getElementById("blogModalImage");
    const body = document.getElementById("blogModalBody");
    const content = modal.querySelector("[data-blog-content]");
    if (!closeBtn || !title || !tag || !length || !image || !body || !content) return;

    let lastTrigger = null;
    let closeTimer = 0;

    function render(trigger) {
      const key = String(trigger.dataset.blogOpen || "").trim();
      if (!key) return false;

      const template = document.getElementById(`blog-template-${key}`);
      if (!(template instanceof HTMLTemplateElement)) return false;

      title.textContent = trigger.dataset.blogTitle || "Website Growth Insight";
      tag.textContent = trigger.dataset.blogTag || "Insight";
      length.textContent = trigger.dataset.blogLength || "";
      image.src = trigger.dataset.blogImage || "";
      image.alt = trigger.dataset.blogImageAlt || "";
      body.replaceChildren(template.content.cloneNode(true));
      content.scrollTop = 0;
      return true;
    }

    function open(trigger) {
      if (!render(trigger)) return;
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = 0;
      }

      lastTrigger = trigger;
      modal.hidden = false;
      document.body.classList.add("blog-modal-open");
      requestAnimationFrame(() => modal.classList.add("open"));
      closeBtn.focus();

      trackMetaCustom("BlogArticleOpened", {
        article: trigger.dataset.blogOpen || "unknown",
        page: document.body.dataset.page || "unknown",
      });
    }

    function close() {
      if (modal.hidden) return;
      modal.classList.remove("open");
      document.body.classList.remove("blog-modal-open");

      closeTimer = window.setTimeout(() => {
        modal.hidden = true;
        body.replaceChildren();
        closeTimer = 0;
      }, 220);

      if (lastTrigger) lastTrigger.focus();
    }

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => open(trigger));
    });

    closeBtn.addEventListener("click", close);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) close();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) close();
    });
  }

  function initCodeCanvas() {
    const canvases = document.querySelectorAll("[data-code-canvas]");
    if (!canvases.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    canvases.forEach((canvas) => {
      function spawnLine(delay) {
        const line = document.createElement("span");
        line.className = "line";
        line.style.setProperty("--w", `${26 + Math.random() * 56}%`);
        line.style.top = `${50 + Math.random() * 260}px`;
        line.style.animationDelay = `${delay || 0}ms`;
        canvas.appendChild(line);
        window.setTimeout(() => line.remove(), 4300 + (delay || 0));
      }

      for (let i = 0; i < 16; i += 1) {
        spawnLine(i * 210);
      }
      window.setInterval(() => spawnLine(0), 360);
    });
  }

  function initTerminalRotate() {
    const groups = document.querySelectorAll("[data-terminal-rotate]");
    if (!groups.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    groups.forEach((group) => {
      const lines = Array.from(group.querySelectorAll(".terminal-line"));
      if (!lines.length) return;

      lines.forEach((line, i) => {
        if (i === 0) line.classList.add("active");
      });
      if (reduceMotion || lines.length === 1) return;

      let index = 0;
      window.setInterval(() => {
        lines[index].classList.remove("active");
        index = (index + 1) % lines.length;
        lines[index].classList.add("active");
      }, 1650);
    });
  }

  function initSymbolCanvas() {
    const canvases = document.querySelectorAll("[data-symbol-canvas]");
    if (!canvases.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const symbols = [
      "</>",
      "{}",
      "const",
      "=>",
      "if (ctr > 0)",
      "npm run build",
      "function()",
      "[metrics]",
      "return growth;",
      "<section>"
    ];

    function start(canvas) {
      if (canvas.dataset.symbolStarted === "1") return;
      canvas.dataset.symbolStarted = "1";

      function spawn() {
        const symbol = document.createElement("span");
        symbol.className = "code-symbol";
        symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        symbol.style.left = `${2 + Math.random() * 92}%`;
        symbol.style.fontSize = `${0.72 + Math.random() * 0.55}rem`;
        symbol.style.animationDuration = `${5.2 + Math.random() * 3.2}s`;
        symbol.style.opacity = `${0.24 + Math.random() * 0.4}`;
        canvas.appendChild(symbol);
        window.setTimeout(() => symbol.remove(), 8800);
      }

      for (let i = 0; i < 7; i += 1) {
        window.setTimeout(spawn, i * 380);
      }
      window.setInterval(spawn, 920);
    }

    if (typeof IntersectionObserver === "undefined") {
      canvases.forEach((canvas) => start(canvas));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          start(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );

    canvases.forEach((canvas) => observer.observe(canvas));
  }

  function initStoryScroller() {
    const sections = document.querySelectorAll("[data-story]");
    if (!sections.length) return;

    sections.forEach((section) => {
      const steps = Array.from(section.querySelectorAll("[data-story-step]"));
      const panels = Array.from(section.querySelectorAll("[data-story-panel]"));
      if (!steps.length || !panels.length) return;

      let active = 0;
      function activate(index) {
        active = Math.max(0, Math.min(index, steps.length - 1));
        steps.forEach((step, i) => step.classList.toggle("active", i === active));
        panels.forEach((panel, i) => panel.classList.toggle("active", i === active));
      }

      activate(0);
      steps.forEach((step, index) => {
        step.addEventListener("click", () => {
          activate(index);
          step.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      });

      function onScroll() {
        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const progress = (vh - rect.top) / (rect.height + vh);
        const idx = Math.max(0, Math.min(steps.length - 1, Math.floor(progress * steps.length)));
        activate(idx);
      }

      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    });
  }

  function initCharts() {
    const cards = document.querySelectorAll("[data-chart]");
    if (!cards.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      cards.forEach((card) => card.classList.add("is-drawn"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-drawn");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.45 }
    );
    cards.forEach((card) => observer.observe(card));
  }

  function initArchitectureMap() {
    const maps = document.querySelectorAll("[data-arch-map]");
    if (!maps.length) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    maps.forEach((map) => {
      const nodes = Array.from(map.querySelectorAll("[data-arch-node]"));
      const lines = Array.from(map.querySelectorAll(".arch-line"));
      if (!nodes.length) return;

      let index = 0;
      function activate(nodeIndex) {
        index = nodeIndex;
        nodes.forEach((node, i) => node.classList.toggle("active", i === nodeIndex));
        const activeSet = new Set((nodes[nodeIndex].dataset.lines || "").split(","));
        lines.forEach((line) => line.classList.toggle("active", activeSet.has(line.dataset.line)));
      }

      nodes.forEach((node, i) => {
        node.addEventListener("mouseenter", () => activate(i));
        node.addEventListener("focus", () => activate(i));
        node.addEventListener("click", () => activate(i));
      });
      activate(0);

      if (reduceMotion || nodes.length < 2) return;
      window.setInterval(() => {
        activate((index + 1) % nodes.length);
      }, 2400);
    });
  }

  function initBeforeAfter() {
    const sliders = document.querySelectorAll("[data-before-after]");
    if (!sliders.length) return;

    sliders.forEach((slider) => {
      const range = slider.querySelector(".ba-range");
      if (!range) return;

      function update(value) {
        const v = Math.max(0, Math.min(100, Number(value)));
        slider.style.setProperty("--pos", `${v}%`);
      }

      update(range.value || 50);
      range.addEventListener("input", (event) => update(event.target.value));
      range.addEventListener("change", (event) => update(event.target.value));
    });
  }

  function initPathSwitch() {
    const switches = document.querySelectorAll("[data-path-switch]");
    if (!switches.length) return;

    switches.forEach((wrap) => {
      const buttons = Array.from(wrap.querySelectorAll("[data-path-target]"));
      const panels = Array.from(wrap.querySelectorAll("[data-path-panel]"));
      if (!buttons.length || !panels.length) return;

      let active = buttons.findIndex((btn) => btn.classList.contains("active"));
      if (active < 0) active = 0;

      function activate(idx) {
        buttons.forEach((btn, i) => btn.classList.toggle("active", i === idx));
        panels.forEach((panel, i) => panel.classList.toggle("active", i === idx));

        const pathName = buttons[idx].dataset.pathTarget || "unknown";
        trackMetaCustom("WebakoofPathSelected", {
          page: document.body.dataset.page || "home",
          path: pathName,
        });
      }

      activate(active);
      buttons.forEach((btn, idx) => {
        btn.addEventListener("click", () => activate(idx));
      });
    });
  }

  function initCalculators() {
    const roiCards = document.querySelectorAll("[data-roi-calc]");
    roiCards.forEach((card) => {
      const visitors = card.querySelector("[name='visitors']");
      const conv = card.querySelector("[name='conversion']");
      const close = card.querySelector("[name='close_rate']");
      const deal = card.querySelector("[name='deal_value']");
      const uplift = card.querySelector("[name='uplift']");
      if (!visitors || !conv || !close || !deal || !uplift) return;

      const outCurrentLeads = card.querySelector("[data-roi-output='current_leads']");
      const outProjectedLeads = card.querySelector("[data-roi-output='projected_leads']");
      const outCurrentRevenue = card.querySelector("[data-roi-output='current_revenue']");
      const outProjectedRevenue = card.querySelector("[data-roi-output='projected_revenue']");
      const outDelta = card.querySelector("[data-roi-output='delta_revenue']");

      function asNum(el, fallback) {
        const v = Number(el.value);
        return Number.isFinite(v) ? v : fallback;
      }

      function money(n) {
        return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
      }

      function run() {
        const v = Math.max(0, asNum(visitors, 15000));
        const c = Math.max(0, asNum(conv, 2.2));
        const cl = Math.max(0, asNum(close, 18));
        const d = Math.max(0, asNum(deal, 150000));
        const u = Math.max(0, asNum(uplift, 35));

        const currentLeads = (v * c) / 100;
        const projectedLeads = currentLeads * (1 + u / 100);
        const currentRevenue = currentLeads * (cl / 100) * d;
        const projectedRevenue = projectedLeads * (cl / 100) * d;
        const delta = projectedRevenue - currentRevenue;

        if (outCurrentLeads) outCurrentLeads.textContent = Math.round(currentLeads).toString();
        if (outProjectedLeads) outProjectedLeads.textContent = Math.round(projectedLeads).toString();
        if (outCurrentRevenue) outCurrentRevenue.textContent = money(currentRevenue);
        if (outProjectedRevenue) outProjectedRevenue.textContent = money(projectedRevenue);
        if (outDelta) outDelta.textContent = `+ ${money(delta)}`;
      }

      [visitors, conv, close, deal, uplift].forEach((input) => {
        input.addEventListener("input", run);
        input.addEventListener("change", run);
      });
      run();
    });

    const timelineCards = document.querySelectorAll("[data-timeline-calc]");
    timelineCards.forEach((card) => {
      const mode = card.querySelector("[name='engagement_mode']");
      const pages = card.querySelector("[name='pages']");
      const complexity = card.querySelector("[name='complexity']");
      if (!mode || !pages || !complexity) return;

      const outWeeks = card.querySelector("[data-time-output='weeks']");
      const outRange = card.querySelector("[data-time-output='range']");
      const outTeam = card.querySelector("[data-time-output='team']");

      const modeBase = {
        fast_start: 2,
        growth: 4,
        premium: 6,
      };

      const complexityFactor = {
        low: 0.9,
        medium: 1.15,
        high: 1.4,
      };

      const teamMap = {
        fast_start: "1 strategist + 1 frontend dev",
        growth: "1 strategist + 1 UI lead + 1 frontend dev",
        premium: "Dedicated pod: strategy, UX, frontend, analytics",
      };

      function run() {
        const m = mode.value || "growth";
        const p = Math.max(1, Number(pages.value || 6));
        const c = complexity.value || "medium";

        const base = modeBase[m] || 4;
        const pageLoad = p / 5;
        const factor = complexityFactor[c] || 1.15;
        const weeks = Math.max(1, Math.round((base + pageLoad) * factor));
        const min = Math.max(1, weeks - 1);
        const max = weeks + 1;

        if (outWeeks) outWeeks.textContent = `${weeks} weeks`;
        if (outRange) outRange.textContent = `${min}-${max} weeks`;
        if (outTeam) outTeam.textContent = teamMap[m] || teamMap.growth;
      }

      [mode, pages, complexity].forEach((el) => {
        el.addEventListener("input", run);
        el.addEventListener("change", run);
      });
      run();
    });
  }

  function initTilt() {
    const cards = document.querySelectorAll("[data-tilt]");
    if (!cards.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (reduceMotion || coarsePointer) return;

    cards.forEach((card) => {
      const max = Number(card.dataset.tiltMax || 7);
      let rafId = 0;

      function apply(clientX, clientY) {
        const rect = card.getBoundingClientRect();
        const px = (clientX - rect.left) / rect.width;
        const py = (clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * (max * 2);
        const rotateX = (0.5 - py) * (max * 2);
        card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
      }

      card.addEventListener("mousemove", (event) => {
        if (rafId) window.cancelAnimationFrame(rafId);
        rafId = window.requestAnimationFrame(() => apply(event.clientX, event.clientY));
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  function initCardSnippets() {
    const cards = document.querySelectorAll("[data-snippets]");
    if (!cards.length) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    cards.forEach((card) => {
      const line = card.querySelector(".snippet-line");
      if (!line) return;

      const entries = (card.dataset.snippets || "")
        .split("|")
        .map((txt) => txt.trim())
        .filter(Boolean);
      if (!entries.length) return;

      let idx = 0;
      line.textContent = entries[0];
      if (reduceMotion || entries.length < 2) return;

      window.setInterval(() => {
        line.style.opacity = "0";
        line.style.transform = "translateY(-8px)";
        window.setTimeout(() => {
          idx = (idx + 1) % entries.length;
          line.textContent = entries[idx];
          line.style.transform = "translateY(0)";
          line.style.opacity = "1";
        }, 170);
      }, 2100);
    });
  }

  function initLogoMarqueeWall() {
    const walls = document.querySelectorAll("[data-logo-wall]");
    if (!walls.length) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rows = document.querySelectorAll(".logo-track");
    if (reduceMotion) rows.forEach((row) => (row.style.animation = "none"));

    walls.forEach((wall) => {
      const layers = Array.from(wall.querySelectorAll("[data-parallax-depth]"));
      if (!layers.length || reduceMotion) return;
      wall.addEventListener("mousemove", (event) => {
        const rect = wall.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        layers.forEach((layer) => {
          const depth = Number(layer.dataset.parallaxDepth || 4);
          layer.style.transform = `translate(${px * depth}px, ${py * depth}px)`;
        });
      });
      wall.addEventListener("mouseleave", () => {
        layers.forEach((layer) => (layer.style.transform = ""));
      });
    });
  }

  function initPortfolioFilter() {
    const categoryBtns = Array.from(document.querySelectorAll("[data-filter]"));
    const budgetBtns = Array.from(document.querySelectorAll("[data-budget-filter]"));
    const cards = Array.from(document.querySelectorAll("[data-category]"));
    if (!cards.length) return;

    let category = "all";
    let budget = "all";

    function apply() {
      cards.forEach((card) => {
        const categories = (card.dataset.category || "").split(",").map((v) => v.trim());
        const budgets = (card.dataset.budget || "").split(",").map((v) => v.trim());

        const categoryMatch = category === "all" || categories.includes(category);
        const budgetMatch = budget === "all" || budgets.includes(budget);
        card.style.display = categoryMatch && budgetMatch ? "" : "none";
      });
    }

    categoryBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        category = btn.dataset.filter || "all";
        categoryBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        apply();
      });
    });

    budgetBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        budget = btn.dataset.budgetFilter || "all";
        budgetBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        apply();
      });
    });

    apply();
  }

  function initMetaTracking() {
    const body = document.body;
    const pageName = body.dataset.page || "unknown";
    trackMetaCustom("WebakoofPageCategory", { page: pageName });

    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-track], [data-track-custom]");
      if (!target) return;

      const label = target.dataset.trackLabel || target.textContent.trim().slice(0, 80);
      const value = target.dataset.trackValue ? Number(target.dataset.trackValue) : undefined;

      if (target.dataset.track) {
        const params = { label: label, page: pageName };
        if (!Number.isNaN(value) && value !== undefined) params.value = value;
        trackMeta(target.dataset.track, params);
      }

      if (target.dataset.trackCustom) {
        trackMetaCustom(target.dataset.trackCustom, { label: label, page: pageName });
      }
    });

    const viewTargets = document.querySelectorAll("[data-track-view]");
    if (!viewTargets.length || typeof IntersectionObserver === "undefined") return;

    const viewObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const name = entry.target.dataset.trackView;
          if (name) trackMetaCustom(name, { page: pageName });
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.42 }
    );

    viewTargets.forEach((el) => viewObserver.observe(el));
  }

  function initLeadForm() {
    const form = document.querySelector("[data-lead-form]");
    if (!form) return;
    const success = document.getElementById("formSuccess");
    const submitBtn = form.querySelector("button[type='submit']");
    const steps = Array.from(form.querySelectorAll("[data-form-step]"));
    const progressFill = form.querySelector(".form-progress-fill");
    const progressText = form.querySelector("[data-form-progress]");
    const nextBtn = form.querySelector("[data-next-step]");
    const prevBtn = form.querySelector("[data-prev-step]");
    let currentStep = 0;

    function clearErrors(scope) {
      const fields = scope.querySelectorAll(".field.invalid");
      fields.forEach((field) => field.classList.remove("invalid"));
    }

    function validateStep(stepIndex) {
      if (!steps.length || !steps[stepIndex]) return true;
      const requiredInputs = steps[stepIndex].querySelectorAll("input[required], select[required], textarea[required]");
      let valid = true;

      requiredInputs.forEach((input) => {
        const field = input.closest(".field");
        const ok = input.checkValidity() && String(input.value || "").trim().length > 0;
        if (field) field.classList.toggle("invalid", !ok);
        if (!ok) valid = false;
      });
      return valid;
    }

    function renderStep() {
      if (!steps.length) return;
      steps.forEach((step, i) => step.classList.toggle("active", i === currentStep));
      if (prevBtn) prevBtn.style.display = currentStep === 0 ? "none" : "";
      if (nextBtn) nextBtn.style.display = currentStep === steps.length - 1 ? "none" : "";
      if (progressFill) progressFill.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
      if (progressText) progressText.textContent = `Step ${currentStep + 1} of ${steps.length}`;
    }

    if (steps.length) {
      const hash = (window.location.hash || "").toLowerCase();
      const serviceField = form.querySelector("#service");
      if (hash === "#fast-start-scope") {
        currentStep = 1;
        if (serviceField && !serviceField.value) serviceField.value = "website_build";
      } else if (hash === "#growth-plan") {
        currentStep = 1;
        if (serviceField && !serviceField.value) serviceField.value = "retainer";
      } else if (hash === "#premium-call") {
        currentStep = 0;
      }

      renderStep();
      form.querySelectorAll("input, select, textarea").forEach((input) => {
        input.addEventListener("input", () => {
          const field = input.closest(".field");
          if (field) field.classList.remove("invalid");
        });
        input.addEventListener("change", () => {
          const field = input.closest(".field");
          if (field) field.classList.remove("invalid");
        });
      });

      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          if (success) success.classList.remove("show");
          clearErrors(form);
          if (!validateStep(currentStep)) return;
          currentStep = Math.min(currentStep + 1, steps.length - 1);
          renderStep();
        });
      }
      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          if (success) success.classList.remove("show");
          clearErrors(form);
          currentStep = Math.max(currentStep - 1, 0);
          renderStep();
        });
      }
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (success) success.classList.remove("show");
      if (steps.length && !validateStep(currentStep)) return;

      const formData = new FormData(form);
      const name = String(formData.get("name") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const site = String(formData.get("website") || "").trim();

      if (!name || !email) return;

      trackMeta("Lead", {
        content_name: "Contact Form",
        page: document.body.dataset.page || "contact",
      });
      trackMetaCustom("WebakoofQualifiedLead", {
        has_website: site ? "yes" : "no",
      });

      if (submitBtn) submitBtn.disabled = true;
      window.setTimeout(() => {
        if (success) success.classList.add("show");
        form.reset();
        currentStep = 0;
        renderStep();
        if (submitBtn) submitBtn.disabled = false;
      }, 420);
    });
  }

  function initFastCheckout() {
    const form = document.querySelector("[data-fast-checkout-form]");
    if (!form) return;
    const success = document.getElementById("checkoutSuccess");
    const button = form.querySelector("button[type='submit']");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const name = String(formData.get("name") || "").trim();
      const email = String(formData.get("email") || "").trim();
      if (!name || !email) return;

      trackMeta("InitiateCheckout", {
        content_name: "Fast Start Checkout",
        page: document.body.dataset.page || "fast-start",
        value: 14999,
      });

      if (button) button.disabled = true;
      window.setTimeout(() => {
        if (success) success.classList.add("show");
        form.reset();
        if (button) button.disabled = false;
      }, 420);
    });
  }

  function initPrivyrForms() {
    const forms = Array.from(document.querySelectorAll("[data-privyr-form]"));
    if (!forms.length) return;

    const endpointFromBody = String(document.body.dataset.privyrEndpoint || "").trim();
    const webhookFromBody = String(document.body.dataset.privyrWebhook || "").trim();
    const globalWebhook = String(window.WEBAKOOF_PRIVYR_WEBHOOK || "").trim();

    function getValue(formData, key) {
      return String(formData.get(key) || "").trim();
    }

    function firstName(name) {
      return String(name || "").trim().split(/\s+/)[0] || "";
    }

    function clearErrors(form) {
      const fields = form.querySelectorAll(".field.invalid");
      fields.forEach((field) => field.classList.remove("invalid"));
    }

    function validateRequired(form) {
      const requiredInputs = form.querySelectorAll("input[required], select[required], textarea[required]");
      let valid = true;

      requiredInputs.forEach((input) => {
        const field = input.closest(".field");
        let hasValue = String(input.value || "").trim().length > 0;
        if (input.type === "checkbox") hasValue = input.checked;
        if (input.type === "radio") {
          const group = form.querySelectorAll(`input[type="radio"][name="${input.name}"]`);
          hasValue = Array.from(group).some((radio) => radio.checked);
        }

        const ok = input.checkValidity() && hasValue;
        if (field) field.classList.toggle("invalid", !ok);
        if (!ok) valid = false;
      });

      return valid;
    }

    function computeIntentScore(formData) {
      let score = 18;

      const budget = getValue(formData, "budget");
      const timeline = getValue(formData, "timeline");
      const authority = getValue(formData, "authority");
      const role = getValue(formData, "role").toLowerCase();
      const website = getValue(formData, "website");
      const goals = getValue(formData, "goals");
      const phone = getValue(formData, "phone");
      const revenue = getValue(formData, "revenue");
      const monthlyLeads = getValue(formData, "monthly_leads");

      const budgetMap = {
        "150_300": 16,
        "300_600": 24,
        "600_1200": 30,
        "1200_plus": 36
      };
      score += budgetMap[budget] || 0;

      const timelineMap = {
        "2_weeks": 26,
        "30_days": 22,
        "60_days": 14,
        "90_days": 8
      };
      score += timelineMap[timeline] || 0;

      const authorityMap = {
        "decision_maker": 24,
        "influencer": 10,
        "research_only": 2
      };
      score += authorityMap[authority] || 0;

      if (role.includes("founder") || role.includes("owner") || role.includes("ceo") || role.includes("marketing")) {
        score += 8;
      }
      if (website) score += 6;
      if (goals.length >= 24) score += 8;
      if (phone.replace(/\D/g, "").length >= 10) score += 6;

      const revenueMap = {
        "under_10l": 2,
        "10l_30l": 6,
        "30l_1cr": 10,
        "1cr_plus": 14
      };
      score += revenueMap[revenue] || 0;

      const leadMap = {
        "under_20": 2,
        "20_100": 7,
        "100_300": 10,
        "300_plus": 12
      };
      score += leadMap[monthlyLeads] || 0;

      return Math.max(0, Math.min(100, score));
    }

    forms.forEach((form) => {
      const success = form.querySelector("[data-form-success]");
      const error = form.querySelector("[data-form-error]");
      const submitBtn = form.querySelector("button[type='submit']");
      const minIntent = Number(form.dataset.intentMin || 65);
      const formName = String(form.dataset.formName || "Privyr Lead Form");
      const placement = String(form.dataset.formPlacement || "unknown");
      const explicitEndpoint = String(form.dataset.endpoint || "").trim();

      function clearStatus() {
        if (success) success.classList.remove("show");
        if (error) error.classList.remove("show");
      }

      function setStatus(target, message) {
        if (!target) return;
        target.textContent = message;
        target.classList.add("show");
      }

      form.querySelectorAll("input, select, textarea").forEach((input) => {
        input.addEventListener("input", () => {
          const field = input.closest(".field");
          if (field) field.classList.remove("invalid");
        });
        input.addEventListener("change", () => {
          const field = input.closest(".field");
          if (field) field.classList.remove("invalid");
        });
      });

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearStatus();
        clearErrors(form);

        if (!validateRequired(form)) return;

        const formData = new FormData(form);
        const name = getValue(formData, "name");
        const email = getValue(formData, "email");
        const phone = getValue(formData, "phone");
        const intentScore = computeIntentScore(formData);

        if (!name || !email) return;

        if (intentScore < minIntent) {
          trackMetaCustom("WebakoofLowIntentLead", {
            form: formName,
            placement,
            page: document.body.dataset.page || "unknown",
            intent_score: intentScore,
          });
          setStatus(
            error,
            "This March offer is reserved for high-intent projects with clear budget and timeline readiness."
          );
          return;
        }

        const endpoint = explicitEndpoint || endpointFromBody || webhookFromBody || globalWebhook;
        if (!endpoint || endpoint.includes("PASTE_")) {
          setStatus(error, "Lead routing is not configured yet. Add your Privyr webhook URL to activate submissions.");
          return;
        }

        const payload = {
          name,
          email,
          phone,
          display_name: firstName(name),
          other_fields: {
            company: getValue(formData, "company"),
            website: getValue(formData, "website"),
            city: getValue(formData, "city") || "Pune",
            service: getValue(formData, "service"),
            role: getValue(formData, "role"),
            budget_range: getValue(formData, "budget"),
            timeline: getValue(formData, "timeline"),
            authority: getValue(formData, "authority"),
            monthly_leads: getValue(formData, "monthly_leads"),
            revenue_band: getValue(formData, "revenue"),
            goals: getValue(formData, "goals"),
            campaign: "march_offer_pune",
            form_name: formName,
            form_placement: placement,
            source_page: document.body.dataset.page || "unknown",
            intent_score: String(intentScore),
          },
        };

        if (submitBtn) submitBtn.disabled = true;
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error(`HTTP_${response.status}`);

          setStatus(success, "Thanks. Your request has been submitted. Our strategy team will contact you shortly.");
          form.reset();

          trackMeta("Lead", {
            content_name: formName,
            page: document.body.dataset.page || "unknown",
          });
          trackMetaCustom("PrivyrLeadSubmitted", {
            form: formName,
            placement,
            intent_score: intentScore,
          });
        } catch (err) {
          trackMetaCustom("PrivyrLeadSubmitFailed", {
            form: formName,
            placement,
            page: document.body.dataset.page || "unknown",
          });
          setStatus(
            error,
            "We could not submit right now. Please retry in a moment or call +91 98765 43210."
          );
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    });
  }

  function init() {
    initAmbientLayers();
    initPageTransitions();
    initSciFiCursor();
    markActiveNav();
    initInfographicSystem();
    initDrawer();
    initMagneticButtons();
    initScrollReveal();
    initCounters();
    initFaq();
    initBlogModal();
    initCodeCanvas();
    initTerminalRotate();
    initSymbolCanvas();
    initStoryScroller();
    initCharts();
    initArchitectureMap();
    initBeforeAfter();
    initPathSwitch();
    initCalculators();
    initTilt();
    initCardSnippets();
    initLogoMarqueeWall();
    initPortfolioFilter();
    initMetaTracking();
    initLeadForm();
    initFastCheckout();
    initPrivyrForms();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
