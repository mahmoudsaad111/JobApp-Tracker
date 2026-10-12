// The popup does all the work. The service worker only keeps the shortlist
// storage ready after install / update.
chrome.runtime.onInstalled.addListener(async () => {
  const { jobs } = await chrome.storage.local.get('jobs');
  if (!jobs) await chrome.storage.local.set({ jobs: [] });
});
