const configured = !SUPABASE_URL.includes("YOUR_") && !SUPABASE_ANON_KEY.includes("YOUR_");
const db = configured ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const demoScores = { odysseus: 0, achilles: 0, circe: 0, athena: 0 };

function renderStandings(scores) {
  const ordered = Object.entries(HOUSE_META)
    .map(([id, meta]) => ({ id, ...meta, points: scores[id] || 0 }))
    .sort((a,b) => b.points - a.points);

  document.getElementById("houseGrid").innerHTML = ordered.map((h, i) => `
    <article class="house-card" style="--house:${h.color}">
      <div class="rank">${i+1}</div>
      <div class="symbol">${h.symbol}</div>
      <h3>${h.name}</h3>
      <div class="traits">${h.traits}</div>
      <div class="score">${h.points.toLocaleString()}</div>
      <div class="score-label">House Points</div>
    </article>
  `).join("");

  const champ = ordered[0];
  document.getElementById("championName").textContent = champ.name;
  document.getElementById("championPoints").textContent = `${champ.points.toLocaleString()} points`;
  document.getElementById("updatedTime").textContent =
    `Updated ${new Date().toLocaleTimeString([], {hour:"numeric", minute:"2-digit"})}`;
}

function renderActivity(rows) {
  const feed = document.getElementById("activityFeed");
  if (!rows.length) {
    feed.innerHTML = `<div class="activity-item"><div></div><div class="activity-main"><strong>No activity yet.</strong><span class="activity-meta">The first decree awaits.</span></div></div>`;
    return;
  }

  feed.innerHTML = rows.map(r => {
    const meta = HOUSE_META[r.house_id] || { name: r.house_id };
    const sign = r.points > 0 ? "+" : "";
    const when = new Date(r.created_at).toLocaleString([], {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"});
    return `
      <div class="activity-item">
        <div class="activity-points ${r.points < 0 ? "negative" : ""}">${sign}${r.points}</div>
        <div class="activity-main">
          <strong>${meta.name}</strong>
          <span class="activity-meta">${r.reason} • ${when}</span>
        </div>
        <div class="activity-teacher">${r.points >= 0 ? "Awarded" : "Deducted"} by ${r.teacher_name}</div>
      </div>
    `;
  }).join("");
}

async function loadPublicBoard() {
  if (!configured) {
    renderStandings(demoScores);
    renderActivity([]);
    return;
  }

  const { data, error } = await db
    .from("point_transactions")
    .select("house_id, points, reason, teacher_name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    renderStandings(demoScores);
    renderActivity([]);
    return;
  }

  const scores = { ...demoScores };
  data.forEach(r => scores[r.house_id] = (scores[r.house_id] || 0) + r.points);
  renderStandings(scores);
  renderActivity(data.slice(0, 12));
}

loadPublicBoard();

if (configured) {
  db.channel("house-scoreboard")
    .on("postgres_changes", { event:"*", schema:"public", table:"point_transactions" }, loadPublicBoard)
    .subscribe();
}
