/** @jest-environment node */
const Utils = require('../js/utils.js');

describe('Utils module tests', () => {
  test('Utils.id() returns a unique alphanumeric string of length around 10-14 chars', () => {
    const id1 = Utils.id();
    const id2 = Utils.id();
    expect(id1).not.toBe(id2);
    expect(id1.length).toBeGreaterThan(6);
    expect(typeof id1).toBe('string');
  });

  test('Utils.today() returns today in YYYY-MM-DD format', () => {
    const today = Utils.today();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const expected = new Date().toISOString().split('T')[0];
    expect(today).toBe(expected);
  });

  test('Utils.escape() escapes special HTML characters in Node environment', () => {
    const input = '<div class="test">Hello & welcome\'s</div>';
    const escaped = Utils.escape(input);
    expect(escaped).toContain('&lt;');
    expect(escaped).toContain('&gt;');
    expect(escaped).toContain('&amp;');
    expect(escaped).toContain('&quot;');
  });

  test('Utils.formatDate() relative day formats', () => {
    const todayStr = Utils.today();
    expect(Utils.formatDate(todayStr)).toBe('Today');

    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = yesterdayObj.toISOString().split('T')[0];
    expect(Utils.formatDate(yesterdayStr)).toBe('Yesterday');

    // Fixed past date
    const pastDate = '2026-06-01';
    expect(Utils.formatDate(pastDate)).toBe('Jun 1');
  });

  test('Utils.weekDates() returns exactly 7 ISO dates ending in today', () => {
    const dates = Utils.weekDates();
    expect(dates.length).toBe(7);
    expect(dates[6]).toBe(Utils.today());
    dates.forEach(d => {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  test('Utils.monthDates() returns exactly 30 ISO dates ending in today', () => {
    const dates = Utils.monthDates();
    expect(dates.length).toBe(30);
    expect(dates[29]).toBe(Utils.today());
    dates.forEach(d => {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  test('Utils.animateNum() animates values correctly', () => {
    jest.useFakeTimers();
    const el = { textContent: '0' };
    
    // Stub global performance and requestAnimationFrame
    const originalPerformance = global.performance;
    const originalRequestAnimationFrame = global.requestAnimationFrame;
    
    let time = 0;
    global.performance = { now: () => time };
    global.requestAnimationFrame = (callback) => {
      setTimeout(() => {
        time += 100;
        callback(time);
      }, 0);
    };

    Utils.animateNum(el, 100, 500);

    // Fast-forward time
    jest.advanceTimersByTime(600);

    expect(el.textContent).toBe(100);

    // Test float version
    el.textContent = '0.0';
    Utils.animateNum(el, 10.5, 500);
    jest.advanceTimersByTime(600);
    expect(el.textContent).toBe('10.5');

    // Clean up
    global.performance = originalPerformance;
    global.requestAnimationFrame = originalRequestAnimationFrame;
    jest.useRealTimers();
  });
});
