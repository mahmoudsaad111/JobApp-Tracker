// ---------- Config ----------
const SITE = 'https://jobapptracker.tryasp.net';
const API = `${SITE}/api`;
const LOGIN_URL = `${SITE}/auth/login`;

const $ = (id) => document.getElementById(id);
const FIELDS = ['title', 'company', 'location', 'description', 'link', 'requiredSkills'];
const DESCRIPTION_MAX = 1000; // the backend rejects longer descriptions

let jobs = [];
let authed = false;
let lastRawText = '';
let currentTab = null;

document.addEventListener('DOMContentLoaded', init);

// ---------- Start ----------
async function init() {
  $('applicationDate').value = today();
  $('jobForm').addEventListener('submit', saveLocal);
  $('clearButton').addEventListener('click', clearForm);
  $('exportButton').addEventListener('click', exportJobs);
  $('saveRemoteButton').addEventListener('click', saveRemote);
  $('loginButton').addEventListener('click', openLogin);
  $('aiButton').addEventListener('click', parseWithAi);
  $('jobForm').addEventListener('input', debounce(saveDraft, 300));

  const stored = await chrome.storage.local.get(['jobs', 'draft']);
  jobs = stored.jobs || [];
  renderQueue();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // Run both at the same time so neither waits for the other.
  await Promise.all([checkAuth(), loadForm(tab, stored.draft)]);
}

// If the user already started filling this exact page (for example before going
// to log in), restore it. Otherwise read the page once.
async function loadForm(tab, draft) {
  // The draft stores the cleaned link, so compare with the cleaned tab URL too.
  if (draft && tab?.url && draft.link === cleanLink(tab.url)) {
    fill(draft);
    $('pageHint').textContent = 'Restored your draft for this page';
    return;
  }
  await capture(tab);
}

// ---------- Read the page (once, on demand) ----------
async function capture(tab) {
  if (!tab?.id || !/^https?:\/\//i.test(tab.url || '')) {
    $('pageHint').textContent = 'Open a job posting tab, then click the extension again';
    return;
  }
  $('pageHint').textContent = `Reading ${truncate(tab.title || 'this page', 40)}…`;
  try {
    let result = await readPage(tab.id);
    // LinkedIn can render the description a moment late: retry a few times.
    for (let i = 0; i < 3 && !result?.description; i++) {
      await sleep(700);
      result = await readPage(tab.id);
    }
    lastRawText = result?.rawText || '';
    fill({ ...result, link: cleanLink(tab.url) });
    $('pageHint').textContent = result?.description
      ? 'Review the details, then save'
      : 'Could not find the job description. Fill it in manually.';
    saveDraft();
  } catch (error) {
    $('pageHint').textContent = `Could not read this page: ${error?.message || 'access denied'}`;
  }
}

async function readPage(tabId) {
  const results = await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  return results?.[0]?.result || null;
}

