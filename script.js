// Scroll progress bar
const scrollProgress = document.createElement("div");
scrollProgress.className = "scroll-progress";
document.body.prepend(scrollProgress);
window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollProgress.style.width = pct + "%";
});

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
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(savedTheme || (systemPrefersDark ? "dark" : "light"));

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
  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    const relX = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    heroGlow.style.setProperty("--glow-x", `${relX * 60}px`);
    heroGlow.style.setProperty("--glow-y", `${relY * 40}px`);
  });
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

// Live viewer count badge
const viewerCountEl = document.getElementById("viewer-count");
if (viewerCountEl) {
  const VIEWER_MIN = 122;
  const VIEWER_MAX = 198;

  const randomBetween = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  viewerCountEl.textContent = randomBetween(VIEWER_MIN, VIEWER_MAX);

  const scheduleViewerUpdate = () => {
    const delay = randomBetween(3000, 7000);
    setTimeout(() => {
      const current = parseInt(viewerCountEl.textContent, 10);
      const next = Math.min(
        VIEWER_MAX,
        Math.max(VIEWER_MIN, current + randomBetween(-12, 12))
      );
      viewerCountEl.textContent = next;
      scheduleViewerUpdate();
    }, delay);
  };

  scheduleViewerUpdate();
}

// GA4 conversion tracking: WhatsApp & email clicks
const waLinks = document.querySelectorAll('a[href*="wa.me"]');
console.log("[GA4 debug] wa.me link sayısı:", waLinks.length);
waLinks.forEach((link) => {
  link.addEventListener("click", () => {
    console.log("[GA4 debug] whatsapp_click tetiklendi, gtag mevcut mu:", typeof gtag);
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
