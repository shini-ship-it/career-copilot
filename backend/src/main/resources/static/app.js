/opt/homebrew/Library/Homebrew/cmd/shellenv.sh: line 27: /bin/ps: Operation not permitted
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
const views = { tracker: $("tracker-view"), profile: $("profile-view"), match: $("match-view") };
const connectionLabel = $("connection");
const connectionDot = $("dot");

const recognizedSkills = [
  ["Java", ["java"]], ["JavaScript", ["javascript", "js"]], ["TypeScript", ["typescript"]],
  ["Python", ["python"]], ["C++", ["c++"]], ["C#", ["c#", "c sharp"]], ["Go", ["golang"]],
  ["Rust", ["rust"]], ["Ruby", ["ruby"]], ["PHP", ["php"]], ["Kotlin", ["kotlin"]],
  ["Swift", ["swift"]], ["SQL", ["sql"]], ["HTML", ["html"]], ["CSS", ["css"]],
  ["React", ["react", "react.js", "reactjs"]], ["Angular", ["angular"]], ["Vue", ["vue", "vue.js"]],
  ["Node.js", ["node.js", "nodejs"]], ["Spring Boot", ["spring boot"]], ["Spring", ["spring framework"]],
  [".NET", [".net", "dotnet"]], ["Django", ["django"]], ["Flask", ["flask"]], ["FastAPI", ["fastapi"]],
  ["REST APIs", ["rest api", "restful api"]], ["GraphQL", ["graphql"]], ["Microservices", ["microservices"]],
  ["AWS", ["aws", "amazon web services"]], ["Azure", ["azure"]], ["Google Cloud", ["google cloud", "gcp"]],
  ["Docker", ["docker"]], ["Kubernetes", ["kubernetes", "k8s"]], ["Terraform", ["terraform"]],
  ["CI/CD", ["ci/cd", "continuous integration", "continuous delivery"]], ["Git", ["git"]], ["GitHub", ["github"]],
  ["Linux", ["linux"]], ["PostgreSQL", ["postgresql", "postgres"]], ["MySQL", ["mysql"]],
  ["MongoDB", ["mongodb"]], ["Redis", ["redis"]], ["Kafka", ["kafka"]], ["Apache Spark", ["apache spark", "pyspark"]],
  ["Snowflake", ["snowflake"]], ["BigQuery", ["bigquery"]], ["Databricks", ["databricks"]],
  ["Tableau", ["tableau"]], ["Power BI", ["power bi"]], ["Microsoft Excel", ["microsoft excel", "excel"]],
  ["Machine learning", ["machine learning"]], ["Deep learning", ["deep learning"]],
  ["TensorFlow", ["tensorflow"]], ["PyTorch", ["pytorch"]], ["Natural language processing", ["natural language processing", "nlp"]],
  ["Generative AI", ["generative ai", "genai"]], ["Large language models", ["large language model", "llm"]],
  ["Prompt engineering", ["prompt engineering"]], ["Data analysis", ["data analysis"]], ["Data visualization", ["data visualization"]],
  ["Statistics", ["statistics", "statistical analysis"]], ["A/B testing", ["a/b testing", "ab testing"]],
  ["Agile", ["agile"]], ["Scrum", ["scrum"]], ["Jira", ["jira"]], ["Project management", ["project management"]],
  ["Product management", ["product management"]], ["Leadership", ["leadership"]], ["Communication", ["communication"]],
  ["Figma", ["figma"]], ["UX design", ["ux design", "user experience design"]], ["UI design", ["ui design", "user interface design"]],
  ["Salesforce", ["salesforce"]], ["CRM", ["crm"]], ["Customer service", ["customer service"]],
  ["Financial modeling", ["financial modeling", "financial modelling"]], ["Risk management", ["risk management"]],
  ["Compliance", ["compliance"]], ["HIPAA", ["hipaa"]], ["SOC 2", ["soc 2", "soc2"]]
];

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
  renderActivity();
}

function renderActivity() {
  const labels = { created: "Added an application", updated: "Updated an application", deleted: "Deleted an application", "profile-updated": "Updated your profile" };
  const recent = activity.slice(0, 6);
  $("activity-list").innerHTML = recent.map((item) => {
    const date = new Date(item.at);
    const validDate = !Number.isNaN(date.getTime());
    const timestamp = validDate ? date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "";
    const job = jobs.find((candidate) => candidate.id === item.id);
    const context = job ? `${job.role || "Role"} · ${job.company || "Company"}` : "";
    return `<li class="activity-item"><span class="activity-mark" aria-hidden="true">✳</span><div><strong>${escapeHtml(labels[item.type] || "Workspace updated")}</strong>${context ? `<div class="muted">${escapeHtml(context)}</div>` : ""}${timestamp ? `<time class="muted" datetime="${escapeHtml(item.at)}">${escapeHtml(timestamp)}</time>` : ""}</div></li>`;
  }).join("");
  $("activity-empty").hidden = recent.length > 0;
  $("activity-list").hidden = recent.length === 0;
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
  ["name", "email", "phone", "location", "summary", "skills", "experience", "education", "resumeText"].forEach((field) => {
    const input = $("profile-" + field);
    if (input) input.value = profile[field] || "";
  });
  $("profile-name-preview").textContent = profile.name || "Your professional profile";
  $("profile-summary-preview").textContent = profile.summary || "Add a short summary to introduce your experience and career goals.";
  $("profile-skills-preview").textContent = profile.skills || "Your skills will appear here.";
}