// ---------- Talking to your API (uses your JobTracker login cookie) ----------
async function api(path, method = 'GET', body) {
  const response = await fetch(`${API}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    /* empty or non-JSON body */
  }
  return { ok: response.ok, status: response.status, data };
}

async function checkAuth() {
  try {
    const res = await api('/auth/Me');
    authed = res.ok;
    $('userEmail').textContent = res.ok ? res.data?.data?.email || 'your account' : '';
  } catch {
    authed = false;
  }
  renderAuth();
}

function renderAuth() {
  $('authSignedOut').classList.toggle('hidden', authed);
  $('authSignedIn').classList.toggle('hidden', !authed);
  $('aiButton').classList.toggle('hidden', !authed);
  $('connectionDot').classList.toggle('offline', !authed);
  $('connectionDot').title = authed ? 'Signed in' : 'Not signed in';
}

async function openLogin() {
  await saveDraft(); // the popup closes when the new tab opens; keep the form
  await chrome.tabs.create({ url: LOGIN_URL });
  window.close();
}

// ---------- Save to your account ----------
async function saveRemote() {
  const item = buildJob();
  if (!item.title || !item.companyName) {
    toast('Title and company are required');
    return;
  }
  if (!authed) await checkAuth(); // maybe they just logged in
  if (!authed) return openLogin();
  if (!confirmDuplicate(item)) return;

  $('saveRemoteButton').disabled = true;
  try {
    const res = await postJob(item);

    if (res.status === 401 || res.status === 403) {
      authed = false;
      renderAuth();
      return openLogin();
    }
    if (!res.ok) {
      $('syncStatus').textContent = describeError(res);
      console.error('Save failed: ' + JSON.stringify(res));
      return;
    }

    item.synced = true;
    jobs.unshift(item);
    await chrome.storage.local.set({ jobs });
    await chrome.storage.local.remove('draft');
    renderQueue();
    clearForm();
    $('syncStatus').textContent = '';
    toast('Saved to your JobTracker account');
  } catch {
    $('syncStatus').textContent = 'Could not reach JobTracker. Check your connection.';
  } finally {
    $('saveRemoteButton').disabled = false;
  }
}

// Sends one job to the user's account (shared by "Save to applications" and the shortlist button).
function postJob(item) {
  return api('/JobApp', 'POST', {
    CompanyName: item.companyName || item.company,
    Title: item.title,
    ApplicationDate: item.applicationDate,
    Type: item.type || item.jobType,
    Location: item.location,
    Link: cleanLink(item.link),
    Status: item.status,
    Description: String(item.description || '').slice(0, DESCRIPTION_MAX),
    WorkMode: item.workMode,
    RequiredSkills: item.requiredSkills,
  });
}

// "Save to account" on a job that is only in the local shortlist.
async function syncLocalJob(e) {
  const button = e.currentTarget;
  const job = jobs.find((j) => j.id === button.dataset.sync);
  if (!job || job.synced) return;

  if (!authed) await checkAuth();
  if (!authed) return openLogin();

  button.disabled = true;
  button.textContent = 'Saving…';
  try {
    const res = await postJob(job);
    if (res.status === 401 || res.status === 403) {
      authed = false;
      renderAuth();
      return openLogin();
    }
    if (!res.ok) {
      $('syncStatus').textContent = describeError(res);
      return;
    }
    job.synced = true;
    await chrome.storage.local.set({ jobs });
    $('syncStatus').textContent = '';
    toast('Saved to your JobTracker account');
  } catch {
    $('syncStatus').textContent = 'Could not reach JobTracker. Check your connection.';
  } finally {
    renderQueue(); // refreshes the button / status
  }
}

// Turns any API error shape into one readable line.
// Handles our { message, errors: [] } and ASP.NET's ProblemDetails { title, errors: { Field: [] } }.
function describeError(res) {
  // The API's error middleware writes PascalCase keys (Message, Errors); MVC writes camelCase.
  const d = res.data && Object.fromEntries(Object.entries(res.data).map(([k, v]) => [k.toLowerCase(), v]));
  const parts = [];
  if (d?.message) parts.push(d.message);
  if (Array.isArray(d?.errors)) parts.push(...d.errors);
  else if (d?.errors && typeof d.errors === 'object') parts.push(...Object.values(d.errors).flat());
  if (!parts.length && d?.title) parts.push(d.title);
  if (!parts.length) parts.push('No details from the server');
  return `Could not save (HTTP ${res.status}): ${parts.join(' ')}`;
}

// ---------- Optional: improve the fields with the AI parser ----------
async function parseWithAi() {
  if (!lastRawText) {
    toast('Nothing to parse on this page');
    return;
  }
  $('aiButton').disabled = true;
  $('pageHint').textContent = 'Asking JobTracker AI…';
  try {
    const res = await api('/job-postings/parse', 'POST', { rawText: lastRawText.slice(0, 9500) });
    if (res.status === 401) {
      authed = false;
      renderAuth();
      return openLogin();
    }
    if (!res.ok) throw new Error('parse failed');
    const parsed = res.data?.data || {};
    const skills = parsed.requiredSkills?.length ? parsed.requiredSkills : parsed.skills;
    fill({
      title: cleanTitle(parsed.jobTitle || parsed.title),
      company: parsed.companyName,
      location: parsed.location,
      jobType: normalizeJobType(parsed.jobType),
      description: parsed.description,
      requiredSkills: Array.isArray(skills) ? skills : undefined,
    });
    $('pageHint').textContent = 'Filled by AI. Review before saving.';
    saveDraft();
  } catch {
    $('pageHint').textContent = 'AI parsing is unavailable right now. Edit the fields manually.';
  } finally {
    $('aiButton').disabled = false;
  }
}

// ---------- Local shortlist ----------
async function saveLocal(event) {
  event.preventDefault();
  const item = buildJob();
  if (!confirmDuplicate(item)) return;
  jobs.unshift(item);
  await chrome.storage.local.set({ jobs });
  await chrome.storage.local.remove('draft');
  renderQueue();
  clearForm();
  toast('Job saved to your shortlist');
}

// Warns when the same posting link is already in the shortlist.
function confirmDuplicate(item) {
  if (!item.link) return true;
  const dup = jobs.some((j) => j.link && cleanLink(j.link) === item.link);
  return !dup || confirm('This job link is already in your shortlist. Save it again?');
}

function buildJob() {
  const company = $('company').value.trim();
  const type = $('jobType').value;
  return {
    id: crypto.randomUUID(),
    companyName: company,
    company,
    title: $('title').value.trim(),
    applicationDate: $('applicationDate').value,
    type,
    jobType: type,
    location: $('location').value.trim(),
    link: cleanLink($('link').value.trim() || currentTab?.url || ''),
    status: $('status').value,
    description: $('description').value.trim().slice(0, DESCRIPTION_MAX),
    workMode: $('workMode').value,
    // backend rules: at most 30 skills, each 50 characters or fewer
    requiredSkills: $('requiredSkills').value.split(',').map((s) => s.trim().slice(0, 50)).filter(Boolean).slice(0, 30),
    createdAt: new Date().toISOString(),
    synced: false,
  };
}

// The backend rejects links over 500 characters. LinkedIn URLs are full of tracking
// parameters, so shorten them to the clean version that opens the same job.
const LINK_MAX = 500;
function cleanLink(raw) {
  try {
    const url = new URL(raw);
    if (/linkedin\.com$/i.test(url.hostname)) {
      const id = url.pathname.match(/\/jobs\/view\/(?:[^/]*-)?(\d+)/)?.[1] || url.searchParams.get('currentJobId');
      if (id) return `https://www.linkedin.com/jobs/view/${id}/`;
    }
    if (raw.length <= LINK_MAX) return raw;
    const short = url.origin + url.pathname; // drop ?query and #hash
    return short.slice(0, LINK_MAX);
  } catch {
    return String(raw || '').slice(0, LINK_MAX);
  }
}

