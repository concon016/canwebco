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

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(contactForm))),
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
