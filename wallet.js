const KEY = "tabungan-v1"; // sama dengan index.js, jadi datanya dibagi
const COLORS = ["#5CE1E6", "#E0A526", "#FF6B5A", "#A58BFF", "#6EDC9A", "#FF8FC7"];
 
const rupiah = n => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const esc = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = d => new Date(d + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
 
function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { goals: [], transactions: [] }; }
  catch { return { goals: [], transactions: [] }; }
}
 
let state = load();
let filter = "all";
 
function renderBalance() {
  const total = state.transactions.reduce((s, t) => s + t.amount, 0);
  const parts = state.goals
    .map((g, i) => ({
      name: g.name,
      saved: state.transactions.filter(t => t.goalId === g.id).reduce((s, t) => s + t.amount, 0),
      color: COLORS[i % COLORS.length]
    }))
    .filter(p => p.saved > 0);
  const sum = parts.reduce((s, p) => s + p.saved, 0);
 
  const strip = parts.length
    ? `<div class="strip" role="img" aria-label="Pembagian saldo per target">${parts
        .map(p => `<span style="flex:${p.saved};background:${p.color}"></span>`).join("")}</div>`
    : `<div class="strip" aria-hidden="true"></div>`;
 
  const legend = parts.length
    ? `<ul class="legend">${parts.map(p => `
        <li>
          <span class="dot" style="background:${p.color}"></span>
          <span class="name">${esc(p.name)}</span>
          <span class="amt">${rupiah(p.saved)}</span>
          <span class="pct">${Math.round((p.saved / sum) * 100)}%</span>
        </li>`).join("")}</ul>`
    : `<p class="empty">Belum ada saldo. Buat target dan setor dulu di halaman <a href="app.html">Target</a>.</p>`;
 
  document.getElementById("balance").innerHTML = `
    <div class="label">Total saldo</div>
    <div class="total">${rupiah(total)}</div>
    ${strip}
    ${legend}`;
}
 
function renderStats() {
  const tx = state.transactions;
  const inTotal = tx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const outTotal = tx.filter(t => t.amount < 0).reduce((s, t) => s - t.amount, 0);
  document.getElementById("stats").innerHTML = `
    <div class="stat"><b>${rupiah(inTotal)}</b><span>Total setoran</span></div>
    <div class="stat"><b>${rupiah(outTotal)}</b><span>Total penarikan</span></div>
    <div class="stat"><b>${tx.length}</b><span>Jumlah transaksi</span></div>`;
}
 
function renderTransactions() {
  const names = Object.fromEntries(state.goals.map(g => [g.id, g.name]));
  const list = state.transactions
    .map((t, i) => ({ ...t, i }))
    .filter(t => filter === "all" || (filter === "in" ? t.amount > 0 : t.amount < 0))
    .sort((a, b) => b.date.localeCompare(a.date) || b.i - a.i);
 
  const el = document.getElementById("txList");
  if (!list.length) {
    el.innerHTML = `<li><p class="empty" style="width:100%;padding:12px 0">Belum ada transaksi di sini.</p></li>`;
    return;
  }
  el.innerHTML = list.map(t => `
    <li>
      <span class="what">
        <b>${esc(names[t.goalId] || "Target dihapus")}</b>
        <small>${fmtDate(t.date)}</small>
      </span>
      <span class="val ${t.amount < 0 ? "out" : "in"}">${t.amount < 0 ? "−" : "+"}${rupiah(Math.abs(t.amount))}</span>
    </li>`).join("");
}
 
function render() {
  renderBalance();
  renderStats();
  renderTransactions();
}
 
document.getElementById("filters").addEventListener("click", e => {
  const btn = e.target.closest("button[data-f]");
  if (!btn) return;
  filter = btn.dataset.f;
  document.querySelectorAll("#filters button").forEach(b =>
    b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
  renderTransactions();
});
 
// Perbarui otomatis kalau data berubah dari tab lain (misalnya halaman Target)
window.addEventListener("storage", e => {
  if (e.key === KEY) { state = load(); render(); }
});
 
render();