// ---------- Form helpers ----------
function fill(data = {}) {
  ['title', 'company', 'location', 'description', 'link'].forEach((k) => {
    if (data[k]) $(k).value = k === 'description' ? String(data[k]).slice(0, DESCRIPTION_MAX) : data[k];
  });
  if (data.workMode) $('workMode').value = data.workMode;
  if (data.jobType) $('jobType').value = data.jobType;
  if (data.status) $('status').value = data.status;
  if (data.applicationDate) $('applicationDate').value = String(data.applicationDate).slice(0, 10);
  if (Array.isArray(data.requiredSkills)) $('requiredSkills').value = data.requiredSkills.join(', ');
  else if (typeof data.requiredSkills === 'string') $('requiredSkills').value = data.requiredSkills;
}

function clearForm() {
  FIELDS.forEach((k) => ($(k).value = ''));
  $('applicationDate').value = today();
  $('status').value = 'Draft';
  $('workMode').value = 'Remote';
  $('jobType').value = 'FullTime';
  chrome.storage.local.remove('draft');
}

async function saveDraft() {
  const draft = {
    title: $('title').value,
    company: $('company').value,
    location: $('location').value,
    description: $('description').value,
    link: $('link').value,
    requiredSkills: $('requiredSkills').value,
    applicationDate: $('applicationDate').value,
    status: $('status').value,
    workMode: $('workMode').value,
    jobType: $('jobType').value,
  };
  await chrome.storage.local.set({ draft });
}

// ---------- Shortlist list ----------
function renderQueue() {
  $('count').textContent = jobs.length;
  $('emptyState').style.display = jobs.length ? 'none' : 'block';
  $('queue').innerHTML = jobs
    .map(
      (job) => `<article class="job-item card">
        <div class="job-head">
          <div class="company-mark">${escapeHtml((job.company || job.companyName || '?')[0].toUpperCase())}</div>
          <div><div class="job-title">${escapeHtml(job.title)}</div><div class="job-company">${escapeHtml(job.company || job.companyName)}</div></div>
        </div>
        <div class="job-meta"><span class="pill">${escapeHtml(job.location)}</span><span class="pill">${escapeHtml(job.workMode)}</span><span class="pill">${escapeHtml(pretty(job.jobType || job.type))}</span></div>
        <div class="job-actions">
          <span class="status ${job.synced ? 'synced' : ''}">${job.synced ? '● In your account' : '○ Local only'}</span>
          <div>${job.synced ? '' : `<button class="link-button" data-sync="${job.id}">Save to account</button> `}<button class="link-button" data-open="${job.id}">Open</button> <button class="link-button" data-delete="${job.id}">Remove</button></div>
        </div>
      </article>`
    )
    .join('');
  document.querySelectorAll('[data-delete]').forEach((b) => (b.onclick = removeJob));
  document.querySelectorAll('[data-open]').forEach((b) => (b.onclick = openJob));
  document.querySelectorAll('[data-sync]').forEach((b) => (b.onclick = syncLocalJob));
}

async function removeJob(e) {
  jobs = jobs.filter((j) => j.id !== e.currentTarget.dataset.delete);
  await chrome.storage.local.set({ jobs });
  renderQueue();
}

async function openJob(e) {
  const job = jobs.find((j) => j.id === e.currentTarget.dataset.open);
  if (job?.link && /^https?:\/\//i.test(job.link)) await chrome.tabs.create({ url: job.link });
}

function exportJobs() {
  const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'jobtracker-shortlist.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Small utilities ----------
const today = () => new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
function cleanTitle(value) {
  return String(value || '').replace(/\s*[|\-–]\s*LinkedIn\s*$/i, '').split(/\s+\|\s+/)[0].trim();
}
function normalizeJobType(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('intern')) return 'Internship';
  if (text.includes('part')) return 'PartTime';
  if (text.includes('contract')) return 'Contract';
  if (text.includes('freelance')) return 'Freelance';
  return 'FullTime';
}
const pretty = (value) => String(value || '').replace(/([A-Z])/g, ' $1').trim();
const truncate = (value, n) => (value.length > n ? value.slice(0, n - 1) + '…' : value);
function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}
function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}
