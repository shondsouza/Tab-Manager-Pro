// Background script for Tab Manager Pro
// This handles extension lifecycle and storage management

chrome.runtime.onInstalled.addListener(() => {
  console.log('Tab Manager Pro installed');
  
  // Initialize default storage
  chrome.storage.local.set({
    groups: [],
    sessions: []
  });
});

// Listen for tab updates to maintain group assignments
chrome.tabs.onRemoved.addListener((tabId) => {
  // Remove tab from any groups when it's closed
  chrome.storage.local.get(['groups'], (result) => {
    const groups = result.groups || [];
    const updatedGroups = groups.map(group => ({
      ...group,
      tabs: group.tabs.filter(tab => tab.id !== tabId)
    }));
    
    chrome.storage.local.set({ groups: updatedGroups });
  });
});

// Helper function to get favicon URL
function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
  } catch {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04IDRWMTJNNCAxMkwxMiAxMiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo=';
  }
}