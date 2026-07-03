const STORAGE_KEY = "unaa-th-visuels-v0.3";
const LEGACY_STORAGE_KEYS = ["unaa-th-visuels-v0.2"];

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

const STOP_TOKENS = new Set([
  "jpg",
  "jpeg",
  "png",
  "pdf",
  "tif",
  "tiff",
  "heic",
  "heif",
  "dwg",
  "data",
  "documents",
  "users",
  "production",
  "graphique",
  "photos",
  "photo",
  "image",
  "images",
  "plans",
  "plan",
]);

const els = {
  manifestInput: document.querySelector("#manifestInput"),
  imageInput: document.querySelector("#imageInput"),
  referencesSessionInput: document.querySelector("#referencesSessionInput"),
  labelsInput: document.querySelector("#labelsInput"),
  exportSelection: document.querySelector("#exportSelection"),
  exportProfile: document.querySelector("#exportProfile"),
  exportBridge: document.querySelector("#exportBridge"),
  clearSession: document.querySelector("#clearSession"),
  bridgeFocusExport: document.querySelector("#bridgeFocusExport"),
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
  sessionTitle: document.querySelector("#sessionTitle"),
  sessionDetail: document.querySelector("#sessionDetail"),
  bridgeTitle: document.querySelector("#bridgeTitle"),
  bridgeText: document.querySelector("#bridgeText"),
  bridgeRows: document.querySelector("#bridgeRows"),
  bridgeProjects: document.querySelector("#bridgeProjects"),
  bridgeCategories: document.querySelector("#bridgeCategories"),
};

let state = restoreState();
let selectedFiles = new Map();
let visibleIds = [];

function blankState() {
  return {
    candidates: [],
    votes: {},
    activeCategory: "a_classer",
    search: "",
    batchSize: 9,
    referencesSession: null,
  };
}

function restoreState() {
  const keys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
  for (const key of keys) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      if (!Array.isArray(saved.candidates)) continue;
      return {
        ...blankState(),
        candidates: saved.candidates,
        votes: normalizeVotes(saved.votes || {}, saved.candidates),
        activeCategory: saved.activeCategory || "a_classer",
        search: saved.search || "",
        batchSize: Number(saved.batchSize || 9),
        referencesSession: normalizeReferencesSession(saved.referencesSession || saved.referencesBridge || null),
      };
    } catch {
      // Try the next storage key.
    }
  }
  return blankState();
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

function norm(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\\/g, "/");
}

function textTokens(value) {
  const matches = norm(value).match(/[a-z0-9_]{3,}/g) || [];
  return new Set(matches.filter((token) => !STOP_TOKENS.has(token) && !/^\d+$/.test(token)));
}

