const { contextBridge, ipcRenderer, shell } = require('electron');
const { version } = require('./package.json');

contextBridge.exposeInMainWorld('electron', {
  isServerMode: () => ipcRenderer.invoke('is-server-mode'),
  loadDirectory: () => ipcRenderer.invoke('load-directory'),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveDirectory: (directoryPath) => ipcRenderer.invoke('save-directory', directoryPath),
  scanDirectory: (directoryPath) => ipcRenderer.invoke('scan-directory', directoryPath),
  getModel: (filePath) => ipcRenderer.invoke('get-model', filePath),
  getModelsFiltered: (filters) => ipcRenderer.invoke('get-models-filtered', filters),
  saveModel: (modelData) => ipcRenderer.invoke('save-model', modelData),
  saveModelBatch: (modelDataBatch) => ipcRenderer.invoke('save-model-batch', modelDataBatch),
  updateModelsBatch: (modelDataBatch) => ipcRenderer.invoke('update-models-batch', modelDataBatch),
  saveThumbnail: (filePath, thumbnail) => ipcRenderer.invoke('save-thumbnail', filePath, thumbnail),
  getDesigners: () => ipcRenderer.invoke('get-designers'),
  getLicenses: () => ipcRenderer.invoke('get-licenses'),
  getModelsByDesigner: (designer) => ipcRenderer.invoke('get-models-by-designer', designer),
  showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),
  openPath: (path) => ipcRenderer.invoke('open-path', path),
  getAllModels: (sortOption, limit) => ipcRenderer.invoke('get-all-models', sortOption, limit),
  getTotalModelCount: () => ipcRenderer.invoke('getTotalModelCount'),
  getParentModels: () => ipcRenderer.invoke('get-parent-models'),
  getAllTags: () => ipcRenderer.invoke('get-all-tags'),
  saveTag: (tagName) => ipcRenderer.invoke('save-tag', tagName),
  deleteTag: (tagId) => ipcRenderer.invoke('delete-tag', tagId),
  getTagModelCount: (tagId) => ipcRenderer.invoke('get-tag-model-count', tagId),
  onOpenTagManager: (callback) => ipcRenderer.on('open-tag-manager', callback),
  getAllMetadata: () => ipcRenderer.invoke('get-all-metadata'),
  getStats: () => ipcRenderer.invoke('get-stats'),
  renameMetadata: (type, oldName, newName) => ipcRenderer.invoke('rename-metadata', type, oldName, newName),
  deleteMetadata: (type, name) => ipcRenderer.invoke('delete-metadata', type, name),
  onOpenMetadataEditor: (callback) => ipcRenderer.on('open-metadata-editor', callback),
  getModelTags: (modelId) => ipcRenderer.invoke('get-model-tags', modelId),
  saveModelTags: (modelId, tagIds) => ipcRenderer.invoke('save-model-tags', modelId, tagIds),
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  saveSetting: (key, value) => ipcRenderer.invoke('save-setting', key, value),
  checkCollectUsage: () => ipcRenderer.invoke('check-collect-usage'),
  purgeThumbnails: () => ipcRenderer.invoke('purge-thumbnails'),
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
  onOpenGuide: (callback) => ipcRenderer.on('open-guide', callback),
  trackEvent: (category, action, label, value) => ipcRenderer.invoke('track-event', category, action, label, value),
  onOpenAbout: (callback) => {
    ipcRenderer.on('open-about', async () => {
      await callback();
    });
  },
  onOpenServerModeInfo: (callback) => {
    ipcRenderer.on('open-server-mode-info', async () => {
      await callback();
    });
  },
  onOpenStats: (callback) => {
    ipcRenderer.on('open-stats', async () => {
      await callback();
    });
  },
  showMessage: (title, message, buttons) => ipcRenderer.invoke('show-message', title, message, buttons),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  onOpenBackupRestore: (callback) => ipcRenderer.on('open-backup-restore', callback),
  backupDatabase: () => ipcRenderer.invoke('backup-database'),
  restoreDatabase: () => ipcRenderer.invoke('restore-database'),
  exportLibrary: () => ipcRenderer.invoke('export-library'),
  importLibrary: () => ipcRenderer.invoke('import-library'),
  getDuplicateFiles: () => ipcRenderer.invoke('get-duplicate-files'),
  onOpenDeDup: (callback) => ipcRenderer.on('open-dedup', callback),
  checkFilesExist: (filePaths) => ipcRenderer.invoke('check-files-exist', filePaths),
  deleteFile: (filePath) => {
    console.log('preload: deleteFile called with:', filePath);
    return ipcRenderer.invoke('delete-file', filePath);
  },
  fetchThangsPage: (url) => ipcRenderer.invoke('fetch-thangs-page', url),
  purgeModels: () => ipcRenderer.invoke('purge-models'),
  onOpenPurgeModels: (callback) => ipcRenderer.on('open-purge-models', callback),
  onGenerateMissingThumbnails: (callback) => ipcRenderer.on('generate-missing-thumbnails', callback),
  onPingRequest: (callback) => ipcRenderer.on('ping', callback),
  showContextMenu: (filePath) => ipcRenderer.invoke('show-context-menu', filePath),
  onRefreshGrid: (callback) => ipcRenderer.on('refresh-grid', callback),
  onThumbnailAdded: (callback) => ipcRenderer.on('thumbnail-added', (event, data) => callback(data)),
  onOpenThemeSettings: (callback) => ipcRenderer.on('open-theme-settings', callback),
  quitApp: () => ipcRenderer.invoke('quitApp'),
  onOpenPerformanceSettings: (callback) => ipcRenderer.on('open-performance-settings', callback),
  get3MFImages: (filePath) => {
    console.log('preload: get3MFImages called with:', filePath);
    return ipcRenderer.invoke('get3MFImages', filePath);
  },
  get3MFSTL: (filePath) => {
    console.log('preload: get3MFSTL called with:', filePath);
    return ipcRenderer.invoke('get3MFSTL', filePath);
  },
  extractModelFromZip: (filePath) => ipcRenderer.invoke('extract-model-from-zip', filePath),
  extractZipArchive: (filePath, destinationPath) => ipcRenderer.invoke('extract-zip-archive', filePath, destinationPath),
  onScanProgress: (callback) => {
    ipcRenderer.on('scan-progress', (_, progress) => callback(progress));
  },
  onDbProgress: (callback) => {
    ipcRenderer.on('db-progress', (_, progress) => callback(progress));
  },
  onDbCleanup: (callback) => {
    ipcRenderer.on('db-cleanup', callback);
  },
  getDuplicates: (includeZip = false) => ipcRenderer.invoke('get-duplicates', includeZip),
  isGeneratingHashes: () => ipcRenderer.invoke('is-generating-hashes'),
  getModelsWithoutHash: () => ipcRenderer.invoke('getModelsWithoutHash'),
  generateMissingHashes: () => ipcRenderer.invoke('generateMissingHashes'),
  calculateFileHash: (filePath) => ipcRenderer.invoke('calculate-file-hash', filePath),
  onHashGenerationProgress: (callback) => {
    ipcRenderer.on('hash-generation-progress', (_, progress) => callback(progress));
  },
  getThumbnail: (filePath) => ipcRenderer.invoke('getThumbnail', filePath),
  getAllThumbnails: (filePath) => ipcRenderer.invoke('get-all-thumbnails', filePath),
  addThumbnail: (filePath, imageDataUrl) => ipcRenderer.invoke('add-thumbnail', filePath, imageDataUrl),
  addMultipleThumbnails: (filePath, imageDataUrls) => ipcRenderer.invoke('add-multiple-thumbnails', filePath, imageDataUrls),
  setDefaultThumbnail: (filePath, index) => ipcRenderer.invoke('set-default-thumbnail', filePath, index),
  onStartPrintRoulette: (callback) => {
    ipcRenderer.on('start-print-roulette', callback);
  },
  checkForUpdates: (isBeta) => ipcRenderer.invoke('check-for-updates', isBeta),
  openUpdatePage: (isBeta) => ipcRenderer.invoke('open-update-page', isBeta),
  onOpenSTLHome: (callback) => ipcRenderer.on('open-stl-home', callback),
  send: (channel, ...args) => {
    // Optionally add a whitelist of channels if needed for security
    const validChannels = [
      'pong',
      'native-prompt-response',
      'puter-ai-chat-response'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    } else {
      ipcRenderer.send(channel, ...args);
    }
  },
  on: (channel, callback) => {
    const validChannels = [
      'ping', 
      'open-ai-config', 
      'open-file-type-settings',
      'tags-generated', 
      'show-progress-dialog',
      'update-progress',
      'close-progress-dialog',
      'start-single-tag-generation',
      'start-batch-tag-generation',
      'batch-tag-generation-complete',
      'show-input-dialog',
      'puter-ai-chat-request',
      'regenerate-thumbnails',
      'generate-missing-thumbnails',
      /* other valid channels */
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
    if (channel === 'open-guide') {
      ipcRenderer.on(channel, (event) => callback());
    }
  },
  invoke: (channel, data) => {
    const validChannels = [
      'show-input-dialog',
      // ... other valid channels ...
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    return ipcRenderer.invoke(channel, data);
  },
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  openSlicerDialog: (title) => ipcRenderer.invoke('open-slicer-dialog', title),
  testAIConfig: (apiKey, baseURL, model, service) => ipcRenderer.invoke('test-ai-config', apiKey, baseURL, model, service),
  generateTags: (filePath) => ipcRenderer.invoke('generate-tags', filePath),
  puterAIChat: (prompt, imageUrl, model) => ipcRenderer.invoke('puter-ai-chat', prompt, imageUrl, model),
  getModelsWithoutThumbnails: () => ipcRenderer.invoke('get-models-without-thumbnails'),
  getModelsWithDefaultThumbnails: () => ipcRenderer.invoke('get-models-with-default-thumbnails'),
  pong: () => ipcRenderer.send('pong'),
  fetchMakerWorldPage: (url) => ipcRenderer.invoke('fetch-makerworld-page', url),
  onOpenSlicerSettings: (callback) => ipcRenderer.on('open-slicer-settings', callback),
  getSlicers: () => ipcRenderer.invoke('get-slicers'),
  saveSlicer: (slicer) => ipcRenderer.invoke('save-slicer', slicer),
  deleteSlicer: (id) => ipcRenderer.invoke('delete-slicer', id),
  clearAndSaveSlicers: (slicers) => ipcRenderer.invoke('clear-and-save-slicers', slicers),
  getAppVersion: () => version,
  getFileStats: (filePath) => ipcRenderer.invoke('get-file-stats', filePath),
  startTransaction: () => ipcRenderer.invoke('database:start-transaction'),
  commitTransaction: () => ipcRenderer.invoke('database:commit-transaction'),
  rollbackTransaction: () => ipcRenderer.invoke('database:rollback-transaction'),
  getAllModelReferences: () => ipcRenderer.invoke('get-all-model-references'),
  showInputDialog: (options) => ipcRenderer.invoke('show-input-dialog', options),
  pull3MFMetadata: (filePaths) => ipcRenderer.invoke('pull-3mf-metadata', filePaths),

  // NEW FEATURES: Enhanced functionality
  // FEATURE 1: Smart Collections
  getSmartCollections: () => ipcRenderer.invoke('get-smart-collections'),
  getSmartCollection: (id) => ipcRenderer.invoke('get-smart-collection', id),
  saveSmartCollection: (collection) => ipcRenderer.invoke('save-smart-collection', collection),
  deleteSmartCollection: (id) => ipcRenderer.invoke('delete-smart-collection', id),
  getSmartCollectionModels: (id) => ipcRenderer.invoke('get-smart-collection-models', id),
  onOpenSmartCollections: (callback) => ipcRenderer.on('open-smart-collections', callback),

  // FEATURE 2: File Watcher
  getWatchedDirectories: () => ipcRenderer.invoke('get-watched-directories'),
  addWatchedDirectory: (path) => ipcRenderer.invoke('add-watched-directory', path),
  removeWatchedDirectory: (id) => ipcRenderer.invoke('remove-watched-directory', id),
  toggleWatchedDirectory: (id, enabled) => ipcRenderer.invoke('toggle-watched-directory', id, enabled),
  onFileWatcherScan: (callback) => ipcRenderer.on('file-watcher-scan', (event, path) => callback(path)),

  // FEATURE 3: Print Queue & History
  getPrintQueue: () => ipcRenderer.invoke('get-print-queue'),
  addToPrintQueue: (modelId, priority, notes) => ipcRenderer.invoke('add-to-print-queue', modelId, priority, notes),
  removeFromPrintQueue: (id) => ipcRenderer.invoke('remove-from-print-queue', id),
  reorderPrintQueue: (items) => ipcRenderer.invoke('reorder-print-queue', items),
  getPrintHistory: (modelId) => ipcRenderer.invoke('get-print-history', modelId),
  addToPrintHistory: (data) => ipcRenderer.invoke('add-to-print-history', data),
  markAsPrinted: (modelId) => ipcRenderer.invoke('mark-as-printed', modelId),
  onOpenPrintQueue: (callback) => ipcRenderer.on('open-print-queue', callback),
  onOpenPrintHistory: (callback) => ipcRenderer.on('open-print-history', callback),

  // FEATURE 4: Recent Models (History)
  getRecentModels: (limit) => ipcRenderer.invoke('get-recent-models', limit),
  addToRecent: (modelId) => ipcRenderer.invoke('add-to-recent', modelId),
  clearRecentModels: () => ipcRenderer.invoke('clear-recent-models'),
  onOpenRecentModels: (callback) => ipcRenderer.on('open-recent-models', callback),

  // FEATURE 5: Favorites/Bookmarks
  getFavorites: () => ipcRenderer.invoke('get-favorites'),
  addToFavorites: (modelId, notes) => ipcRenderer.invoke('add-to-favorites', modelId, notes),
  removeFromFavorites: (modelId) => ipcRenderer.invoke('remove-from-favorites', modelId),
  isFavorite: (modelId) => ipcRenderer.invoke('is-favorite', modelId),
  onOpenFavorites: (callback) => ipcRenderer.on('open-favorites', callback),

  // FEATURE 6: Custom Metadata Fields
  getCustomFields: () => ipcRenderer.invoke('get-custom-fields'),
  saveCustomField: (field) => ipcRenderer.invoke('save-custom-field', field),
  deleteCustomField: (id) => ipcRenderer.invoke('delete-custom-field', id),
  getModelCustomFields: (modelId) => ipcRenderer.invoke('get-model-custom-fields', modelId),
  saveModelCustomField: (modelId, fieldId, value) => ipcRenderer.invoke('save-model-custom-field', modelId, fieldId, value),
  onOpenCustomFields: (callback) => ipcRenderer.on('open-custom-fields', callback),

  // FEATURE 7: Bulk Rename Tool
  bulkRenameModels: (models, pattern) => ipcRenderer.invoke('bulk-rename-models', models, pattern),
  onOpenBulkRename: (callback) => ipcRenderer.on('open-bulk-rename', callback),

  // FEATURE 9: Collection Export/Import
  exportCollection: (options) => ipcRenderer.invoke('export-collection', options),
  importCollection: (filePath) => ipcRenderer.invoke('import-collection', filePath),
  onOpenCollectionExport: (callback) => ipcRenderer.on('open-collection-export', callback),
  onOpenCollectionImport: (callback) => ipcRenderer.on('open-collection-import', callback),

  // FEATURE 10: Saved Searches
  getSavedSearches: () => ipcRenderer.invoke('get-saved-searches'),
  saveSearch: (name, filters) => ipcRenderer.invoke('save-search', name, filters),
  deleteSavedSearch: (id) => ipcRenderer.invoke('delete-saved-search', id),
  loadSavedSearch: (id) => ipcRenderer.invoke('load-saved-search', id),
  onOpenSavedSearches: (callback) => ipcRenderer.on('open-saved-searches', callback),

  // FEATURE 4: Statistics Dashboard
  getStatistics: () => ipcRenderer.invoke('get-statistics'),
  onOpenStatistics: (callback) => ipcRenderer.on('open-statistics', callback)

  // FEATURE 11: Model Groups (Folders) with Images and Tags
  getModelGroups: () => ipcRenderer.invoke('get-model-groups'),
  getModelGroup: (id) => ipcRenderer.invoke('get-model-group', id),
  createModelGroup: (data) => ipcRenderer.invoke('create-model-group', data),
  updateModelGroup: (id, data) => ipcRenderer.invoke('update-model-group', id, data),
  deleteModelGroup: (id) => ipcRenderer.invoke('delete-model-group', id),
  addModelsToGroup: (groupId, modelIds) => ipcRenderer.invoke('add-models-to-group', groupId, modelIds),
  removeModelsFromGroup: (groupId, modelIds) => ipcRenderer.invoke('remove-models-from-group', groupId, modelIds),
  getModelGroupsForModel: (modelId) => ipcRenderer.invoke('get-model-groups-for-model', modelId),
  setGroupThumbnail: (groupId, thumbnail) => ipcRenderer.invoke('set-group-thumbnail', groupId, thumbnail),
  addTagsToGroup: (groupId, tagIds) => ipcRenderer.invoke('add-tags-to-group', groupId, tagIds),
  removeTagsFromGroup: (groupId, tagIds) => ipcRenderer.invoke('remove-tags-from-group', groupId, tagIds),
  getGroupTags: (groupId) => ipcRenderer.invoke('get-group-tags', groupId),
  searchAllLevels: (searchParams) => ipcRenderer.invoke('search-all-levels', searchParams),
  getTagHierarchy: (tagId) => ipcRenderer.invoke('get-tag-hierarchy', tagId),
  onOpenGroupManager: (callback) => ipcRenderer.on('open-group-manager', callback),
  onCreateGroupFromSelection: (callback) => ipcRenderer.on('create-group-from-selection', callback)
});

contextBridge.exposeInMainWorld('electronAPI', {
  getDb: () => ipcRenderer.invoke('get-db'),
  // ... other exposed functions
});

