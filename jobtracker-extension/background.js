if (chrome.sidePanel) chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  chrome.storage.local.get('settings').then(({ settings }) => { if (!settings) chrome.storage.local.set({ settings: { apiUrl: 'https://jobapptracker.tryasp.net/api' } }); });
});
