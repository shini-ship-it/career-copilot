/* Career Copilot UI
 * Sections: state, DOM references, persistence, rendering, actions, events.
 */

// State
const STORAGE_KEY = "career-copilot-workspace-v1";
const applicationFields = ["company", "role", "status", "location", "url", "date", "followup", "notes"];
let jobs = [];
let profile = {};
let activity = [];
let backendAvailable = false;
let saveTimer;

// DOM references
const $ = (id) => document.getElementById(id);
const views = { tracker: $("tracker-view"), profile: $("profile-view") };
const connectionLabel = $("connection");
const connectionDot = $("dot");

// Persistence
function saveLocally() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jobs, profile, activity }));
  } catch (error) {
    console.warn("Unable to save workspace locally.", error);
  }
}

async function loadWorkspace() {
  try {
    const response = await fetch("/api/workspace");
    if (!response.ok) throw new Error("Workspace API unavailable");
    const data = await response.json();
    jobs = Array.isArray(data.jobs) ? data.jobs : [];
    profile = data.profile && typeof data.profile === "object" ? data.profile : {};
    activity = Array.isArray(data.activity) ? data.activity : [];
    backendAvailable = true;
    connectionLabel.textContent = "Synced with backend";
  } catch (error) {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      jobs = Array.isArray(data.jobs) ? data.jobs : [];
      profile = data.profile && typeof data.profile === "object" ? data.profile : {};
      activity = Array.isArray(data.activity) ? data.activity : [];
    } catch (storageError) {
      console.warn("Unable to load local workspace.", storageError);
    }
    connectionLabel.textContent = "Local browser mode";
    connectionDot.style.background = "#d99c43";
  }
  renderApplications();
  renderProfile();
}

function persistWorkspace() {
  saveLocally();
  if (!backendAvailable) return;
  connectionLabel.textContent = "Saving…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      const response = await fetch("/api/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs, profile, activity })
      });
      if (!response.ok) throw new Error("Workspace save failed");
      connectionLabel.textContent = "Synced with backend";
      connectionDot.style.background = "#59a879";
    } catch (error) {
      connectionLabel.textContent = "Saved locally · backend unavailable";
      connectionDot.style.background = "#d99c43";
    }
  }, 250);
}

// Shared utilities
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function recordActivity(type, id) {
  activity.unshift({ type, id, at: new Date().toISOString() });
}

// Application rendering and actions
function renderApplications() {
  const query = $("search").value.toLowerCase();
  const status = $("filter").value;
  const visibleJobs = jobs.filter((job) =>
    (!status || job.status === status) &&
    [job.company, job.role, job.location].some((value) => (value || "").toLowerCase().includes(query))
  );

  $("rows").innerHTML = visibleJobs.map((job) => `
    <tr>
      <td><div class="company">${escapeHtml(job.company)}</div>
        <div class="role">${escapeHtml(job.role)}${job.location ? " · " + escapeHtml(job.location) : ""}</div></td>
      <td><span class="pill ${escapeHtml(job.status)}">${escapeHtml(job.status)}</span></td>
      <td>${escapeHtml(job.date || "—")}</td>
      <td>${escapeHtml(job.followup || "—")}</td>
      <td><div class="rowactions">
        <button class="iconbtn" type="button" data-edit="${escapeHtml(job.id)}" aria-label="Edit ${escapeHtml(job.company)}">✎</button>
        <button class="iconbtn" type="button" data-delete="${escapeHtml(job.id)}" aria-label="Delete ${escapeHtml(job.company)}">×</button>
        ${job.url ? `<a class="iconbtn" target="_blank" rel="noopener" href="${escapeHtml(job.url)}" aria-label="Open job posting">↗</a>` : ""}
      </div></td>
    </tr>`).join("");

  $("empty").hidden = visibleJobs.length > 0;
  $("total").textContent = jobs.length;
  $("progress").textContent = jobs.filter((job) => ["Applied", "Interviewing"].includes(job.status)).length;
  $("interviews").textContent = jobs.filter((job) => job.status === "Interviewing").length;
  $("offers").textContent = jobs.filter((job) => job.status === "Offer").length;
  $("count").textContent = `${jobs.length} record${jobs.length === 1 ? "" : "s"}`;
}

