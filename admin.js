/* canwebco — admin paneli (gelen mesajlar) */

const ADMIN_KEY_STORAGE = "mcdnet_admin_key";

function initAdminTheme() {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;
  const apply = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    toggle.setAttribute("aria-checked", theme === "dark" ? "true" : "false");
  };
  apply(document.documentElement.getAttribute("data-theme") || "light");
  toggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    apply(next);
  });
}

function adminKey() {
  return sessionStorage.getItem(ADMIN_KEY_STORAGE) || "";
}

function showMsg(text, ok) {
  const el = document.getElementById("adminMsg");
  el.textContent = text;
  el.className = ok ? "ok" : "err";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function unauthorize() {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  showMsg("Şifre hatalı görünüyor, lütfen tekrar giriş yap.", false);
  document.getElementById("adminGate").style.display = "";
  document.getElementById("adminPanel").style.display = "none";
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

let allMessages = [];
let activeDurumFilter = "hepsi";

const DURUM_LABELS = {
  yeni: "Yeni",
  teklif_gonderildi: "Teklif Gönderildi",
  gorusuluyor: "Görüşülüyor",
  anlasildi: "Anlaşıldı",
  reddedildi: "Reddedildi",
};

function drawList() {
  const list = document.getElementById("msgList");
  const visible = activeDurumFilter === "hepsi"
    ? allMessages
    : allMessages.filter((m) => (m.durum || "yeni") === activeDurumFilter);

  document.getElementById("msgCount").textContent = `${visible.length} / ${allMessages.length} mesaj`;

  if (!visible.length) {
    list.innerHTML = `<p class="admin-empty">Bu durumda mesaj yok.</p>`;
    return;
  }

  list.innerHTML = visible.map((m) => {
    const durum = m.durum || "yeni";
    const durumOptions = Object.entries(DURUM_LABELS)
      .map(([val, label]) => `<option value="${val}"${val === durum ? " selected" : ""}>${label}</option>`)
      .join("");
    return `
    <div class="msg-row${m.replied ? " replied" : ""}">
      <div class="msg-head">
        <b>${m.adSoyad}</b>
        <span class="msg-date">${fmtDate(m.createdAt)}</span>
      </div>
      <div class="msg-email">${m.eposta}</div>
      <div class="msg-body">${m.mesaj}</div>
      <div class="msg-actions">
        <button class="btn-reply" data-reply-open="${m.id}">Yanıtla</button>
        <button class="btn-toggle" data-toggle="${m.id}" data-replied="${m.replied}">${m.replied ? "Yanıtsız İşaretle" : "Yanıtlandı İşaretle"}</button>
        <select class="durum-select durum-${durum}" data-durum-select="${m.id}">${durumOptions}</select>
        <button class="btn-del" data-delete="${m.id}">Sil</button>
      </div>
      <div class="reply-box" id="reply-box-${m.id}">
        <input type="text" placeholder="Konu" data-reply-subject="${m.id}" value="${m.konu ? "Re: " + m.konu : "canwebco - Talebiniz Hakkında"}">
        <textarea placeholder="Mesajınız..." data-reply-body="${m.id}">Merhaba ${m.adSoyad},\n\n\n\nİyi çalışmalar,\ncanwebco</textarea>
        <div class="reply-box-actions">
          <button class="btn-send" data-reply-send="${m.id}" data-reply-to="${m.eposta}">Gönder</button>
          <span class="reply-status" id="reply-status-${m.id}"></span>
        </div>
      </div>
      <div class="msg-notlar">
        <textarea placeholder="Not ekle (fiyat teklifi, görüşme tarihi vb.)" data-notlar="${m.id}" rows="1">${m.notlar || ""}</textarea>
      </div>
    </div>`;
  }).join("");
}

async function fetchMessages() {
  const res = await fetch("/api/messages", { headers: { "x-admin-key": adminKey() } });
  if (res.status === 401) return unauthorize();
  allMessages = await res.json();
  drawList();
}

async function toggleReplied(id, currentlyReplied) {
  const res = await fetch(`/api/messages?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey() },
    body: JSON.stringify({ replied: !currentlyReplied }),
  });
  if (res.status === 401) return unauthorize();
  fetchMessages();
}

async function updateDurum(id, durum) {
  const res = await fetch(`/api/messages?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey() },
    body: JSON.stringify({ durum }),
  });
  if (res.status === 401) return unauthorize();
  const m = allMessages.find((x) => String(x.id) === String(id));
  if (m) m.durum = durum;
  drawList();
}

