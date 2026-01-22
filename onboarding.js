// ========================================================================
// PRINTVENTORY ONBOARDING & TUTORIAL SYSTEM
// Complete implementation of Welcome Wizard, Feature Tour, and Help
// ========================================================================

// Welcome Wizard State
let currentWizardStep = 1;
const totalWizardSteps = 5;

// Feature Tour State
let currentTourStep = 0;
let tourSteps = [];

// Initialize onboarding system
function initializeOnboardingSystem() {
  initializeWelcomeWizard();
  initializeFeatureTour();
  initializeHelpDocumentation();
  initializeKeyboardShortcuts();
  checkFirstRun();
}

// ========================================================================
// WELCOME WIZARD
// ========================================================================

function initializeWelcomeWizard() {
  const prevBtn = document.getElementById('wizard-prev-btn');
  const nextBtn = document.getElementById('wizard-next-btn');
  const skipBtn = document.getElementById('wizard-skip-btn');

  if (prevBtn) prevBtn.addEventListener('click', previousWizardStep);
  if (nextBtn) nextBtn.addEventListener('click', nextWizardStep);
  if (skipBtn) skipBtn.addEventListener('click', skipWizard);

  // Allow clicking on wizard steps
  document.querySelectorAll('.wizard-step').forEach(step => {
    step.addEventListener('click', () => {
      const stepNum = parseInt(step.dataset.step);
      if (stepNum <= currentWizardStep || step.classList.contains('completed')) {
        goToWizardStep(stepNum);
      }
    });
  });
}

function showWelcomeWizard() {
  currentWizardStep = 1;
  updateWizardUI();
  const dialog = document.getElementById('welcome-wizard-dialog');
  if (dialog) dialog.showModal();
}

function nextWizardStep() {
  if (currentWizardStep < totalWizardSteps) {
    markStepCompleted(currentWizardStep);
    currentWizardStep++;
    updateWizardUI();
  } else {
    finishWizard();
  }
}

function previousWizardStep() {
  if (currentWizardStep > 1) {
    currentWizardStep--;
    updateWizardUI();
  }
}

function goToWizardStep(stepNum) {
  currentWizardStep = stepNum;
  updateWizardUI();
}

function markStepCompleted(stepNum) {
  const step = document.querySelector('.wizard-step[data-step="' + stepNum + '"]');
  if (step) step.classList.add('completed');
}

function updateWizardUI() {
  // Update pages
  document.querySelectorAll('.wizard-page').forEach(page => {
    page.classList.remove('active');
  });
  const currentPage = document.querySelector('.wizard-page[data-page="' + currentWizardStep + '"]');
  if (currentPage) currentPage.classList.add('active');

  // Update steps
  document.querySelectorAll('.wizard-step').forEach(step => {
    step.classList.remove('active');
  });
  const currentStep = document.querySelector('.wizard-step[data-step="' + currentWizardStep + '"]');
  if (currentStep) currentStep.classList.add('active');

  // Update navigation buttons
  const prevBtn = document.getElementById('wizard-prev-btn');
  const nextBtn = document.getElementById('wizard-next-btn');
  const skipBtn = document.getElementById('wizard-skip-btn');

  if (prevBtn) prevBtn.disabled = currentWizardStep === 1;
  if (nextBtn) nextBtn.textContent = currentWizardStep === totalWizardSteps ? 'Finish' : 'Next';
  if (skipBtn) skipBtn.style.display = currentWizardStep === totalWizardSteps ? 'none' : 'inline-block';

  // Update progress bar
  const progress = (currentWizardStep / totalWizardSteps) * 100;
  const progressBar = document.querySelector('.wizard-progress-bar');
  if (progressBar) progressBar.style.width = progress + '%';
}

function finishWizard() {
  const dontShowAgain = document.getElementById('dont-show-wizard-again');
  if (dontShowAgain && dontShowAgain.checked && typeof window.electron !== 'undefined') {
    window.electron.setUserPreference?.('hideWelcomeWizard', 'true');
  }
  const dialog = document.getElementById('welcome-wizard-dialog');
  if (dialog) dialog.close();
}

