/* =========================================================
   THE AI ARTISAN — COPY PROMPT / CODE UTILITY
   Author: Abdullah Khan | HQAIM Studios
   Version: Publication-Ready (2025)
   ========================================================= */

/*
  FEATURES:
  - Appends copy buttons to all <pre><code> and .prompt-table code blocks
  - Uses the modern Clipboard API (fallback-free)
  - Provides visual + accessible confirmation
  - Works across light/dark themes
  - No duplication of buttons when re-run
*/

(function () {
  const COPY_BUTTON_CLASS = 'copy-btn';
  const COPIED_CLASS = 'copied';
  const TOOLTIP_DELAY = 1500;

  /**
   * Create a copy button element
   */
  function createCopyButton() {
    const btn = document.createElement('button');
    btn.className = COPY_BUTTON_CLASS;
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Copy prompt to clipboard');
    btn.title = 'Copy Prompt';
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v16h14a2 2 0 0 0 2-2V5Zm0 16H8V7h11v14Z"/>
      </svg>
    `;
    return btn;
  }

  /**
   * Add copy buttons to all eligible code elements
   */
  function addCopyButtons() {
    const blocks = document.querySelectorAll('pre code, .prompt-table code');
    blocks.forEach((code) => {
      // Skip if button already exists
      if (code.parentElement.querySelector(`.${COPY_BUTTON_CLASS}`)) return;

      const btn = createCopyButton();
      code.parentElement.style.position = 'relative';
      btn.style.position = 'absolute';
      btn.style.top = '8px';
      btn.style.right = '8px';
      btn.style.cursor = 'pointer';
      btn.style.background = 'transparent';
      btn.style.border = 'none';
      btn.style.padding = '4px';
      btn.style.borderRadius = '6px';
      btn.style.transition = 'background 0.15s ease';
      btn.style.color = 'var(--text-muted-2)';
      btn.style.zIndex = '5';

      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(124,58,237,0.1)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'transparent';
      });

      // Copy logic
      btn.addEventListener('click', () => {
        const text = code.innerText.trim();
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
          showTooltip(btn, 'Copied ✓');
        }).catch(() => {
          showTooltip(btn, 'Error');
        });
      });

      // Keyboard accessibility
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });

      code.parentElement.appendChild(btn);
    });
  }

  /**
   * Tooltip feedback
   */
  function showTooltip(btn, message) {
    btn.classList.add(COPIED_CLASS);
    const tooltip = document.createElement('span');
    tooltip.textContent = message;
    tooltip.style.position = 'absolute';
    tooltip.style.bottom = '-1.8rem';
    tooltip.style.right = '4px';
    tooltip.style.fontSize = '0.75rem';
    tooltip.style.padding = '0.15rem 0.5rem';
    tooltip.style.borderRadius = '0.35rem';
    tooltip.style.background = 'var(--brand)';
    tooltip.style.color = '#fff';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.opacity = '0.95';
    tooltip.style.transition = 'opacity 0.2s ease';
    btn.appendChild(tooltip);
    setTimeout(() => {
      tooltip.style.opacity = '0';
      setTimeout(() => tooltip.remove(), 250);
      btn.classList.remove(COPIED_CLASS);
    }, TOOLTIP_DELAY);
  }

  /**
   * Initialize after DOM is ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addCopyButtons);
  } else {
    addCopyButtons();
  }

  // Re-export global function to refresh dynamically-loaded content
  window.AIArtisanCopy = { refresh: addCopyButtons };
})();
