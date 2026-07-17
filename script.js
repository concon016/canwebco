// Scroll progress bar
const scrollProgress = document.createElement("div");
scrollProgress.className = "scroll-progress";
document.body.prepend(scrollProgress);
window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollProgress.style.width = pct + "%";
}, { passive: true });

// Tab title trick
const originalTitle = document.title;
document.addEventListener("visibilitychange", () => {
  document.title = document.hidden ? "Seni bekliyoruz!" : originalTitle;
});

// Dark mode toggle
const themeToggle = document.getElementById("themeToggle");
const logoIcon = document.getElementById("logoIcon");
const root = document.documentElement;

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeToggle.setAttribute("aria-checked", theme === "dark" ? "true" : "false");
  logoIcon.src = theme === "dark" ? "assets/logo-512-dark.png" : "assets/logo-512.png";
}

const savedTheme = localStorage.getItem("theme");
applyTheme(savedTheme || "light");

themeToggle.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("theme", next);
});

// Mobile menu toggle
const menuToggle = document.getElementById("menuToggle");
const navMobile = document.getElementById("navMobile");

menuToggle.addEventListener("click", () => {
  navMobile.classList.toggle("open");
});

navMobile.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => navMobile.classList.remove("open"));
});

// Scroll reveal
const revealEls = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
revealEls.forEach((el) => revealObserver.observe(el));

// Hero glow follows the cursor
const hero = document.querySelector(".hero");
const heroGlow = document.querySelector(".hero-glow");
if (hero && heroGlow) {
  // mousemove sadece koordinatları yazar; getBoundingClientRect (layout okuma)
  // ve stil yazma işlemi requestAnimationFrame içinde, saniyede en fazla bir kez yapılır.
  let heroRect = hero.getBoundingClientRect();
  let pendingX = null;
  let pendingY = null;
  let glowTicking = false;

  window.addEventListener("resize", () => { heroRect = hero.getBoundingClientRect(); });

  function applyGlow() {
    glowTicking = false;
    if (pendingX === null) return;
    const relX = (pendingX - heroRect.left - heroRect.width / 2) / heroRect.width;
    const relY = (pendingY - heroRect.top) / heroRect.height;
    heroGlow.style.setProperty("--glow-x", `${relX * 60}px`);
    heroGlow.style.setProperty("--glow-y", `${relY * 40}px`);
  }

  hero.addEventListener("mousemove", (e) => {
    pendingX = e.clientX;
    pendingY = e.clientY;
    if (!glowTicking) {
      glowTicking = true;
      requestAnimationFrame(applyGlow);
    }
  }, { passive: true });

  hero.addEventListener("mouseleave", () => {
    heroGlow.style.setProperty("--glow-x", "0px");
    heroGlow.style.setProperty("--glow-y", "0px");
  });
}

