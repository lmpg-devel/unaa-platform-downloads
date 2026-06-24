const STORAGE_KEY = "unaa-th-visuels-v0.2";

const DEFAULT_CATEGORIES = [
  ["a_classer", "A classer"],
  ["situation_existante", "Situation existante"],
  ["chantier", "Chantier"],
  ["images_synthese", "Images de synthese"],
  ["photographe", "Photographe / projet livre"],
  ["participatif", "Participatif"],
  ["detail_photo", "Detail"],
  ["materialite", "Materialite"],
  ["abords_jardin", "Abords / jardin"],
  ["plan_implantation", "Plan implantation"],
  ["plan_rez", "Plan rez"],
  ["plan_etage", "Plan etage"],
  ["coupes", "Coupes"],
  ["elevations_1", "Elevations A"],
  ["elevations_2", "Elevations B"],
  ["schemas", "Schemas"],
  ["details_techniques", "Details techniques"],
  ["_eliminer", "A eliminer / hors corpus"],
];

const els = {
  manifestInput: document.querySelector("#manifestInput"),
  imageInput: document.querySelector("#imageInput"),
  labelsInput: document.querySelector("#labelsInput"),
  exportSelection: document.querySelector("#exportSelection"),
  exportProfile: document.querySelector("#exportProfile"),
  clearSession: document.querySelector("#clearSession"),
  categorySelect: document.querySelector("#categorySelect"),
  batchSize: document.querySelector("#batchSize"),
  searchInput: document.querySelector("#searchInput"),
  nextBatch: document.querySelector("#nextBatch"),
  categoryNav: document.querySelector("#categoryNav"),
  emptyState: document.querySelector("#emptyState"),
  cardGrid: document.querySelector("#cardGrid"),
  template: document.querySelector("#cardTemplate"),
  candidateCount: document.querySelector("#candidateCount"),
  reviewedCount: document.querySelector("#reviewedCount"),
  okCount: document.querySelector("#okCount"),
};

let state = restoreState();
let selectedFiles = new Map();
let visibleIds = [];

function restoreState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      candidates: Array.isArray(saved.candidates) ? saved.candidates : [],
      votes: saved.votes && typeof saved.votes === "object" ? saved.votes : {},
      activeCategory: saved.activeCategory || "a_classer",
      search: saved.search || "",
      batchSize: Number(saved.batchSize || 9),
    };
  } catch {
    return { candidates: [], votes: {}, activeCategory: "a_classer", search: "", batchSize: 9 };
  }
}

function persist() {
  const candidates = state.candidates.map(({ objectUrl, file, ...item }) => item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, candidates }));
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "visuel";
}

function basename(value) {
  return String(value || "").replace(/\\/g, "/").split("/").pop() || "";
}

function cleanText(value) {
  return String(value || "").trim();
}

function candidateId(row, index) {
  const basis = [
    row.source_path,
    row.asset,
    row.project,
    row.source_label,
    row.label,
    row.name,
    index,
  ].filter(Boolean).join("|");
  let hash = 0;
  for (let i = 0; i < basis.length; i += 1) hash = (hash * 31 + basis.charCodeAt(i)) >>> 0;
  return `${slug(row.category || "a_classer")}-${hash.toString(16)}`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted && char === '"' && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  if (!rows.length) return [];
  const headers = rows.shift().map((header) => slug(header));
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, cleanText(values[index])])));
}

function fileIndex(files) {
  const map = new Map();
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const item = { file, objectUrl: url, name: file.name, size: file.size, extension: file.name.split(".").pop() || "" };
    map.set(file.name.toLowerCase(), item);
    map.set(slug(file.name), item);
  }
  return map;
}

function matchFile(row) {
  const names = [row.asset, row.source_path, row.sourcePath, row.fileName, row.name, row.filename, row.file]
    .map(basename)
    .filter(Boolean);
  for (const name of names) {
    const exact = selectedFiles.get(name.toLowerCase());
    if (exact) return exact;
    const bySlug = selectedFiles.get(slug(name));
    if (bySlug) return bySlug;
  }
  return null;
}