function skipWizard() {
  if (confirm('Skip the tutorial? You can access it anytime from Help → Welcome Wizard')) {
    const dialog = document.getElementById('welcome-wizard-dialog');
    if (dialog) dialog.close();
  }
}

// Wizard setup actions
function setupQuickScan() {
  const dialog = document.getElementById('welcome-wizard-dialog');
  if (dialog) dialog.close();
  setTimeout(() => {
    document.getElementById('scan-btn')?.click();
  }, 300);
}

function setupSTLHome() {
  const dialog = document.getElementById('welcome-wizard-dialog');
  if (dialog) dialog.close();
  setTimeout(() => {
    if (typeof window.electron !== 'undefined') {
      window.electron.send?.('open-stl-home');
    }
  }, 300);
}

function setupImportCollection() {
  const dialog = document.getElementById('welcome-wizard-dialog');
  if (dialog) dialog.close();
  setTimeout(() => {
    if (typeof window.electron !== 'undefined') {
      window.electron.send?.('open-collection-import');
    }
  }, 300);
}

// ========================================================================
// FEATURE TOUR
// ========================================================================

function initializeFeatureTour() {
  tourSteps = [
    {
      element: '#search-filter-input',
      title: 'Search Your Library',
      content: 'Quickly find any model with powerful search. Type keywords, designer names, or tags to filter instantly.'
    },
    {
      element: '.filter-section',
      title: 'Advanced Filters',
      content: 'Filter by designer, license, print status, file type, and more. Combine filters for powerful searches.'
    },
    {
      element: '#filetype-select',
      title: 'File Type Filter',
      content: 'Filter by STL, 3MF, or ZIP files. Mix and match to find exactly what you need.'
    },
    {
      element: '#tag-filter',
      title: 'Tag Filter',
      content: 'Use tags to organize and find models. Create your own tags or use AI to generate them automatically.'
    },
    {
      element: '#scan-btn',
      title: 'Scan Directory',
      content: 'Add models to your library by scanning directories. Printventory will automatically generate thumbnails and index everything.'
    }
  ];
}

function startFeatureTour() {
  currentTourStep = 0;
  showTourStep();
  const overlay = document.getElementById('feature-tour-overlay');
  if (overlay) overlay.style.display = 'block';
}

