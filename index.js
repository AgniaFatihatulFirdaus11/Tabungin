const KEY = "tabungan-v1";
const rupiah = n => new Intl.NumberFormat("id-ID", { 
  style: "currency", currency: "IDR", maximumFractionDigits: 0 
  }).format(n);
const esc = s => s.replace(/[&<>"']/g,
       c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---- State (sumber kebenaran tunggal) ----
let state = load();

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { goals: [], transactions: [] }; }
  catch { return { goals: [], transactions: [] }; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

// ---- Perhitungan: selalu diturunkan dari transaksi ----
function stats(goal) {
  const saved = state.transactions
    .filter(t => t.goalId === goal.id)
    .reduce((sum, t) => sum + t.amount, 0);
  const percent = Math.max(0, Math.min(100, (saved / goal.target) * 100));
  const remaining = Math.max(0, goal.target - saved);
  let perMonth = null;
  if (goal.deadline && remaining > 0) {
    const days = (new Date(goal.deadline) - new Date()) / 86400000;
    if (days > 0) perMonth = remaining / Math.max(1, days / 30);
  }
  return { saved, percent, remaining, perMonth, done: saved >= goal.target };
}

// ---- Aksi ----
function addGoal(name, target, deadline) {
  state.goals.push({ id: uid(), name, target, deadline: deadline || null, createdAt: Date.now() });
  commit();
}
function addTransaction(goalId, amount) {
  state.transactions.push({ id: uid(), goalId, amount, date: new Date().toISOString().slice(0, 10) });
  toast(amount > 0
    ? `Setoran ${rupiah(amount)} tersimpan`
    : `Penarikan ${rupiah(-amount)} tersimpan`);
  commit();
}
function deleteTransaction(id) {
  state.transactions = state.transactions.filter(t => t.id !== id);
  commit();
}
function deleteGoal(id) {
  if (!confirm("Hapus target ini beserta seluruh riwayatnya?")) return;
  state.goals = state.goals.filter(g => g.id !== id);
  state.transactions = state.transactions.filter(t => t.goalId !== id);
  commit();
}
function commit() { save(); render(); }

// ---- Toast ----
let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2000);
}

// ---- Tampilan ----
function renderSummary() {
  const total = state.transactions.reduce((s, t) => s + t.amount, 0);
  const done = state.goals.filter(g => stats(g).done).length;
  document.getElementById("summary").innerHTML = `
    <div class="stat"><b>${rupiah(total)}</b><span>Total terkumpul</span></div>
    <div class="stat"><b>${state.goals.length - done}</b><span>Target berjalan</span></div>
    <div class="stat"><b>${done}</b><span>Tercapai</span></div>`;
}

function deadlineInfo(g, s) {
  if (!g.deadline || s.done) return "";
  const days = Math.ceil((new Date(g.deadline) - new Date()) / 86400000);
  if (days < 0) return `<span class="late">Terlambat ${-days} hari</span>`;
  const extra = s.perMonth ? ` · perlu ${rupiah(s.perMonth)}/bulan` : "";
  return `<span>${days} hari lagi${extra}</span>`;
}

function render() {
  renderSummary();
  const root = document.getElementById("goals");
  if (!state.goals.length) {
    root.innerHTML = '<p class="empty">Belum ada target. Buat yang pertama di atas.</p>';
    return;
  }
  root.innerHTML = state.goals.map(g => {
    const s = stats(g);
    const barWidth = s.saved > 0 ? Math.max(s.percent, 1.5) : 0;
    const history = state.transactions
      .filter(t => t.goalId === g.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    return `
    <article class="goal ${s.done ? "done" : ""}" data-id="${g.id}">
      <div class="goal-head">
        <h2>${esc(g.name)}</h2>
        ${s.done ? '<span class="badge">Tercapai</span>' : '<button class="ghost" data-act="del-goal">Hapus</button>'}
      </div>
      <div class="amounts">
        <span class="saved">${rupiah(s.saved)}</span>
        <span class="of">dari ${rupiah(g.target)}</span>
      </div>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(s.percent)}">
        <span style="width:${barWidth}%"></span>
      </div>
      <div class="meta">
        <span>${Math.floor(s.percent)}%${s.done ? "" : " · sisa " + rupiah(s.remaining)}</span>
        ${deadlineInfo(g, s)}
      </div>
      <form class="deposit" data-act="deposit">
        <input type="number" min="1" required placeholder="Nominal (Rp)" aria-label="Nominal setoran untuk ${esc(g.name)}">
        <button type="submit">Setor</button>
        <button type="button" class="alt" data-act="withdraw">Tarik</button>
      </form>
      <div class="chips">
        <button type="button" class="chip" data-act="chip" data-val="50000">+50rb</button>
        <button type="button" class="chip" data-act="chip" data-val="100000">+100rb</button>
        <button type="button" class="chip" data-act="chip" data-val="500000">+500rb</button>
      </div>
      ${history.length ? `
      <details>
        <summary>Riwayat (${history.length})</summary>
        <ul class="history">
          ${history.map(t => `
            <li>
              <span>${t.date}</span>
              <span class="${t.amount < 0 ? "neg" : ""}">${t.amount < 0 ? "−" : "+"}${rupiah(Math.abs(t.amount))}</span>
              <button class="ghost" data-act="del-tx" data-tx="${t.id}">Hapus</button>
            </li>`).join("")}
        </ul>
      </details>` : ""}
    </article>`;
  }).join("");
}

// ---- Event ----
document.getElementById("goalForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("gName").value.trim();
  const target = Number(document.getElementById("gTarget").value);
  const deadline = document.getElementById("gDeadline").value;
  if (!name || !(target > 0)) return;
  addGoal(name, target, deadline);
  e.target.reset();
});

const goalsEl = document.getElementById("goals");

goalsEl.addEventListener("submit", e => {
  e.preventDefault();
  const card = e.target.closest(".goal");
  const input = e.target.querySelector("input");
  const amount = Number(input.value);
  if (amount > 0) addTransaction(card.dataset.id, amount);
});

goalsEl.addEventListener("click", e => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const card = btn.closest(".goal");
  const id = card.dataset.id;
  const input = card.querySelector(".deposit input");

  if (btn.dataset.act === "del-goal") deleteGoal(id);
  if (btn.dataset.act === "del-tx") deleteTransaction(btn.dataset.tx);
  if (btn.dataset.act === "chip") input.value = btn.dataset.val;
  if (btn.dataset.act === "withdraw") {
    const amount = Number(input.value);
    const saved = stats(state.goals.find(g => g.id === id)).saved;
    if (amount > saved) { toast("Saldo tidak cukup"); return; }
    if (amount > 0) addTransaction(id, -amount);
  }
});

render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}