/* =========================================================
   THE AI ARTISAN — THEME CONTROLLER (Aetherium Edition)
   Author: Abdullah Khan · HQAIM Studios
   Build: v1.1 (TOC Publication)
   =========================================================
   • Manages Light/Dark theme toggle.
   • Persists user preference via localStorage.
   • Respects system color scheme if no user setting.
   • Accessible: announces theme changes via live region.
   ========================================================= */

(function () {
  'use strict';

  const root = document.documentElement;
  const toggleBtn = document.getElementById('themeToggle');
  if (!toggleBtn) return;

  const STORAGE_KEY = 'aiartisan_theme';
  const LIVE_REGION_ID = 'theme-status-liveregion';

  // ------------------------------
  // Accessible live region for announcements
  // ------------------------------
  let liveRegion = document.getElementById(LIVE_REGION_ID);
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = LIVE_REGION_ID;
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.className = 'visually-hidden';
    document.body.appendChild(liveRegion);
  }

  // ------------------------------
  // Determine Theme Preference
  // ------------------------------
  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // ------------------------------
  // Apply Theme
  // ------------------------------
  function applyTheme(mode, announce = false) {
    const isDark = mode === 'dark';
    root.setAttribute('data-theme', mode);
    localStorage.setItem(STORAGE_KEY, mode);

    // Update ARIA + title
    toggleBtn.setAttribute('aria-pressed', String(isDark));
    const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';
    toggleBtn.setAttribute('aria-label', label);
    toggleBtn.setAttribute('title', label);

    // Optional: announce change
    if (announce) {
      liveRegion.textContent = `${mode.charAt(0).toUpperCase() + mode.slice(1)} theme enabled.`;
    }

    // Smooth background transition handling
    document.body.classList.add('theme-transitioning');
    window.setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 250);
  }

  // ------------------------------
  // Initialize Theme
  // ------------------------------
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme, false);

  // ------------------------------
  // Toggle Button Behavior
  // ------------------------------
  toggleBtn.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next, true);
  });

  toggleBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleBtn.click();
    }
  });

  // ------------------------------
  // Follow System Preference
  // ------------------------------
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', (e) => {
    const hasUserSetting = !!localStorage.getItem(STORAGE_KEY);
    if (!hasUserSetting) {
      applyTheme(e.matches ? 'dark' : 'light', true);
    }
  });

  // ------------------------------
  // Debug Info
  // ------------------------------
  console.info('AI Artisan Theme Controller v1.1 — active:', root.getAttribute('data-theme'));
})();
