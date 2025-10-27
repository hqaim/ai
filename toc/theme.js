/*
=========================================================
THE AI ARTISAN — THEME CONTROLLER (theme.js)
HQAIM Studios — Diamond Edition (vFinal - Enhanced)
=========================================================
* Handles theme persistence (localStorage)
* Respects system preference (prefers-color-scheme)
* Updates toggle button ARIA attributes
* CSS handles all icon visibility/animation
*/
(function () {
  'use strict';

  const root = document.documentElement;
  const toggleBtn = document.getElementById('themeToggle');
  if (!toggleBtn) return; // Exit if no button found
  
  const STORAGE_KEY = 'aiartisan_theme_preference'; // Unique storage key
  const LIVE_REGION_ID = 'theme-status-liveregion'; // ID for the live region

  // ------------------------------
  // Accessible live region for announcements
  // ------------------------------
  let liveRegion = document.getElementById(LIVE_REGION_ID);
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = LIVE_REGION_ID;
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.className = 'sr-only'; // Use the visually-hidden class
    document.body.appendChild(liveRegion);
  }

  // ------------------------------
  // Determine Theme Preference
  // ------------------------------
  function getPreferredTheme() {
    let savedTheme = null;
    try {
      savedTheme = localStorage.getItem(STORAGE_KEY);
    } catch (e) { /* Ignore private browsing errors */ }
    
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light'; // Default to light
  }

  // ------------------------------
  // Apply Theme
  // ------------------------------
  function applyTheme(theme, announce = false) {
    const isDark = (theme === 'dark');
    
    root.setAttribute('data-theme', theme);
    
    toggleBtn.setAttribute('aria-pressed', String(isDark));
    const newLabel = isDark ? 'Switch to light theme' : 'Switch to dark theme';
    toggleBtn.setAttribute('aria-label', newLabel);
    toggleBtn.setAttribute('title', newLabel);

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      console.warn('LocalStorage not available, theme persistence disabled.');
    }
    
    // Update meta theme color dynamically
    const themeColorMeta = document.getElementById('themeColor');
    if (themeColorMeta) {
        themeColorMeta.content = isDark ? '#0f172a' : '#ffffff'; // Match dark/light background
    }

    if (announce && liveRegion) {
      liveRegion.textContent = `${theme.charAt(0).toUpperCase() + theme.slice(1)} theme enabled.`;
    }
  }

  // ------------------------------
  // Initialize Theme
  // ------------------------------
  applyTheme(getPreferredTheme(), false); // Don't announce on initial load

  // ------------------------------
  // Event Listeners
  // ------------------------------
  toggleBtn.addEventListener('click', () => {
    const currentTheme = root.getAttribute('data-theme') || getPreferredTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme, true); // Announce the change
  });

  toggleBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleBtn.click();
    }
  });

  // Listen for system changes (if user has no manual override)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const newTheme = e.matches ? 'dark' : 'light';
      applyTheme(newTheme, true);
    }
  });

})();