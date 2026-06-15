global.Utils = require('../js/utils.js');
const Data = require('../js/data.js');

describe('Data module tests', () => {
  let db;

  beforeEach(() => {
    // Setup a standard mock database state
    db = {
      activities: [
        { id: '1', category: 'transport', type: 'car', amount: 10, co2: 2.1, date: '2026-06-15', time: '10:00 AM' },
        { id: '2', category: 'food', type: 'meat', amount: 1, co2: 3.3, date: '2026-06-15', time: '01:00 PM' },
        { id: '3', category: 'energy', type: 'electricity', amount: 5, co2: 2.1, date: '2026-06-14', time: '08:00 PM' }
      ],
      settings: { goal: 50, region: 'global' }
    };
  });

  test('Data.calc() calculates CO2 correctly for factors', () => {
    // Transport - car (factor 0.21)
    expect(Data.calc('transport', 'car', 10)).toBe(2.1);
    // Food - vegan (factor 0.9)
    expect(Data.calc('food', 'vegan', 2)).toBe(1.8);
    // Energy - electricity (factor 0.42 global)
    expect(Data.calc('energy', 'electricity', 10, 'global')).toBe(4.2);
    // Energy - electricity (factor 0.71 India)
    expect(Data.calc('energy', 'electricity', 10, 'in')).toBe(7.1);
    // Invalid/missing factors return 0
    expect(Data.calc('invalid', 'type', 10)).toBe(0);
  });

  test('Data.dayTotal() sums up correct total emissions for a day', () => {
    expect(Data.dayTotal(db, '2026-06-15')).toBe(5.4); // 2.1 + 3.3
    expect(Data.dayTotal(db, '2026-06-14')).toBe(2.1);
    expect(Data.dayTotal(db, '2026-06-13')).toBe(0);
  });

  test('Data.avgDaily() calculates mathematical daily average', () => {
    // Unique dates are '2026-06-15' and '2026-06-14' (2 days)
    // Total co2 = 2.1 + 3.3 + 2.1 = 7.5
    expect(Data.avgDaily(db)).toBeCloseTo(3.75);

    // Empty DB returns 0
    expect(Data.avgDaily({ activities: [] })).toBe(0);
  });

  test('Data.catBreakdown() sums emissions correctly by category', () => {
    const breakdown = Data.catBreakdown(db);
    expect(breakdown).toEqual({
      transport: 2.1,
      energy: 2.1,
      food: 3.3,
      shopping: 0
    });

    // Breakdown filtered by specific dates
    const breakdownFiltered = Data.catBreakdown(db, ['2026-06-15']);
    expect(breakdownFiltered).toEqual({
      transport: 2.1,
      energy: 0,
      food: 3.3,
      shopping: 0
    });
  });

  test('Data.streak() measures correct active day streaks', () => {
    // Mock Utils.today to return '2026-06-15'
    const originalToday = Utils.today;
    Utils.today = () => '2026-06-15';

    // Consecutive days: June 15, June 14
    expect(Data.streak(db)).toBe(2);

    // Add activity for June 13
    db.activities.push({ id: '4', category: 'shopping', type: 'clothing', amount: 1, co2: 10, date: '2026-06-13' });
    expect(Data.streak(db)).toBe(3);

    // Add activity with a gap (June 11)
    db.activities.push({ id: '5', category: 'shopping', type: 'clothing', amount: 1, co2: 10, date: '2026-06-11' });
    expect(Data.streak(db)).toBe(3); // Gap at June 12 breaks streak

    // Reset mock
    Utils.today = originalToday;
  });
});