function showTourStep() {
  if (currentTourStep >= tourSteps.length) {
    endFeatureTour();
    return;
  }

  const step = tourSteps[currentTourStep];
  const element = document.querySelector(step.element);

  if (!element) {
    currentTourStep++;
    showTourStep();
    return;
  }

  // Position spotlight
  const rect = element.getBoundingClientRect();
  const spotlight = document.querySelector('.tour-spotlight');
  if (spotlight) {
    spotlight.style.left = (rect.left - 5) + 'px';
    spotlight.style.top = (rect.top - 5) + 'px';
    spotlight.style.width = (rect.width + 10) + 'px';
    spotlight.style.height = (rect.height + 10) + 'px';
  }

  // Position tooltip
  const tooltip = document.querySelector('.tour-tooltip');
  if (tooltip) {
    tooltip.style.left = Math.max(20, Math.min(window.innerWidth - 420, rect.left + rect.width / 2 - 200)) + 'px';
    tooltip.style.top = (rect.bottom + 20) + 'px';
  }

  // Update tooltip content
  const titleEl = document.getElementById('tour-tooltip-title');
  const contentEl = document.getElementById('tour-tooltip-content');
  const progressEl = document.getElementById('tour-progress');

  if (titleEl) titleEl.textContent = step.title;
  if (contentEl) contentEl.textContent = step.content;
  if (progressEl) progressEl.textContent = (currentTourStep + 1) + ' / ' + tourSteps.length;

  // Update navigation buttons
  const prevBtn = document.getElementById('tour-prev-btn');
  const nextBtn = document.getElementById('tour-next-btn');
  if (prevBtn) prevBtn.disabled = currentTourStep === 0;
  if (nextBtn) nextBtn.textContent = currentTourStep === tourSteps.length - 1 ? 'Finish' : 'Next';

  // Scroll element into view
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function nextTourStep() {
  currentTourStep++;
  showTourStep();
}

function previousTourStep() {
  if (currentTourStep > 0) {
    currentTourStep--;
    showTourStep();
  }
}

function endFeatureTour() {
  const overlay = document.getElementById('feature-tour-overlay');
  if (overlay) overlay.style.display = 'none';
  currentTourStep = 0;
}

// ========================================================================
// HELP DOCUMENTATION
// ========================================================================

const helpContent = {
  'getting-started': '<h2>Getting Started</h2><p>Welcome to Printventory! Scan a directory to add models, then use tags and collections to organize them.</p><p>Press F1 anytime to reopen the Welcome Wizard.</p>',
  'organizing': '<h2>Organizing Models</h2><p>Use tags, Smart Collections, and Model Groups to keep your library organized.</p>',
  'printing': '<h2>Printing Features</h2><p>Manage your Print Queue, track history, schedule prints, and organize projects.</p>',
  'inventory': '<h2>Inventory Management</h2><p>Track filament spools, calculate costs, and monitor usage.</p>',
  'advanced': '<h2>Advanced Features</h2><p>Slicer integration, version control, recommendations, and more.</p>',
  'shortcuts': '<h2>Keyboard Shortcuts</h2><p>Ctrl+F: Search | F1: Welcome Wizard | Ctrl+Shift+G: Groups | Ctrl+Shift+F: Filament</p>',
  'troubleshooting': '<h2>Troubleshooting</h2><p>Check filters, regenerate thumbnails, or join our Discord for help.</p>'
};

function initializeHelpDocumentation() {
  document.querySelectorAll('.help-category').forEach(category => {
    category.addEventListener('click', () => {
      document.querySelectorAll('.help-category').forEach(c => c.classList.remove('active'));
      category.classList.add('active');
      loadHelpContent(category.dataset.category);
    });
  });

  const helpSearch = document.getElementById('help-search');
  if (helpSearch) {
    helpSearch.addEventListener('input', (e) => {
      searchHelpContent(e.target.value);
    });
  }
}

function openHelpDocumentation(category) {
  loadHelpContent(category || 'getting-started');
  const dialog = document.getElementById('help-documentation-dialog');
  if (dialog) dialog.showModal();
}

function loadHelpContent(category) {
  const content = helpContent[category] || helpContent['getting-started'];
  const contentArea = document.getElementById('help-content-area');
  if (contentArea) contentArea.innerHTML = content;
}

function searchHelpContent(query) {
  if (!query.trim()) {
    loadHelpContent('getting-started');
    return;
  }

  const results = Object.values(helpContent).filter(content =>
    content.toLowerCase().includes(query.toLowerCase())
  );

  const contentArea = document.getElementById('help-content-area');
  if (contentArea) {
    contentArea.innerHTML = results.length > 0 ?
      results.join('<hr>') :
      '<p>No results found</p>';
  }
}

// ========================================================================
// KEYBOARD SHORTCUTS
// ========================================================================

function initializeKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F1') {
      e.preventDefault();
      showWelcomeWizard();
    }
  });
}

function openKeyboardShortcuts() {
  const dialog = document.getElementById('keyboard-shortcuts-dialog');
  if (dialog) dialog.showModal();
}

// ========================================================================
// FIRST RUN CHECK
// ========================================================================

function checkFirstRun() {
  if (typeof window.electron === 'undefined') return;

  setTimeout(() => {
    window.electron.getUserPreference?.('hideWelcomeWizard')
      .then(hidden => {
        if (!hidden) showWelcomeWizard();
      })
      .catch(() => {
        showWelcomeWizard();
      });
  }, 1500);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeOnboardingSystem);
} else {
  initializeOnboardingSystem();
}

// Export functions globally
window.showWelcomeWizard = showWelcomeWizard;
window.startFeatureTour = startFeatureTour;
window.openHelpDocumentation = openHelpDocumentation;
window.openKeyboardShortcuts = openKeyboardShortcuts;
window.nextTourStep = nextTourStep;
window.previousTourStep = previousTourStep;
window.endFeatureTour = endFeatureTour;
window.setupQuickScan = setupQuickScan;
window.setupSTLHome = setupSTLHome;
window.setupImportCollection = setupImportCollection;

console.log('✅ Printventory Onboarding System loaded');
