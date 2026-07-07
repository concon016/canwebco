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

// Contact form
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

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
