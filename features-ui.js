// ========================================================================
// NEW FEATURES UI: Enhanced Functionality (v2.0)
// This file contains all UI handlers for the 10 new features
// ========================================================================

// Global state for features
const featuresState = {
  currentCollection: null,
  draggedQueueItem: null,
  selectedModelsForExport: []
};

// ========================================================================
// FEATURE 1: Smart Collections
// ========================================================================

async function initializeSmartCollections() {
  window.electron.onOpenSmartCollections(() => {
    const dialog = document.getElementById('smart-collections-dialog');
    loadSmartCollections();
    dialog.showModal();
  });

  document.getElementById('new-smart-collection-btn')?.addEventListener('click', () => {
    featuresState.currentCollection = null;
    showCollectionEditor();
  });

  document.getElementById('add-rule-btn')?.addEventListener('click', addCollectionRule);
  document.getElementById('save-collection-btn')?.addEventListener('click', saveSmartCollection);
  document.getElementById('delete-collection-btn')?.addEventListener('click', deleteSmartCollection);
}

async function loadSmartCollections() {
  try {
    const collections = await window.electron.getSmartCollections();
    const list = document.getElementById('collections-list');
    list.innerHTML = '';

    if (collections.length === 0) {
      list.innerHTML = '<div class="empty-state">No collections yet. Create one!</div>';
      return;
    }

    collections.forEach(collection => {
      const item = document.createElement('div');
      item.className = 'collection-item';
      item.innerHTML = `
        <span class="collection-icon">${collection.icon || '📁'}</span>
        <span class="collection-name">${collection.name}</span>
      `;
      item.addEventListener('click', () => loadCollection(collection.id));
      list.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading smart collections:', error);
  }
}

async function loadCollection(id) {
  try {
    const collection = await window.electron.getSmartCollection(id);
    featuresState.currentCollection = collection;

    // Highlight selected
    document.querySelectorAll('.collection-item').forEach(item => {
      item.classList.remove('active');
    });
    event.target.closest('.collection-item').classList.add('active');

    // Show editor
    showCollectionEditor(collection);

    // Load models
    const models = await window.electron.getSmartCollectionModels(id);
    displayCollectionModels(models);
  } catch (error) {
    console.error('Error loading collection:', error);
  }
}

function showCollectionEditor(collection = null) {
  const editor = document.getElementById('collection-editor');
  const viewer = document.getElementById('collection-viewer');

  editor.style.display = 'flex';
  viewer.innerHTML = '';

  if (collection) {
    document.getElementById('collection-name').value = collection.name;
    document.getElementById('collection-description').value = collection.description || '';
    document.getElementById('collection-icon').value = collection.icon || '';
    document.getElementById('collection-color').value = collection.color || '#4CAF50';

    // Load rules
    const rules = JSON.parse(collection.rules);
    const rulesContainer = document.getElementById('collection-rules');
    rulesContainer.innerHTML = '';
    rules.forEach(rule => addCollectionRule(rule));
  } else {
    document.getElementById('collection-name').value = '';
    document.getElementById('collection-description').value = '';
    document.getElementById('collection-icon').value = '📁';
    document.getElementById('collection-color').value = '#4CAF50';
    document.getElementById('collection-rules').innerHTML = '';
  }
}

function addCollectionRule(existingRule = null) {
  const rulesContainer = document.getElementById('collection-rules');
  const ruleDiv = document.createElement('div');
  ruleDiv.className = 'rule-item';

  ruleDiv.innerHTML = `
    <select class="rule-field">
      <option value="fileName">File Name</option>
      <option value="designer">Designer</option>
      <option value="size">Size</option>
      <option value="dateAdded">Date Added</option>
      <option value="license">License</option>
      <option value="printed">Printed</option>
    </select>
    <select class="rule-operator">
      <option value="equals">Equals</option>
      <option value="contains">Contains</option>
      <option value="startsWith">Starts With</option>
      <option value="greaterThan">Greater Than</option>
      <option value="lessThan">Less Than</option>
      <option value="isEmpty">Is Empty</option>
      <option value="isNotEmpty">Is Not Empty</option>
    </select>
    <input type="text" class="rule-value" placeholder="Value">
    <button type="button" class="remove-rule">×</button>
  `;

  if (existingRule) {
    ruleDiv.querySelector('.rule-field').value = existingRule.field;
    ruleDiv.querySelector('.rule-operator').value = existingRule.operator;
    ruleDiv.querySelector('.rule-value').value = existingRule.value || '';
  }

  ruleDiv.querySelector('.remove-rule').addEventListener('click', () => ruleDiv.remove());
  rulesContainer.appendChild(ruleDiv);
}

async function saveSmartCollection() {
  const name = document.getElementById('collection-name').value;
  const description = document.getElementById('collection-description').value;
  const icon = document.getElementById('collection-icon').value;
  const color = document.getElementById('collection-color').value;

  if (!name) {
    alert('Please enter a collection name');
    return;
  }

  // Gather rules
  const rules = [];
  document.querySelectorAll('.rule-item').forEach(item => {
    rules.push({
      field: item.querySelector('.rule-field').value,
      operator: item.querySelector('.rule-operator').value,
      value: item.querySelector('.rule-value').value
    });
  });

  if (rules.length === 0) {
    alert('Please add at least one rule');
    return;
  }

  try {
    const collection = {
      id: featuresState.currentCollection?.id,
      name,
      description,
      icon,
      color,
      rules
    };

    await window.electron.saveSmartCollection(collection);
    await loadSmartCollections();
    alert('Collection saved successfully!');
  } catch (error) {
    console.error('Error saving collection:', error);
    alert('Error saving collection: ' + error.message);
  }
}

async function deleteSmartCollection() {
  if (!featuresState.currentCollection) return;

  if (!confirm(`Delete collection "${featuresState.currentCollection.name}"?`)) return;

  try {
    await window.electron.deleteSmartCollection(featuresState.currentCollection.id);
    featuresState.currentCollection = null;
    document.getElementById('collection-editor').style.display = 'none';
    await loadSmartCollections();
  } catch (error) {
    console.error('Error deleting collection:', error);
    alert('Error deleting collection: ' + error.message);
  }
}

function displayCollectionModels(models) {
  const viewer = document.getElementById('collection-viewer');
  viewer.innerHTML = `<h4>${models.length} Models</h4>`;

  if (models.length === 0) {
    viewer.innerHTML += '<div class="empty-state">No models match these rules</div>';
    return;
  }

  // Reuse existing grid display
  viewer.innerHTML += `<div class="favorites-grid" id="collection-models-grid"></div>`;
  const grid = viewer.querySelector('#collection-models-grid');

  models.forEach(model => {
    const card = createModelCard(model);
    grid.appendChild(card);
  });
}

// ========================================================================
// FEATURE 2: File Watcher
// ========================================================================

async function initializeFileWatcher() {
  window.electron.onOpenFileWatcherScan((path) => {
    console.log('Auto-scanning:', path);
    // Trigger refresh after auto-scan completes
    if (typeof window.performCombinedSearch === 'function') {
      setTimeout(() => window.performCombinedSearch(), 1000);
    }
  });

  // Listen for menu event
  window.electron.on('open-file-watcher', () => {
    const dialog = document.getElementById('file-watcher-dialog');
    loadWatchedDirectories();
    dialog.showModal();
  });

  document.getElementById('add-watched-dir-btn')?.addEventListener('click', async () => {
    const paths = await window.electron.openFileDialog();
    if (paths && paths.length > 0) {
      try {
        await window.electron.addWatchedDirectory(paths[0]);
        await loadWatchedDirectories();
      } catch (error) {
        alert('Error adding directory: ' + error.message);
      }
    }
  });
}

async function loadWatchedDirectories() {
  try {
    const dirs = await window.electron.getWatchedDirectories();
    const list = document.getElementById('watched-directories-list');
    list.innerHTML = '';

    if (dirs.length === 0) {
      list.innerHTML = '<div class="empty-state">No watched directories. Add one to enable auto-scanning.</div>';
      return;
    }

    dirs.forEach(dir => {
      const item = document.createElement('div');
      item.className = 'watched-dir-item';
      item.innerHTML = `
        <div class="watched-dir-path" title="${dir.path}">${dir.path}</div>
        <div class="watched-dir-status">${dir.last_scan ? 'Last scan: ' + new Date(dir.last_scan).toLocaleString() : 'Not scanned yet'}</div>
        <div class="watched-dir-toggle ${dir.enabled ? 'active' : ''}" data-id="${dir.id}" data-enabled="${dir.enabled}"></div>
        <button class="watched-dir-remove" data-id="${dir.id}">×</button>
      `;

      item.querySelector('.watched-dir-toggle').addEventListener('click', async (e) => {
        const toggle = e.target;
        const id = parseInt(toggle.dataset.id);
        const currentEnabled = toggle.dataset.enabled === '1';
        const newEnabled = !currentEnabled;

        try {
          await window.electron.toggleWatchedDirectory(id, newEnabled);
          toggle.classList.toggle('active');
          toggle.dataset.enabled = newEnabled ? '1' : '0';
        } catch (error) {
          alert('Error toggling watcher: ' + error.message);
        }
      });

      item.querySelector('.watched-dir-remove').addEventListener('click', async (e) => {
        const id = parseInt(e.target.dataset.id);
        if (confirm('Remove this watched directory?')) {
          try {
            await window.electron.removeWatchedDirectory(id);
            await loadWatchedDirectories();
          } catch (error) {
            alert('Error removing directory: ' + error.message);
          }
        }
      });

      list.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading watched directories:', error);
  }
}

// ========================================================================
// FEATURE 3: Print Queue & History
// ========================================================================

async function initializePrintQueue() {
  window.electron.onOpenPrintQueue(() => {
    const dialog = document.getElementById('print-queue-dialog');
    loadPrintQueue();
    dialog.showModal();
  });

  window.electron.onOpenPrintHistory(() => {
    const dialog = document.getElementById('print-history-dialog');
    loadPrintHistory();
    dialog.showModal();
  });

  // Mark as printed dialog
  initializeMarkPrintedDialog();
}

async function loadPrintQueue() {
  try {
    const queue = await window.electron.getPrintQueue();
    const list = document.getElementById('print-queue-list');
    list.innerHTML = '';

    if (queue.length === 0) {
      list.innerHTML = '<div class="empty-state">Print queue is empty. Right-click a model and select "Add to Print Queue"</div>';
      return;
    }

    queue.forEach((item, index) => {
      const queueItem = document.createElement('div');
      queueItem.className = 'queue-item';
      queueItem.draggable = true;
      queueItem.dataset.id = item.id;
      queueItem.dataset.position = item.position;

      queueItem.innerHTML = `
        <img src="${item.thumbnail || 'logo.png'}" class="queue-thumbnail" alt="${item.fileName}">
        <div class="queue-details">
          <div class="queue-name">${item.fileName}</div>
          <div class="queue-designer">${item.designer || 'Unknown'}</div>
          ${item.notes ? `<div class="queue-notes">${item.notes}</div>` : ''}
        </div>
        <div class="queue-priority ${item.priority}">${item.priority.toUpperCase()}</div>
        <div class="queue-actions">
          <button data-id="${item.id}">Remove</button>
        </div>
      `;

      // Drag and drop
      queueItem.addEventListener('dragstart', (e) => {
        featuresState.draggedQueueItem = queueItem;
        queueItem.classList.add('dragging');
      });

      queueItem.addEventListener('dragend', () => {
        queueItem.classList.remove('dragging');
      });

      queueItem.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(list, e.clientY);
        if (afterElement == null) {
          list.appendChild(featuresState.draggedQueueItem);
        } else {
          list.insertBefore(featuresState.draggedQueueItem, afterElement);
        }
      });

      // Remove button
      queueItem.querySelector('button').addEventListener('click', async () => {
        try {
          await window.electron.removeFromPrintQueue(item.id);
          await loadPrintQueue();
        } catch (error) {
          alert('Error removing from queue: ' + error.message);
        }
      });

      list.appendChild(queueItem);
    });

    // Save order on drop
    list.addEventListener('drop', async () => {
      const items = Array.from(list.querySelectorAll('.queue-item')).map((item, index) => ({
        id: parseInt(item.dataset.id),
        position: index + 1
      }));

      try {
        await window.electron.reorderPrintQueue(items);
      } catch (error) {
        console.error('Error reordering queue:', error);
      }
    });
  } catch (error) {
    console.error('Error loading print queue:', error);
  }
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.queue-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function loadPrintHistory() {
  try {
    const history = await window.electron.getPrintHistory();
    const list = document.getElementById('print-history-list');
    list.innerHTML = '';

    // Update stats
    const totalPrints = history.length;
    const successful = history.filter(h => h.success === 1).length;
    const ratings = history.filter(h => h.rating > 0);
    const avgRating = ratings.length > 0 ? (ratings.reduce((sum, h) => sum + h.rating, 0) / ratings.length).toFixed(1) : 0;

    document.getElementById('total-prints-stat').textContent = totalPrints;
    document.getElementById('success-rate-stat').textContent = totalPrints > 0 ? `${Math.round(successful / totalPrints * 100)}%` : '0%';
    document.getElementById('avg-rating-stat').textContent = avgRating;

    if (history.length === 0) {
      list.innerHTML = '<div class="empty-state">No print history yet. Mark models as printed to track your progress!</div>';
      return;
    }

    history.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';

      const durationStr = item.duration ? `${Math.floor(item.duration / 3600)}h ${Math.floor((item.duration % 3600) / 60)}m` : 'N/A';
      const ratingStars = '★'.repeat(item.rating || 0) + '☆'.repeat(5 - (item.rating || 0));

      historyItem.innerHTML = `
        <img src="${item.thumbnail || 'logo.png'}" class="queue-thumbnail" alt="${item.fileName}">
        <div class="queue-details">
          <div class="queue-name">${item.fileName}</div>
          <div class="queue-designer">${item.designer || 'Unknown'}</div>
          <div class="history-status ${item.success ? 'success' : 'failed'}">
            ${item.success ? '✓ Success' : '✗ Failed'} • ${new Date(item.print_date).toLocaleDateString()}
          </div>
          <div style="font-size: 12px; color: #aaa;">
            Duration: ${durationStr} | Material: ${item.material_used || 'N/A'}g
          </div>
          ${item.rating ? `<div class="history-rating">${ratingStars}</div>` : ''}
          ${item.notes ? `<div class="queue-notes">${item.notes}</div>` : ''}
        </div>
      `;

      list.appendChild(historyItem);
    });
  } catch (error) {
    console.error('Error loading print history:', error);
  }
}

function initializeMarkPrintedDialog() {
  const dialog = document.getElementById('mark-printed-dialog');

  // Rating stars
  dialog.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
      const rating = parseInt(star.dataset.rating);
      document.getElementById('print-rating').value = rating;

      dialog.querySelectorAll('.star').forEach((s, index) => {
        s.textContent = index < rating ? '★' : '☆';
        s.classList.toggle('active', index < rating);
      });
    });
  });

  document.getElementById('save-print-history-btn')?.addEventListener('click', async () => {
    const modelId = parseInt(document.getElementById('printed-model-id').value);
    const durationStr = document.getElementById('print-duration').value;
    const materialUsed = parseFloat(document.getElementById('print-material').value) || null;
    const success = parseInt(document.getElementById('print-success').value);
    const rating = parseInt(document.getElementById('print-rating').value) || 0;
    const notes = document.getElementById('print-notes').value;

    // Parse duration
    let duration = null;
    if (durationStr) {
      const parts = durationStr.split(':');
      if (parts.length === 2) {
        duration = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60;
      }
    }

    try {
      await window.electron.addToPrintHistory({
        modelId,
        duration,
        materialUsed,
        success,
        rating,
        notes
      });

      dialog.close();
      alert('Print history saved!');

      // Refresh grid if function exists
      if (typeof window.performCombinedSearch === 'function') {
        window.performCombinedSearch();
      }
    } catch (error) {
      alert('Error saving print history: ' + error.message);
    }
  });

  document.getElementById('cancel-print-history-btn')?.addEventListener('click', () => {
    dialog.close();
  });
}