function saveProfile(event) {
  event.preventDefault();
  ["name", "email", "phone", "location", "summary", "skills", "experience", "education", "resumeText"].forEach((field) => {
    profile[field] = $("profile-" + field).value.trim();
  });
  recordActivity("profile-updated", "profile");
  persistWorkspace();
  renderProfile();
  $("profile-save-status").textContent = "Profile saved.";
}

function containsSkill(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i").test(text);
}

function getSkills(text) {
  const normalized = String(text || "").toLowerCase();
  return recognizedSkills
    .filter(([, terms]) => terms.some((term) => containsSkill(normalized, term)))
    .map(([name]) => name);
}

function setSkillList(id, skills, emptyMessage) {
  const list = $(id);
  list.replaceChildren();
  if (skills.length === 0) {
    const item = document.createElement("li");
    item.className = "muted";
    item.textContent = emptyMessage;
    list.append(item);
    return;
  }
  skills.forEach((skill) => {
    const item = document.createElement("li");
    item.textContent = skill;
    list.append(item);
  });
}

function renderResumeMatch(jobDescription) {
  const profileText = [profile.resumeText, profile.skills, profile.summary, profile.experience, profile.education]
    .filter(Boolean).join("\n");
  const required = getSkills(jobDescription);
  const candidate = new Set(getSkills(profileText));
  const matched = required.filter((skill) => candidate.has(skill));
  const missing = required.filter((skill) => !candidate.has(skill));

  $("match-result").hidden = false;
  $("match-score").textContent = required.length ? `${Math.round((matched.length / required.length) * 100)}%` : "—";
  $("match-score").setAttribute("aria-label", required.length ? `Match score ${Math.round((matched.length / required.length) * 100)} percent` : "Match score unavailable");
  $("match-summary").textContent = required.length
    ? `${matched.length} of ${required.length} recognized job skills appear in your saved profile.`
    : "No recognizable skills were found in this description, so a match percentage is not available.";
  $("match-found-count").textContent = `(${matched.length})`;
  $("match-missing-count").textContent = `(${missing.length})`;
  setSkillList("match-found-list", matched, "No recognized job skills found in your profile yet.");
  setSkillList("match-missing-list", missing, required.length ? "No missing skills from the recognized list." : "No skills to compare.");
}

async function checkResumeMatch(event) {
  event.preventDefault();
  const url = $("match-url").value.trim();
  let description = $("match-description").value.trim();
  if (Boolean(url) === Boolean(description)) {
    $("match-status").textContent = "Enter a job posting URL or paste its description (choose one).";
    return;
  }

  if (!url && description.length < 40) {
    $("match-status").textContent = "Paste a fuller job description (at least 40 characters) so there is enough context to compare.";
    return;
  }
  const profileText = [profile.resumeText, profile.skills, profile.summary, profile.experience, profile.education]
    .filter(Boolean).join(" ").trim();
  if (!profileText) {
    $("match-status").textContent = "Add resume text or profile skills/experience, then save your profile before matching.";
    return;
  }

  const button = $("match-submit");
  button.disabled = true;
  $("match-result").hidden = true;
  try {
    if (url) {
      $("match-status").textContent = "Reading the public job posting…";
      const response = await fetch("/api/job-description/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || result.message || result.error || "Could not read this posting. Paste the job description instead.");
      description = result.text;
    }
    renderResumeMatch(description);
    $("match-status").textContent = "Match complete. Your job description was not saved.";
  } catch (error) {
    $("match-status").textContent = error.message || "Could not read this posting. Paste the job description instead.";
  } finally {
    button.disabled = false;
  }
}

// Navigation and event bindings
function showView(viewName) {
  Object.entries(views).forEach(([name, element]) => { element.hidden = name !== viewName; });
  $("tracker-actions").hidden = viewName !== "tracker";
  document.querySelectorAll("[data-view]").forEach((button) => {
    const active = button.dataset.view === viewName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
  const pageCopy = {
    tracker: ["Good things take tracking.", "A calmer way to manage your job search."],
    profile: ["Your professional profile", "Keep your career details organized in one place."],
    match: ["Resume match", "See which job requirements your profile already covers."]
  };
  $("page-title").textContent = pageCopy[viewName][0];
  $("page-subtitle").textContent = pageCopy[viewName][1];
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
  $("match-form").addEventListener("submit", checkResumeMatch);
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });
}

bindEvents();
loadWorkspace();
