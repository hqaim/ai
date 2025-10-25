/* =========================================================
   THE AI ARTISAN — CLIENT-SIDE AUTHENTICATION
   Version: Publication-Ready (2025)
   Author: Abdullah Khan | HQAIM Studios
   ========================================================= */

/*
  OVERVIEW:
  - Uses SHA-256 hashing to validate passwords locally.
  - Prevents storing or transmitting any plaintext.
  - On successful verification, upgrades access → premium.
  - Works seamlessly with /assets/js/premium.js logic.
  - Fully offline-compatible.

  HOW TO CONFIGURE:
  1. Replace the placeholder HASH below with the SHA-256 hash
     of your chosen password (use a trusted generator or crypto tool).
  2. Example hash format (hex string, lowercase, 64 chars):
       "9b74c9897bac770ffc029102a200c5de"
  3. The password page (/premium-access.html) should call:
       AIArtisanAuth.verifyPassword(inputValue);

  SECURITY NOTE:
  This is a front-end layer only — suitable for low-risk content gating.
  Do NOT use for sensitive information or real user credentials.
*/

(function () {
  // ===== CONFIGURATION =====
  const PASSWORD_HASH = "REPLACE_WITH_YOUR_SHA256_HASH"; 
  // Example (for testing only): "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"  ← hash for "password123"
  const STORAGE_KEY = 'access';
  const STATUS_ID = 'auth-status';

  /**
   * Compute SHA-256 hash (hex)
   */
  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Verify entered password
   */
  async function verifyPassword(input) {
    if (!input) return announce('Please enter a password.');
    const hashed = await sha256(input.trim());
    if (hashed === PASSWORD_HASH) {
      localStorage.setItem(STORAGE_KEY, 'premium');
      announce('✅ Access Granted — Welcome to the Diamond Tier!');
      document.body.classList.add('premium-access-granted');
      setTimeout(() => {
        window.location.href = '/premium.html?access=premium';
      }, 1200);
      return true;
    } else {
      announce('❌ Incorrect password. Please try again.');
      return false;
    }
  }

  /**
   * Display or announce feedback
   */
  function announce(msg) {
    let el = document.getElementById(STATUS_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = STATUS_ID;
      el.setAttribute('role', 'alert');
      el.style.textAlign = 'center';
      el.style.marginTop = '1rem';
      el.style.color = 'var(--text)';
      document.body.appendChild(el);
    }
    el.textContent = msg;
  }

  /**
   * Bind form automatically if present
   */
  function attachForm() {
    const form = document.querySelector('#auth-form');
    const input = document.querySelector('#auth-input');
    const button = document.querySelector('#auth-btn');

    if (!form || !input || !button) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      button.disabled = true;
      button.textContent = 'Verifying...';
      const ok = await verifyPassword(input.value);
      setTimeout(() => {
        button.disabled = false;
        button.textContent = 'Unlock Access';
        if (ok) input.value = '';
      }, 1500);
    });
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachForm);
  } else {
    attachForm();
  }

  // Export global API
  window.AIArtisanAuth = { verifyPassword };
})();