// Export function to open mark printed dialog
window.openMarkPrintedDialog = function(modelId) {
  const dialog = document.getElementById('mark-printed-dialog');
  document.getElementById('printed-model-id').value = modelId;
  document.getElementById('print-duration').value = '';
  document.getElementById('print-material').value = '';
  document.getElementById('print-success').value = '1';
  document.getElementById('print-rating').value = '0';
  document.getElementById('print-notes').value = '';

  // Reset stars
  dialog.querySelectorAll('.star').forEach(s => {
    s.textContent = '☆';
    s.classList.remove('active');
  });

  dialog.showModal();
};

// ========================================================================
// FEATURE 4: Statistics Dashboard
// ========================================================================

async function initializeStatistics() {
  window.electron.onOpenStatistics(async () => {
    const dialog = document.getElementById('statistics-dialog');
    await loadStatistics();
    dialog.showModal();
  });
}

async function loadStatistics() {
  try {
    const stats = await window.electron.getStatistics();

    // Update main stats
    document.getElementById('stat-total-models').textContent = stats.totalModels.toLocaleString();
    document.getElementById('stat-total-designers').textContent = stats.totalDesigners.toLocaleString();
    document.getElementById('stat-total-tags').textContent = stats.totalTags.toLocaleString();
    document.getElementById('stat-total-size').textContent = `${(stats.totalSize / 1073741824).toFixed(2)} GB`;
    document.getElementById('stat-printed-ratio').textContent = stats.totalModels > 0 ?
      `${Math.round(stats.totalPrinted / stats.totalModels * 100)}%` : '0%';
    document.getElementById('stat-favorites').textContent = stats.totalFavorites.toLocaleString();

    // Top designers
    const designersList = document.getElementById('top-designers-list');
    designersList.innerHTML = '';
    stats.topDesigners.forEach(item => {
      const div = document.createElement('div');
      div.className = 'top-list-item';
      div.innerHTML = `
        <span class="top-list-name">${item.designer}</span>
        <span class="top-list-count">${item.count}</span>
      `;
      designersList.appendChild(div);
    });

    // Top tags
    const tagsList = document.getElementById('top-tags-list');
    tagsList.innerHTML = '';
    stats.topTags.forEach(item => {
      const div = document.createElement('div');
      div.className = 'top-list-item';
      div.innerHTML = `
        <span class="top-list-name">${item.name}</span>
        <span class="top-list-count">${item.count}</span>
      `;
      tagsList.appendChild(div);
    });

    // File types chart
    const fileTypesChart = document.getElementById('file-types-chart');
    fileTypesChart.innerHTML = '';
    const totalFiles = stats.fileTypes.stl + stats.fileTypes.threemf + stats.fileTypes.zip;

    ['stl', 'threemf', 'zip'].forEach(type => {
      const count = stats.fileTypes[type];
      if (count > 0) {
        const percentage = (count / totalFiles * 100).toFixed(1);
        const div = document.createElement('div');
        div.className = 'chart-bar';
        div.innerHTML = `
          <span class="chart-label">${type.toUpperCase()}</span>
          <div class="chart-bar-bg">
            <div class="chart-bar-fill" style="width: ${percentage}%">
              <span class="chart-value">${count}</span>
            </div>
          </div>
        `;
        fileTypesChart.appendChild(div);
      }
    });

    // Models by month chart
    const monthChart = document.getElementById('models-by-month-chart');
    monthChart.innerHTML = '';
    const maxCount = Math.max(...stats.modelsByMonth.map(m => m.count), 1);

    stats.modelsByMonth.reverse().forEach(item => {
      const percentage = (item.count / maxCount * 100).toFixed(1);
      const div = document.createElement('div');
      div.className = 'chart-bar';
      div.innerHTML = `
        <span class="chart-label">${item.month}</span>
        <div class="chart-bar-bg">
          <div class="chart-bar-fill" style="width: ${percentage}%">
            <span class="chart-value">${item.count}</span>
          </div>
        </div>
      `;
      monthChart.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

// ========================================================================
// FEATURE 5: Favorites
// ========================================================================

async function initializeFavorites() {
  window.electron.onOpenFavorites(async () => {
    const dialog = document.getElementById('favorites-dialog');
    await loadFavorites();
    dialog.showModal();
  });
}

async function loadFavorites() {
  try {
    const favorites = await window.electron.getFavorites();
    const grid = document.getElementById('favorites-grid');
    grid.innerHTML = '';

    if (favorites.length === 0) {
      grid.innerHTML = '<div class="empty-state">No favorites yet. Click the star on model cards to add favorites!</div>';
      return;
    }

    favorites.forEach(model => {
      const card = createModelCard(model);
      grid.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading favorites:', error);
  }
}

// Toggle favorite function - to be called from model cards
window.toggleFavorite = async function(modelId) {
  try {
    const isFav = await window.electron.isFavorite(modelId);

    if (isFav) {
      await window.electron.removeFromFavorites(modelId);
    } else {
      await window.electron.addToFavorites(modelId, '');
    }

    // Update UI
    const star = document.querySelector(`.favorite-star[data-model-id="${modelId}"]`);
    if (star) {
      star.classList.toggle('active');
      star.textContent = star.classList.contains('active') ? '★' : '☆';
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
};

// ========================================================================
// FEATURE 6: Custom Fields
// ========================================================================

async function initializeCustomFields() {
  window.electron.onOpenCustomFields(() => {
    const dialog = document.getElementById('custom-fields-dialog');
    loadCustomFields();
    dialog.showModal();
  });

  document.getElementById('new-custom-field-btn')?.addEventListener('click', () => {
    const dialog = document.getElementById('edit-custom-field-dialog');
    document.getElementById('custom-field-dialog-title').textContent = 'New Custom Field';
    document.getElementById('custom-field-id').value = '';
    document.getElementById('custom-field-name').value = '';
    document.getElementById('custom-field-type').value = 'text';
    document.getElementById('custom-field-options').value = '';
    document.getElementById('custom-field-default').value = '';
    document.getElementById('custom-field-options-group').style.display = 'none';
    dialog.showModal();
  });

  document.getElementById('custom-field-type')?.addEventListener('change', (e) => {
    const optionsGroup = document.getElementById('custom-field-options-group');
    optionsGroup.style.display = e.target.value === 'select' ? 'block' : 'none';
  });

  document.getElementById('save-custom-field-btn')?.addEventListener('click', saveCustomField);
  document.getElementById('cancel-custom-field-btn')?.addEventListener('click', () => {
    document.getElementById('edit-custom-field-dialog').close();
  });
}

async function loadCustomFields() {
  try {
    const fields = await window.electron.getCustomFields();
    const list = document.getElementById('custom-fields-list');
    list.innerHTML = '';

    if (fields.length === 0) {
      list.innerHTML = '<div class="empty-state">No custom fields yet. Create one to add specialized metadata!</div>';
      return;
    }

    fields.forEach(field => {
      const item = document.createElement('div');
      item.className = 'custom-field-item';
      item.innerHTML = `
        <div class="custom-field-name">${field.name}</div>
        <div class="custom-field-type">${field.type}</div>
        <div class="custom-field-actions">
          <button class="edit-field" data-id="${field.id}">Edit</button>
          <button class="delete-field" data-id="${field.id}">Delete</button>
        </div>
      `;

      item.querySelector('.edit-field').addEventListener('click', () => editCustomField(field));
      item.querySelector('.delete-field').addEventListener('click', () => deleteCustomField(field.id));

      list.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading custom fields:', error);
  }
}

function editCustomField(field) {
  const dialog = document.getElementById('edit-custom-field-dialog');
  document.getElementById('custom-field-dialog-title').textContent = 'Edit Custom Field';
  document.getElementById('custom-field-id').value = field.id;
  document.getElementById('custom-field-name').value = field.name;
  document.getElementById('custom-field-type').value = field.type;
  document.getElementById('custom-field-default').value = field.default_value || '';

  if (field.type === 'select' && field.options) {
    const options = JSON.parse(field.options);
    document.getElementById('custom-field-options').value = options.join(', ');
    document.getElementById('custom-field-options-group').style.display = 'block';
  } else {
    document.getElementById('custom-field-options').value = '';
    document.getElementById('custom-field-options-group').style.display = 'none';
  }

  dialog.showModal();
}

async function saveCustomField() {
  const id = document.getElementById('custom-field-id').value;
  const name = document.getElementById('custom-field-name').value;
  const type = document.getElementById('custom-field-type').value;
  const defaultValue = document.getElementById('custom-field-default').value;
  const optionsStr = document.getElementById('custom-field-options').value;

  if (!name) {
    alert('Please enter a field name');
    return;
  }

  let options = null;
  if (type === 'select' && optionsStr) {
    options = optionsStr.split(',').map(o => o.trim()).filter(o => o);
  }

  try {
    await window.electron.saveCustomField({
      id: id ? parseInt(id) : null,
      name,
      type,
      defaultValue,
      options
    });

    document.getElementById('edit-custom-field-dialog').close();
    await loadCustomFields();
  } catch (error) {
    alert('Error saving custom field: ' + error.message);
  }
}

async function deleteCustomField(id) {
  if (!confirm('Delete this custom field? All values will be removed from models.')) return;

  try {
    await window.electron.deleteCustomField(id);
    await loadCustomFields();
  } catch (error) {
    alert('Error deleting custom field: ' + error.message);
  }
}

// ========================================================================
// FEATURE 7: Bulk Rename
// ========================================================================

async function initializeBulkRename() {
  window.electron.onOpenBulkRename(() => {
    if (!isMultiSelectMode || selectedModels.size === 0) {
      alert('Please select models in multi-select mode first');
      return;
    }

    const dialog = document.getElementById('bulk-rename-dialog');
    updateRenamePreview();
    dialog.showModal();
  });

  document.getElementById('rename-pattern')?.addEventListener('input', updateRenamePreview);
  document.getElementById('apply-rename-btn')?.addEventListener('click', applyBulkRename);
}

async function updateRenamePreview() {
  const pattern = document.getElementById('rename-pattern').value;
  const preview = document.getElementById('rename-preview');
  preview.innerHTML = '';

  if (!pattern || selectedModels.size === 0) {
    preview.innerHTML = '<div class="empty-state">Enter a pattern to see preview</div>';
    return;
  }

  try {
    const models = await window.electron.getAllModels();
    const selectedModelsList = models.filter(m => selectedModels.has(m.id));

    selectedModelsList.forEach((model, index) => {
      const oldName = model.fileName;
      const ext = oldName.substring(oldName.lastIndexOf('.'));
      const nameWithoutExt = oldName.substring(0, oldName.lastIndexOf('.'));

      let newName = pattern
        .replace(/{designer}/g, model.designer || 'Unknown')
        .replace(/{original}/g, nameWithoutExt)
        .replace(/{index}/g, index + 1)
        .replace(/{date}/g, new Date().toISOString().split('T')[0]);

      newName += ext;

      const item = document.createElement('div');
      item.className = 'rename-preview-item';
      item.innerHTML = `
        <span class="rename-old">${oldName}</span>
        <span class="rename-arrow">→</span>
        <span class="rename-new">${newName}</span>
      `;
      preview.appendChild(item);
    });
  } catch (error) {
    console.error('Error updating preview:', error);
  }
}

async function applyBulkRename() {
  if (!confirm('Apply rename to all selected models? This cannot be undone.')) return;

  const pattern = document.getElementById('rename-pattern').value;

  try {
    const models = await window.electron.getAllModels();
    const selectedModelsList = models.filter(m => selectedModels.has(m.id));

    const results = await window.electron.bulkRenameModels(selectedModelsList, pattern);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    alert(`Rename complete!\nSuccessful: ${successful}\nFailed: ${failed}`);

    document.getElementById('bulk-rename-dialog').close();

    // Refresh grid
    if (typeof window.performCombinedSearch === 'function') {
      window.performCombinedSearch();
    }
  } catch (error) {
    alert('Error renaming files: ' + error.message);
  }
}

// ========================================================================
// FEATURE 8: Recent Models
// ========================================================================

async function initializeRecentModels() {
  window.electron.onOpenRecentModels(async () => {
    const dialog = document.getElementById('recent-models-dialog');
    await loadRecentModels();
    dialog.showModal();
  });

  document.getElementById('clear-recent-btn')?.addEventListener('click', async () => {
    if (confirm('Clear all recent model history?')) {
      try {
        await window.electron.clearRecentModels();
        await loadRecentModels();
      } catch (error) {
        alert('Error clearing recent models: ' + error.message);
      }
    }
  });
}

async function loadRecentModels() {
  try {
    const recent = await window.electron.getRecentModels(50);
    const grid = document.getElementById('recent-models-grid');
    grid.innerHTML = '';

    if (recent.length === 0) {
      grid.innerHTML = '<div class="empty-state">No recent models yet</div>';
      return;
    }

    recent.forEach(model => {
      const card = createModelCard(model);
      grid.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading recent models:', error);
  }
}

// ========================================================================
// FEATURE 9: Collection Export/Import
// ========================================================================

async function initializeCollectionExportImport() {
  window.electron.onOpenCollectionExport(() => {
    const dialog = document.getElementById('export-collection-dialog');
    dialog.showModal();
  });

  window.electron.onOpenCollectionImport(() => {
    const dialog = document.getElementById('import-collection-dialog');
    document.getElementById('import-results').style.display = 'none';
    dialog.showModal();
  });

  document.getElementById('do-export-btn')?.addEventListener('click', doExportCollection);
  document.getElementById('browse-import-btn')?.addEventListener('click', browseImportFile);
  document.getElementById('do-import-btn')?.addEventListener('click', doImportCollection);
}

async function doExportCollection() {
  const name = document.getElementById('export-name').value;
  const description = document.getElementById('export-description').value;
  const includeFiles = document.getElementById('export-include-files').checked;

  if (!name) {
    alert('Please enter a collection name');
    return;
  }

  if (selectedModels.size === 0) {
    alert('No models selected. Please select models in multi-select mode first.');
    return;
  }

  try {
    const paths = await window.electron.openFileDialog();
    if (!paths || paths.length === 0) return;

    const result = await window.electron.exportCollection({
      name,
      description,
      modelIds: Array.from(selectedModels),
      includeFiles,
      exportPath: paths[0]
    });

    if (result.success) {
      alert(`Collection exported to:\n${result.path}`);
      document.getElementById('export-collection-dialog').close();
    }
  } catch (error) {
    alert('Error exporting collection: ' + error.message);
  }
}

async function browseImportFile() {
  try {
    const paths = await window.electron.openFileDialog();
    if (paths && paths.length > 0) {
      document.getElementById('import-file-path').value = paths[0];
    }
  } catch (error) {
    alert('Error selecting file: ' + error.message);
  }
}

async function doImportCollection() {
  const filePath = document.getElementById('import-file-path').value;

  if (!filePath) {
    alert('Please select a collection file');
    return;
  }

  try {
    const result = await window.electron.importCollection(filePath);

    const resultsDiv = document.getElementById('import-results');
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `
      <div class="import-success">Successfully imported ${result.imported} models</div>
      ${result.errors.length > 0 ? `
        <div class="import-errors">
          <strong>Errors (${result.errors.length}):</strong>
          ${result.errors.map(e => `<div class="import-error-item">${e.file}: ${e.error}</div>`).join('')}
        </div>
      ` : ''}
    `;

    // Refresh grid
    if (typeof window.performCombinedSearch === 'function') {
      setTimeout(() => window.performCombinedSearch(), 1000);
    }
  } catch (error) {
    alert('Error importing collection: ' + error.message);
  }
}

// ========================================================================
// FEATURE 10: Saved Searches
// ========================================================================

async function initializeSavedSearches() {
  window.electron.onOpenSavedSearches(() => {
    const dialog = document.getElementById('saved-searches-dialog');
    loadSavedSearches();
    dialog.showModal();
  });

  document.getElementById('save-current-search-btn')?.addEventListener('click', () => {
    const dialog = document.getElementById('save-search-dialog');
    document.getElementById('search-name').value = '';
    dialog.showModal();
  });

  document.getElementById('do-save-search-btn')?.addEventListener('click', doSaveSearch);
  document.getElementById('cancel-save-search-btn')?.addEventListener('click', () => {
    document.getElementById('save-search-dialog').close();
  });
}

async function loadSavedSearches() {
  try {
    const searches = await window.electron.getSavedSearches();
    const list = document.getElementById('saved-searches-list');
    list.innerHTML = '';

    if (searches.length === 0) {
      list.innerHTML = '<div class="empty-state">No saved searches yet. Save your current filters to reuse them later!</div>';
      return;
    }

    searches.forEach(search => {
      const item = document.createElement('div');
      item.className = 'saved-search-item';
      item.innerHTML = `
        <div class="saved-search-name">${search.name}</div>
        <div class="saved-search-date">${new Date(search.created_at).toLocaleDateString()}</div>
        <div class="saved-search-actions">
          <button class="load" data-id="${search.id}">Load</button>
          <button class="delete" data-id="${search.id}">Delete</button>
        </div>
      `;

      item.querySelector('.load').addEventListener('click', async () => {
        try {
          const filters = await window.electron.loadSavedSearch(search.id);
          applySavedSearchFilters(filters);
          document.getElementById('saved-searches-dialog').close();
        } catch (error) {
          alert('Error loading search: ' + error.message);
        }
      });

      item.querySelector('.delete').addEventListener('click', async () => {
        if (confirm(`Delete search "${search.name}"?`)) {
          try {
            await window.electron.deleteSavedSearch(search.id);
            await loadSavedSearches();
          } catch (error) {
            alert('Error deleting search: ' + error.message);
          }
        }
      });

      list.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading saved searches:', error);
  }
}

async function doSaveSearch() {
  const name = document.getElementById('search-name').value;

  if (!name) {
    alert('Please enter a search name');
    return;
  }

  try {
    // Get current filter state
    const filters = {
      designer: document.getElementById('designer-select')?.value || '',
      license: document.getElementById('license-select')?.value || '',
      parentModel: document.getElementById('parent-select')?.value || '',
      printed: document.getElementById('printed-select')?.value || 'all',
      tag: document.getElementById('tag-filter')?.value || '',
      fileType: document.getElementById('filetype-select')?.value || '',
      search: document.getElementById('search-filter-input')?.value || '',
      sortOption: document.getElementById('sort-select')?.value || 'date-desc'
    };

    await window.electron.saveSearch(name, filters);
    document.getElementById('save-search-dialog').close();
    alert('Search saved!');
  } catch (error) {
    alert('Error saving search: ' + error.message);
  }
}

function applySavedSearchFilters(filters) {
  // Apply filters to UI
  if (document.getElementById('designer-select')) document.getElementById('designer-select').value = filters.designer || '';
  if (document.getElementById('license-select')) document.getElementById('license-select').value = filters.license || '';
  if (document.getElementById('parent-select')) document.getElementById('parent-select').value = filters.parentModel || '';
  if (document.getElementById('printed-select')) document.getElementById('printed-select').value = filters.printed || 'all';
  if (document.getElementById('tag-filter')) document.getElementById('tag-filter').value = filters.tag || '';
  if (document.getElementById('filetype-select')) document.getElementById('filetype-select').value = filters.fileType || '';
  if (document.getElementById('search-filter-input')) document.getElementById('search-filter-input').value = filters.search || '';
  if (document.getElementById('sort-select')) document.getElementById('sort-select').value = filters.sortOption || 'date-desc';

  // Trigger search
  if (typeof window.performCombinedSearch === 'function') {
    window.performCombinedSearch();
  }
}

// ========================================================================
// Helper Functions
// ========================================================================

function createModelCard(model) {
  const card = document.createElement('div');
  card.className = 'model-card';
  card.innerHTML = `
    <img src="${model.thumbnail || 'logo.png'}" alt="${model.fileName}">
    <div class="model-info">
      <div class="model-name">${model.fileName}</div>
      <div class="model-designer">${model.designer || 'Unknown'}</div>
    </div>
  `;
  return card;
}

// ========================================================================
// Initialize All Features
// ========================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing enhanced features UI...');

  try {
    initializeSmartCollections();
    initializeFileWatcher();
    initializePrintQueue();
    initializeStatistics();
    initializeFavorites();
    initializeCustomFields();
    initializeBulkRename();
    initializeRecentModels();
    initializeCollectionExportImport();
    initializeSavedSearches();

    console.log('Enhanced features UI initialized successfully');
  } catch (error) {
    console.error('Error initializing enhanced features:', error);
  }
});

// ========================================================================
// FEATURE 11: Model Groups (Folders) with Hierarchical Tags
// ========================================================================

let allGroups = [];
let selectedModels = new Set();
let isMultiSelectMode = false;

// Initialize group features
function initializeGroupFeatures() {
  // Group Manager
  document.getElementById('create-new-group-btn')?.addEventListener('click', showCreateGroupDialog);
  document.getElementById('save-group-btn')?.addEventListener('click', saveGroup);
  document.getElementById('cancel-group-btn')?.addEventListener('click', () => {
    document.getElementById('create-group-dialog').close();
  });

  // Create Group from Selection
  document.getElementById('create-selection-group-btn')?.addEventListener('click', createGroupFromSelection);
  document.getElementById('cancel-selection-group-btn')?.addEventListener('click', () => {
    document.getElementById('create-group-from-selection-dialog').close();
  });

  // Group Thumbnail Preview
  document.getElementById('group-thumbnail-file')?.addEventListener('change', previewGroupThumbnail);

  // Group Tag Manager
  document.getElementById('group-tag-input')?.addEventListener('input', showGroupTagSuggestions);
  document.getElementById('group-tag-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTagToGroup();
    }
  });

  // Hierarchical Search
  document.getElementById('do-hierarchical-search-btn')?.addEventListener('click', performHierarchicalSearch);

  // Initialize multi-select mode listeners
  initializeMultiSelect();
}

// Show Group Manager
async function showGroupManager() {
  try {
    allGroups = await window.electron.getModelGroups();
    renderGroupsGrid();
    document.getElementById('group-manager-dialog').showModal();
  } catch (error) {
    console.error('Error loading groups:', error);
    alert('Failed to load groups: ' + error.message);
  }
}

// Render Groups Grid
function renderGroupsGrid() {
  const grid = document.getElementById('groups-grid');
  if (!grid) return;

  if (allGroups.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: #888;">No groups yet. Create your first group!</p>';
    return;
  }

  grid.innerHTML = allGroups.map(group => `
    <div class="group-card ${group.parent_group_id ? 'has-parent' : ''}" data-group-id="${group.id}">
      <div class="group-actions">
        <button class="group-action-btn" onclick="editGroup(${group.id})" title="Edit">✏️</button>
        <button class="group-action-btn" onclick="manageGroupTags(${group.id})" title="Manage Tags">🏷️</button>
        <button class="group-action-btn" onclick="deleteGroup(${group.id})" title="Delete">🗑️</button>
      </div>
      <div class="group-thumbnail ${group.thumbnail ? '' : 'placeholder'}" onclick="openGroup(${group.id})">
        ${group.thumbnail ? `<img src="${group.thumbnail}" alt="${group.name}">` : '📁'}
      </div>
      <div class="group-info" onclick="openGroup(${group.id})">
        <h4>${escapeHtml(group.name)}</h4>
        <p>${group.description || 'No description'}</p>
      </div>
      <div class="group-stats">
        <span>📦 ${group.model_count || 0} models</span>
        ${group.tag_names ? `<span>🏷️ ${group.tag_names.split(',').length}</span>` : ''}
      </div>
    </div>
  `).join('');
}

// Show Create Group Dialog
async function showCreateGroupDialog() {
  document.getElementById('create-group-title').textContent = 'Create Group';
  document.getElementById('edit-group-id').value = '';
  document.getElementById('group-name').value = '';
  document.getElementById('group-description').value = '';
  document.getElementById('group-thumbnail-file').value = '';
  document.getElementById('group-thumbnail-preview').innerHTML = '';
  document.getElementById('group-thumbnail-preview').classList.remove('has-image');

  // Populate parent group dropdown
  await populateGroupParentDropdown();

  document.getElementById('create-group-dialog').showModal();
}

// Populate Parent Group Dropdown
async function populateGroupParentDropdown(currentGroupId = null) {
  const select = document.getElementById('group-parent');
  const selectionSelect = document.getElementById('selection-group-parent');

  const groups = await window.electron.getModelGroups();
  const options = groups
    .filter(g => g.id !== currentGroupId) // Don't allow self as parent
    .map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`)
    .join('');

  if (select) {
    select.innerHTML = '<option value="">None (Top Level)</option>' + options;
  }
  if (selectionSelect) {
    selectionSelect.innerHTML = '<option value="">None (Top Level)</option>' + options;
  }
}

// Preview Group Thumbnail
function previewGroupThumbnail(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('group-thumbnail-preview');
    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    preview.classList.add('has-image');
  };
  reader.readAsDataURL(file);
}

// Save Group
async function saveGroup(event) {
  event.preventDefault();

  const id = document.getElementById('edit-group-id').value;
  const name = document.getElementById('group-name').value.trim();
  const description = document.getElementById('group-description').value.trim();
  const parentId = document.getElementById('group-parent').value;
  const thumbnailFile = document.getElementById('group-thumbnail-file').files[0];

  if (!name) {
    alert('Please enter a group name');
    return;
  }

  try {
    let thumbnailBase64 = null;
    if (thumbnailFile) {
      thumbnailBase64 = await fileToBase64(thumbnailFile);
    }

    const groupData = {
      name,
      description,
      parent_group_id: parentId || null,
      thumbnail: thumbnailBase64
    };

    if (id) {
      groupData.id = parseInt(id);
      await window.electron.updateModelGroup(groupData);
    } else {
      await window.electron.createModelGroup(groupData);
    }

    document.getElementById('create-group-dialog').close();
    showGroupManager(); // Refresh
    showNotification(`Group "${name}" ${id ? 'updated' : 'created'} successfully!`);
  } catch (error) {
    console.error('Error saving group:', error);
    alert('Failed to save group: ' + error.message);
  }
}

// Edit Group
async function editGroup(groupId) {
  try {
    const group = await window.electron.getModelGroup(groupId);
    if (!group) return;

    document.getElementById('create-group-title').textContent = 'Edit Group';
    document.getElementById('edit-group-id').value = group.id;
    document.getElementById('group-name').value = group.name;
    document.getElementById('group-description').value = group.description || '';

    await populateGroupParentDropdown(group.id);
    document.getElementById('group-parent').value = group.parent_group_id || '';

    if (group.thumbnail) {
      const preview = document.getElementById('group-thumbnail-preview');
      preview.innerHTML = `<img src="${group.thumbnail}" alt="Preview">`;
      preview.classList.add('has-image');
    }

    document.getElementById('create-group-dialog').showModal();
  } catch (error) {
    console.error('Error loading group:', error);
    alert('Failed to load group: ' + error.message);
  }
}

// Delete Group
async function deleteGroup(groupId) {
  const group = allGroups.find(g => g.id === groupId);
  if (!group) return;

  if (!confirm(`Delete group "${group.name}"?\n\nThis will not delete the models, only the group.`)) {
    return;
  }

  try {
    await window.electron.deleteModelGroup(groupId);
    showGroupManager(); // Refresh
    showNotification(`Group "${group.name}" deleted successfully!`);
  } catch (error) {
    console.error('Error deleting group:', error);
    alert('Failed to delete group: ' + error.message);
  }
}

// Open Group (show models in group)
async function openGroup(groupId) {
  try {
    const group = await window.electron.getModelGroup(groupId);
    if (!group || !group.models) return;

    // Close group manager
    document.getElementById('group-manager-dialog').close();

    // Filter main view to show only these models
    // This assumes there's a function to display specific models
    if (typeof displayModels === 'function') {
      displayModels(group.models);
    }

    showNotification(`Showing ${group.models.length} models from "${group.name}"`);
  } catch (error) {
    console.error('Error opening group:', error);
    alert('Failed to open group: ' + error.message);
  }
}

// Show Create Group from Selection Dialog
async function showCreateGroupFromSelection() {
  if (selectedModels.size === 0) {
    alert('Please select at least one model first');
    return;
  }

  document.getElementById('selected-models-count').textContent = selectedModels.size;
  document.getElementById('selection-group-name').value = '';
  document.getElementById('selection-group-description').value = '';
  document.getElementById('use-first-model-thumbnail').checked = true;

  await populateGroupParentDropdown();

  document.getElementById('create-group-from-selection-dialog').showModal();
}

// Create Group from Selection
async function createGroupFromSelection(event) {
  event.preventDefault();

  const name = document.getElementById('selection-group-name').value.trim();
  const description = document.getElementById('selection-group-description').value.trim();
  const parentId = document.getElementById('selection-group-parent').value;
  const useFirstThumbnail = document.getElementById('use-first-model-thumbnail').checked;

  if (!name) {
    alert('Please enter a group name');
    return;
  }

  try {
    // Create group
    const groupData = {
      name,
      description,
      parent_group_id: parentId || null
    };

    const groupId = await window.electron.createModelGroup(groupData);

    // Add models to group
    const modelIds = Array.from(selectedModels);
    await window.electron.addModelsToGroup(groupId, modelIds);

    // Use first model's thumbnail if requested
    if (useFirstThumbnail && modelIds.length > 0) {
      const firstModel = await window.electron.getModel(modelIds[0]);
      if (firstModel && firstModel.thumbnail) {
        await window.electron.updateModelGroup({
          id: groupId,
          thumbnail: firstModel.thumbnail
        });
      }
    }

    document.getElementById('create-group-from-selection-dialog').close();
    clearSelection();
    showNotification(`Group "${name}" created with ${modelIds.length} models!`);
  } catch (error) {
    console.error('Error creating group from selection:', error);
    alert('Failed to create group: ' + error.message);
  }
}

// Manage Group Tags
async function manageGroupTags(groupId) {
  try {
    const group = await window.electron.getModelGroup(groupId);
    if (!group) return;

    document.getElementById('tag-manager-group-id').value = groupId;
    document.getElementById('tag-manager-group-name').textContent = group.name;
    document.getElementById('group-tag-input').value = '';

    // Load current tags
    await refreshGroupTags(groupId);

    document.getElementById('group-tag-manager-dialog').showModal();
  } catch (error) {
    console.error('Error loading group tags:', error);
    alert('Failed to load group tags: ' + error.message);
  }
}

// Refresh Group Tags Display
async function refreshGroupTags(groupId) {
  try {
    const tags = await window.electron.getGroupTags(groupId);
    const container = document.getElementById('group-current-tags');

    if (tags.length === 0) {
      container.innerHTML = '<p style="color: #888; margin: 10px;">No tags assigned</p>';
      return;
    }

    container.innerHTML = tags.map(tag => `
      <div class="tag-item">
        <span>${escapeHtml(tag.name)}</span>
        <span class="remove-tag" onclick="removeTagFromGroup(${groupId}, ${tag.id})">×</span>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error refreshing group tags:', error);
  }
}

// Show Tag Suggestions for Groups
async function showGroupTagSuggestions(event) {
  const input = event.target.value.trim();
  const suggestionsDiv = document.getElementById('group-tag-suggestions');

  if (input.length < 1) {
    suggestionsDiv.classList.remove('active');
    return;
  }

  try {
    const allTags = await window.electron.getAllTags();
    const matches = allTags.filter(tag =>
      tag.name.toLowerCase().includes(input.toLowerCase())
    );

    if (matches.length === 0) {
      suggestionsDiv.innerHTML = '<div class="tag-suggestion-item">Press Enter to create new tag</div>';
    } else {
      suggestionsDiv.innerHTML = matches.map(tag => `
        <div class="tag-suggestion-item" onclick="selectGroupTag('${escapeHtml(tag.name)}')">
          ${escapeHtml(tag.name)}
        </div>
      `).join('');
    }

    suggestionsDiv.classList.add('active');
  } catch (error) {
    console.error('Error loading tag suggestions:', error);
  }
}

// Select Group Tag from Suggestions
function selectGroupTag(tagName) {
  document.getElementById('group-tag-input').value = tagName;
  document.getElementById('group-tag-suggestions').classList.remove('active');
  addTagToGroup();
}

// Add Tag to Group
async function addTagToGroup() {
  const groupId = parseInt(document.getElementById('tag-manager-group-id').value);
  const tagName = document.getElementById('group-tag-input').value.trim();

  if (!tagName) return;

  try {
    // Create tag if doesn't exist
    let tagId;
    const allTags = await window.electron.getAllTags();
    const existingTag = allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());

    if (existingTag) {
      tagId = existingTag.id;
    } else {
      tagId = await window.electron.createTag(tagName);
    }

    // Add tag to group
    await window.electron.addTagsToGroup(groupId, [tagId]);

    // Refresh display
    await refreshGroupTags(groupId);

    // Clear input
    document.getElementById('group-tag-input').value = '';
    document.getElementById('group-tag-suggestions').classList.remove('active');

    showNotification(`Tag "${tagName}" added to group`);
  } catch (error) {
    console.error('Error adding tag to group:', error);
    alert('Failed to add tag: ' + error.message);
  }
}

// Remove Tag from Group
async function removeTagFromGroup(groupId, tagId) {
  try {
    await window.electron.removeTagsFromGroup(groupId, [tagId]);
    await refreshGroupTags(groupId);
    showNotification('Tag removed from group');
  } catch (error) {
    console.error('Error removing tag from group:', error);
    alert('Failed to remove tag: ' + error.message);
  }
}

// Initialize Multi-Select Mode
function initializeMultiSelect() {
  // Add event listener to toggle multi-select mode
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (!isMultiSelectMode) {
        enableMultiSelectMode();
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    if (!e.ctrlKey && !e.metaKey) {
      // Keep mode active if there are selections
      if (selectedModels.size === 0) {
        disableMultiSelectMode();
      }
    }
  });
}

// Enable Multi-Select Mode
function enableMultiSelectMode() {
  isMultiSelectMode = true;
  document.body.classList.add('multi-select-mode');

  // Show banner
  const banner = getOrCreateMultiSelectBanner();
  banner.classList.add('active');

  // Show all checkboxes
  document.querySelectorAll('.model-checkbox').forEach(cb => {
    cb.style.opacity = '1';
  });
}

// Disable Multi-Select Mode
function disableMultiSelectMode() {
  isMultiSelectMode = false;
  document.body.classList.remove('multi-select-mode');

  const banner = document.getElementById('multi-select-banner');
  if (banner) {
    banner.classList.remove('active');
  }
}

// Get or Create Multi-Select Banner
function getOrCreateMultiSelectBanner() {
  let banner = document.getElementById('multi-select-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'multi-select-banner';
    banner.className = 'multi-select-banner';
    banner.innerHTML = `
      <span id="selection-count">0 selected</span>
      <button onclick="showCreateGroupFromSelection()">Create Group</button>
      <button onclick="addSelectedToExistingGroup()">Add to Group</button>
      <button onclick="clearSelection()">Clear</button>
    `;
    document.body.appendChild(banner);
  }
  return banner;
}

// Toggle Model Selection
function toggleModelSelection(modelId, checkbox) {
  if (checkbox.checked) {
    selectedModels.add(modelId);
    checkbox.closest('.model-item')?.classList.add('selected');
  } else {
    selectedModels.delete(modelId);
    checkbox.closest('.model-item')?.classList.remove('selected');
  }

  updateSelectionCount();

  if (selectedModels.size > 0) {
    enableMultiSelectMode();
  } else if (!event.ctrlKey && !event.metaKey) {
    disableMultiSelectMode();
  }
}

// Update Selection Count
function updateSelectionCount() {
  const countSpan = document.getElementById('selection-count');
  if (countSpan) {
    countSpan.textContent = `${selectedModels.size} selected`;
  }
}

// Clear Selection
function clearSelection() {
  selectedModels.clear();
  document.querySelectorAll('.model-checkbox').forEach(cb => {
    cb.checked = false;
  });
  document.querySelectorAll('.model-item.selected').forEach(item => {
    item.classList.remove('selected');
  });
  disableMultiSelectMode();
  updateSelectionCount();
}

// Add Selected to Existing Group
async function addSelectedToExistingGroup() {
  if (selectedModels.size === 0) {
    alert('No models selected');
    return;
  }

  try {
    const groups = await window.electron.getModelGroups();

    if (groups.length === 0) {
      alert('No groups available. Create a group first.');
      return;
    }

    // Show simple selection dialog
    const groupName = prompt('Enter group name:\n\n' + groups.map(g => g.name).join('\n'));
    if (!groupName) return;

    const group = groups.find(g => g.name === groupName);
    if (!group) {
      alert('Group not found');
      return;
    }

    const modelIds = Array.from(selectedModels);
    await window.electron.addModelsToGroup(group.id, modelIds);

    clearSelection();
    showNotification(`Added ${modelIds.length} models to "${group.name}"`);
  } catch (error) {
    console.error('Error adding to group:', error);
    alert('Failed to add to group: ' + error.message);
  }
}

// Perform Hierarchical Search
async function performHierarchicalSearch() {
  const query = document.getElementById('hier-search-query').value.trim();
  const searchModels = document.getElementById('search-models').checked;
  const searchGroups = document.getElementById('search-groups').checked;
  const searchTags = document.getElementById('search-tags').checked;

  if (!query) {
    alert('Please enter a search query');
    return;
  }

  try {
    const results = await window.electron.searchAllLevels({
      query,
      searchModels,
      searchGroups,
      searchTags
    });

    renderHierarchicalSearchResults(results);
  } catch (error) {
    console.error('Error performing hierarchical search:', error);
    alert('Search failed: ' + error.message);
  }
}

// Render Hierarchical Search Results
function renderHierarchicalSearchResults(results) {
  const container = document.getElementById('hierarchical-search-results');

  if (!results || (results.models?.length === 0 && results.groups?.length === 0)) {
    container.innerHTML = '<p style="text-align: center; color: #888;">No results found</p>';
    return;
  }

  let html = '';

  if (results.groups?.length > 0) {
    html += '<h4 style="margin-top: 0;">Groups</h4>';
    results.groups.forEach(group => {
      html += `
        <div class="search-result-item" onclick="openGroup(${group.id})">
          <span class="search-result-type group">GROUP</span>
          <span class="search-result-name">${escapeHtml(group.name)}</span>
          <div class="search-result-path">${group.model_count || 0} models</div>
        </div>
      `;
    });
  }

  if (results.models?.length > 0) {
    html += '<h4>Models</h4>';
    results.models.forEach(model => {
      html += `
        <div class="search-result-item" onclick="viewModelDetails(${model.id})">
          <span class="search-result-type model">MODEL</span>
          <span class="search-result-name">${escapeHtml(model.fileName)}</span>
          <div class="search-result-path">${escapeHtml(model.filePath)}</div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
}

// Helper: Convert File to Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper: Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper: Show Notification
function showNotification(message) {
  // Simple notification - can be enhanced with a toast library
  console.log('Notification:', message);

  // If there's a notification element, use it
  const notif = document.getElementById('notification');
  if (notif) {
    notif.textContent = message;
    notif.style.display = 'block';
    setTimeout(() => {
      notif.style.display = 'none';
    }, 3000);
  } else {
    // Fallback to alert for important messages
    if (message.includes('error') || message.includes('failed')) {
      alert(message);
    }
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGroupFeatures);
} else {
  initializeGroupFeatures();
}

// Make functions globally available
window.showGroupManager = showGroupManager;
window.editGroup = editGroup;
window.deleteGroup = deleteGroup;
window.openGroup = openGroup;
window.manageGroupTags = manageGroupTags;
window.removeTagFromGroup = removeTagFromGroup;
window.selectGroupTag = selectGroupTag;
window.toggleModelSelection = toggleModelSelection;
window.clearSelection = clearSelection;
window.showCreateGroupFromSelection = showCreateGroupFromSelection;
window.addSelectedToExistingGroup = addSelectedToExistingGroup;
