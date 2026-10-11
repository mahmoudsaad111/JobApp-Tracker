const $ = (id) => document.getElementById(id);
const defaults = { apiUrl: 'https://jobapptracker.tryasp.net/api' };
let jobs = [];
let settings = { ...defaults };
let currentTabId = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const stored = await chrome.storage.local.get(['jobs', 'settings', 'pendingApplication']);
  jobs = stored.jobs || [];
  settings = { ...defaults, ...(stored.settings || {}), apiUrl: defaults.apiUrl };
  $('applicationDate').value = new Date().toISOString().slice(0, 10);
  if (stored.pendingApplication) fill({ ...stored.pendingApplication, company: stored.pendingApplication.companyName, jobType: stored.pendingApplication.type });
  renderQueue();

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (tab?.id) {
    currentTabId = tab.id;
    $('pageHint').textContent = tab.title ? `Ready to capture from ${truncate(tab.title, 40)}` : 'Ready to capture this tab';
    try {
      if (!isReadableUrl(tab.url)) throw new Error('browser pages such as chrome:// and extension pages cannot be read');
      resetCapturedFields();
      const result = await getJobData(tab.id);
      fill({ ...result, link: tab.url });
    } catch (error) { $('pageHint').textContent = `Could not read this tab: ${error?.message || 'browser access was denied'}`; }
  }
  $('jobForm').addEventListener('submit', saveJob);
  $('clearButton').addEventListener('click', clearForm);
  $('exportButton').addEventListener('click', exportJobs);
  $('saveRemoteButton').addEventListener('click', saveRemote);
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => { if (tabId === currentTabId && (changeInfo.status === 'complete' || changeInfo.url)) refreshForTab(tabId); });
  chrome.runtime.onMessage.addListener(message => { if (message.type === 'JOB_PAGE_CHANGED' && currentTabId) refreshForTab(currentTabId); });
}

async function refreshForTab(tabId) {
  if (!tabId || tabId !== currentTabId) return;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!isReadableUrl(tab.url)) throw new Error('browser pages such as chrome:// and extension pages cannot be read');
    $('pageHint').textContent = tab.title ? `Reading ${truncate(tab.title, 40)}` : 'Reading this tab…';
    resetCapturedFields();
    let result = await getJobData(tabId);
    if (result?.rawText && !/about the job|job description|requirements/i.test(result.rawText)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      result = await getJobData(tabId);
    }
    fill({ ...result, link: tab.url });
    const connected = (await chrome.storage.local.get('connectedUser')).connectedUser;
    if (result?.rawText && result.description && connected) await parseWithBackend(result.rawText);
    else if (result?.description) $('pageHint').textContent = 'Review the captured details before saving';
    else $('pageHint').textContent = 'LinkedIn has not loaded the job description yet; wait or open the job details.';
  } catch (error) { $('pageHint').textContent = `Could not read this tab: ${error?.message || 'browser access was denied'}`; }
}

function fill(data = {}) {
  ['title', 'company', 'location', 'description', 'link'].forEach(k => { if (data[k]) $(k).value = data[k]; });
  if (data.workMode) $('workMode').value = data.workMode;
  if (data.jobType) $('jobType').value = data.jobType;
  if (data.status) $('status').value = data.status;
  if (data.applicationDate) $('applicationDate').value = data.applicationDate.slice(0, 10);
  if (Array.isArray(data.requiredSkills)) $('requiredSkills').value = data.requiredSkills.join(', ');
}
function resetCapturedFields() { ['title', 'company', 'location', 'description', 'link', 'requiredSkills'].forEach(k => $(k).value = ''); }

async function parseWithBackend(rawText) {
  $('pageHint').textContent = 'Parsing this posting with JobTracker…';
  try {
    const result = await runAppRequest('/api/job-postings/parse', 'POST', { rawText: rawText.slice(0, 20000) });
    if (!result.ok) throw new Error('Parser request failed');
    const payload = JSON.parse(result.text);
    const parsed = payload.data || payload;
    const parsedSkills = Array.isArray(parsed.requiredSkills) && parsed.requiredSkills.length ? parsed.requiredSkills : (Array.isArray(parsed.skills) && parsed.skills.length ? parsed.skills : $('requiredSkills').value.split(',').map(s => s.trim()).filter(Boolean));
    fill({ title: cleanTitle(parsed.jobTitle || parsed.title), company: parsed.companyName, location: parsed.location, jobType: normalizeJobType(parsed.jobType), description: parsed.description || $('description').value, requiredSkills: parsedSkills });
    $('pageHint').textContent = 'Parsed by JobTracker. Review before saving.';
  } catch { $('pageHint').textContent = 'Server parsing was unavailable; review the extracted details manually'; }
}