function makeCandidate(row, index) {
  const matched = matchFile(row);
  const category = row.category || row.categorie || "a_classer";
  const label = row.label || row.source_label || row.sourceLabel || row.asset || row.source_path || row.sourcePath || matched?.name || `Visuel ${index + 1}`;
  return {
    id: row.card_id || candidateId({ ...row, category, label }, index),
    category,
    label,
    project: row.project || row.projet || "",
    sourceLabel: row.source_label || row.sourceLabel || row.source || "",
    sourcePath: row.source_path || row.sourcePath || row.asset || matched?.name || "",
    fileName: matched?.name || row.fileName || basename(row.asset || row.source_path || row.sourcePath || row.name),
    extension: row.extension || matched?.extension || "",
    sizeBytes: Number(row.size_bytes || matched?.size || 0),
    notes: row.notes || "",
    objectUrl: matched?.objectUrl || "",
  };
}

function mergeCandidates(next) {
  const existing = new Map(state.candidates.map((item) => [item.id, item]));
  for (const item of next) {
    const previous = existing.get(item.id) || {};
    existing.set(item.id, { ...previous, ...item, objectUrl: item.objectUrl || previous.objectUrl || "" });
  }
  state.candidates = Array.from(existing.values());
}

function makeCandidatesFromFiles(files) {
  return Array.from(files).map((file, index) => ({
    id: candidateId({ name: file.name, source_path: file.name }, index),
    category: "a_classer",
    label: file.name,
    project: "",
    sourceLabel: "",
    sourcePath: file.name,
    fileName: file.name,
    extension: file.name.split(".").pop() || "",
    sizeBytes: file.size,
    notes: "",
    objectUrl: URL.createObjectURL(file),
  }));
}

function categoryLabel(id) {
  return DEFAULT_CATEGORIES.find(([key]) => key === id)?.[1] || id;
}

function categoriesInUse() {
  const ids = new Set(DEFAULT_CATEGORIES.map(([key]) => key));
  state.candidates.forEach((item) => ids.add(item.category || "a_classer"));
  Object.values(state.votes).forEach((vote) => {
    if (vote.correctCategory) ids.add(vote.correctCategory);
  });
  return Array.from(ids);
}

function scoreCandidate(item) {
  const vote = state.votes[item.id];
  const seenPenalty = vote ? 80 : 0;
  const projectPenalty = projectExposure(item.category, item.project) * 4;
  const sizeBoost = item.objectUrl ? 8 : 0;
  return 100 + sizeBoost - seenPenalty - projectPenalty;
}

function projectExposure(category, project) {
  if (!project) return 0;
  return Object.values(state.votes).filter((vote) => vote.category === category && vote.project === project).length;
}

function balancedSelection(candidates, limit) {
  const buckets = new Map();
  for (const item of candidates) {
    const project = item.project || "_projet_inconnu";
    if (!buckets.has(project)) buckets.set(project, []);
    buckets.get(project).push(item);
  }
  for (const bucket of buckets.values()) bucket.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
  const pickedByProject = new Map(Array.from(buckets.keys()).map((key) => [key, 0]));
  const selected = [];
  while (selected.length < limit) {
    const available = Array.from(buckets.entries()).filter(([, rows]) => rows.length);
    if (!available.length) break;
    available.sort(([projectA, rowsA], [projectB, rowsB]) => {
      const rankA = scoreCandidate(rowsA[0]) - (pickedByProject.get(projectA) || 0) * 90;
      const rankB = scoreCandidate(rowsB[0]) - (pickedByProject.get(projectB) || 0) * 90;
      return rankB - rankA;
    });
    const [project, rows] = available[0];
    selected.push(rows.shift());
    pickedByProject.set(project, (pickedByProject.get(project) || 0) + 1);
  }
  return selected;
}

function filteredCandidates() {
  const query = state.search.toLowerCase();
  return state.candidates.filter((item) => {
    if (state.activeCategory !== "a_classer" && item.category !== state.activeCategory) return false;
    if (!query) return true;
    return [item.label, item.project, item.sourceLabel, item.sourcePath, item.fileName].join(" ").toLowerCase().includes(query);
  });
}

function rebuildVisibleIds() {
  const batch = balancedSelection(filteredCandidates(), state.batchSize);
  visibleIds = batch.map((item) => item.id);
}

