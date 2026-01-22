# CLAUDE.md - AI Assistant Guide for Printventory

**Last Updated:** 2026-01-22
**Version:** 2.0.0

This document provides comprehensive guidance for AI assistants working on the Printventory codebase. It covers architecture, conventions, workflows, and best practices to help you make effective contributions.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Key Files & Directory Structure](#key-files--directory-structure)
4. [Database Schema](#database-schema)
5. [Development Workflows](#development-workflows)
6. [Code Conventions & Patterns](#code-conventions--patterns)
7. [Server Mode Architecture](#server-mode-architecture)
8. [Build & Deployment](#build--deployment)
9. [Common Tasks & Guidelines](#common-tasks--guidelines)
10. [Testing & Validation](#testing--validation)
11. [Troubleshooting & Gotchas](#troubleshooting--gotchas)

---

## Project Overview

**Printventory** is an Electron-based desktop application for managing 3D printing model collections. It provides file management, 3D model preview, tagging, duplicate detection, and AI-powered organization features.

### Key Features
- Directory scanning for STL, 3MF, and ZIP files
- 3D model thumbnails using Three.js
- Tagging system with AI-powered tag generation
- Duplicate detection via content hashing
- Multi-edit mode for batch operations
- Server mode for remote browser access
- Docker deployment support

### Target Platforms
- Windows (NSIS installer)
- macOS (Universal binary - Intel + Apple Silicon)
- Linux (AppImage)
- Docker (Linux containers)

### User Base
- 3D printing enthusiasts
- Designers managing large model collections
- Makerspaces and workshops

---

## Architecture & Technology Stack

### Application Type
**Three-Process Electron Application** (v39.2.4)

### Core Technologies
```json
{
  "electron": "^39.2.4",              // Desktop framework
  "better-sqlite3": "^12.5.0",        // Database
  "three": "^0.181.2",                // 3D rendering
  "express": "^4.18.2",               // Server mode HTTP
  "ws": "^8.14.2",                    // Server mode WebSocket
  "openai": "^6.9.1",                 // AI tagging
  "fuse.js": "^7.1.0",                // Fuzzy search
  "puppeteer": "^24.31.0",            // Browser automation
  "jszip": "^3.10.1",                 // ZIP handling
  "node-stream-zip": "^1.15.0"        // ZIP streaming
}
```

### Architecture Pattern

#### 1. Main Process (`main.js` - 245KB, ~6,976 lines)
**Role:** Core application logic, data management, system integration

**Responsibilities:**
- Database operations (SQLite via better-sqlite3)
- File system operations and scanning
- Server mode HTTP/WebSocket server
- IPC handler registration (80+ handlers)
- Window and menu management
- Analytics (Google Analytics 4)
- Settings management
- Thumbnail storage

**Key Functions:**
- `initializeDatabase()` - Sets up database schema and indexes
- `scanDirectory()` - Scans directories using worker threads
- `startServer()` - Launches Express server for server mode
- IPC handlers: `scan-directory`, `get-models`, `update-model`, etc.

#### 2. Renderer Process (`renderer.js` - 565KB, ~14,103 lines)
**Role:** User interface, 3D rendering, client-side logic

**Responsibilities:**
- UI rendering and event handling
- 3D model loading and rendering (Three.js)
- Thumbnail generation using WebGL
- Virtual scrolling for performance
- Client-side filtering and sorting
- Context menus and dialogs

**Key Components:**
- Three.js scene setup and management
- STLLoader and ThreeMFLoader
- Virtual scrolling implementation
- Filter and search UI
- Multi-edit mode

#### 3. Preload Script (`preload.js` - 10KB, ~197 lines)
**Role:** Secure bridge between main and renderer

**Exposes:**
```javascript
window.electron = {
  scanDirectory: (path) => ipcRenderer.invoke('scan-directory', path),
  getModels: (filters) => ipcRenderer.invoke('get-models', filters),
  updateModel: (id, data) => ipcRenderer.invoke('update-model', id, data),
  // ... 80+ more methods
}
```

### Supporting Modules

| Module | Lines | Purpose |
|--------|-------|---------|
| `server-bridge.js` | 405 | WebSocket bridge for server mode |
| `scan-worker.js` | 200 | Worker thread for directory scanning |
| `search.js` | 545 | Advanced search and filtering logic |
| `aitagging.js` | 570 | AI-powered tag generation |
| `slicer.js` | 171 | Slicer configuration management |
| `guide.js` | 264 | Interactive quickstart guide |

---

## Key Files & Directory Structure

```
Printventory/
├── main.js                   # Main process (Electron backend)
├── renderer.js               # Renderer process (UI and 3D rendering)
├── preload.js               # Secure IPC bridge
├── index.html               # Main UI structure
├── styles.css               # Application styling (116KB)
│
├── server-bridge.js         # WebSocket client for server mode
├── scan-worker.js           # Worker thread for scanning
├── search.js                # Search and filter logic
├── aitagging.js             # AI tagging integration
├── slicer.js                # Slicer management
├── guide.js                 # Quickstart guide
│
├── package.json             # Project config and dependencies
├── Dockerfile               # Docker container image
├── docker-compose.yml       # Docker deployment config
├── docker-entrypoint.sh     # Container startup script
│
├── scripts/                 # Build and deployment scripts
│   ├── build-linux-appimage.js
│   ├── create-docker-distribution.js
│   ├── docker-hub-push.js
│   └── cleanup-win-build.js
│
├── build/                   # Build resources
│   └── entitlements.mac.plist
│
├── guide/                   # Guide images and assets
│
├── logo.png                 # App icon (various formats)
├── logo.icns               # macOS icon
├── logo.ico                # Windows icon
│
├── README.md               # User documentation
├── GUIDE.md                # Feature guide
└── CLAUDE.md               # This file (AI assistant guide)
```

### File Size Context
- `main.js`: 245KB (complex backend logic)
- `renderer.js`: 565KB (extensive UI code)
- `styles.css`: 116KB (comprehensive styling)
- `printventory.db`: ~10MB (sample database)

---

## Database Schema

### Location
- **Windows**: `%LOCALAPPDATA%\Printventory\printventory.db`
- **macOS**: `~/Library/Application Support/Printventory/printventory.db`
- **Docker**: `/root/.config/Printventory/printventory.db`

### Tables

#### `models`
Primary table for all 3D model files.

```sql
CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filePath TEXT UNIQUE,           -- Full path or ZIP::entry format
    fileName TEXT,                  -- File name only
    designer TEXT,                  -- Designer name
    source TEXT,                    -- Source URL
    notes TEXT,                     -- User notes
    printed INTEGER,                -- 0=not printed, 1=printed
    thumbnail TEXT,                 -- Base64 PNG or file reference
    parentModel TEXT,               -- Parent model name (for variants)
    hash TEXT,                      -- MD5 hash for deduplication
    size INTEGER,                   -- File size in bytes
    license TEXT,                   -- License type
    modifiedDate DATETIME,          -- File modification timestamp
    dateAdded DATETIME              -- Added to database timestamp
);
```

**Indexes:**
```sql
-- Single column indexes
CREATE INDEX IF NOT EXISTS idx_filePath ON models(filePath);
CREATE INDEX IF NOT EXISTS idx_fileName ON models(fileName);
CREATE INDEX IF NOT EXISTS idx_designer ON models(designer);
CREATE INDEX IF NOT EXISTS idx_size ON models(size);
CREATE INDEX IF NOT EXISTS idx_modifiedDate ON models(modifiedDate);
CREATE INDEX IF NOT EXISTS idx_license ON models(license);
CREATE INDEX IF NOT EXISTS idx_parentModel ON models(parentModel);
CREATE INDEX IF NOT EXISTS idx_printed ON models(printed);
CREATE INDEX IF NOT EXISTS idx_hash ON models(hash);
CREATE INDEX IF NOT EXISTS idx_dateAdded ON models(dateAdded);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_designer_fileName ON models(designer, fileName);
CREATE INDEX IF NOT EXISTS idx_license_modifiedDate ON models(license, modifiedDate);
CREATE INDEX IF NOT EXISTS idx_printed_modifiedDate ON models(printed, modifiedDate);
CREATE INDEX IF NOT EXISTS idx_parentModel_modifiedDate ON models(parentModel, modifiedDate);
```

#### `tags`
Tag definitions (many-to-many with models).

```sql
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
);
```

#### `model_tags`
Junction table for model-tag relationships.

```sql
CREATE TABLE IF NOT EXISTS model_tags (
    model_id INTEGER,
    tag_id INTEGER,
    FOREIGN KEY(model_id) REFERENCES models(id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY(model_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_model_tags_model_id ON model_tags(model_id);
CREATE INDEX IF NOT EXISTS idx_model_tags_tag_id ON model_tags(tag_id);
```

#### `settings`
Application configuration (key-value store).

```sql
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
```

**Common Settings Keys:**
- `maxFileSize`: Maximum file size in MB (default: 50)
- `scanZips`: Enable ZIP scanning (0/1)
- `thumbnailSize`: Thumbnail size in pixels
- `theme`: UI theme name
- `backgroundColor`: Model background color
- `stlHome`: Auto-scan directory path
- `stlHomeUpdateFrequency`: Scan interval in minutes
- `aiApiKey`: OpenAI/Gemini API key
- `aiModel`: AI model name
- `slicerPath`: Path to slicer executable

#### `slicers`
External slicer configurations.

```sql
CREATE TABLE IF NOT EXISTS slicers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT NOT NULL
);
```

### Path Formats

**Desktop Mode:**
```
C:\Users\Name\Models\file.stl           (Windows)
/Users/Name/Models/file.stl              (macOS)
/home/user/models/file.stl               (Linux)
```

**Server Mode (Windows):**
```
\\server\share\models\file.stl           (UNC path)
```

**Server Mode (Docker):**
```
/mnt/network-share/models/file.stl       (Linux absolute path)
```

**ZIP Entries:**
```
C:\Models\archive.zip::subfolder/model.stl
```

---

## Development Workflows

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/printventory.git
cd printventory

# Install dependencies
npm install

# Run in development mode
npm start

# Run in server mode
npm start:server
```

### Development Mode
```bash
npm start
# Opens Electron window with DevTools available
# Changes require restart (no hot reload)
```

### Build Commands

```bash
# Build all platforms (Mac + Windows)
npm run build

# Build specific platforms
npm run build:mac      # Universal macOS binary
npm run build:win      # Windows NSIS installer
npm run build:linux    # Linux AppImage (requires WSL or Docker)

# Docker distribution
npm run build:docker   # Creates distribution package

# Docker Hub publishing
npm run docker:hub:all # Build, tag, and push to Docker Hub
```

### Git Workflow

**Branch Naming Convention:**
```
claude/add-feature-name-sessionId
claude/fix-bug-description-sessionId
```

**Example:**
```
claude/add-claude-documentation-bN77N
```

**Commit Message Format:**
```
Short description of changes

https://claude.ai/code/session_016JFivmSEnd837ZRdteAyYu
```

---

## Code Conventions & Patterns

### IPC Communication Pattern

**Main Process (handler):**
```javascript
ipcMain.handle('get-models', async (event, filters) => {
  try {
    // Database query
    const models = db.prepare('SELECT * FROM models WHERE ...').all();
    return { success: true, models };
  } catch (error) {
    console.error('Error getting models:', error);
    return { success: false, error: error.message };
  }
});
```

**Renderer Process (caller):**
```javascript
async function loadModels() {
  try {
    const result = await window.electron.getModels(filters);
    if (result.success) {
      displayModels(result.models);
    } else {
      showError(result.error);
    }
  } catch (error) {
    console.error('Failed to load models:', error);
  }
}
```

### Database Transaction Pattern

```javascript
// Use transactions for multi-query operations
const transaction = db.transaction((modelData) => {
  const insertModel = db.prepare('INSERT INTO models (...) VALUES (...)');
  const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
  const linkTag = db.prepare('INSERT INTO model_tags (...) VALUES (...)');

  const modelResult = insertModel.run(modelData);
  const modelId = modelResult.lastInsertRowid;

  for (const tag of modelData.tags) {
    insertTag.run(tag);
    const tagId = db.prepare('SELECT id FROM tags WHERE name = ?').get(tag).id;
    linkTag.run(modelId, tagId);
  }
});

// Execute transaction
try {
  transaction(modelData);
} catch (error) {
  console.error('Transaction failed:', error);
}
```

### 3D Model Loading Pattern

```javascript
// Load STL
const loader = new THREE.STLLoader();
loader.load(url, (geometry) => {
  geometry.computeVertexNormals();
  const material = new THREE.MeshPhongMaterial({ color: 0x888888 });
  const mesh = new THREE.Mesh(geometry, material);

  // Center and scale
  geometry.center();
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  mesh.scale.multiplyScalar(10 / maxDim);

  scene.add(mesh);
});

// Load 3MF
const loader3MF = new ThreeMFLoader();
loader3MF.load(url, (object) => {
  // 3MF can contain multiple objects
  scene.add(object);
});
```

### Error Handling Pattern

```javascript
// Always return structured responses
try {
  const result = performOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation failed:', error);
  return { success: false, error: error.message };
}

// In renderer, check success before using data
const result = await window.electron.someOperation();
if (!result.success) {
  showErrorDialog(result.error);
  return;
}
// Use result.data
```

### Path Handling Pattern

```javascript
// Server mode detection
const isServerMode = process.argv.includes('--server');

// Path validation (Windows server mode requires UNC)
function validatePath(path) {
  if (isServerMode && process.platform === 'win32') {
    // Must be UNC path (\\server\share\path)
    if (!path.startsWith('\\\\')) {
      return { valid: false, message: 'Server mode requires UNC paths' };
    }
  }
  return { valid: true };
}

// Docker detection
const isDocker = fs.existsSync('/.dockerenv');

// Docker paths must be absolute Linux paths
if (isDocker && !path.startsWith('/')) {
  return { valid: false, message: 'Docker requires absolute paths' };
}
```

### Virtual Scrolling Pattern

```javascript
// Only render visible items
function renderVisibleModels() {
  const scrollTop = container.scrollTop;
  const containerHeight = container.clientHeight;
  const itemHeight = 200; // Approximate item height

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);

  const visibleModels = allModels.slice(startIndex, endIndex + 1);

  // Render only visible models
  renderModels(visibleModels, startIndex * itemHeight);
}

// Attach to scroll event with throttling
container.addEventListener('scroll', throttle(renderVisibleModels, 100));
```

### Settings Management Pattern

```javascript
// Get setting with default
function getSetting(key, defaultValue) {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const result = stmt.get(key);
  return result ? result.value : defaultValue;
}

// Set setting
function setSetting(key, value) {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  stmt.run(key, value);
}
```

---

## Server Mode Architecture

### Overview
Server mode allows Printventory to run as a web server, accessible from browsers on the local network.

### Starting Server Mode
```bash
electron . --server
# or
npm start:server
```

### Components

#### 1. Express HTTP Server
**Port:** 5000
**Location:** `main.js:startServer()`

**Routes:**
```javascript
app.get('/', (req, res) => res.sendFile('index.html'));
app.get('/renderer.js', (req, res) => res.sendFile('renderer.js'));
app.get('/server-bridge.js', (req, res) => res.sendFile('server-bridge.js'));
// ... static file serving
```

#### 2. WebSocket Server
**Port:** 5000
**Location:** `main.js:startServer()`

**Purpose:** Replaces Electron IPC for browser clients

**Client:** `server-bridge.js` - Creates `window.electron` API via WebSocket

**Protocol:**
```javascript
// Client sends
ws.send(JSON.stringify({
  method: 'get-models',
  args: [filters],
  id: requestId
}));

// Server responds
ws.send(JSON.stringify({
  id: requestId,
  result: { success: true, models: [...] }
}));
```

#### 3. Path Requirements

**Windows Server Mode:**
- **MUST use UNC paths**: `\\server\share\path\file.stl`
- **CANNOT use drive letters**: `C:\path` will fail
- Validation enforced in path handlers

**Docker Server Mode:**
- **MUST use Linux absolute paths**: `/mnt/share/path/file.stl`
- Network shares must be mounted into container
- Example: `-v Z:/:/mnt/network-share:ro`

#### 4. STL Home Auto-Scanning

**Configuration:**
- Path: Linux absolute path (Docker) or UNC path (Windows server)
- Update frequency: 1-1440 minutes (default: 60)

**Behavior:**
- Scans on container/server startup
- Periodic background scanning at configured interval
- Non-blocking operation
- Logs scan results

**Implementation:** `main.js:scheduleStlHomeScan()`

---

## Build & Deployment

### Electron Builder Configuration

**`package.json:build`:**
```json
{
  "appId": "com.printventory.app",
  "mac": {
    "target": [{"target": "dmg", "arch": ["universal"]}],
    "icon": "logo.icns"
  },
  "win": {
    "target": "nsis",
    "icon": "logo.ico"
  },
  "linux": {
    "target": [{"target": "AppImage", "arch": ["x64"]}],
    "icon": "logo.png"
  },
  "files": ["main.js", "renderer.js", "preload.js", "..."],
  "asarUnpack": ["scan-worker.js", "node_modules/better-sqlite3/**/*"]
}
```

### Native Module Handling

**better-sqlite3** requires platform-specific compilation:
```bash
# Rebuilds native modules for Electron
npm run postinstall
# or manually
electron-builder install-app-deps
```

### Docker Build Process

#### 1. Create Distribution Package
```bash
npm run build:docker
# Creates: printventory-docker-{version}.zip
```

**Package Contents:**
- Dockerfile
- docker-compose.yml
- docker-entrypoint.sh
- Source files (main.js, renderer.js, etc.)
- node_modules/ directory

#### 2. Build Docker Image
```bash
docker build -t printventory:latest .
```

**Multi-stage build:**
1. Install dependencies
2. Rebuild native modules for Linux
3. Install Chromium for Puppeteer
4. Configure Xvfb for headless display

#### 3. Docker Hub Publishing
```bash
npm run docker:hub:all
# Executes: build, tag, push-version, push-latest
```

**Registry:** `printventory/printventory:latest`

### Platform-Specific Build Notes

#### Windows
- NSIS installer with custom sidebar
- Includes pre-install backup script (`installer.nsh`)
- Differential updates supported
- Post-build cleanup: `scripts/cleanup-win-build.js`

#### macOS
- Universal binary (Intel + Apple Silicon)
- Requires entitlements for hardened runtime
- Code signing recommended (not required for development)

#### Linux
- AppImage built via Docker or WSL
- Script: `scripts/build-linux-appimage.js`
- Auto-detects WSL vs Docker

---

## Common Tasks & Guidelines

### Adding a New IPC Handler

**1. Define handler in main.js:**
```javascript
ipcMain.handle('my-new-operation', async (event, arg1, arg2) => {
  try {
    // Perform operation
    const result = await doSomething(arg1, arg2);
    return { success: true, data: result };
  } catch (error) {
    console.error('my-new-operation failed:', error);
    return { success: false, error: error.message };
  }
});
```

**2. Expose in preload.js:**
```javascript
contextBridge.exposeInMainWorld('electron', {
  // ... existing methods
  myNewOperation: (arg1, arg2) => ipcRenderer.invoke('my-new-operation', arg1, arg2)
});
```

**3. Add to server-bridge.js (for server mode):**
```javascript
window.electron = {
  // ... existing methods
  myNewOperation: (arg1, arg2) => {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36);
      pendingRequests[id] = { resolve, reject };
      ws.send(JSON.stringify({ method: 'my-new-operation', args: [arg1, arg2], id }));
    });
  }
};
```

**4. Register in main.js server handler:**
```javascript
// In startServer() WebSocket connection handler
ws.on('message', (message) => {
  const { method, args, id } = JSON.parse(message);

  switch (method) {
    // ... existing cases
    case 'my-new-operation':
      handleMyNewOperation(...args).then(result => {
        ws.send(JSON.stringify({ id, result }));
      });
      break;
  }
});
```

### Adding a New Database Column

**1. Add migration in initializeDatabase():**
```javascript
function initializeDatabase() {
  // ... existing tables

  // Check if column exists
  const columns = db.prepare("PRAGMA table_info(models)").all();
  const hasNewColumn = columns.some(col => col.name === 'newColumn');

  if (!hasNewColumn) {
    db.prepare('ALTER TABLE models ADD COLUMN newColumn TEXT').run();
    console.log('Added newColumn to models table');
  }

  // Add index if needed
  db.prepare('CREATE INDEX IF NOT EXISTS idx_newColumn ON models(newColumn)').run();
}
```

**2. Update model queries:**
```javascript
// Include in SELECT queries
const models = db.prepare(`
  SELECT id, filePath, fileName, newColumn, ...
  FROM models
  WHERE ...
`).all();
```

**3. Update UI in renderer.js:**
```javascript
function renderModelCard(model) {
  // ... existing rendering

  if (model.newColumn) {
    const newElement = document.createElement('div');
    newElement.textContent = model.newColumn;
    card.appendChild(newElement);
  }
}
```

### Adding a New Setting

**1. Define default value:**
```javascript
// In main.js
function getSettingWithDefault(key, defaultValue) {
  const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return result ? result.value : defaultValue;
}

const myNewSetting = getSettingWithDefault('myNewSetting', 'defaultValue');
```

**2. Add UI in settings dialog (renderer.js):**
```javascript
// In showSettingsDialog()
const settingsHTML = `
  <div class="settings-section">
    <label for="myNewSetting">My New Setting:</label>
    <input type="text" id="myNewSetting" value="${currentValue}">
  </div>
`;
```

**3. Save handler:**
```javascript
document.getElementById('saveSettings').onclick = async () => {
  const myNewSetting = document.getElementById('myNewSetting').value;
  await window.electron.setSetting('myNewSetting', myNewSetting);
};
```

### Adding AI Provider Support

**Location:** `aitagging.js`

**Pattern:**
```javascript
async function generateTagsWithAI(modelData, config) {
  const { provider, apiKey, model } = config;

  switch (provider) {
    case 'openai':
      return generateWithOpenAI(modelData, apiKey, model);

    case 'mynewprovider':
      return generateWithMyNewProvider(modelData, apiKey, model);

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

async function generateWithMyNewProvider(modelData, apiKey, model) {
  // Implement API call to new provider
  const response = await fetch('https://api.mynewprovider.com/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: buildTagPrompt(modelData),
      model: model
    })
  });

  const result = await response.json();
  return parseTagsFromResponse(result);
}
```

### Modifying 3D Rendering

**Location:** `renderer.js` - Three.js setup

**Common modifications:**

**Change lighting:**
```javascript
// Find existing lights in setupThreeJS()
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
// Adjust intensity values
```

**Change camera:**
```javascript
// Adjust camera position
camera.position.set(15, 15, 15);
camera.lookAt(0, 0, 0);
```

**Add post-processing:**
```javascript
// Add after renderer creation
const composer = new THREE.EffectComposer(renderer);
const renderPass = new THREE.RenderPass(scene, camera);
composer.addPass(renderPass);
```

### Adding a New File Format

**1. Add loader in renderer.js:**
```javascript
function loadNewFormatModel(url) {
  const loader = new NewFormatLoader();
  loader.load(url, (geometry) => {
    // Process geometry
    const material = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
  });
}
```

**2. Update file scanning in main.js:**
```javascript
// In scanDirectory function
const supportedExtensions = ['.stl', '.3mf', '.newformat'];

if (supportedExtensions.includes(ext.toLowerCase())) {
  // Process file
}
```

**3. Update thumbnail generation:**
```javascript
// In generateThumbnail function
if (filePath.endsWith('.newformat')) {
  await loadNewFormatModel(fileUrl);
  await captureScreenshot();
}
```

---

## Testing & Validation

### Manual Testing Checklist

**Before committing changes:**

- [ ] Test in desktop mode (`npm start`)
- [ ] Test in server mode (`npm start:server`)
- [ ] Verify database migrations work on existing database
- [ ] Check browser console for errors
- [ ] Test on Windows (if path-related changes)
- [ ] Verify existing data is preserved

**For UI changes:**
- [ ] Test all view modes (List, Preview, Detailed)
- [ ] Test with various screen sizes
- [ ] Verify keyboard navigation works
- [ ] Check accessibility (screen reader compatibility)

**For database changes:**
- [ ] Test with empty database
- [ ] Test with existing database (migrations)
- [ ] Verify indexes are created
- [ ] Check query performance with large dataset (1000+ models)

**For server mode changes:**
- [ ] Test UNC path validation (Windows)
- [ ] Test absolute path validation (Docker)
- [ ] Verify WebSocket reconnection works
- [ ] Test from remote browser

### Automated Testing

**Test framework:** Playwright (configured in `playwright.config.js`)

**Test file:** `verify.spec.js`

**Run tests:**
```bash
npx playwright test
```

**Basic test structure:**
```javascript
const { test, expect } = require('@playwright/test');

test('loads application', async ({ page }) => {
  await page.goto('file://' + __dirname + '/index.html');
  await expect(page).toHaveTitle('Printventory');
});
```

---

## Troubleshooting & Gotchas

### Common Issues

#### 1. Native Module Errors
**Symptom:** `Error: Module did not self-register`

**Cause:** better-sqlite3 compiled for wrong platform/Node version

**Solution:**
```bash
npm run postinstall
# or
electron-builder install-app-deps
```

#### 2. Server Mode Path Errors
**Symptom:** Files not found in server mode

**Windows:**
- Ensure using UNC paths: `\\server\share\path`
- NOT drive letters: `C:\path` won't work

**Docker:**
- Ensure using container paths: `/mnt/network-share/path`
- NOT host paths: `Z:\path` won't work
- Verify volume mounts in docker-compose.yml

#### 3. Database Locked
**Symptom:** `Error: database is locked`

**Cause:** Multiple processes accessing database simultaneously

**Solution:**
- Enable WAL mode: `db.pragma('journal_mode = WAL');`
- Use transactions for multiple operations
- Ensure proper connection closing

#### 4. Thumbnail Generation Fails
**Symptom:** No thumbnails generated, black images

**Cause:** WebGL context issues, file format errors

**Solution:**
- Check browser console for WebGL errors
- Verify file format is valid
- Try regenerating thumbnails
- Check file size (must be under limit)

#### 5. Memory Issues with Large Collections
**Symptom:** Application slows down or crashes with 10,000+ models

**Solution:**
- Enable virtual scrolling (already implemented)
- Use pagination in database queries
- Limit thumbnail size in settings
- Consider thumbnail file storage instead of base64

### Performance Optimization Tips

**Database:**
- Use prepared statements (already implemented)
- Use transactions for bulk operations
- Ensure proper indexing
- Use `LIMIT` and `OFFSET` for pagination

**3D Rendering:**
- Reuse Three.js renderer context
- Dispose geometry and materials after use
- Use `requestAnimationFrame` for animations
- Limit concurrent renders (configured in settings)

**UI:**
- Use virtual scrolling (already implemented)
- Debounce search input
- Lazy load thumbnails
- Use CSS transforms for smooth animations

**Server Mode:**
- Use WebSocket compression
- Implement response caching where appropriate
- Limit concurrent scanning operations
- Use streaming for large responses

### Security Considerations

**API Keys:**
- Store in settings table (not committed to git)
- Never log API keys
- Validate on server side

**File Access:**
- Validate all file paths
- Prevent directory traversal attacks
- Check file extensions before processing
- Limit file sizes

**Server Mode:**
- Designed for local network only
- No authentication by default
- Add authentication for production deployments
- Use HTTPS for remote access

### Code Review Checklist

When reviewing or submitting code:

- [ ] No console.log calls (use console.error for errors)
- [ ] Proper error handling with try-catch
- [ ] IPC handlers return structured responses
- [ ] Database queries use prepared statements
- [ ] Path handling considers server mode and Docker
- [ ] Settings have sensible defaults
- [ ] UI updates are performant (no unnecessary re-renders)
- [ ] Code follows existing patterns
- [ ] Comments explain "why" not "what"
- [ ] No hardcoded paths or credentials

---

## Additional Resources

### Documentation
- [Electron Documentation](https://www.electronjs.org/docs)
- [Three.js Documentation](https://threejs.org/docs/)
- [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)

### Internal Files
- `README.md` - User-facing documentation
- `GUIDE.md` - Feature guide
- `package.json` - Dependencies and build configuration

### Community
- Discord community (link in application Help menu)
- GitHub Issues for bug reports
- GitHub Discussions for feature requests

---

## Contact & Contribution

**Author:** TechJeeper Designs
**License:** MIT

**Contributing:**
- Follow existing code style and patterns
- Test thoroughly before submitting
- Update this CLAUDE.md if adding new patterns or conventions
- Write clear commit messages
- One feature per branch/PR

---

**Document Version:** 1.0
**Last Updated:** 2026-01-22
**Maintainer:** Claude AI (auto-generated)

For questions or improvements to this guide, please submit an issue or PR.