async function getAppTab() { const stored = await chrome.storage.local.get('appTabId'); if (stored.appTabId) { try { const tab = await chrome.tabs.get(stored.appTabId); if (tab.url?.startsWith('https://jobapptracker.tryasp.net/')) return tab; } catch {} } const tabs = await chrome.tabs.query({ url: 'https://jobapptracker.tryasp.net/*' }); if (!tabs.length) throw new Error('Open JobTracker login first'); await chrome.storage.local.set({ appTabId: tabs[0].id }); return tabs[0]; }
async function runAppRequest(path, method, body) { const tab = await getAppTab(); const results = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: async (requestPath, requestMethod, requestBody) => { const response = await fetch(requestPath, { method: requestMethod, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: requestBody == null ? undefined : JSON.stringify(requestBody) }); return { ok: response.ok, status: response.status, text: await response.text() }; }, args: [path, method, body] }); return results[0]?.result || { ok: false, status: 0, text: '' }; }
async function getJobData(tabId) { try { return await chrome.tabs.sendMessage(tabId, { type: 'GET_JOB_DATA' }); } catch (firstError) { try { await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }); return await chrome.tabs.sendMessage(tabId, { type: 'GET_JOB_DATA' }); } catch (secondError) { throw new Error(secondError?.message || firstError?.message || 'content script could not be injected'); } } }
function isReadableUrl(url = '') { return /^https?:\/\//i.test(url); }

async function buildJob() { const tabs = await chrome.tabs.query({ active: true, currentWindow: true }); const item = { id: crypto.randomUUID(), companyName: $('company').value.trim(), title: $('title').value.trim(), applicationDate: $('applicationDate').value, type: $('jobType').value, location: $('location').value.trim(), link: $('link').value.trim() || tabs[0]?.url || '', status: $('status').value, description: $('description').value.trim(), workMode: $('workMode').value, requiredSkills: $('requiredSkills').value.split(',').map(s => s.trim()).filter(Boolean), createdAt: new Date().toISOString(), synced: false }; item.company = item.companyName; item.jobType = item.type; return item; }
async function saveJob(event) { event.preventDefault(); const item = await buildJob(); jobs.unshift(item); await persist(); renderQueue(); clearForm(); toast('Job saved to your shortlist'); }
async function saveRemote() { const item = await buildJob(); await chrome.storage.local.set({ pendingApplication: item }); try { const response = await runAppRequest('/api/JobApp', 'POST', { CompanyName: item.companyName, Title: item.title, ApplicationDate: item.applicationDate, Type: item.type, Location: item.location, Link: item.link, Status: item.status, Description: item.description, WorkMode: item.workMode, RequiredSkills: item.requiredSkills }); if (!response.ok) { if (response.status === 401 || response.status === 403) { await openLoginForPendingJob(); return; } $('syncStatus').textContent = 'The application could not be saved. Please try again.'; return; } item.synced = true; await chrome.storage.local.remove('pendingApplication'); jobs.unshift(item); await persist(); renderQueue(); clearForm(); toast('Application saved to your JobTracker profile'); } catch { await openLoginForPendingJob(); } }
async function openLoginForPendingJob() { const tab = await chrome.tabs.create({ url: 'https://jobapptracker.tryasp.net/auth/login', active: true }); await chrome.storage.local.set({ appTabId: tab.id }); $('syncStatus').textContent = 'Sign in on the opened JobTracker page, return here, then click Save to applications again.'; }
function clearForm() { ['title', 'company', 'location', 'link', 'description', 'requiredSkills'].forEach(k => $(k).value = ''); $('applicationDate').value = new Date().toISOString().slice(0, 10); $('status').value = 'Draft'; $('workMode').value = 'Remote'; $('jobType').value = 'FullTime'; }
async function persist() { await chrome.storage.local.set({ jobs }); }

function renderQueue() { $('count').textContent = jobs.length; $('emptyState').style.display = jobs.length ? 'none' : 'block'; $('queue').innerHTML = jobs.map(job => `<article class="job-item card"><div class="job-head"><div class="company-mark">${escapeHtml((job.company || job.companyName || '?')[0].toUpperCase())}</div><div><div class="job-title">${escapeHtml(job.title)}</div><div class="job-company">${escapeHtml(job.company || job.companyName)}</div></div></div><div class="job-meta"><span class="pill">${escapeHtml(job.location)}</span><span class="pill">${escapeHtml(job.workMode)}</span><span class="pill">${escapeHtml(pretty(job.jobType || job.type))}</span></div><div class="job-actions"><span class="status ${job.synced ? 'synced' : ''}">${job.synced ? '● Synced' : '○ Local only'}</span><div><button class="link-button" data-open="${job.id}">Open</button> <button class="link-button" data-delete="${job.id}">Remove</button></div></div></article>`).join(''); document.querySelectorAll('[data-delete]').forEach(b => b.onclick = removeJob); document.querySelectorAll('[data-open]').forEach(b => b.onclick = openJob); }
async function removeJob(e) { jobs = jobs.filter(j => j.id !== e.currentTarget.dataset.delete); await persist(); renderQueue(); }
async function openJob(e) { const job = jobs.find(j => j.id === e.currentTarget.dataset.open); if (job?.link) await chrome.tabs.create({ url: job.link }); }
function exportJobs() { const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'jobtracker-shortlist.json'; a.click(); URL.revokeObjectURL(url); }
function cleanTitle(value) { return String(value || '').replace(/\s*[|\-–]\s*LinkedIn\s*$/i, '').split(/\s+\|\s+/)[0].trim(); }
function normalizeJobType(value) { const text = String(value || '').toLowerCase(); if (text.includes('intern')) return 'Internship'; if (text.includes('part')) return 'PartTime'; if (text.includes('contract')) return 'Contract'; if (text.includes('freelance')) return 'Freelance'; if (text.includes('temporary')) return 'Temporary'; return 'FullTime'; }
function pretty(value) { return String(value || '').replace(/([A-Z])/g, ' $1').trim(); } function truncate(value, n) { return value.length > n ? value.slice(0, n - 1) + '…' : value; } function escapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); } function toast(text) { const el = $('toast'); el.textContent = text; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2200); }
