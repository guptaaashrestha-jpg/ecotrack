/* ============================================================
   ECOTRACK — Data Layer
   ============================================================ */
/**
 * Core Data layer for managing emission factors, calculations, and local storage state.
 */
const Data = (() => {
  const KEY = 'ecotrack';
  const FACTORS = {
    transport: {
      car:   { label:'Car',        unit:'km',  factor:0.21,  icon:'🚗' },
      bus:   { label:'Bus',        unit:'km',  factor:0.089, icon:'🚌' },
      train: { label:'Train',      unit:'km',  factor:0.041, icon:'🚆' },
      flight:{ label:'Flight',     unit:'km',  factor:0.255, icon:'✈️' },
      bike:  { label:'Bike/Walk',  unit:'km',  factor:0,     icon:'🚲' }
    },
    energy: {
      electricity:{ label:'Electricity',  unit:'kWh', factor:0.42, icon:'⚡' },
      gas:        { label:'Natural Gas',  unit:'kWh', factor:0.18, icon:'🔥' }
    },
    food: {
      meat:      { label:'Meat Meal',      unit:'meal', factor:3.3, icon:'🥩' },
      vegetarian:{ label:'Vegetarian Meal',unit:'meal', factor:1.7, icon:'🥗' },
      vegan:     { label:'Vegan Meal',     unit:'meal', factor:0.9, icon:'🥬' }
    },
    shopping: {
      clothing:   { label:'Clothing',    unit:'item', factor:10,  icon:'👕' },
      electronics:{ label:'Electronics', unit:'item', factor:50,  icon:'📱' },
      groceries:  { label:'Groceries',   unit:'bag',  factor:3.5, icon:'🛒' }
    }
  };
  const GRID = { global:0.42, us:0.39, eu:0.23, uk:0.21, in:0.71 };
  const GLOBAL_AVG = 13.1; // kg CO₂e/day per capita

  /**
   * Generates a blank state database object.
   * @returns {Object} A blank database object with activities list and initial settings.
   */
  const blank = () => ({ activities:[], settings:{ goal:50, region:'global' } });

  /**
   * Loads user data from local storage. Fallbacks to a blank state.
   * @returns {Object} The parsed user database state.
   */
  function load() {
    try {
      if (typeof localStorage === 'undefined') return blank();
      const d = JSON.parse(localStorage.getItem(KEY));
      return d?.activities ? d : blank();
    }
    catch { return blank(); }
  }

  /**
   * Saves user database state into local storage.
   * @param {Object} d - The database state to save.
   */
  const save = d => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEY, JSON.stringify(d));
    }
  };

  /**
   * Wipes the local storage key.
   */
  const clear = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(KEY);
    }
  };

  /**
   * Calculates CO₂ estimation based on activity variables and emission factors.
   * @param {string} cat - Activity category ('transport', 'energy', 'food', 'shopping').
   * @param {string} type - Specific activity subtype (e.g. 'car', 'meat').
   * @param {number} amt - Numerical amount of usage/consumption.
   * @param {string} [region='global'] - Regional setting for electricity grid factor.
   * @returns {number} The rounded CO₂ footprint in kg.
   */
  function calc(cat, type, amt, region='global') {
    const f = FACTORS[cat]?.[type];
    if (!f) return 0;
    let factor = f.factor;
    if (cat==='energy' && type==='electricity' && GRID[region]) factor = GRID[region];
    return +(amt * factor).toFixed(2);
  }

  /**
   * Returns sum of all activities on a specific day.
   * @param {Object} d - The database state.
   * @param {string} date - Date in YYYY-MM-DD format.
   * @returns {number} Total emissions in kg.
   */
  const dayTotal = (d, date) => d.activities.filter(a=>a.date===date).reduce((s,a)=>s+a.co2,0);

  /**
   * Returns total emissions for the current week.
   * @param {Object} d - The database state.
   * @returns {number} Total weekly emissions in kg.
   */
  const weekTotal = d => Utils.weekDates().reduce((s,dt)=>s+dayTotal(d,dt),0);

  /**
   * Computes average daily emissions.
   * @param {Object} d - The database state.
   * @returns {number} Average emissions in kg.
   */
  const avgDaily = d => {
    if (!d.activities.length) return 0;
    const dates = [...new Set(d.activities.map(a=>a.date))];
    return d.activities.reduce((s,a)=>s+a.co2,0) / dates.length;
  };

  /**
   * Creates a breakdown of emissions across categories.
   * @param {Object} d - The database state.
   * @param {string[]} [dates] - Optional array of dates to filter by.
   * @returns {Object} Category breakdown key-value map.
   */
  const catBreakdown = (d, dates) => {
    const b = {transport:0,energy:0,food:0,shopping:0};
    const acts = dates ? d.activities.filter(a=>dates.includes(a.date)) : d.activities;
    acts.forEach(a=>{ if(b.hasOwnProperty(a.category)) b[a.category]+=a.co2 });
    return b;
  };

  /**
   * Tracks consecutive usage/logging streak.
   * @param {Object} d - The database state.
   * @returns {number} Daily streak length.
   */
  function streak(d) {
    if (!d.activities.length) return 0;
    const dates = [...new Set(d.activities.map(a=>a.date))].sort().reverse();
    let s=0, check=Utils.today();
    for (const dt of dates) {
      if (dt===check) { s++; const p=new Date(check); p.setDate(p.getDate()-1); check=p.toISOString().split('T')[0]; }
      else if (dt<check) break;
    }
    return s;
  }

  return { FACTORS, GLOBAL_AVG, load, save, clear, calc, dayTotal, weekTotal, avgDaily, catBreakdown, streak };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Data;
}
