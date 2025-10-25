/* =========================================================
   THE AI ARTISAN — THEME CONTROLLER
   Version: Publication-Ready (2025)
   Author: Abdullah Khan | HQAIM Studios
   ========================================================= */

/*
  FEATURES:
  - Persists user theme (light / dark) using localStorage
  - Honors system-level preference initially
  - Updates <html data-theme> for CSS variable binding
  - Updates toggle icons (sun/moon)
  - Adds smooth fade transition between themes
  - Accessible: announces change via aria-live region
*/

(function () {
  const root = document.documentElement;
  const toggleBtn = document.querySelector('.theme-toggle');
  const STORAGE_KEY = 'theme';
  const ANIMATION_MS = 180;

  // ---- Accessible live region (announces theme change)
  let live = document.getElementById('theme-status');
  if (!live) {
    live = document.createElement('div');
    live.id = 'theme-status';
    live.setAttribute('aria-live', 'polite');
    live.className = 'visually-hidden';
    document.body.appendChild(live);
  }

  // ---- Helper: Apply theme
  function applyTheme(mode) {
    root.setAttribute('data-theme', mode);
    document.body.style.transition = 'background-color 0.2s ease, color 0.2s ease';
    localStorage.setItem(STORAGE_KEY, mode);
    live.textContent = `Theme changed to ${mode} mode.`;
    setTimeout(() => {
      document.body.style.transition = '';
    }, ANIMATION_MS);
  }

  // ---- Detect system preference if none saved
  const saved = localStorage.getItem(STORAGE_KEY);
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const initialTheme = saved || (systemPrefersLight ? 'light' : 'dark');
  applyTheme(initialTheme);

  // ---- Update toggle icons visibility (sun/moon)
  function updateToggleIcon(mode) {
    const sun = toggleBtn?.querySelector('[data-icon="sun"]');
    const moon = toggleBtn?.querySelector('[data-icon="moon"]');
    if (!sun || !moon) return;
    sun.style.display = mode === 'light' ? 'inline' : 'none';
    moon.style.display = mode === 'light' ? 'none' : 'inline';
  }
  updateToggleIcon(initialTheme);

  // ---- Add listener to toggle button
  toggleBtn?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    updateToggleIcon(next);
  });

  // ---- React to system preference change dynamically
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    const autoTheme = e.matches ? 'light' : 'dark';
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(autoTheme);
      updateToggleIcon(autoTheme);
    }
  });

  // ---- Tooltip / Keyboard accessibility
  if (toggleBtn) {
    toggleBtn.setAttribute('title', 'Toggle light or dark theme');
    toggleBtn.setAttribute('aria-label', 'Toggle color theme');
    toggleBtn.tabIndex = 0;

    toggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleBtn.click();
      }
    });
  }

  // ---- Expose global function (optional API)
  window.AIArtisanTheme = {
    get current() {
      return root.getAttribute('data-theme');
    },
    set mode(value) {
      if (['light', 'dark'].includes(value)) {
        applyTheme(value);
        updateToggleIcon(value);
      }
    },
    reset() {
      localStorage.removeItem(STORAGE_KEY);
      applyTheme(systemPrefersLight ? 'light' : 'dark');
    },
  };
})();
