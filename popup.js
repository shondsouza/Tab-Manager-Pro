// Tab Manager Pro - Main popup logic

class TabManager {
  constructor() {
    this.groups = [];
    this.allTabs = [];
    this.selectedColor = '#3b82f6';
    this.init();
  }

  async init() {
    await this.loadData();
    await this.loadTabs();
    this.setupEventListeners();
    this.render();
  }

  async loadData() {
    const result = await chrome.storage.local.get(['groups']);
    this.groups = result.groups || [];
  }

  async saveData() {
    await chrome.storage.local.set({ groups: this.groups });
  }

  async loadTabs() {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    this.allTabs = tabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      url: tab.url,
      favicon: tab.favIconUrl || this.getFaviconUrl(tab.url),
      active: tab.active
    }));
  }

  getFaviconUrl(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04IDRWMTJNNCAxMkwxMiAxMiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo=';
    }
  }

  setupEventListeners() {
    // Create group button
    document.getElementById('create-group-btn').addEventListener('click', () => {
      this.showCreateGroupModal();
    });

    // Save session button
    document.getElementById('save-session-btn').addEventListener('click', () => {
      this.saveSession();
    });

    // Modal handlers
    document.getElementById('cancel-group-btn').addEventListener('click', () => {
      this.hideCreateGroupModal();
    });

    document.getElementById('confirm-group-btn').addEventListener('click', () => {
      this.createGroup();
    });

    // Color picker
    document.querySelectorAll('.color-option').forEach(option => {
      option.addEventListener('click', (e) => {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        e.target.classList.add('selected');
        this.selectedColor = e.target.dataset.color;
      });
    });

    // Close modal when clicking outside
    document.getElementById('create-group-modal').addEventListener('click', (e) => {
      if (e.target.id === 'create-group-modal') {
        this.hideCreateGroupModal();
      }
    });
  }

  getUngroupedTabs() {
    const groupedTabIds = new Set();
    this.groups.forEach(group => {
      group.tabs.forEach(tab => groupedTabIds.add(tab.id));
    });
    
    return this.allTabs.filter(tab => !groupedTabIds.has(tab.id));
  }

  render() {
    this.renderUngroupedTabs();
    this.renderGroups();
  }

  renderUngroupedTabs() {
    const ungroupedTabs = this.getUngroupedTabs();
    const container = document.getElementById('ungrouped-tabs');
    const countElement = document.getElementById('ungrouped-count');
    
    countElement.textContent = ungroupedTabs.length;
    
    container.innerHTML = '';
    ungroupedTabs.forEach(tab => {
      const tabElement = this.createTabElement(tab, null);
      container.appendChild(tabElement);
    });
  }

  renderGroups() {
    const container = document.getElementById('groups-container');
    container.innerHTML = '';
    
    this.groups.forEach((group, groupIndex) => {
      const groupElement = this.createGroupElement(group, groupIndex);
      container.appendChild(groupElement);
    });
  }

  createTabElement(tab, groupIndex) {
    const tabDiv = document.createElement('div');
    tabDiv.className = 'tab-item';
    tabDiv.innerHTML = `
      <img src="${tab.favicon}" alt="" class="tab-favicon" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04IDRWMTJNNCAxMkwxMiAxMiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo='">
      <span class="tab-title">${tab.title}</span>
      <button class="tab-close" data-tab-id="${tab.id}">×</button>
    `;

    // Click to switch to tab
    tabDiv.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) {
        chrome.tabs.update(tab.id, { active: true });
        window.close();
      }
    });

    // Close tab
    tabDiv.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(tab.id);
    });

    return tabDiv;
  }

  createGroupElement(group, groupIndex) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'group';
    
    const validTabs = group.tabs.filter(groupTab => 
      this.allTabs.some(tab => tab.id === groupTab.id)
    );
    
    groupDiv.innerHTML = `
      <div class="group-header">
        <div class="group-color" style="background: ${group.color}"></div>
        <span class="group-name">${group.name}</span>
        <span class="group-count">${validTabs.length}</span>
        <div class="group-actions">
          <button class="group-action" data-action="toggle" title="Toggle collapse">↕️</button>
          <button class="group-action" data-action="close-all" title="Close all tabs">×</button>
          <button class="group-action" data-action="delete" title="Delete group">🗑️</button>
        </div>
      </div>
      <div class="group-tabs" id="group-tabs-${groupIndex}">
        ${validTabs.map(tab => this.createTabElement(tab, groupIndex).outerHTML).join('')}
      </div>
    `;

    // Group action handlers
    groupDiv.querySelectorAll('.group-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        switch (action) {
          case 'toggle':
            this.toggleGroup(groupIndex);
            break;
          case 'close-all':
            this.closeGroupTabs(groupIndex);
            break;
          case 'delete':
            this.deleteGroup(groupIndex);
            break;
        }
      });
    });

    return groupDiv;
  }

  showCreateGroupModal() {
    document.getElementById('create-group-modal').classList.remove('hidden');
    document.getElementById('group-name-input').focus();
    // Select first color by default
    document.querySelector('.color-option').classList.add('selected');
  }

  hideCreateGroupModal() {
    document.getElementById('create-group-modal').classList.add('hidden');
    document.getElementById('group-name-input').value = '';
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
  }

  async createGroup() {
    const name = document.getElementById('group-name-input').value.trim();
    if (!name) return;

    const newGroup = {
      id: Date.now(),
      name,
      color: this.selectedColor,
      tabs: [],
      collapsed: false
    };

    this.groups.push(newGroup);
    await this.saveData();
    this.render();
    this.hideCreateGroupModal();
  }

  async closeTab(tabId) {
    try {
      await chrome.tabs.remove(tabId);
      // Remove from groups
      this.groups.forEach(group => {
        group.tabs = group.tabs.filter(tab => tab.id !== tabId);
      });
      await this.saveData();
      await this.loadTabs();
      this.render();
    } catch (error) {
      console.error('Error closing tab:', error);
    }
  }

  async toggleGroup(groupIndex) {
    this.groups[groupIndex].collapsed = !this.groups[groupIndex].collapsed;
    const tabsContainer = document.getElementById(`group-tabs-${groupIndex}`);
    tabsContainer.classList.toggle('collapsed');
    await this.saveData();
  }

  async closeGroupTabs(groupIndex) {
    const group = this.groups[groupIndex];
    const tabIds = group.tabs.map(tab => tab.id);
    
    try {
      await chrome.tabs.remove(tabIds);
      group.tabs = [];
      await this.saveData();
      await this.loadTabs();
      this.render();
    } catch (error) {
      console.error('Error closing group tabs:', error);
    }
  }

  async deleteGroup(groupIndex) {
    if (confirm('Are you sure you want to delete this group?')) {
      this.groups.splice(groupIndex, 1);
      await this.saveData();
      this.render();
    }
  }

  async saveSession() {
    const session = {
      id: Date.now(),
      name: `Session ${new Date().toLocaleString()}`,
      tabs: this.allTabs.map(tab => ({
        title: tab.title,
        url: tab.url
      })),
      groups: this.groups
    };

    const result = await chrome.storage.local.get(['sessions']);
    const sessions = result.sessions || [];
    sessions.push(session);
    
    await chrome.storage.local.set({ sessions });
    alert('Session saved successfully!');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TabManager();
});