function voteFor(id, patch) {
  const item = state.candidates.find((candidate) => candidate.id === id);
  if (!item) return;
  state.votes[id] = {
    ...(state.votes[id] || {}),
    category: item.category,
    project: item.project || "",
    vote: patch.vote,
    rating: patch.rating || "",
    correctCategory: patch.correctCategory || "",
    timestamp: new Date().toISOString(),
  };
  persist();
  render();
}

function renderOptions(select, selected) {
  select.innerHTML = DEFAULT_CATEGORIES
    .map(([key, label]) => `<option value="${key}"${key === selected ? " selected" : ""}>${label}</option>`)
    .join("");
}

function render() {
  els.batchSize.value = state.batchSize;
  els.searchInput.value = state.search;
  renderOptions(els.categorySelect, state.activeCategory);
  renderNav();
  renderStats();
  if (!visibleIds.length) rebuildVisibleIds();
  const visible = visibleIds.map((id) => state.candidates.find((item) => item.id === id)).filter(Boolean);
  els.emptyState.hidden = state.candidates.length > 0;
  els.cardGrid.hidden = state.candidates.length === 0;
  els.cardGrid.innerHTML = "";
  for (const item of visible) renderCard(item);
}

function renderNav() {
  const counts = new Map();
  state.candidates.forEach((item) => counts.set(item.category, (counts.get(item.category) || 0) + 1));
  els.categoryNav.innerHTML = "";
  for (const id of categoriesInUse()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = id === state.activeCategory ? "active" : "";
    button.textContent = `${categoryLabel(id)} ${counts.get(id) || 0}`;
    button.addEventListener("click", () => {
      state.activeCategory = id;
      visibleIds = [];
      persist();
      render();
    });
    els.categoryNav.append(button);
  }
}

function renderStats() {
  const votes = Object.values(state.votes);
  els.candidateCount.textContent = String(state.candidates.length);
  els.reviewedCount.textContent = String(votes.length);
  els.okCount.textContent = String(votes.filter((vote) => vote.vote === "ok").length);
}

function renderCard(item) {
  const node = els.template.content.firstElementChild.cloneNode(true);
  const vote = state.votes[item.id] || {};
  node.dataset.id = item.id;
  node.classList.toggle("is-ok", vote.vote === "ok");
  node.classList.toggle("is-ko", vote.vote === "ko");
  node.classList.toggle("is-out", vote.vote === "out");

  const media = node.querySelector(".media-frame");
  if (item.objectUrl) {
    const img = document.createElement("img");
    img.src = item.objectUrl;
    img.alt = item.label || item.fileName || "";
    media.append(img);
  } else {
    const missing = document.createElement("div");
    missing.className = "missing-media";
    missing.textContent = item.fileName ? `Image a reimporter: ${item.fileName}` : "Image non liee";
    media.append(missing);
  }

  node.querySelector(".card-title strong").textContent = item.project || item.label || "Visuel";
  node.querySelector(".card-title span").textContent = categoryLabel(item.category);
  node.querySelector(".source-line").textContent = [item.sourceLabel, item.fileName || basename(item.sourcePath)].filter(Boolean).join(" - ");

  node.querySelector(".vote-ok").addEventListener("click", () => voteFor(item.id, { vote: "ok", rating: vote.rating || 3 }));
  node.querySelector(".vote-ko").addEventListener("click", () => voteFor(item.id, { vote: "ko", correctCategory: vote.correctCategory || "" }));
  node.querySelector(".vote-out").addEventListener("click", () => voteFor(item.id, { vote: "out", correctCategory: "_eliminer" }));

  node.querySelectorAll("[data-rating]").forEach((button) => {
    const rating = Number(button.dataset.rating);
    button.classList.toggle("active", Number(vote.rating) === rating);
    button.addEventListener("click", () => voteFor(item.id, { vote: "ok", rating }));
  });

  const select = node.querySelector(".reclass-row select");
  renderOptions(select, vote.correctCategory || "");
  select.addEventListener("change", () => voteFor(item.id, { vote: "ko", correctCategory: select.value }));

  els.cardGrid.append(node);
}

