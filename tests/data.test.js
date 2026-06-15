global.Utils = require('../js/utils.js');

// Mock localStorage globally
const mockStorage = {};
global.localStorage = {
  getItem: jest.fn(key => mockStorage[key] || null),
  setItem: jest.fn((key, val) => { mockStorage[key] = val; }),
  removeItem: jest.fn(key => { delete mockStorage[key]; })
};

const Data = require('../js/data.js');

describe('Data module tests', () => {
  let db;

  beforeEach(() => {
    // Reset storage
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
    jest.clearAllMocks();

    db = {
      activities: [
        { id: '1', category: 'transport', type: 'car', amount: 10, co2: 2.1, date: '2026-06-15', time: '10:00 AM' },
        { id: '2', category: 'food', type: 'meat', amount: 1, co2: 3.3, date: '2026-06-15', time: '01:00 PM' },
        { id: '3', category: 'energy', type: 'electricity', amount: 5, co2: 2.1, date: '2026-06-14', time: '08:00 PM' }
      ],
      settings: { goal: 50, region: 'global' }
    };
  });

  test('Data.load() and Data.save() handle localStorage correctly', () => {
    // Save state
    Data.save(db);
    expect(global.localStorage.setItem).toHaveBeenCalledWith('ecotrack', JSON.stringify(db));

    // Load state
    const loaded = Data.load();
    expect(loaded.activities.length).toBe(3);
    expect(loaded.settings.goal).toBe(50);

    // Wipes state
    Data.clear();
    expect(global.localStorage.removeItem).toHaveBeenCalledWith('ecotrack');

    // Load empty state returns default blank layout
    const empty = Data.load();
    expect(empty.activities).toEqual([]);
    expect(empty.settings.goal).toBe(50);
  });

  test('Data.load() handles syntax errors gracefully', () => {
    global.localStorage.getItem.mockImplementationOnce(() => 'invalid json {');
    const result = Data.load();
    expect(result.activities).toEqual([]);
  });

  test('Data.calc() calculates CO2 correctly for factors', () => {
    expect(Data.calc('transport', 'car', 10)).toBe(2.1);
    expect(Data.calc('food', 'vegan', 2)).toBe(1.8);
    expect(Data.calc('energy', 'electricity', 10, 'global')).toBe(4.2);
    expect(Data.calc('energy', 'electricity', 10, 'in')).toBe(7.1);
    expect(Data.calc('invalid', 'type', 10)).toBe(0);
  });

  test('Data.dayTotal() sums up correct total emissions for a day', () => {
    expect(Data.dayTotal(db, '2026-06-15')).toBe(5.4);
    expect(Data.dayTotal(db, '2026-06-14')).toBe(2.1);
    expect(Data.dayTotal(db, '2026-06-13')).toBe(0);
  });

  test('Data.avgDaily() calculates mathematical daily average', () => {
    expect(Data.avgDaily(db)).toBeCloseTo(3.75);
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

    const breakdownFiltered = Data.catBreakdown(db, ['2026-06-15']);
    expect(breakdownFiltered).toEqual({
      transport: 2.1,
      energy: 0,
      food: 3.3,
      shopping: 0
    });
  });

  test('Data.streak() measures correct active day streaks', () => {
    const originalToday = Utils.today;
    Utils.today = () => '2026-06-15';

    expect(Data.streak(db)).toBe(2);

    db.activities.push({ id: '4', category: 'shopping', type: 'clothing', amount: 1, co2: 10, date: '2026-06-13' });
    expect(Data.streak(db)).toBe(3);

    db.activities.push({ id: '5', category: 'shopping', type: 'clothing', amount: 1, co2: 10, date: '2026-06-11' });
    expect(Data.streak(db)).toBe(3); // Gap breaks streak

    Utils.today = originalToday;
  });
});