async function updateNotlar(id, notlar) {
  const res = await fetch(`/api/messages?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey() },
    body: JSON.stringify({ notlar }),
  });
  if (res.status === 401) return unauthorize();
  const m = allMessages.find((x) => String(x.id) === String(id));
  if (m) m.notlar = notlar;
  showMsg("Not kaydedildi.", true);
}

async function sendReply(id, to) {
  const subjectEl = document.querySelector(`[data-reply-subject="${id}"]`);
  const bodyEl = document.querySelector(`[data-reply-body="${id}"]`);
  const sendBtn = document.querySelector(`[data-reply-send="${id}"]`);
  const statusEl = document.getElementById(`reply-status-${id}`);

  const subject = subjectEl.value.trim();
  const body = bodyEl.value.trim();
  if (!subject || !body) {
    statusEl.textContent = "Konu ve mesaj boş olamaz.";
    return;
  }

  sendBtn.disabled = true;
  statusEl.textContent = "Gönderiliyor...";

  try {
    const res = await fetch("/api/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey() },
      body: JSON.stringify({ messageId: id, to, subject, body }),
    });
    if (res.status === 401) return unauthorize();
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Bilinmeyen hata");

    statusEl.textContent = "Gönderildi ✓";
    const m = allMessages.find((x) => String(x.id) === String(id));
    if (m) m.replied = true;
    setTimeout(() => drawList(), 800);
  } catch (err) {
    statusEl.textContent = "Hata: " + err.message;
    sendBtn.disabled = false;
  }
}

async function deleteMessage(id) {
  if (!confirm("Bu mesajı silmek istediğine emin misin?")) return;
  const res = await fetch(`/api/messages?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "x-admin-key": adminKey() },
  });
  if (res.status === 401) return unauthorize();
  showMsg("Mesaj silindi.", true);
  fetchMessages();
}

function enterPanel() {
  document.getElementById("adminGate").style.display = "none";
  document.getElementById("adminPanel").style.display = "";
  fetchMessages();
}

document.addEventListener("DOMContentLoaded", () => {
  initAdminTheme();

  if (adminKey()) enterPanel();

  document.getElementById("adminEnterBtn").addEventListener("click", () => {
    const pass = document.getElementById("adminPass").value;
    if (!pass) return;
    sessionStorage.setItem(ADMIN_KEY_STORAGE, pass);
    enterPanel();
  });

  document.getElementById("msgList").addEventListener("click", (e) => {
    const toggleBtn = e.target.closest("[data-toggle]");
    if (toggleBtn) {
      toggleReplied(toggleBtn.dataset.toggle, toggleBtn.dataset.replied === "true");
      return;
    }
    const delBtn = e.target.closest("[data-delete]");
    if (delBtn) {
      deleteMessage(delBtn.dataset.delete);
      return;
    }
    const replyOpenBtn = e.target.closest("[data-reply-open]");
    if (replyOpenBtn) {
      const box = document.getElementById(`reply-box-${replyOpenBtn.dataset.replyOpen}`);
      if (box) box.classList.toggle("open");
      return;
    }
    const sendBtn = e.target.closest("[data-reply-send]");
    if (sendBtn) sendReply(sendBtn.dataset.replySend, sendBtn.dataset.replyTo);
  });

  document.getElementById("msgList").addEventListener("change", (e) => {
    const durumSelect = e.target.closest("[data-durum-select]");
    if (durumSelect) updateDurum(durumSelect.dataset.durumSelect, durumSelect.value);
  });

  document.getElementById("msgList").addEventListener("blur", (e) => {
    const textarea = e.target.closest("[data-notlar]");
    if (textarea) updateNotlar(textarea.dataset.notlar, textarea.value);
  }, true);

  document.getElementById("durumFilter").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    activeDurumFilter = btn.dataset.filter;
    document.querySelectorAll("#durumFilter button").forEach((b) => b.classList.toggle("active", b === btn));
    drawList();
  });
});