function exportSelection() {
  const payload = {
    schemaVersion: "visual-selection.v1",
    exportedAt: new Date().toISOString(),
    source: "unaa-th-visuels-pwa",
    candidates: state.candidates.map(({ objectUrl, file, ...item }) => item),
    votes: state.votes,
  };
  downloadJson("visual-selection.v1.json", payload);
}

function buildProfile() {
  const projectCategoryStats = {};
  const confusion = {};
  const ratingByCategory = {};
  for (const [id, vote] of Object.entries(state.votes)) {
    const item = state.candidates.find((candidate) => candidate.id === id);
    if (!item) continue;
    const category = vote.category || item.category;
    const project = vote.project || item.project || "_projet_inconnu";
    projectCategoryStats[category] ||= {};
    projectCategoryStats[category][project] ||= { total: 0, ok: 0, ko: 0, out: 0, ratings: [] };
    const stats = projectCategoryStats[category][project];
    stats.total += 1;
    if (vote.vote === "ok") {
      stats.ok += 1;
      if (vote.rating) stats.ratings.push(Number(vote.rating));
      ratingByCategory[category] ||= [];
      ratingByCategory[category].push(Number(vote.rating || 3));
    } else if (vote.vote === "out") {
      stats.out += 1;
    } else {
      stats.ko += 1;
      if (vote.correctCategory) {
        confusion[category] ||= {};
        confusion[category][vote.correctCategory] = (confusion[category][vote.correctCategory] || 0) + 1;
      }
    }
  }
  for (const projects of Object.values(projectCategoryStats)) {
    for (const stats of Object.values(projects)) {
      const ratings = stats.ratings;
      stats.avgRating = ratings.length ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 100) / 100 : 0;
      delete stats.ratings;
    }
  }
  return {
    schemaVersion: "visual-learning-profile.v1",
    generatedAt: new Date().toISOString(),
    samples: Object.keys(state.votes).length,
    projectCategoryStats,
    confusion,
    ratingByCategory: Object.fromEntries(Object.entries(ratingByCategory).map(([category, ratings]) => [
      category,
      { count: ratings.length, avgRating: Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 100) / 100 },
    ])),
  };
}

function downloadJson(name, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

els.manifestInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const rows = parseCsv(text);
  mergeCandidates(rows.map(makeCandidate));
  visibleIds = [];
  persist();
  render();
});

els.imageInput.addEventListener("change", (event) => {
  const files = Array.from(event.target.files || []);
  selectedFiles = fileIndex(files);
  if (state.candidates.length) {
    state.candidates = state.candidates.map((candidate, index) => makeCandidate(candidate, index));
  } else {
    mergeCandidates(makeCandidatesFromFiles(files));
  }
  visibleIds = [];
  persist();
  render();
});

els.labelsInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const data = JSON.parse(await file.text());
  if (Array.isArray(data.candidates)) mergeCandidates(data.candidates.map(makeCandidate));
  if (data.votes && typeof data.votes === "object") state.votes = { ...state.votes, ...data.votes };
  visibleIds = [];
  persist();
  render();
});

els.categorySelect.addEventListener("change", () => {
  state.activeCategory = els.categorySelect.value;
  visibleIds = [];
  persist();
  render();
});

els.batchSize.addEventListener("change", () => {
  state.batchSize = Math.max(3, Math.min(30, Number(els.batchSize.value || 9)));
  visibleIds = [];
  persist();
  render();
});

els.searchInput.addEventListener("input", () => {
  state.search = els.searchInput.value;
  visibleIds = [];
  persist();
  render();
});

els.nextBatch.addEventListener("click", () => {
  visibleIds = [];
  render();
});

els.exportSelection.addEventListener("click", exportSelection);
els.exportProfile.addEventListener("click", () => downloadJson("visual-learning-profile.v1.json", buildProfile()));
els.clearSession.addEventListener("click", () => {
  if (!confirm("Vider les labels et visuels stockes localement sur cet appareil ?")) return;
  for (const item of state.candidates) if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
  selectedFiles = new Map();
  visibleIds = [];
  state = { candidates: [], votes: {}, activeCategory: "a_classer", search: "", batchSize: 9 };
  persist();
  render();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

render();
