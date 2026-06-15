global.Utils = require('../js/utils.js');
global.Data = require('../js/data.js');
const AI = require('../js/ai.js');

describe('AI module tests', () => {
  let db;

  beforeEach(() => {
    db = {
      activities: [
        { id: '1', category: 'transport', type: 'car', amount: 10, co2: 2.1, date: '2026-06-15' },
        { id: '2', category: 'food', type: 'meat', amount: 1, co2: 3.3, date: '2026-06-15' }
      ],
      settings: { goal: 50, region: 'global' }
    };
  });

  test('AI.analyzeTopCategory() detects top category', () => {
    // Food is 3.3, Transport is 2.1
    const top = AI.analyzeTopCategory(db);
    expect(top).not.toBeNull();
    expect(top.category).toBe('food');
    expect(top.co2).toBe(3.3);
    expect(top.pct).toBe(61); // 3.3 / 5.4 * 100 = 61.1% -> 61%
  });

  test('AI.generateTip() returns expected tip depending on top category', () => {
    // Top category is food, has meat
    const tipFoodMeat = AI.generateTip(db);
    expect(tipFoodMeat).toContain('meat meals');
    expect(tipFoodMeat).toContain('saves 2.4 kg');

    // Change top category to transport with car activity
    db.activities = [
      { id: '1', category: 'transport', type: 'car', amount: 100, co2: 21.0, date: '2026-06-15' }
    ];
    const tipTransportCar = AI.generateTip(db);
    expect(tipTransportCar).toContain('Switch one car trip');
    expect(tipTransportCar).toContain('save ~');
  });

  test('AI.generateWeeklySummary() provides comparative description', () => {
    // Mock date range to return specific values
    const originalWeekDates = Utils.weekDates;
    Utils.weekDates = () => ['2026-06-15', '2026-06-14', '2026-06-13', '2026-06-12', '2026-06-11', '2026-06-10', '2026-06-09'];

    const summary = AI.generateWeeklySummary(db);
    expect(summary).toContain('This week you emitted');
    expect(summary).toContain('Swap one meat meal');

    Utils.weekDates = originalWeekDates;
  });

  test('AI.chatRespond() answers standard prompts', () => {
    // Empty database case
    const emptyResponse = AI.chatRespond('hello', { activities: [] });
    expect(emptyResponse).toContain('Log at least one activity first');

    // Food keyword match
    const foodReply = AI.chatRespond('Tell me about my food impact', db);
    expect(foodReply).toContain('meat meals');
    expect(foodReply).toContain('vegan meals');

    // Transport keyword match
    const transReply = AI.chatRespond('How much did I drive?', db);
    expect(transReply).toContain('transport emissions');

    // Energy keyword match
    db.activities.push({ id: '3', category: 'energy', type: 'electricity', amount: 10, co2: 4.2 });
    const energyReply = AI.chatRespond('energy usage', db);
    expect(energyReply).toContain('energy emissions');

    // Advice keyword match
    const helpReply = AI.chatRespond('give me tips', db);
    expect(helpReply).toBeTruthy();
  });
});