// Confetti burst
function fireConfetti(originEl) {
  const rect = originEl.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top;
  const colors = ["#0071e3", "#3ba55d", "#ffc23c", "#ff5533"];

  for (let i = 0; i < 24; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${originX}px`;
    piece.style.top = `${originY}px`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty("--x", `${(Math.random() - 0.5) * 260}px`);
    piece.style.setProperty("--y", `${Math.random() * -180 - 40}px`);
    piece.style.setProperty("--r", `${Math.random() * 360}deg`);
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 1200);
  }
}

// Hizmetler sayfasında seçilen hizmetler URL üzerinden (?hizmetler=...) buraya taşınır:
// iletişim formunun mesaj alanına ve WhatsApp linklerine otomatik ekleniyor.
const selectedServicesParam = new URLSearchParams(window.location.search).get("hizmetler");
if (selectedServicesParam) {
  const selectedServiceNames = selectedServicesParam
    .split(",")
    .map((s) => decodeURIComponent(s.trim()))
    .filter(Boolean);

  if (selectedServiceNames.length) {
    const messageField = document.querySelector('textarea[name="message"]');
    if (messageField && !messageField.value) {
      messageField.value = `İlgilendiğim hizmetler: ${selectedServiceNames.join(", ")}\n\n`;
    }

    const waText = encodeURIComponent(`Merhaba, ilgilendiğim hizmetler: ${selectedServiceNames.join(", ")}.`);
    document.querySelectorAll('a[href^="https://wa.me/905324648288"]').forEach((link) => {
      const base = link.getAttribute("href").split("?")[0];
      link.setAttribute("href", `${base}?text=${waText}`);
    });
  }
}

// Hizmetler sayfası: seçilebilir hizmet kartları
const serviceCheckboxes = document.querySelectorAll(".service-checkbox");
if (serviceCheckboxes.length) {
  const serviceNudge = document.getElementById("serviceNudge");
  const serviceContactBtn = document.getElementById("serviceContactBtn");
  const serviceSelectCount = document.getElementById("serviceSelectCount");
  const complementaryServices = ["Haritada Görünürlük", "Google Arama & Reklam Yönetimi"];

  function joinWithVe(services) {
    const items = services.map((s) => `<strong>${s}</strong>`);
    if (items.length < 2) return items.join("");
    return `${items.slice(0, -1).join(", ")} ve ${items[items.length - 1]}`;
  }

  function getSelectedServices() {
    const selected = [];
    serviceCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) selected.push(checkbox.closest(".service-card").dataset.service);
    });
    return selected;
  }

  function updateServiceSelection() {
    const selected = [];
    serviceCheckboxes.forEach((checkbox) => {
      const card = checkbox.closest(".service-card");
      card.classList.toggle("selected", checkbox.checked);
      if (checkbox.checked) selected.push(card.dataset.service);
    });

    if (serviceNudge) {
      const wantsWebsite = selected.includes("Web Sitesi Tasarımı");
      const chosen = ["Web Sitesi Tasarımı", ...complementaryServices].filter((s) => selected.includes(s));
      const missing = complementaryServices.filter((s) => !selected.includes(s));
      if (wantsWebsite && missing.length) {
        const chosenList = joinWithVe(chosen);
        const missingList = joinWithVe(missing);
        const isPlural = missing.length > 1;
        serviceNudge.innerHTML = `${chosenList} seçtiniz — ${missingList} ${
          isPlural ? "hizmetlerini" : "hizmetini"
        } de eklemenizi öneririz. ${
          isPlural
            ? "Bunlar, sitenizin gerçekten bulunabilir olması için tamamlayıcı ve önemli hizmetlerdir."
            : "Bu, sitenizin gerçekten bulunabilir olması için tamamlayıcı ve önemli bir hizmettir."
        }`;
        serviceNudge.hidden = false;
      } else {
        serviceNudge.hidden = true;
      }
    }

    if (serviceContactBtn) {
      serviceContactBtn.href = selected.length
        ? `iletisim.html?hizmetler=${encodeURIComponent(selected.join(","))}`
        : "iletisim.html";
    }

    if (serviceSelectCount) {
      serviceSelectCount.textContent = selected.length ? `${selected.length} hizmet seçildi` : "";
    }
  }

  serviceCheckboxes.forEach((checkbox) => checkbox.addEventListener("change", updateServiceSelection));
  updateServiceSelection();

  const serviceWarningOverlay = document.getElementById("serviceWarningOverlay");
  const serviceWarningText = document.getElementById("serviceWarningText");
  const serviceWarningCancel = document.getElementById("serviceWarningCancel");
  const serviceWarningContinue = document.getElementById("serviceWarningContinue");

  function closeServiceWarning() {
    if (serviceWarningOverlay) serviceWarningOverlay.hidden = true;
  }

  if (serviceContactBtn && serviceWarningOverlay) {
    serviceContactBtn.addEventListener("click", (e) => {
      const selected = getSelectedServices();
      const wantsWebsite = selected.includes("Web Sitesi Tasarımı");
      const missing = complementaryServices.filter((s) => !selected.includes(s));
      if (wantsWebsite && missing.length) {
        e.preventDefault();
        const isPlural = missing.length > 1;
        const missingText = joinWithVe(missing);
        serviceWarningText.innerHTML = `${missingText} ${
          isPlural ? "hizmetlerini" : "hizmetini"
        } seçmediniz. Bu ${
          isPlural ? "hizmetler sitenizin" : "hizmet sitenizin"
        } gerçekten bulunabilir olması için önemlidir. Yine de devam etmek istiyor musunuz?`;
        serviceWarningContinue.href = serviceContactBtn.href;
        serviceWarningOverlay.hidden = false;
      }
    });

    serviceWarningCancel.addEventListener("click", closeServiceWarning);
    serviceWarningOverlay.addEventListener("click", (e) => {
      if (e.target === serviceWarningOverlay) closeServiceWarning();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeServiceWarning();
    });
  }
}

// Contact form
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = contactForm.querySelector(".form-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Gönderiliyor...";
    formStatus.textContent = "";
    formStatus.className = "form-status";

    const formData = Object.fromEntries(new FormData(contactForm));

    // Mesajı admin panelinde de sakla — Web3Forms (e-posta) başarısız olsa bile
    // mesaj kaybolmasın diye bu çağrı e-posta adımından bağımsız çalışır.
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adSoyad: formData.name,
        eposta: formData.email,
        mesaj: formData.message,
      }),
    }).catch((err) => console.error("Mesaj admin paneline kaydedilemedi:", err));

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        formStatus.textContent = "Mesajınız gönderildi, en kısa sürede dönüş yapacağız.";
        formStatus.classList.add("success");
        fireConfetti(submitBtn);
        contactForm.reset();
      } else {
        throw new Error(result.message || "Gönderim başarısız");
      }
    } catch (err) {
      formStatus.textContent = "Bir hata oluştu, lütfen tekrar deneyin veya WhatsApp'tan yazın.";
      formStatus.classList.add("error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Gönder";
    }
  });
}

// Dolar fiyatların altına güncel kurdan TL karşılığını ekler (fiyat kartı olan sayfalarda çalışır)
const priceTryEls = document.querySelectorAll(".price-try[data-usd]");
if (priceTryEls.length) {
  const RATE_CACHE_KEY = "mcdnet_usdtry_rate";
  const RATE_CACHE_TS_KEY = "mcdnet_usdtry_ts";
  const RATE_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 saat sonra kur tazelenir
  const FALLBACK_RATE = 47; // API'ye hiç ulaşılamazsa ve önbellek de yoksa kullanılacak yaklaşık kur

  const renderTryPrices = (rate) => {
    priceTryEls.forEach((el) => {
      const usd = parseFloat(el.dataset.usd);
      if (!isNaN(usd)) {
        const tl = Math.round(usd * rate);
        el.textContent = `≈ ${tl.toLocaleString("tr-TR")} ₺`;
      }
    });
  };

  const cachedRate = parseFloat(localStorage.getItem(RATE_CACHE_KEY));
  const cachedTs = parseInt(localStorage.getItem(RATE_CACHE_TS_KEY), 10);
  const isFresh = cachedTs && Date.now() - cachedTs < RATE_CACHE_TTL;

  renderTryPrices(cachedRate || FALLBACK_RATE);

  if (!isFresh) {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => res.json())
      .then((data) => {
        const rate = data && data.rates && data.rates.TRY;
        if (rate) {
          localStorage.setItem(RATE_CACHE_KEY, rate);
          localStorage.setItem(RATE_CACHE_TS_KEY, Date.now().toString());
          renderTryPrices(rate);
        }
      })
      .catch(() => {
        // Kur alınamazsa önbellekteki/varsayılan değer zaten gösteriliyor, sessizce geç
      });
  }
}

// GA4 conversion tracking: WhatsApp & email clicks
document.querySelectorAll('a[href*="wa.me"]').forEach((link) => {
  link.addEventListener("click", () => {
    if (typeof gtag === "function") {
      gtag("event", "whatsapp_click", {
        event_category: "engagement",
        event_label: window.location.pathname,
      });
    }
  });
});

document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
  link.addEventListener("click", () => {
    if (typeof gtag === "function") {
      gtag("event", "email_click", {
        event_category: "engagement",
        event_label: window.location.pathname,
      });
    }
  });
});
