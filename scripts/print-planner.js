(function () {
  const FIXED_RESOURCE_PATTERN = /teacher'?s guide|lesson plan/i;
  const SKIP_RESOURCE_PATTERN = /^all handouts/i;

  function clampCopies(value, fallback = 1) {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.max(1, Math.min(200, parsed));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function injectStyles() {
    if (document.getElementById("spokes-print-planner-styles")) return;
    const style = document.createElement("style");
    style.id = "spokes-print-planner-styles";
    style.textContent = `
      .print-all-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin: 0.25rem 0 0.85rem;
        padding: 0.65rem 0.75rem;
        border: 1px solid rgba(211,178,87,0.72);
        border-radius: 8px;
        background: rgba(211,178,87,0.16);
        color: var(--light, #fff);
        font-family: var(--font-body, inherit);
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.2s ease;
      }
      .print-all-btn:hover,
      .print-all-btn:focus-visible {
        background: rgba(211,178,87,0.28);
        outline: none;
        transform: translateY(-1px);
      }
      .print-all-btn::before {
        content: "\\2399";
        color: var(--gold, rgb(211,178,87));
        font-size: 1rem;
        line-height: 1;
      }
      .print-modal {
        position: fixed;
        inset: 0;
        z-index: 5000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: rgba(0,19,63,0.62);
      }
      .print-modal.open { display: flex; }
      .print-dialog {
        width: min(860px, 100%);
        max-height: min(86vh, 760px);
        overflow-y: auto;
        background: var(--light, rgb(255,255,255));
        color: var(--dark, rgb(0,64,113));
        border-radius: 12px;
        box-shadow: 0 24px 70px rgba(0,0,0,0.35);
        border: 1px solid rgba(0,64,113,0.18);
      }
      .print-dialog-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.35rem 1.5rem 1rem;
        border-bottom: 1px solid rgba(0,64,113,0.14);
        background: var(--dark, rgb(0,64,113));
        color: var(--light, rgb(255,255,255));
      }
      .print-dialog-header h2 {
        font-family: var(--font-heading, inherit);
        font-size: 1.55rem;
        color: var(--light, rgb(255,255,255));
        margin: 0;
        line-height: 1.15;
      }
      .print-dialog-header p {
        color: rgba(255,255,255,0.78);
        margin: 0.35rem 0 0;
        font-size: 0.92rem;
        line-height: 1.35;
      }
      .print-close {
        width: 42px;
        height: 42px;
        border: 1px solid rgba(255,255,255,0.28);
        border-radius: 8px;
        background: rgba(255,255,255,0.08);
        color: var(--light, rgb(255,255,255));
        font-size: 1.5rem;
        cursor: pointer;
        flex-shrink: 0;
      }
      .print-close:hover,
      .print-close:focus-visible {
        background: rgba(255,255,255,0.18);
        outline: none;
      }
      .print-dialog-body { padding: 1.4rem 1.5rem 1.5rem; }
      .print-student-control {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem;
        background: var(--light, rgb(255,255,255));
        border: 1px solid rgba(0,64,113,0.14);
        border-radius: 10px;
        margin-bottom: 1rem;
      }
      .print-student-control label {
        display: grid;
        gap: 0.2rem;
        font-weight: 700;
        color: var(--dark, rgb(0,64,113));
      }
      .print-student-control span {
        font-size: 0.85rem;
        font-weight: 400;
        color: var(--gray, rgb(96,99,107));
      }
      .print-student-control input,
      .print-copy-input {
        width: 88px;
        min-height: 44px;
        border: 2px solid rgba(0,64,113,0.26);
        border-radius: 8px;
        padding: 0.4rem 0.55rem;
        font-size: 1rem;
        color: var(--dark, rgb(0,64,113));
        background: var(--light, rgb(255,255,255));
      }
      .print-table {
        width: 100%;
        border-collapse: collapse;
        background: var(--light, rgb(255,255,255));
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid rgba(0,64,113,0.14);
      }
      .print-table th,
      .print-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid rgba(0,64,113,0.1);
        vertical-align: middle;
      }
      .print-table th {
        background: var(--dark, rgb(0,64,113));
        color: var(--light, rgb(255,255,255));
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .print-table tr:last-child td { border-bottom: 0; }
      .print-resource-title {
        font-weight: 700;
        color: var(--dark, rgb(0,64,113));
      }
      .print-resource-note {
        display: block;
        margin-top: 0.2rem;
        color: var(--gray, rgb(96,99,107));
        font-size: 0.82rem;
      }
      .print-actions {
        position: sticky;
        bottom: -1.5rem;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-top: 1.2rem;
        margin-left: -1.5rem;
        margin-right: -1.5rem;
        margin-bottom: -1.5rem;
        padding: 0.9rem 1.5rem 1rem;
        background: linear-gradient(180deg, rgba(237,243,247,0.86), var(--light, rgb(255,255,255)) 38%);
        border-top: 1px solid rgba(0,64,113,0.12);
      }
      .print-action-btn {
        min-height: 44px;
        border: 2px solid var(--dark, rgb(0,64,113));
        border-radius: 8px;
        padding: 0.55rem 1rem;
        font-family: var(--font-body, inherit);
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
      }
      .print-action-btn.primary {
        background: var(--dark, rgb(0,64,113));
        color: var(--light, rgb(255,255,255));
      }
      .print-action-btn.secondary {
        background: transparent;
        color: var(--dark, rgb(0,64,113));
      }
      .print-action-btn:hover,
      .print-action-btn:focus-visible {
        transform: translateY(-1px);
        outline: none;
      }
      .print-note {
        margin-top: 1rem;
        color: var(--gray, rgb(96,99,107));
        font-size: 0.85rem;
        line-height: 1.45;
      }
    `;
    document.head.appendChild(style);
  }

  function collectResources() {
    const seen = new Set();
    return Array.from(document.querySelectorAll(".resources-section .resource-link"))
      .map(link => {
        const title = link.textContent.trim();
        const href = link.getAttribute("href");
        return { title, href };
      })
      .filter(resource => resource.title && resource.href && !SKIP_RESOURCE_PATTERN.test(resource.title))
      .filter(resource => {
        const key = resource.href + "|" + resource.title;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(resource => {
        const fixed = FIXED_RESOURCE_PATTERN.test(resource.title);
        return {
          ...resource,
          defaultType: fixed ? "fixed" : "student",
          defaultCopies: fixed ? 1 : undefined,
          note: fixed ? "Instructor copy" : "One per student"
        };
      });
  }

  function ensureModal() {
    if (document.getElementById("printPlanner")) return;
    const modal = document.createElement("div");
    modal.className = "print-modal";
    modal.id = "printPlanner";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "printPlannerTitle");
    modal.setAttribute("aria-describedby", "printPlannerDescription");
    modal.innerHTML = `
      <div class="print-dialog">
        <div class="print-dialog-header">
          <div>
            <h2 id="printPlannerTitle">Print Lesson Packet</h2>
            <p id="printPlannerDescription">Set the number of students, adjust any resource counts, then launch a guided print queue.</p>
          </div>
          <button class="print-close" type="button" aria-label="Close print planner">&times;</button>
        </div>
        <div class="print-dialog-body">
          <div class="print-student-control">
            <label for="studentCopyCount">
              Students attending
              <span>Student handouts and rubric copy counts update from this number.</span>
            </label>
            <input id="studentCopyCount" type="number" min="1" max="200" value="5" inputmode="numeric">
          </div>
          <table class="print-table" aria-label="Printable resources and copy counts">
            <thead>
              <tr>
                <th scope="col">Resource</th>
                <th scope="col">Copies</th>
              </tr>
            </thead>
            <tbody id="printResourceRows"></tbody>
          </table>
          <p class="print-note">Browser security prevents this page from silently choosing printer copy counts. The print queue will show the required copies for each PDF; enter that number in the browser print dialog before printing each item.</p>
          <div class="print-actions">
            <button class="print-action-btn secondary" type="button" data-print-reset>Reset Counts</button>
            <button class="print-action-btn primary" type="button" data-print-launch>Launch Print Queue</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function getPrintResources() {
    if (!window.__spokesPrintResources) {
      window.__spokesPrintResources = collectResources();
    }
    return window.__spokesPrintResources;
  }

  function renderPrintPlannerRows() {
    const tbody = document.getElementById("printResourceRows");
    if (!tbody) return;
    const studentCount = clampCopies(document.getElementById("studentCopyCount")?.value, 5);
    tbody.innerHTML = getPrintResources().map((resource, index) => {
      const copies = resource.defaultType === "student" ? studentCount : resource.defaultCopies;
      const attr = resource.defaultType === "fixed" ? 'data-fixed="true"' : 'data-student-copy="true"';
      return `
        <tr>
          <td>
            <span class="print-resource-title">${escapeHtml(resource.title)}</span>
            <span class="print-resource-note">${escapeHtml(resource.note)}</span>
          </td>
          <td>
            <input class="print-copy-input" type="number" min="1" max="200" value="${copies}" inputmode="numeric" aria-label="Copies for ${escapeHtml(resource.title)}" data-print-index="${index}" ${attr}>
          </td>
        </tr>
      `;
    }).join("");
  }

  function openPrintPlanner() {
    ensureModal();
    renderPrintPlannerRows();
    const modal = document.getElementById("printPlanner");
    modal?.classList.add("open");
    modal?.querySelector("#studentCopyCount")?.focus();
  }

  function closePrintPlanner() {
    document.getElementById("printPlanner")?.classList.remove("open");
    document.querySelector(".print-all-btn")?.focus();
  }

  function syncStudentCopies() {
    const studentCount = clampCopies(document.getElementById("studentCopyCount")?.value, 5);
    document.querySelectorAll('.print-copy-input[data-student-copy="true"]').forEach(input => {
      input.value = studentCount;
    });
  }

  function resetPrintQuantities() {
    const studentInput = document.getElementById("studentCopyCount");
    if (studentInput) studentInput.value = 5;
    renderPrintPlannerRows();
  }

  function getPrintJobs() {
    return getPrintResources().map((resource, index) => {
      const input = document.querySelector(`.print-copy-input[data-print-index="${index}"]`);
      return {
        title: resource.title,
        copies: clampCopies(input?.value, resource.defaultCopies || 1),
        url: new URL(resource.href, window.location.href).href
      };
    });
  }

  function launchPrintQueue() {
    const jobs = getPrintJobs();
    const lessonTitle = document.querySelector(".sidebar-title")?.textContent.trim() || document.title || "Lesson";
    const queueWindow = window.open("", "spokesPrintQueue", "width=1100,height=820");
    if (!queueWindow) {
      alert("Your browser blocked the print queue window. Please allow pop-ups for this lesson and try again.");
      return;
    }
    queueWindow.document.open();
    queueWindow.document.write(`<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>${escapeHtml(lessonTitle)} Print Queue</title>
          <style>
            body { margin: 0; font-family: Segoe UI, Arial, sans-serif; color: rgb(0,64,113); background: rgb(237,243,247); }
            header { padding: 16px 20px; background: rgb(0,64,113); color: white; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
            h1 { margin: 0; font-size: 20px; }
            main { display: grid; grid-template-columns: 300px 1fr; height: calc(100vh - 68px); }
            aside { padding: 16px; overflow-y: auto; border-right: 1px solid rgb(201,215,223); background: white; }
            iframe { width: 100%; height: 100%; border: 0; background: white; }
            .job { width: 100%; text-align: left; border: 1px solid rgb(201,215,223); background: rgb(237,243,247); color: rgb(0,64,113); border-radius: 8px; padding: 10px; margin-bottom: 8px; cursor: pointer; }
            .job.active { border-color: rgb(211,178,87); background: rgb(255,250,232); }
            .copies { display: inline-flex; min-width: 36px; justify-content: center; border-radius: 999px; background: rgb(0,64,113); color: white; padding: 3px 8px; margin-right: 6px; font-weight: 700; }
            .controls { display: flex; gap: 8px; flex-wrap: wrap; }
            button { min-height: 40px; border: 2px solid rgb(0,64,113); border-radius: 8px; padding: 7px 12px; font-weight: 700; cursor: pointer; }
            .primary { background: rgb(211,178,87); color: rgb(0,19,63); border-color: rgb(211,178,87); }
            .secondary { background: white; color: rgb(0,64,113); }
            .note { margin: 12px 0 16px; color: rgb(96,99,107); font-size: 13px; line-height: 1.4; }
            #currentCopies { font-weight: 700; color: rgb(211,178,87); }
          </style>
        </head>
        <body>
          <header>
            <div>
              <h1>${escapeHtml(lessonTitle)} Print Queue</h1>
              <div>Current item: <span id="currentTitle"></span> | Copies needed: <span id="currentCopies"></span></div>
            </div>
            <div class="controls">
              <button class="secondary" type="button" onclick="previousJob()">Previous</button>
              <button class="primary" type="button" onclick="printCurrent()">Print Current</button>
              <button class="secondary" type="button" onclick="nextJob()">Next</button>
            </div>
          </header>
          <main>
            <aside>
              <p class="note">For each PDF, click <strong>Print Current</strong>, then enter the shown copy count in the browser print dialog.</p>
              <div id="jobList"></div>
            </aside>
            <iframe id="pdfFrame" title="Selected PDF preview"></iframe>
          </main>
          <script>
            const jobs = ${JSON.stringify(jobs)};
            let current = 0;
            const frame = document.getElementById('pdfFrame');
            function renderJobs() {
              document.getElementById('jobList').innerHTML = jobs.map((job, index) =>
                '<button class="job ' + (index === current ? 'active' : '') + '" type="button" onclick="goToJob(' + index + ')">' +
                '<span class="copies">' + job.copies + '</span>' + job.title + '</button>'
              ).join('');
              document.getElementById('currentTitle').textContent = jobs[current].title;
              document.getElementById('currentCopies').textContent = jobs[current].copies;
              frame.src = jobs[current].url;
            }
            function goToJob(index) { current = Math.max(0, Math.min(jobs.length - 1, index)); renderJobs(); }
            function nextJob() { goToJob((current + 1) % jobs.length); }
            function previousJob() { goToJob((current - 1 + jobs.length) % jobs.length); }
            function printCurrent() {
              try {
                frame.contentWindow.focus();
                frame.contentWindow.print();
              } catch (error) {
                window.open(jobs[current].url, '_blank', 'noopener');
              }
            }
            renderJobs();
          <\/script>
        </body>
      </html>`);
    queueWindow.document.close();
    queueWindow.focus();
  }

  function insertPrintButton() {
    const resourcesSection = document.querySelector(".resources-section");
    if (!resourcesSection || resourcesSection.querySelector(".print-all-btn")) return;
    const button = document.createElement("button");
    button.className = "print-all-btn";
    button.type = "button";
    button.textContent = "Print All";
    button.addEventListener("click", openPrintPlanner);
    const title = resourcesSection.querySelector(".resources-title");
    if (title && title.nextSibling) {
      title.parentNode.insertBefore(button, title.nextSibling);
    } else {
      resourcesSection.prepend(button);
    }
  }

  function bindModalEvents() {
    document.addEventListener("input", event => {
      if (event.target?.id === "studentCopyCount") syncStudentCopies();
    });
    document.addEventListener("change", event => {
      if (event.target?.id === "studentCopyCount") syncStudentCopies();
    });
    document.addEventListener("click", event => {
      if (event.target?.classList?.contains("print-close")) closePrintPlanner();
      if (event.target?.matches("[data-print-reset]")) resetPrintQuantities();
      if (event.target?.matches("[data-print-launch]")) launchPrintQueue();
      if (event.target?.id === "printPlanner") closePrintPlanner();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && document.getElementById("printPlanner")?.classList.contains("open")) {
        closePrintPlanner();
      }
    });
  }

  function init() {
    injectStyles();
    ensureModal();
    insertPrintButton();
    bindModalEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
