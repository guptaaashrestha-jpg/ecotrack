/* ============================================================
   ECOTRACK — Utilities
   ============================================================ */
/**
 * Utility functions for date calculations, string escaping, ID generation, and number animation.
 */
const Utils = {
  /**
   * Generates a unique short alphanumeric identifier.
   * @returns {string} The unique ID.
   */
  id: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6),

  /**
   * Returns today's date in YYYY-MM-DD format based on local time.
   * @returns {string} Today's ISO date string.
   */
  today: () => new Date().toISOString().split('T')[0],

  /**
   * Safely escapes HTML special characters in a string to prevent XSS.
   * @param {string} s - The raw string to escape.
   * @returns {string} The escaped HTML string.
   */
  escape: s => {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Formats a YYYY-MM-DD date string into a user-friendly relative date or month-day representation.
   * @param {string} d - The date string to format.
   * @returns {string} 'Today', 'Yesterday', or e.g., 'Jun 15'.
   */
  formatDate(d) {
    const t = Utils.today();
    if (d === t) return 'Today';
    const y = new Date(); y.setDate(y.getDate() - 1);
    if (d === y.toISOString().split('T')[0]) return 'Yesterday';
    return new Date(d + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' });
  },

  /**
   * Returns an array of the last 7 dates (including today) in YYYY-MM-DD format.
   * @returns {string[]} An array of date strings.
   */
  weekDates() {
    const out = [], now = new Date();
    for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); out.push(d.toISOString().split('T')[0]); }
    return out;
  },

  /**
   * Returns an array of the last 30 dates (including today) in YYYY-MM-DD format.
   * @returns {string[]} An array of date strings.
   */
  monthDates() {
    const out = [], now = new Date();
    for (let i = 29; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); out.push(d.toISOString().split('T')[0]); }
    return out;
  },

  /**
   * Animates a numeric value inside an element over a specific duration.
   * @param {HTMLElement} el - The DOM element containing the text representation.
   * @param {number} to - The target value to animate towards.
   * @param {number} [dur=800] - Duration of the animation in milliseconds.
   */
  animateNum(el, to, dur = 800) {
    const from = parseFloat(el.textContent) || 0;
    const start = performance.now();
    const isInt = Number.isInteger(to);
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = isInt ? Math.round(from + (to - from) * e) : (from + (to - from) * e).toFixed(1);
      if (p < 1) requestAnimationFrame(tick);
    })(performance.now());
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