function openApplicationForm(job = null) {
  $("form").reset();
  $("id").value = job?.id || "";
  $("formtitle").textContent = job ? "Edit application" : "Add application";
  applicationFields.forEach((field) => {
    $(field).value = job?.[field] || (field === "status" ? "Saved" :
      field === "date" ? new Date().toISOString().slice(0, 10) : "");
  });
  $("backdrop").style.display = "flex";
  $("company").focus();
}

function closeApplicationForm() {
  $("backdrop").style.display = "none";
}

function saveApplication(event) {
  event.preventDefault();
  const application = {};
  applicationFields.forEach((field) => { application[field] = $(field).value.trim(); });
  application.id = $("id").value || crypto.randomUUID();
  const existingIndex = jobs.findIndex((job) => job.id === application.id);
  if (existingIndex >= 0) {
    jobs[existingIndex] = application;
    recordActivity("updated", application.id);
  } else {
    jobs.unshift(application);
    recordActivity("created", application.id);
  }
  persistWorkspace();
  renderApplications();
  closeApplicationForm();
}

function handleApplicationActions(event) {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) {
    openApplicationForm(jobs.find((job) => job.id === editButton.dataset.edit));
  }
  if (deleteButton && confirm("Delete this application?")) {
    const id = deleteButton.dataset.delete;
    jobs = jobs.filter((job) => job.id !== id);
    recordActivity("deleted", id);
    persistWorkspace();
    renderApplications();
  }
}

function exportApplications() {
  const columns = applicationFields;
  const csv = [columns.join(","), ...jobs.map((job) =>
    columns.map((field) => '"' + String(job[field] || "").replace(/"/g, '""') + '"').join(",")
  )].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = "career-copilot-applications.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

// Profile rendering and actions
function renderProfile() {
  ["name", "email", "phone", "location", "summary", "skills", "experience", "education"].forEach((field) => {
    const input = $("profile-" + field);
    if (input) input.value = profile[field] || "";
  });
  $("profile-name-preview").textContent = profile.name || "Your professional profile";
  $("profile-summary-preview").textContent = profile.summary || "Add a short summary to introduce your experience and career goals.";
  $("profile-skills-preview").textContent = profile.skills || "Your skills will appear here.";
}

function saveProfile(event) {
  event.preventDefault();
  ["name", "email", "phone", "location", "summary", "skills", "experience", "education"].forEach((field) => {
    profile[field] = $("profile-" + field).value.trim();
  });
  recordActivity("profile-updated", "profile");
  persistWorkspace();
  renderProfile();
  $("profile-save-status").textContent = "Profile saved.";
}

// Navigation and event bindings
function showView(viewName) {
  Object.entries(views).forEach(([name, element]) => { element.hidden = name !== viewName; });
  document.querySelectorAll("[data-view]").forEach((button) => {
    const active = button.dataset.view === viewName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
  $("page-title").textContent = viewName === "profile" ? "Your professional profile" : "Good things take tracking.";
  $("page-subtitle").textContent = viewName === "profile"
    ? "Keep your career details organized in one place."
    : "A calmer way to manage your job search.";
}

function bindEvents() {
  $("add").addEventListener("click", () => openApplicationForm());
  $("close").addEventListener("click", closeApplicationForm);
  $("cancel").addEventListener("click", closeApplicationForm);
  $("backdrop").addEventListener("click", (event) => {
    if (event.target === $("backdrop")) closeApplicationForm();
  });
  $("search").addEventListener("input", renderApplications);
  $("filter").addEventListener("change", renderApplications);
  $("form").addEventListener("submit", saveApplication);
  $("rows").addEventListener("click", handleApplicationActions);
  $("export").addEventListener("click", exportApplications);
  $("profile-form").addEventListener("submit", saveProfile);
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });
}

bindEvents();
loadWorkspace();
