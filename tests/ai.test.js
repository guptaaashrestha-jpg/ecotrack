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

  test('AI.analyzeTopCategory() detects top category or null', () => {
    const top = AI.analyzeTopCategory(db);
    expect(top).not.toBeNull();
    expect(top.category).toBe('food');
    expect(top.co2).toBe(3.3);

    // Empty dataset returns null
    expect(AI.analyzeTopCategory({ activities: [] })).toBeNull();
  });

  test('AI.generateTip() returns expected tip depending on top category', () => {
    // 1. Food (with meat)
    expect(AI.generateTip(db)).toContain('meat meals');

    // 2. Food (without meat)
    db.activities = [{ id: '1', category: 'food', type: 'vegan', amount: 2, co2: 1.8, date: '2026-06-15' }];
    expect(AI.generateTip(db)).toContain('plant-based meals');

    // 3. Transport (with car)
    db.activities = [{ id: '1', category: 'transport', type: 'car', amount: 50, co2: 10.5, date: '2026-06-15' }];
    expect(AI.generateTip(db)).toContain('Switch one car');

    // 4. Transport (without car)
    db.activities = [{ id: '1', category: 'transport', type: 'train', amount: 50, co2: 2.05, date: '2026-06-15' }];
    expect(AI.generateTip(db)).toContain('transport emissions account for');

    // 5. Energy
    db.activities = [{ id: '1', category: 'energy', type: 'electricity', amount: 20, co2: 8.4, date: '2026-06-15' }];
    expect(AI.generateTip(db)).toContain('Reducing by just');

    // 6. Shopping (with electronics)
    db.activities = [{ id: '1', category: 'shopping', type: 'electronics', amount: 1, co2: 50.0, date: '2026-06-15' }];
    expect(AI.generateTip(db)).toContain('Electronics have the highest');

    // 7. Shopping (without electronics)
    db.activities = [{ id: '1', category: 'shopping', type: 'clothing', amount: 2, co2: 20.0, date: '2026-06-15' }];
    expect(AI.generateTip(db)).toContain('Shopping is 100% of your footprint');
  });

  test('AI.generateWeeklySummary() provides comparative description', () => {
    // 1. Empty dates
    expect(AI.generateWeeklySummary({ activities: [] })).toContain('Log activities to generate');

    // Setup dates mock
    const originalWeekDates = Utils.weekDates;
    Utils.weekDates = () => ['2026-06-15', '2026-06-14', '2026-06-13', '2026-06-12', '2026-06-11', '2026-06-10', '2026-06-09'];

    // 2. Only this week has emissions (no prev week)
    let summary = AI.generateWeeklySummary(db);
    expect(summary).toContain('This week you emitted');
    expect(summary).toContain('Swap one meat meal');

    // 3. Both weeks have emissions (increased/decreased check)
    const twoWeekDb = {
      activities: [
        // This week: June 15
        { id: '1', category: 'transport', type: 'car', amount: 10, co2: 2.1, date: '2026-06-15' },
        // Last week: June 08
        { id: '2', category: 'transport', type: 'car', amount: 50, co2: 10.5, date: '2026-06-08' }
      ],
      settings: { goal: 50, region: 'global' }
    };
    summary = AI.generateWeeklySummary(twoWeekDb);
    expect(summary).toContain('emissions decreased by');

    Utils.weekDates = originalWeekDates;
  });

  test('AI.chatRespond() answers standard prompts', () => {
    // Empty database case
    expect(AI.chatRespond('hello', { activities: [] })).toContain('Log at least one activity first');

    // Food keyword matches
    expect(AI.chatRespond('Tell me about my food impact', db)).toContain('meat meals');
    
    // Transport keyword matches
    expect(AI.chatRespond('How much did I drive?', db)).toContain('transport emissions');

    // Energy keyword matches
    db.activities.push({ id: '3', category: 'energy', type: 'electricity', amount: 10, co2: 4.2 });
    expect(AI.chatRespond('energy usage', db)).toContain('energy emissions');

    // Shopping keyword matches
    db.activities.push({ id: '4', category: 'shopping', type: 'electronics', amount: 1, co2: 50.0 });
    expect(AI.chatRespond('shopping items', db)).toContain('shopping emissions');

    // Week / summary keyword
    expect(AI.chatRespond('weekly summary please', db)).toContain('This week you emitted');

    // Worst / biggest impact keyword
    expect(AI.chatRespond('what is my worst impact', db)).toContain('biggest impact area is');

    // Best / lowest impact keyword
    expect(AI.chatRespond('what is my best area', db)).toContain('lowest-impact category is');

    // Advice / tip keyword
    expect(AI.chatRespond('give me tips', db)).toContain('Electronics');

    // Fallback response
    const fallback = AI.chatRespond('arbitrary message', db);
    expect(fallback).toContain('daily average is');
    expect(fallback).toContain('Electronics');
  });

  test('AI.chatRespond() fallback response with zero total emissions', () => {
    const zeroDb = {
      activities: [{ id: '1', category: 'transport', type: 'bike', amount: 10, co2: 0, date: '2026-06-15' }],
      settings: { goal: 50, region: 'global' }
    };
    const fallback = AI.chatRespond('arbitrary message', zeroDb);
    expect(fallback).toContain('daily average is 0.0');
    expect(fallback).not.toContain('Your top category is');
  });
});
