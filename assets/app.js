const state = {
  manifest: null,
  selectedTeam: null,
  selectedDate: null
};

const els = {
  teamTabs: document.querySelector("#teamTabs"),
  teamSelect: document.querySelector("#teamSelect"),
  meetingList: document.querySelector("#meetingList"),
  noteTitle: document.querySelector("#noteTitle"),
  noteContent: document.querySelector("#noteContent"),
  eyebrow: document.querySelector("#eyebrow"),
  copyLink: document.querySelector("#copyLink")
};

const markdownRules = [
  [/^### (.*)$/gm, "<h3>$1</h3>"],
  [/^## (.*)$/gm, "<h2>$1</h2>"],
  [/^# (.*)$/gm, "<h1>$1</h1>"],
  [/\*\*(.*?)\*\*/g, "<strong>$1</strong>"],
  [/`([^`]+)`/g, "<code>$1</code>"]
];

init();

async function init() {
  try {
    const response = await fetch("data/manifest.json", { cache: "no-store" });
    state.manifest = await response.json();
    const params = new URLSearchParams(window.location.search);
    state.selectedTeam = params.get("team") || state.manifest.teams[0]?.slug;
    state.selectedDate = params.get("date") || getMeetings(state.selectedTeam)[0]?.date;
    renderNavigation();
    await renderSelectedNote();
  } catch (error) {
    els.noteTitle.textContent = "Manifest not found";
    els.noteContent.innerHTML = "<p>Run <code>npm run build</code> to generate <code>data/manifest.json</code>.</p>";
  }
}

function renderNavigation() {
  els.teamTabs.innerHTML = state.manifest.teams.map((team) => (
    `<a class="team-tab ${team.slug === state.selectedTeam ? "active" : ""}" href="${linkFor(team.slug)}">${team.name}</a>`
  )).join("");

  els.teamSelect.innerHTML = state.manifest.teams.map((team) => (
    `<option value="${team.slug}" ${team.slug === state.selectedTeam ? "selected" : ""}>${team.name}</option>`
  )).join("");

  els.teamSelect.addEventListener("change", () => {
    state.selectedTeam = els.teamSelect.value;
    state.selectedDate = getMeetings(state.selectedTeam)[0]?.date;
    updateUrl();
    renderNavigation();
    renderSelectedNote();
  }, { once: true });

  const meetings = getMeetings(state.selectedTeam);
  els.meetingList.innerHTML = meetings.map((meeting) => (
    `<a class="meeting-card ${meeting.date === state.selectedDate ? "active" : ""}" href="${linkFor(state.selectedTeam, meeting.date)}">
      <time datetime="${meeting.date}">${formatDate(meeting.date)}</time>
      <strong>${escapeHtml(meeting.title)}</strong>
      <span>${meeting.teamName}</span>
    </a>`
  )).join("") || "<p>No notes yet for this team.</p>";
}

async function renderSelectedNote() {
  const meeting = getMeetings(state.selectedTeam).find((item) => item.date === state.selectedDate);

  if (!meeting) {
    els.noteTitle.textContent = "No meeting note found";
    els.eyebrow.textContent = "Youth Day";
    els.noteContent.className = "note-content empty-state";
    els.noteContent.innerHTML = "<p>Add a Markdown note for this team/date, then run <code>npm run build</code>.</p>";
    return;
  }

  els.noteTitle.textContent = meeting.title;
  els.eyebrow.textContent = `${meeting.teamName} · ${formatDate(meeting.date)}`;
  els.copyLink.href = linkFor(meeting.team, meeting.date);
  els.copyLink.onclick = async (event) => {
    event.preventDefault();
    await navigator.clipboard.writeText(new URL(linkFor(meeting.team, meeting.date), window.location.href).href);
    els.copyLink.textContent = "Copied";
    setTimeout(() => {
      els.copyLink.textContent = "Copy link";
    }, 1400);
  };

  const response = await fetch(meeting.path, { cache: "no-store" });
  const markdown = await response.text();
  els.noteContent.className = "note-content";
  els.noteContent.innerHTML = renderMarkdown(stripFrontMatter(markdown));
}

function getMeetings(teamSlug) {
  return state.manifest.meetings
    .filter((meeting) => meeting.team === teamSlug)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function linkFor(team, date = getMeetings(team)[0]?.date) {
  const params = new URLSearchParams();
  if (team) params.set("team", team);
  if (date) params.set("date", date);
  return `?${params.toString()}`;
}

function updateUrl() {
  history.pushState(null, "", linkFor(state.selectedTeam, state.selectedDate));
}

function stripFrontMatter(markdown) {
  return markdown.replace(/^---[\s\S]*?---\s*/, "");
}

function renderMarkdown(markdown) {
  const lines = escapeHtml(markdown).split("\n");
  const html = [];
  let listType = null;

  for (const line of lines) {
    if (/^\s*-\s+\[[ x]\]\s+/i.test(line)) {
      if (listType !== "ul") {
        closeList(html, listType);
        html.push("<ul>");
        listType = "ul";
      }
      const checked = /\[[x]\]/i.test(line) ? " checked" : "";
      html.push(`<li><input type="checkbox" disabled${checked}>${line.replace(/^\s*-\s+\[[ x]\]\s+/i, "")}</li>`);
      continue;
    }

    if (/^\s*-\s+/.test(line)) {
      if (listType !== "ul") {
        closeList(html, listType);
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${line.replace(/^\s*-\s+/, "")}</li>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      if (listType !== "ol") {
        closeList(html, listType);
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${line.replace(/^\s*\d+\.\s+/, "")}</li>`);
      continue;
    }

    closeList(html, listType);
    listType = null;

    if (!line.trim()) {
      continue;
    }

    const block = markdownRules.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), line);
    html.push(block.startsWith("<h") ? block : `<p>${block}</p>`);
  }

  closeList(html, listType);
  return html.join("\n");
}

function closeList(html, listType) {
  if (listType) {
    html.push(`</${listType}>`);
  }
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00+08:00`));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
