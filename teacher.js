const configured = !SUPABASE_URL.includes("YOUR_") && !SUPABASE_ANON_KEY.includes("YOUR_");
const db = configured ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

let action = "award";
let selectedPoints = 3;
let transactions = [];

const loginCard = document.getElementById("loginCard");
const dashboard = document.getElementById("dashboard");
const logoutBtn = document.getElementById("logoutBtn");
const houseSelect = document.getElementById("houseId");

Object.entries(HOUSE_META).forEach(([id, h]) => {
  const opt = document.createElement("option");
  opt.value = id;
  opt.textContent = h.name;
  houseSelect.appendChild(opt);
});

function showDashboard() {
  loginCard.classList.add("hidden");
  dashboard.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
  loadData();
}

function showLogin() {
  loginCard.classList.remove("hidden");
  dashboard.classList.add("hidden");
  logoutBtn.classList.add("hidden");
}

document.querySelectorAll(".action-toggle").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".action-toggle").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  action = btn.dataset.action;
  updateConfirmation();
}));

document.querySelectorAll(".point-btn").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".point-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  selectedPoints = Number(btn.dataset.points);
  document.getElementById("customPoints").value = "";
  updateConfirmation();
}));

["teacherName","houseId","reason","otherReason","customPoints"].forEach(id =>
  document.getElementById(id).addEventListener("input", updateConfirmation)
);

document.getElementById("reason").addEventListener("change", e => {
  document.getElementById("otherReasonWrap").classList.toggle("hidden", e.target.value !== "Other");
  updateConfirmation();
});

function getAmount() {
  const custom = Number(document.getElementById("customPoints").value);
  return custom > 0 ? custom : selectedPoints;
}

function getReason() {
  const r = document.getElementById("reason").value;
  return r === "Other" ? document.getElementById("otherReason").value.trim() : r;
}

function updateConfirmation() {
  const teacher = document.getElementById("teacherName").value;
  const house = HOUSE_META[houseSelect.value];
  const reason = getReason();
  const amount = getAmount();
  const verb = action === "award" ? "Award" : "Deduct";
  const prep = action === "award" ? "to" : "from";

  document.getElementById("confirmation").textContent =
    teacher && house && reason
      ? `${verb} ${amount} point${amount === 1 ? "" : "s"} ${prep} ${house.name} for ${reason} — ${teacher}.`
      : "Choose a teacher, house, amount, and reason.";
}

document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const msg = document.getElementById("loginMessage");

  if (!configured) {
    msg.textContent = "Add your Supabase URL and anon key to config.js first.";
    msg.className = "form-message error";
    return;
  }

  const { error } = await db.auth.signInWithPassword({
    email: document.getElementById("email").value,
    password: document.getElementById("password").value
  });

  if (error) {
    msg.textContent = error.message;
    msg.className = "form-message error";
  } else {
    msg.textContent = "";
    showDashboard();
  }
});

logoutBtn.addEventListener("click", async () => {
  await db.auth.signOut();
  showLogin();
});

document.getElementById("pointsForm").addEventListener("submit", async e => {
  e.preventDefault();

  const msg = document.getElementById("pointsMessage");
  const teacher = document.getElementById("teacherName").value;
  const houseId = houseSelect.value;
  const reason = getReason();
  const amount = getAmount();

  if (!teacher || !houseId || !reason || amount < 1) {
    msg.textContent = "Please complete every field.";
    msg.className = "form-message error";
    return;
  }

  const points = action === "award" ? amount : -amount;

  const { error } = await db.from("point_transactions").insert({
    house_id: houseId,
    points,
    reason,
    teacher_name: teacher
  });

  if (error) {
    msg.textContent = error.message;
    msg.className = "form-message error";
    return;
  }

  msg.textContent = `${points > 0 ? "Awarded" : "Deducted"} ${Math.abs(points)} points successfully.`;
  msg.className = "form-message success";
  document.getElementById("reason").value = "";
  document.getElementById("otherReason").value = "";
  document.getElementById("otherReasonWrap").classList.add("hidden");
  updateConfirmation();
  await loadData();
});

async function loadData() {
  const { data, error } = await db
    .from("point_transactions")
    .select("*")
    .order("created_at", { ascending:false });

  if (error) return console.error(error);
  transactions = data || [];

  const scores = { odysseus:0, achilles:0, circe:0, athena:0 };
  transactions.forEach(t => scores[t.house_id] = (scores[t.house_id] || 0) + t.points);

  document.getElementById("teacherStandings").innerHTML = Object.entries(HOUSE_META)
    .map(([id,h]) => ({id,...h,points:scores[id]}))
    .sort((a,b)=>b.points-a.points)
    .map(h => `<div class="teacher-standing" style="--house:${h.color}"><strong>${h.symbol} ${h.name}</strong><strong>${h.points}</strong></div>`)
    .join("");

  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("historyList");

  if (!transactions.length) {
    list.innerHTML = "<p class='history-note'>No transactions yet.</p>";
    return;
  }

  list.innerHTML = transactions.slice(0,30).map(t => {
    const house = HOUSE_META[t.house_id] || {name:t.house_id};
    const sign = t.points > 0 ? "+" : "";
    const when = new Date(t.created_at).toLocaleString([], {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"});
    return `
      <div class="history-row">
        <strong class="${t.points < 0 ? "error" : ""}">${sign}${t.points}</strong>
        <div><strong>${house.name}</strong><div class="history-note">${t.reason} • ${when}</div></div>
        <div class="teacher-cell">${t.teacher_name}</div>
        <button class="undo-btn" data-id="${t.id}" data-points="${t.points}" data-house="${t.house_id}" data-reason="${encodeURIComponent(t.reason)}" data-teacher="${encodeURIComponent(t.teacher_name)}">Undo</button>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".undo-btn").forEach(btn => btn.addEventListener("click", undoTransaction));
}

async function undoTransaction(e) {
  const btn = e.currentTarget;
  if (!confirm("Undo this transaction by creating an equal and opposite correction?")) return;

  const originalPoints = Number(btn.dataset.points);
  const reason = decodeURIComponent(btn.dataset.reason);
  const teacher = decodeURIComponent(btn.dataset.teacher);

  const { error } = await db.from("point_transactions").insert({
    house_id: btn.dataset.house,
    points: -originalPoints,
    reason: `Undo: ${reason}`,
    teacher_name: teacher
  });

  if (error) alert(error.message);
  else loadData();
}

(async function init(){
  if (!configured) return showLogin();
  const { data:{ session } } = await db.auth.getSession();
  if (session) showDashboard();
  else showLogin();

  db.auth.onAuthStateChange((_event, session) => {
    if (session) showDashboard();
    else showLogin();
  });

  db.channel("teacher-house-scoreboard")
    .on("postgres_changes", { event:"*", schema:"public", table:"point_transactions" }, loadData)
    .subscribe();
})();
