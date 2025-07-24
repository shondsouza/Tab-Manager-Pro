// Tab Manager Pro - Enhanced with Drag & Drop

class TabManager {
  constructor() {
    this.groups = [];
    this.sessions = [];
    this.allTabs = [];
    this.selectedTabs = new Set();
    this.selectedColor = '#3b82f6';
    this.searchQuery = '';
    this.draggedTab = null;
    this.draggedElement = null;
    this.init();
  }

  async init() {
    await this.loadData();
    await this.loadTabs();
    this.setupEventListeners();
    this.setupDragAndDrop();
    this.render();
    this.updateStats();
  }

  async loadData() {
    const result = await chrome.storage.local.get(['groups', 'sessions']);
    this.groups = result.groups || [];
    this.sessions = result.sessions || [];
  }

  async saveData() {
    await chrome.storage.local.set({ 
      groups: this.groups,
      sessions: this.sessions 
    });
  }

  async loadTabs() {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    this.allTabs = tabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      url: tab.url,
      favicon: tab.favIconUrl || this.getFaviconUrl(tab.url),
      active: tab.active,
      domain: this.getDomain(tab.url)
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

  getDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-tabs');
    const clearSearchBtn = document.getElementById('clear-search');
    
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      clearSearchBtn.classList.toggle('hidden', !this.searchQuery);
      this.render();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      this.searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      this.render();
    });

    // Header buttons
    document.getElementById('create-group-btn').addEventListener('click', () => {
      this.showCreateGroupModal();
    });

    document.getElementById('save-session-btn').addEventListener('click', () => {
      this.saveSession();
    });

    document.getElementById('restore-session-btn').addEventListener('click', () => {
      this.showRestoreSessionModal();
    });

    document.getElementById('close-duplicates-btn').addEventListener('click', () => {
      this.closeDuplicateTabs();
    });

    // Quick actions
    document.getElementById('select-all-tabs').addEventListener('click', () => {
      this.selectAllTabs();
    });

    document.getElementById('close-selected-tabs').addEventListener('click', () => {
      this.closeSelectedTabs();
    });

    document.getElementById('move-to-group').addEventListener('click', () => {
      this.showMoveToGroupModal();
    });

    document.getElementById('sort-tabs').addEventListener('click', () => {
      this.sortTabs();
    });

    document.getElementById('close-all-ungrouped').addEventListener('click', () => {
      this.closeAllUngrouped();
    });

    // Modal handlers
    this.setupModalHandlers();

    // Section collapse handlers
    document.querySelectorAll('.section-header.collapsible').forEach(header => {
      header.addEventListener('click', (e) => {
        if (!e.target.closest('.section-actions')) {
          this.toggleSection(e.currentTarget.dataset.section);
        }
      });
    });
  }

  setupDragAndDrop() {
    // Enable drag and drop for all tab lists
    document.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('tab-item')) {
        this.handleDragStart(e);
      }
    });

    document.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('tab-item')) {
        this.handleDragEnd(e);
      }
    });

    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.handleDragOver(e);
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      this.handleDrop(e);
    });

    document.addEventListener('dragenter', (e) => {
      this.handleDragEnter(e);
    });

    document.addEventListener('dragleave', (e) => {
      this.handleDragLeave(e);
    });
  }

  handleDragStart(e) {
    const tabItem = e.target.closest('.tab-item');
    const tabId = parseInt(tabItem.querySelector('.tab-checkbox').dataset.tabId);
    
    this.draggedTab = this.allTabs.find(tab => tab.id === tabId);
    this.draggedElement = tabItem;
    
    tabItem.classList.add('dragging');
    
    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabId.toString());
    
    // Create drag image
    const dragImage = tabItem.cloneNode(true);
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);

    // Show all drop zones
    this.showDropZones();
  }

  handleDragEnd(e) {
    const tabItem = e.target.closest('.tab-item');
    tabItem.classList.remove('dragging');
    
    this.draggedTab = null;
    this.draggedElement = null;
    
    // Hide all drop zones and placeholders
    this.hideDropZones();
    this.clearDragPlaceholders();
  }

  handleDragOver(e) {
    e.preventDefault();
    
    const tabList = e.target.closest('.tab-list');
    const tabItem = e.target.closest('.tab-item');
    const group = e.target.closest('.group');
    
    if (tabList && !tabItem) {
      // Dragging over empty space in tab list
      this.showDragPlaceholder(tabList, null);
    } else if (tabItem && tabItem !== this.draggedElement) {
      // Dragging over another tab item
      const rect = tabItem.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const insertBefore = e.clientY < midY;
      
      this.showDragPlaceholder(tabList, insertBefore ? tabItem : tabItem.nextElementSibling);
    }
  }

  handleDragEnter(e) {
    const tabList = e.target.closest('.tab-list');
    const group = e.target.closest('.group');
    
    if (tabList) {
      tabList.classList.add('drag-over');
    }
    
    if (group) {
      group.classList.add('drag-over');
    }
  }

  handleDragLeave(e) {
    const tabList = e.target.closest('.tab-list');
    const group = e.target.closest('.group');
    
    // Only remove drag-over if we're actually leaving the element
    if (tabList && !tabList.contains(e.relatedTarget)) {
      tabList.classList.remove('drag-over');
    }
    
    if (group && !group.contains(e.relatedTarget)) {
      group.classList.remove('drag-over');
    }
  }

  handleDrop(e) {
    e.preventDefault();
    
    const tabList = e.target.closest('.tab-list');
    const group = e.target.closest('.group');
    
    if (!this.draggedTab || !tabList) return;
    
    // Determine target group
    let targetGroupIndex = null;
    if (tabList.dataset.group === 'ungrouped') {
      targetGroupIndex = 'ungrouped';
    } else if (group) {
      const groupHeader = group.querySelector('.group-header');
      targetGroupIndex = parseInt(groupHeader.dataset.group);
    }
    
    // Move the tab
    this.moveTabToGroup(this.draggedTab.id, targetGroupIndex);
    
    // Clean up
    this.hideDropZones();
    this.clearDragPlaceholders();
  }

  showDropZones() {
    document.querySelectorAll('.drop-zone').forEach(zone => {
      zone.classList.remove('hidden');
    });
  }

  hideDropZones() {
    document.querySelectorAll('.drop-zone').forEach(zone => {
      zone.classList.add('hidden');
    });
    
    document.querySelectorAll('.tab-list').forEach(list => {
      list.classList.remove('drag-over');
    });
    
    document.querySelectorAll('.group').forEach(group => {
      group.classList.remove('drag-over');
    });
  }

  showDragPlaceholder(tabList, beforeElement) {
    this.clearDragPlaceholders();
    
    const placeholder = document.createElement('div');
    placeholder.className = 'drag-placeholder active';
    
    if (beforeElement) {
      tabList.insertBefore(placeholder, beforeElement);
    } else {
      tabList.appendChild(placeholder);
    }
  }

  clearDragPlaceholders() {
    document.querySelectorAll('.drag-placeholder').forEach(placeholder => {
      placeholder.remove();
    });
  }

  async moveTabToGroup(tabId, targetGroupIndex) {
    const tab = this.allTabs.find(t => t.id === tabId);
    if (!tab) return;

    // Remove tab from all groups first
    this.groups.forEach(group => {
      group.tabs = group.tabs.filter(t => t.id !== tabId);
    });

    // Add to target group if not ungrouped
    if (targetGroupIndex !== 'ungrouped' && targetGroupIndex !== null) {
      if (this.groups[targetGroupIndex]) {
        this.groups[targetGroupIndex].tabs.push({
          id: tab.id,
          title: tab.title,
          url: tab.url
        });
      }
    }

    // Clean up empty groups with auto-close
    this.groups = this.groups.filter(group => 
      !(group.autoClose && group.tabs.length === 0)
    );

    await this.saveData();
    this.render();
    this.updateStats();
  }

  setupModalHandlers() {
    // Create group modal
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

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        modal.classList.add('hidden');
      });
    });

    // Click outside to close
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });

    // Restore session modal
    document.getElementById('cancel-restore-btn').addEventListener('click', () => {
      document.getElementById('restore-session-modal').classList.add('hidden');
    });

    // Move to group modal
    document.getElementById('cancel-move-btn').addEventListener('click', () => {
      document.getElementById('group-selection-modal').classList.add('hidden');
    });
  }

  updateStats() {
    document.getElementById('total-tabs').textContent = `${this.allTabs.length} tabs`;
    document.getElementById('total-groups').textContent = `${this.groups.length} groups`;
  }

  getFilteredTabs() {
    if (!this.searchQuery) return this.allTabs;
    
    return this.allTabs.filter(tab => 
      tab.title.toLowerCase().includes(this.searchQuery) ||
      tab.url.toLowerCase().includes(this.searchQuery) ||
      tab.domain.toLowerCase().includes(this.searchQuery)
    );
  }

  getUngroupedTabs() {
    const groupedTabIds = new Set();
    this.groups.forEach(group => {
      group.tabs.forEach(tab => groupedTabIds.add(tab.id));
    });
    
    return this.getFilteredTabs().filter(tab => !groupedTabIds.has(tab.id));
  }

  render() {
    this.renderUngroupedTabs();
    this.renderGroups();
    this.updateSelectedTabsUI();
    this.showEmptyStateIfNeeded();
  }

  renderUngroupedTabs() {
    const ungroupedTabs = this.getUngroupedTabs();
    const container = document.getElementById('ungrouped-tabs');
    const countElement = document.getElementById('ungrouped-count');
    
    countElement.textContent = ungroupedTabs.length;
    
    // Clear existing content except drop zone
    const dropZone = container.querySelector('.drop-zone');
    container.innerHTML = '';
    if (dropZone) {
      container.appendChild(dropZone);
    }
    
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
    tabDiv.className = `tab-item ${this.selectedTabs.has(tab.id) ? 'selected' : ''}`;
    tabDiv.draggable = true;
    
    tabDiv.innerHTML = `
      <input type="checkbox" class="tab-checkbox" data-tab-id="${tab.id}" ${this.selectedTabs.has(tab.id) ? 'checked' : ''}>
      <img src="${tab.favicon}" alt="" class="tab-favicon" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04IDRWMTJNNCAxMkwxMiAxMiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo='">
      <div class="tab-info">
        <span class="tab-title">${tab.title}</span>
        <span class="tab-domain">${tab.domain}</span>
      </div>
      <button class="tab-close" data-tab-id="${tab.id}">×</button>
    `;

    // Checkbox handler
    const checkbox = tabDiv.querySelector('.tab-checkbox');
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      if (e.target.checked) {
        this.selectedTabs.add(tab.id);
      } else {
        this.selectedTabs.delete(tab.id);
      }
      tabDiv.classList.toggle('selected', e.target.checked);
      this.updateSelectedTabsUI();
    });

    // Click to switch to tab
    tabDiv.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close') && !e.target.classList.contains('tab-checkbox')) {
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
    ).filter(groupTab => {
      if (!this.searchQuery) return true;
      const tab = this.allTabs.find(t => t.id === groupTab.id);
      return tab && (
        tab.title.toLowerCase().includes(this.searchQuery) ||
        tab.url.toLowerCase().includes(this.searchQuery) ||
        tab.domain.toLowerCase().includes(this.searchQuery)
      );
    });
    
    groupDiv.innerHTML = `
      <div class="group-header" data-group="${groupIndex}">
        <div class="group-color" style="background: ${group.color}"></div>
        <span class="group-name">${group.name}</span>
        <span class="group-count">${validTabs.length}</span>
        <div class="group-actions">
          <button class="group-action" data-action="toggle" title="Toggle collapse">↕️</button>
          <button class="group-action" data-action="close-all" title="Close all tabs">×</button>
          <button class="group-action" data-action="delete" title="Delete group">🗑️</button>
        </div>
      </div>
      <div class="group-tabs ${group.collapsed ? 'collapsed' : ''}" id="group-tabs-${groupIndex}" data-group="${groupIndex}">
        <div class="drop-zone hidden">Drop tabs here to add to "${group.name}"</div>
        ${validTabs.map(tabData => {
          const tab = this.allTabs.find(t => t.id === tabData.id);
          return tab ? this.createTabElement(tab, groupIndex).outerHTML : '';
        }).join('')}
      </div>
    `;

    // Re-attach event listeners
    this.attachGroupEventListeners(groupDiv, groupIndex);
    this.attachTabEventListeners(groupDiv);

    return groupDiv;
  }

  attachGroupEventListeners(groupDiv, groupIndex) {
    // Group header click to toggle
    const header = groupDiv.querySelector('.group-header');
    header.addEventListener('click', (e) => {
      if (!e.target.closest('.group-actions')) {
        this.toggleGroup(groupIndex);
      }
    });

    // Group action handlers
    groupDiv.querySelectorAll('.group-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
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
  }

  attachTabEventListeners(groupDiv) {
    // Re-attach tab event listeners
    groupDiv.querySelectorAll('.tab-item').forEach(tabItem => {
      const tabId = parseInt(tabItem.querySelector('.tab-checkbox').dataset.tabId);
      
      // Make draggable
      tabItem.draggable = true;
      
      // Checkbox handler
      const checkbox = tabItem.querySelector('.tab-checkbox');
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        if (e.target.checked) {
          this.selectedTabs.add(tabId);
        } else {
          this.selectedTabs.delete(tabId);
        }
        tabItem.classList.toggle('selected', e.target.checked);
        this.updateSelectedTabsUI();
      });

      // Click to switch to tab
      tabItem.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tab-close') && !e.target.classList.contains('tab-checkbox')) {
          chrome.tabs.update(tabId, { active: true });
          window.close();
        }
      });

      // Close tab
      const closeBtn = tabItem.querySelector('.tab-close');
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeTab(tabId);
      });
    });
  }

  updateSelectedTabsUI() {
    const selectedCount = this.selectedTabs.size;
    document.getElementById('close-selected-tabs').disabled = selectedCount === 0;
    document.getElementById('move-to-group').disabled = selectedCount === 0;
    
    // Update button text
    const closeBtn = document.getElementById('close-selected-tabs');
    const moveBtn = document.getElementById('move-to-group');
    
    closeBtn.textContent = selectedCount > 0 ? `Close (${selectedCount})` : 'Close Selected';
    moveBtn.textContent = selectedCount > 0 ? `Move (${selectedCount})` : 'Move to Group';
  }

  showEmptyStateIfNeeded() {
    const hasVisibleTabs = this.getFilteredTabs().length > 0;
    document.getElementById('empty-state').classList.toggle('hidden', hasVisibleTabs);
  }

  // Enhanced Features Implementation
  
  selectAllTabs() {
    const visibleTabs = this.getFilteredTabs();
    visibleTabs.forEach(tab => this.selectedTabs.add(tab.id));
    this.render();
  }

  async closeSelectedTabs() {
    if (this.selectedTabs.size === 0) return;
    
    const tabIds = Array.from(this.selectedTabs);
    try {
      await chrome.tabs.remove(tabIds);
      this.selectedTabs.clear();
      await this.loadTabs();
      this.render();
      this.updateStats();
    } catch (error) {
      console.error('Error closing selected tabs:', error);
    }
  }

  async closeDuplicateTabs() {
    const urlGroups = {};
    this.allTabs.forEach(tab => {
      if (!urlGroups[tab.url]) {
        urlGroups[tab.url] = [];
      }
      urlGroups[tab.url].push(tab);
    });

    const duplicateTabs = [];
    Object.values(urlGroups).forEach(tabs => {
      if (tabs.length > 1) {
        duplicateTabs.push(...tabs.slice(1));
      }
    });

    if (duplicateTabs.length > 0) {
      const tabIds = duplicateTabs.map(tab => tab.id);
      try {
        await chrome.tabs.remove(tabIds);
        await this.loadTabs();
        this.render();
        this.updateStats();
        alert(`Closed ${duplicateTabs.length} duplicate tabs`);
      } catch (error) {
        console.error('Error closing duplicate tabs:', error);
      }
    } else {
      alert('No duplicate tabs found');
    }
  }

  async sortTabs() {
    const sortedTabs = [...this.allTabs].sort((a, b) => a.title.localeCompare(b.title));
    
    try {
      for (let i = 0; i < sortedTabs.length; i++) {
        await chrome.tabs.move(sortedTabs[i].id, { index: i });
      }
      await this.loadTabs();
      this.render();
    } catch (error) {
      console.error('Error sorting tabs:', error);
    }
  }

  async closeAllUngrouped() {
    const ungroupedTabs = this.getUngroupedTabs();
    if (ungroupedTabs.length === 0) return;

    if (confirm(`Close all ${ungroupedTabs.length} ungrouped tabs?`)) {
      const tabIds = ungroupedTabs.map(tab => tab.id);
      try {
        await chrome.tabs.remove(tabIds);
        await this.loadTabs();
        this.render();
        this.updateStats();
      } catch (error) {
        console.error('Error closing ungrouped tabs:', error);
      }
    }
  }

  toggleSection(sectionName) {
    const header = document.querySelector(`[data-section="${sectionName}"]`);
    const content = document.getElementById(`${sectionName}-tabs`);
    
    header.classList.toggle('collapsed');
    content.classList.toggle('collapsed');
  }

  showMoveToGroupModal() {
    if (this.selectedTabs.size === 0) return;
    
    const modal = document.getElementById('group-selection-modal');
    const list = document.getElementById('group-selection-list');
    
    list.innerHTML = this.groups.map((group, index) => `
      <div class="group-selection-item" data-group-index="${index}">
        <div class="group-info">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="group-color" style="background: ${group.color}; width: 16px; height: 16px; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
            <h4>${group.name}</h4>
          </div>
          <small>${group.tabs.length} tabs</small>
        </div>
      </div>
    `).join('');

    // Add click handlers
    list.querySelectorAll('.group-selection-item').forEach(item => {
      item.addEventListener('click', () => {
        const groupIndex = parseInt(item.dataset.groupIndex);
        this.moveSelectedTabsToGroup(groupIndex);
        modal.classList.add('hidden');
      });
    });

    modal.classList.remove('hidden');
  }

  async moveSelectedTabsToGroup(groupIndex) {
    const selectedTabIds = Array.from(this.selectedTabs);
    const selectedTabsData = this.allTabs.filter(tab => selectedTabIds.includes(tab.id));
    
    // Add tabs to group
    selectedTabsData.forEach(tab => {
      this.groups[groupIndex].tabs.push({
        id: tab.id,
        title: tab.title,
        url: tab.url
      });
    });

    // Remove from other groups
    this.groups.forEach((group, idx) => {
      if (idx !== groupIndex) {
        group.tabs = group.tabs.filter(tab => !selectedTabIds.includes(tab.id));
      }
    });

    this.selectedTabs.clear();
    await this.saveData();
    this.render();
  }

  showRestoreSessionModal() {
    const modal = document.getElementById('restore-session-modal');
    const list = document.getElementById('sessions-list');
    
    if (this.sessions.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: #9ca3af; padding: 40px; font-size: 14px;"><div style="font-size: 32px; margin-bottom: 12px;">📂</div>No saved sessions<br><small>Save your current session to restore it later</small></div>';
    } else {
      list.innerHTML = this.sessions.map((session, index) => `
        <div class="session-item" data-session-index="${index}">
          <div class="session-info">
            <h4>${session.name}</h4>
            <small>${session.tabs.length} tabs • ${new Date(session.id).toLocaleDateString()}</small>
          </div>
          <button class="btn-secondary" onclick="event.stopPropagation(); tabManager.deleteSession(${index})" style="padding: 6px 12px; font-size: 10px;">Delete</button>
        </div>
      `).join('');

      // Add click handlers
      list.querySelectorAll('.session-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (e.target.tagName !== 'BUTTON') {
            const sessionIndex = parseInt(item.dataset.sessionIndex);
            this.restoreSession(sessionIndex);
            modal.classList.add('hidden');
          }
        });
      });
    }

    modal.classList.remove('hidden');
  }

  async restoreSession(sessionIndex) {
    const session = this.sessions[sessionIndex];
    if (!session) return;

    try {
      // Show loading state
      const modal = document.getElementById('restore-session-modal');
      modal.classList.add('loading');
      
      // Restore tabs
      for (const tab of session.tabs) {
        await chrome.tabs.create({ url: tab.url, active: false });
      }
      
      // Restore groups
      this.groups = session.groups || [];
      await this.saveData();
      await this.loadTabs();
      this.render();
      this.updateStats();
      
      modal.classList.remove('loading');
      modal.classList.add('hidden');
      
      alert(`✅ Restored session: ${session.name}`);
    } catch (error) {
      console.error('Error restoring session:', error);
      alert('❌ Error restoring session');
    }
  }

  async deleteSession(sessionIndex) {
    if (confirm('Delete this session permanently?')) {
      this.sessions.splice(sessionIndex, 1);
      await this.saveData();
      this.showRestoreSessionModal(); // Refresh the modal
    }
  }

  // Group Management Methods
  
  showCreateGroupModal() {
    document.getElementById('create-group-modal').classList.remove('hidden');
    document.getElementById('group-name-input').focus();
    // Select first color by default
    document.querySelector('.color-option').classList.add('selected');
    this.selectedColor = document.querySelector('.color-option').dataset.color;
  }

  hideCreateGroupModal() {
    document.getElementById('create-group-modal').classList.add('hidden');
    document.getElementById('group-name-input').value = '';
    document.getElementById('auto-close-empty').checked = false;
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
  }

  async createGroup() {
    const name = document.getElementById('group-name-input').value.trim();
    if (!name) {
      alert('Please enter a group name');
      return;
    }

    // Check for duplicate names
    if (this.groups.some(group => group.name.toLowerCase() === name.toLowerCase())) {
      alert('A group with this name already exists');
      return;
    }

    const autoClose = document.getElementById('auto-close-empty').checked;

    const newGroup = {
      id: Date.now(),
      name,
      color: this.selectedColor,
      tabs: [],
      collapsed: false,
      autoClose,
      createdAt: new Date().toISOString()
    };

    this.groups.push(newGroup);
    await this.saveData();
    this.render();
    this.updateStats();
    this.hideCreateGroupModal();
    
    // Show success message
    this.showToast(`✅ Created group "${name}"`);
  }

  async closeTab(tabId) {
    try {
      await chrome.tabs.remove(tabId);
      
      // Remove from groups and clean up empty groups with auto-close
      this.groups = this.groups.filter(group => {
        group.tabs = group.tabs.filter(tab => tab.id !== tabId);
        return !(group.autoClose && group.tabs.length === 0);
      });
      
      this.selectedTabs.delete(tabId);
      await this.saveData();
      await this.loadTabs();
      this.render();
      this.updateStats();
    } catch (error) {
      console.error('Error closing tab:', error);
    }
  }

  async toggleGroup(groupIndex) {
    this.groups[groupIndex].collapsed = !this.groups[groupIndex].collapsed;
    const tabsContainer = document.getElementById(`group-tabs-${groupIndex}`);
    if (tabsContainer) {
      tabsContainer.classList.toggle('collapsed');
    }
    await this.saveData();
  }

  async closeGroupTabs(groupIndex) {
    const group = this.groups[groupIndex];
    const tabIds = group.tabs.map(tab => tab.id);
    
    if (tabIds.length === 0) return;
    
    if (confirm(`Close all ${tabIds.length} tabs in "${group.name}"?`)) {
      try {
        await chrome.tabs.remove(tabIds);
        group.tabs = [];
        
        // Auto-delete group if it has auto-close enabled
        if (group.autoClose) {
          this.groups.splice(groupIndex, 1);
          this.showToast(`🗑️ Deleted empty group "${group.name}"`);
        }
        
        await this.saveData();
        await this.loadTabs();
        this.render();
        this.updateStats();
      } catch (error) {
        console.error('Error closing group tabs:', error);
      }
    }
  }

  async deleteGroup(groupIndex) {
    const group = this.groups[groupIndex];
    if (confirm(`Delete group "${group.name}"?\nTabs will become ungrouped.`)) {
      this.groups.splice(groupIndex, 1);
      await this.saveData();
      this.render();
      this.updateStats();
      this.showToast(`🗑️ Deleted group "${group.name}"`);
    }
  }

  async saveSession() {
    const sessionName = prompt('Enter session name:', `Session ${new Date().toLocaleString()}`);
    if (!sessionName) return;

    const session = {
      id: Date.now(),
      name: sessionName,
      tabs: this.allTabs.map(tab => ({
        title: tab.title,
        url: tab.url,
        favicon: tab.favicon
      })),
      groups: JSON.parse(JSON.stringify(this.groups)), // Deep copy
      createdAt: new Date().toISOString(),
      tabCount: this.allTabs.length,
      groupCount: this.groups.length
    };

    this.sessions.push(session);
    
    // Limit to 10 most recent sessions
    if (this.sessions.length > 10) {
      this.sessions = this.sessions.slice(-10);
    }
    
    await this.saveData();
    this.showToast(`💾 Session "${sessionName}" saved successfully!`);
  }

  // Utility Methods
  
  showToast(message, duration = 3000) {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      backdrop-filter: blur(12px);
      animation: slideUpToast 0.3s ease;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUpToast {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove after duration
    setTimeout(() => {
      toast.style.animation = 'slideUpToast 0.3s ease reverse';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }, 300);
    }, duration);
  }

  // Keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + A: Select all tabs
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.target.matches('input')) {
        e.preventDefault();
        this.selectAllTabs();
      }
      
      // Delete: Close selected tabs
      if (e.key === 'Delete' && this.selectedTabs.size > 0) {
        e.preventDefault();
        this.closeSelectedTabs();
      }
      
      // Escape: Clear selection or close modals
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal:not(.hidden)');
        if (openModal) {
          openModal.classList.add('hidden');
        } else {
          this.selectedTabs.clear();
          this.render();
        }
      }
    });
  }
}

// Make tabManager globally accessible for inline event handlers
let tabManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  tabManager = new TabManager();
  tabManager.setupKeyboardShortcuts();
});