function candidateId(row, index) {
  const basis = [
    row.source_path,
    row.sourcePath,
    row.asset,
    row.project,
    row.source_label,
    row.sourceLabel,
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
  const names = [row.asset, row.source_path, row.sourcePath, row.fileName, row.filename, row.name, row.file]
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
  const id = row.id || row.card_id || row.cardId || candidateId({ ...row, category, label }, index);
  const sourcePath = row.source_path || row.sourcePath || row.asset || matched?.name || "";
  return {
    id,
    cardId: row.card_id || row.cardId || id,
    category,
    label,
    slot: row.slot || "",
    project: row.project || row.projet || "",
    sourceLabel: row.source_label || row.sourceLabel || row.source || "",
    sourcePath,
    asset: row.asset || "",
    fileName: matched?.name || row.fileName || row.filename || basename(row.asset || sourcePath || row.name),
    extension: row.extension || matched?.extension || "",
    sizeBytes: Number(row.size_bytes || row.sizeBytes || matched?.size || 0),
    notes: row.notes || "",
    objectUrl: matched?.objectUrl || row.objectUrl || "",
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
  return Array.from(files).map((file, index) => {
    const id = candidateId({ name: file.name, source_path: file.name }, index);
    return {
      id,
      cardId: id,
      category: "a_classer",
      label: file.name,
      slot: String(index + 1),
      project: "",
      sourceLabel: "",
      sourcePath: file.name,
      asset: "",
      fileName: file.name,
      extension: file.name.split(".").pop() || "",
      sizeBytes: file.size,
      notes: "",
      objectUrl: URL.createObjectURL(file),
    };
  });
}

function normalizeVote(vote = {}, item = {}) {
  return {
    category: vote.category || item.category || "",
    project: vote.project || item.project || "",
    vote: vote.vote || "",
    rating: vote.rating || "",
    correctCategory: vote.correctCategory || vote.correct_category || "",
    timestamp: vote.timestamp || "",
  };
}

function normalizeVotes(votes = {}, candidates = []) {
  const byId = new Map(candidates.map((item) => [item.id || item.card_id || item.cardId, item]));
  return Object.fromEntries(Object.entries(votes).map(([id, vote]) => [id, normalizeVote(vote, byId.get(id) || {})]));
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
  state.votes[id] = normalizeVote({
    ...(state.votes[id] || {}),
    category: item.category,
    project: item.project || "",
    ...patch,
    timestamp: new Date().toISOString(),
  }, item);
  persist();
  render();
}

function renderOptions(select, selected, options = {}) {
  const blank = options.includeBlank ? '<option value="">Bonne categorie</option>' : "";
  select.innerHTML = blank + DEFAULT_CATEGORIES
    .map(([key, label]) => `<option value="${key}"${key === selected ? " selected" : ""}>${label}</option>`)
    .join("");
}

function render() {
  els.batchSize.value = state.batchSize;
  els.searchInput.value = state.search;
  renderOptions(els.categorySelect, state.activeCategory);
  renderNav();
  renderStats();
  renderBridge();
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

function renderBridge() {
  const session = state.referencesSession;
  const projects = new Set(state.candidates.map((item) => item.project).filter(Boolean));
  const categoryCounts = session?.categoryCounts || {};
  const sessionRows = Number(session?.rows || 0);
  const activeCategories = Object.keys(categoryCounts).length || new Set(state.candidates.map((item) => item.category).filter(Boolean)).size;

  els.sessionTitle.textContent = session?.referenceId || session?.id || "Session locale";
  els.sessionDetail.textContent = session
    ? `${session.scope || "references"} - ${session.rows || state.candidates.length} lignes`
    : "Aucun contrat References charge";
  els.bridgeTitle.textContent = session ? "Session References chargee" : "Contrat local pret";
  els.bridgeText.textContent = session?.importAfterReview || "Exports compatibles avec l'import References tri-visuels:import.";
  els.bridgeRows.textContent = String(sessionRows || state.candidates.length);
  els.bridgeProjects.textContent = String(session?.projects?.length || projects.size);
  els.bridgeCategories.textContent = String(activeCategories || 0);
}

function renderCard(item) {
  const node = els.template.content.firstElementChild.cloneNode(true);
  const vote = normalizeVote(state.votes[item.id] || {}, item);
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

  node.querySelector(".vote-ok").addEventListener("click", () => voteFor(item.id, { vote: "ok", rating: vote.rating || 3, correctCategory: "" }));
  node.querySelector(".vote-ko").addEventListener("click", () => voteFor(item.id, { vote: "ko", correctCategory: vote.correctCategory || "" }));
  node.querySelector(".vote-out").addEventListener("click", () => voteFor(item.id, { vote: "out", correctCategory: "_eliminer" }));

  node.querySelectorAll("[data-rating]").forEach((button) => {
    const rating = Number(button.dataset.rating);
    button.classList.toggle("active", Number(vote.rating) === rating);
    button.addEventListener("click", () => voteFor(item.id, { vote: "ok", rating, correctCategory: "" }));
  });

  const select = node.querySelector(".reclass-row select");
  renderOptions(select, vote.correctCategory || "", { includeBlank: true });
  select.addEventListener("change", () => voteFor(item.id, { vote: "ko", correctCategory: select.value }));

  els.cardGrid.append(node);
}

function normalizeReferencesSession(input) {
  if (!input || typeof input !== "object") return null;
  const session = input.referencesSession || input.referencesBridge || input.session || input;
  if (!session || typeof session !== "object") return null;
  return {
    id: session.id || session.runId || "",
    generatedAt: session.generatedAt || session.generated_at || "",
    scope: session.scope || "",
    referenceId: session.referenceId || session.reference_id || "",
    projects: Array.isArray(session.projects) ? session.projects : [],
    sourceRootId: session.sourceRootId || session.source_root_id || "",
    manifest: session.manifest || "",
    reviewDataDir: session.reviewDataDir || session.review_data_dir || "",
    assetsDir: session.assetsDir || session.assets_dir || "",
    rows: Number(session.rows || 0),
    skipped: Number(session.skipped || 0),
    categoryCounts: session.categoryCounts || session.category_counts || {},
    launchFromRepoRoot: session.launchFromRepoRoot || session.launch_from_repo_root || "",
    importAfterReview: session.importAfterReview || session.import_after_review || "",
    categoryMap: session.categoryMap || session.category_map || "",
  };
}

function importReferencesSession(data) {
  const session = normalizeReferencesSession(data);
  if (!session) return false;
  state.referencesSession = session;
  persist();
  render();
  return true;
}

function exportCandidate(item) {
  return {
    id: item.id,
    card_id: item.cardId || item.id,
    category: item.category,
    label: item.label,
    slot: item.slot || "",
    project: item.project || "",
    source_label: item.sourceLabel || "",
    sourceLabel: item.sourceLabel || "",
    source_path: item.sourcePath || "",
    sourcePath: item.sourcePath || "",
    asset: item.asset || "",
    fileName: item.fileName || "",
    extension: item.extension || "",
    size_bytes: Number(item.sizeBytes || 0),
    sizeBytes: Number(item.sizeBytes || 0),
    notes: item.notes || "",
  };
}

function exportVote(vote = {}, item = {}) {
  const normalized = normalizeVote(vote, item);
  return {
    vote: normalized.vote,
    category: normalized.category || item.category || "",
    project: normalized.project || item.project || "",
    rating: normalized.rating || "",
    correct_category: normalized.correctCategory || "",
    correctCategory: normalized.correctCategory || "",
    timestamp: normalized.timestamp || "",
  };
}

function buildSelectionExport() {
  const exportedAt = new Date().toISOString();
  return {
    schemaVersion: "visual-selection.v1",
    schema_version: "visual-selection.v1",
    exportedAt,
    exported_at: exportedAt,
    source: "unaa-th-visuels-pwa",
    referencesBridge: state.referencesSession,
    referencesSession: state.referencesSession,
    references_session: state.referencesSession,
    candidates: state.candidates.map(exportCandidate),
    votes: Object.fromEntries(Object.entries(state.votes).map(([id, vote]) => {
      const item = state.candidates.find((candidate) => candidate.id === id) || {};
      return [id, exportVote(vote, item)];
    })),
  };
}

function parseNotes(item) {
  if (!item.notes) return {};
  try {
    return JSON.parse(item.notes);
  } catch {
    return {};
  }
}

function addWeight(container, category, key, delta) {
  if (!category || !key || !Number.isFinite(delta)) return;
  container[category] ||= {};
  container[category][key] = Math.round(((container[category][key] || 0) + delta) * 1000) / 1000;
}

function addFlatWeight(container, key, delta) {
  if (!key || !Number.isFinite(delta)) return;
  container[key] = Math.round(((container[key] || 0) + delta) * 1000) / 1000;
}

function applyLearningSignals(weights, item, category, multiplier) {
  const learning = parseNotes(item).learning || {};
  const groups = [
    ["semantic_signal_weights", learning.semanticSignals || learning.semantic_signals || []],
    ["semiotic_signal_weights", learning.semioticSignals || learning.semiotic_signals || []],
    ["visual_signal_weights", learning.visualSignals || learning.visual_signals || []],
  ];
  for (const [key, signals] of groups) {
    weights[key] ||= {};
    for (const signal of signals) {
      const signalKey = signal.key || slug(signal.label || "");
      const score = Number(signal.score || 1);
      addWeight(weights[key], category, signalKey, score * multiplier);
    }
  }
}

function summarizeRatings(ratings) {
  return {
    count: ratings.length,
    avg_rating: ratings.length ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 100) / 100 : 0,
  };
}

function buildProfile() {
  const pathProfiles = {};
  const tokenWeights = {};
  const signalWeights = {
    semantic_signal_weights: {},
    semiotic_signal_weights: {},
    visual_signal_weights: {},
  };
  const qualityTokenWeights = {};
  const confusion = {};
  const ratingByCategory = {};
  const projectCategoryStats = {};

  for (const [id, rawVote] of Object.entries(state.votes)) {
    const item = state.candidates.find((candidate) => candidate.id === id);
    if (!item) continue;
    const vote = normalizeVote(rawVote, item);
    const category = vote.category || item.category;
    const correct = vote.correctCategory;
    const sourcePath = item.sourcePath || item.asset || item.fileName || item.id;
    const project = vote.project || item.project || "_projet_inconnu";
    const rating = Number(vote.rating || 0);
    const sampleTokens = textTokens([sourcePath, item.project, item.sourceLabel, item.fileName].join(" "));

    pathProfiles[sourcePath] ||= {
      approved_categories: {},
      rejected_categories: new Set(),
      correct_category_votes: {},
      samples: 0,
    };
    pathProfiles[sourcePath].samples += 1;

    projectCategoryStats[category] ||= {};
    projectCategoryStats[category][project] ||= { total: 0, ok: 0, ko: 0, out: 0, ratings: [] };
    const stats = projectCategoryStats[category][project];
    stats.total += 1;

    if (vote.vote === "ok") {
      stats.ok += 1;
      if (rating) stats.ratings.push(rating);
      pathProfiles[sourcePath].approved_categories[category] ||= [];
      pathProfiles[sourcePath].approved_categories[category].push(rating || 3);
      ratingByCategory[category] ||= [];
      ratingByCategory[category].push(rating || 3);

      const categoryWeight = 2.5 + Math.max(0, (rating || 3) - 3);
      for (const token of sampleTokens) {
        addWeight(tokenWeights, category, token, categoryWeight);
        if (rating >= 4) addFlatWeight(qualityTokenWeights, token, 1.5);
        else if (rating && rating <= 2) addFlatWeight(qualityTokenWeights, token, -1.5);
      }
      applyLearningSignals(signalWeights, item, category, Math.max(1, rating || 3));
    } else if (vote.vote === "ko" || vote.vote === "out") {
      if (vote.vote === "out") stats.out += 1;
      else stats.ko += 1;
      pathProfiles[sourcePath].rejected_categories.add(category);
      for (const token of sampleTokens) addWeight(tokenWeights, category, token, -5);
      if (correct) {
        pathProfiles[sourcePath].correct_category_votes[correct] = (pathProfiles[sourcePath].correct_category_votes[correct] || 0) + 1;
        confusion[category] ||= {};
        confusion[category][correct] = (confusion[category][correct] || 0) + 1;
        for (const token of sampleTokens) addWeight(tokenWeights, correct, token, vote.vote === "out" ? 2 : 4);
        applyLearningSignals(signalWeights, item, correct, vote.vote === "out" ? .5 : 1.5);
      }
    }
  }

  const paths = {};
  for (const [sourcePath, data] of Object.entries(pathProfiles)) {
    const approved = {};
    for (const [category, ratings] of Object.entries(data.approved_categories)) {
      approved[category] = summarizeRatings(ratings);
    }
    const correctCategory = Object.entries(data.correct_category_votes).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    paths[sourcePath] = {
      samples: data.samples,
      approved_categories: approved,
      rejected_categories: Array.from(data.rejected_categories).sort(),
      correct_category: correctCategory,
    };
  }

  const projectStats = {};
  for (const [category, projects] of Object.entries(projectCategoryStats)) {
    projectStats[category] = {};
    for (const [project, stats] of Object.entries(projects)) {
      projectStats[category][project] = {
        total: stats.total,
        ok: stats.ok,
        ko: stats.ko,
        out: stats.out,
        avg_rating: summarizeRatings(stats.ratings).avg_rating,
      };
    }
  }

  const ratingStats = Object.fromEntries(Object.entries(ratingByCategory).map(([category, ratings]) => [category, summarizeRatings(ratings)]));
  return {
    schemaVersion: "visual-learning-profile.v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    generated_at: new Date().toISOString(),
    source: "unaa-th-visuels-pwa",
    source_session: state.referencesSession,
    samples: Object.keys(state.votes).length,
    paths,
    token_weights: tokenWeights,
    quality_token_weights: qualityTokenWeights,
    semantic_signal_weights: signalWeights.semantic_signal_weights,
    semiotic_signal_weights: signalWeights.semiotic_signal_weights,
    visual_signal_weights: signalWeights.visual_signal_weights,
    confusion,
    project_category_stats: projectStats,
    rating_by_category: ratingStats,
    projectCategoryStats: projectStats,
    ratingByCategory: ratingStats,
  };
}

function buildBridgePackage() {
  const exportedAt = new Date().toISOString();
  return {
    schemaVersion: "unaa-references-bridge.v1",
    schema_version: "unaa-references-bridge.v1",
    exportedAt,
    exported_at: exportedAt,
    source: "unaa-th-visuels-pwa",
    referencesSession: state.referencesSession,
    references_session: state.referencesSession,
    selection: buildSelectionExport(),
    profile: buildProfile(),
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

els.referencesSessionInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const data = JSON.parse(await file.text());
  importReferencesSession(data);
  if (data.selection?.candidates) {
    mergeCandidates(data.selection.candidates.map(makeCandidate));
    state.votes = { ...state.votes, ...normalizeVotes(data.selection.votes || {}, state.candidates) };
  }
  visibleIds = [];
  persist();
  render();
});

els.labelsInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const data = JSON.parse(await file.text());
  importReferencesSession(data);
  const selection = data.selection?.candidates ? data.selection : data;
  if (Array.isArray(selection.candidates)) mergeCandidates(selection.candidates.map(makeCandidate));
  if (selection.votes && typeof selection.votes === "object") {
    state.votes = { ...state.votes, ...normalizeVotes(selection.votes, state.candidates) };
  }
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

els.bridgeFocusExport.addEventListener("click", () => {
  document.querySelector("#exports")?.scrollIntoView({ behavior: "smooth", block: "start" });
  els.exportProfile.focus({ preventScroll: true });
});

els.exportSelection.addEventListener("click", () => downloadJson("visual-selection.v1.json", buildSelectionExport()));
els.exportProfile.addEventListener("click", () => downloadJson("visual-learning-profile.v1.json", buildProfile()));
els.exportBridge.addEventListener("click", () => downloadJson("unaa-references-bridge.v1.json", buildBridgePackage()));
els.clearSession.addEventListener("click", () => {
  if (!confirm("Vider les labels et visuels stockes localement sur cet appareil ?")) return;
  for (const item of state.candidates) if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
  selectedFiles = new Map();
  visibleIds = [];
  state = blankState();
  persist();
  render();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

render();
