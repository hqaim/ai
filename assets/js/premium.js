/* =========================================================
   THE AI ARTISAN — PREMIUM ACCESS MANAGER
   Version: Publication-Ready (2025)
   Author: Abdullah Khan | HQAIM Studios
   ========================================================= */

/*
  OVERVIEW:
  This script manages client-side access to premium or gifted content.
  It uses localStorage to persist access status across sessions.

  ACCESS TIERS:
  - free (default)
  - premium (paid access)
  - gifted (gift token / link)

  URL PARAMETERS:
  ?access=premium      → Unlocks permanently
  ?gift=CODE123        → Unlocks as gifted access

  ELEMENTS:
  - Locked sections: .elite-content.locked
  - Unlocked sections: .elite-content.unlocked
  - CTA overlay: dynamically inserted if locked

  USAGE:
  Include this script on all pages containing premium content.
*/

(function () {
  const STORAGE_KEY = 'access';
  const PARAM_ACCESS = new URLSearchParams(window.location.search).get('access');
  const PARAM_GIFT = new URLSearchParams(window.location.search).get('gift');
  const LOCK_SELECTOR = '.elite-content.locked';
  const UNLOCKED_CLASS = 'unlocked';
  const LOCKED_CLASS = 'locked';

  /**
   * Get current access state
   */
  function getAccess() {
    return localStorage.getItem(STORAGE_KEY) || 'free';
  }

  /**
   * Set access and persist
   */
  function setAccess(value) {
    if (['free', 'premium', 'gifted'].includes(value)) {
      localStorage.setItem(STORAGE_KEY, value);
      updateLockedContent();
    }
  }

  /**
   * Remove access (reset)
   */
  function resetAccess() {
    localStorage.removeItem(STORAGE_KEY);
    updateLockedContent();
  }

  /**
   * Show overlay CTA for locked sections
   */
  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'premium-overlay';
    overlay.innerHTML = `
      <div class="overlay-content">
        <p>🔒 This section is part of the <strong>Diamond Tier</strong>.</p>
        <a href="/premium.html" class="unlock-btn" aria-label="Unlock Premium Access">Unlock Access</a>
      </div>
    `;
    return overlay;
  }

  /**
   * Update visibility of all locked/unlocked content
   */
  function updateLockedContent() {
    const access = getAccess();
    const lockedBlocks = document.querySelectorAll(LOCK_SELECTOR);

    lockedBlocks.forEach((block) => {
      const existingOverlay = block.querySelector('.premium-overlay');
      if (access === 'premium' || access === 'gifted') {
        block.classList.remove(LOCKED_CLASS);
        block.classList.add(UNLOCKED_CLASS);
        if (existingOverlay) existingOverlay.remove();
      } else {
        block.classList.add(LOCKED_CLASS);
        block.classList.remove(UNLOCKED_CLASS);
        if (!existingOverlay) {
          block.appendChild(createOverlay());
        }
      }
    });
  }

  /**
   * Auto-unlock if parameters present
   */
  if (PARAM_ACCESS === 'premium') {
    setAccess('premium');
  } else if (PARAM_GIFT) {
    setAccess('gifted');
  }

  /**
   * Initialize on page load
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateLockedContent);
  } else {
    updateLockedContent();
  }

  /**
   * Expose public API
   */
  window.AIArtisanPremium = {
    get tier() {
      return getAccess();
    },
    unlockPremium() {
      setAccess('premium');
    },
    unlockGift() {
      setAccess('gifted');
    },
    revoke() {
      resetAccess();
    },
    refresh() {
      updateLockedContent();
    },
  };
})();
