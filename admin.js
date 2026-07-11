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

function drawList() {
  const list = document.getElementById("msgList");
  document.getElementById("msgCount").textContent = `${allMessages.length} mesaj`;

  if (!allMessages.length) {
    list.innerHTML = `<p class="admin-empty">Henüz mesaj yok.</p>`;
    return;
  }

  list.innerHTML = allMessages.map((m) => `
    <div class="msg-row${m.replied ? " replied" : ""}">
      <div class="msg-head">
        <b>${m.adSoyad}</b>
        <span class="msg-date">${fmtDate(m.createdAt)}</span>
      </div>
      <div class="msg-email">${m.eposta}</div>
      <div class="msg-body">${m.mesaj}</div>
      <div class="msg-actions">
        <a class="btn-reply" style="text-decoration:none;" href="mailto:${m.eposta}">Yanıtla</a>
        <button class="btn-toggle" data-toggle="${m.id}" data-replied="${m.replied}">${m.replied ? "Yanıtsız İşaretle" : "Yanıtlandı İşaretle"}</button>
        <button class="btn-del" data-delete="${m.id}">Sil</button>
      </div>
    </div>`).join("");
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
    if (delBtn) deleteMessage(delBtn.dataset.delete);
  });
});
