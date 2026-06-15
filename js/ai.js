/* ============================================================
   ECOTRACK — Local AI Engine (no API, no external calls)
   ============================================================ */
/**
 * Local AI engine executing browser-side analytics, tip generation, and chat responses.
 */
const AI = (() => {
  /**
   * Analyzes activity data to identify the highest emission category.
   * @param {Object} d - The database state.
   * @returns {Object|null} Top category details including name, co2 value, and percentage, or null if empty.
   */
  function analyzeTopCategory(d) {
    const b = Data.catBreakdown(d);
    const total = Object.values(b).reduce((s,v)=>s+v,0);
    if (total === 0) return null;
    const top = Object.entries(b).sort((a,b)=>b[1]-a[1])[0];
    return { category:top[0], co2:top[1], pct:Math.round(top[1]/total*100), total };
  }

  /**
   * Generates a single, personalized sustainability tip based on top emission category.
   * @param {Object} d - The database state.
   * @returns {string} The tip text.
   */
  function generateTip(d) {
    const top = analyzeTopCategory(d);
    if (!top) return 'Log your first activity to get personalized tips';
    const acts = d.activities;
    const tips = {
      transport: () => {
        const carActs = acts.filter(a=>a.type==='car');
        const totalKm = carActs.reduce((s,a)=>s+a.amount,0);
        const saving = +(totalKm * (0.21-0.041) / Math.max(carActs.length,1)).toFixed(1);
        return totalKm > 0
          ? `Switch one car trip per week to train — save ~${saving} kg CO₂ per trip based on your average ${Math.round(totalKm/Math.max(carActs.length,1))} km distance`
          : `Your transport emissions account for ${top.pct}% of your footprint. Try cycling for short trips`;
      },
      energy: () => {
        const kwh = acts.filter(a=>a.category==='energy').reduce((s,a)=>s+a.amount,0);
        const target = Math.round(kwh * 0.15);
        return `You logged ${kwh.toFixed(0)} kWh total. Reducing by just ${target} kWh (15%) would save ~${(target*0.42).toFixed(1)} kg CO₂`;
      },
      food: () => {
        const meat = acts.filter(a=>a.type==='meat').length;
        const veg = acts.filter(a=>a.type==='vegan').length;
        const swap = +(3.3-0.9).toFixed(1);
        return meat > 0
          ? `You logged ${meat} meat meals. Swapping just one to vegan saves ${swap} kg CO₂ per meal`
          : `Food is ${top.pct}% of your emissions. Try more plant-based meals — each vegan meal saves ~2.4 kg vs meat`;
      },
      shopping: () => {
        const elec = acts.filter(a=>a.type==='electronics').length;
        return elec > 0
          ? `Electronics have the highest per-item impact (50 kg each). You bought ${elec} — consider a 30-day wait rule before purchases`
          : `Shopping is ${top.pct}% of your footprint. Buy less, choose quality items that last longer`;
      }
    };
    return (tips[top.category] || tips.transport)();
  }

  /**
   * Generates a week-over-week comparative emission summary text.
   * @param {Object} d - The database state.
   * @returns {string} The weekly summary text.
   */
  function generateWeeklySummary(d) {
    const thisWeek = Utils.weekDates();
    const prevWeek = []; const now = new Date();
    for (let i=13;i>=7;i--) { const dt=new Date(now); dt.setDate(dt.getDate()-i); prevWeek.push(dt.toISOString().split('T')[0]); }
    const thisB = Data.catBreakdown(d, thisWeek);
    const prevB = Data.catBreakdown(d, prevWeek);
    const thisTotal = Object.values(thisB).reduce((s,v)=>s+v,0);
    const prevTotal = Object.values(prevB).reduce((s,v)=>s+v,0);
    if (thisTotal===0 && prevTotal===0) return 'Log activities to generate your weekly summary with specific recommendations.';

    let change = '', action = '';
    const cats = Object.keys(thisB);
    let biggest = cats[0], biggestDiff = 0;
    cats.forEach(c => { const diff = thisB[c]-prevB[c]; if (Math.abs(diff)>Math.abs(biggestDiff)) { biggest=c; biggestDiff=diff; } });

    if (prevTotal === 0) {
      change = `This week you emitted ${thisTotal.toFixed(1)} kg CO₂e total, with ${biggest} as your top category at ${thisB[biggest].toFixed(1)} kg.`;
    } else {
      const dir = biggestDiff > 0 ? 'increased' : 'decreased';
      change = `Your ${biggest} emissions ${dir} by ${Math.abs(biggestDiff).toFixed(1)} kg compared to last week (${thisTotal.toFixed(1)} kg total vs ${prevTotal.toFixed(1)} kg).`;
    }
    const topCat = Object.entries(thisB).sort((a,b)=>b[1]-a[1])[0];
    const actions = {
      transport: 'Try replacing one car trip with public transit next week.',
      energy: 'Aim to reduce electricity use by turning off standby devices.',
      food: 'Swap one meat meal for a plant-based option this coming week.',
      shopping: 'Challenge yourself to a no-buy week for non-essentials.'
    };
    action = actions[topCat[0]] || actions.transport;
    return `${change} ${action}`;
  }

  /**
   * Responds to user chat messages based on text matching and user statistics.
   * @param {string} msg - The text query message from the user.
   * @param {Object} d - The database state.
   * @returns {string} The local AI response string.
   */
  function chatRespond(msg, d) {
    if (!d.activities.length) return "I don't have any data to work with yet. Log at least one activity first, and I'll be able to give you personalized insights based on your actual numbers.";
    const m = msg.toLowerCase();
    const top = analyzeTopCategory(d);
    const total = top ? top.total : 0;
    const avg = Data.avgDaily(d);
    const b = Data.catBreakdown(d);

    if (m.includes('food') || m.includes('meal') || m.includes('eat')) {
      const meat = d.activities.filter(a=>a.type==='meat').length;
      const vegan = d.activities.filter(a=>a.type==='vegan').length;
      return `Your food emissions total ${b.food.toFixed(1)} kg CO₂e (${total>0?Math.round(b.food/total*100):0}% of all emissions). You've logged ${meat} meat meals and ${vegan} vegan meals. Each meat-to-vegan swap saves 2.4 kg CO₂. ${meat>0?`Swapping just ${Math.min(meat,3)} of those would save ~${(Math.min(meat,3)*2.4).toFixed(1)} kg.`:'Great job keeping meat meals low!'}`;
    }
    if (m.includes('transport') || m.includes('car') || m.includes('drive') || m.includes('travel')) {
      const carKm = d.activities.filter(a=>a.type==='car').reduce((s,a)=>s+a.amount,0);
      return `Your transport emissions total ${b.transport.toFixed(1)} kg CO₂e. You've driven ${carKm.toFixed(0)} km by car (${(carKm*0.21).toFixed(1)} kg CO₂). Switching to train for the same distance would only produce ${(carKm*0.041).toFixed(1)} kg — a ${((carKm*0.21)-(carKm*0.041)).toFixed(1)} kg saving.`;
    }
    if (m.includes('energy') || m.includes('electric') || m.includes('power')) {
      const kwh = d.activities.filter(a=>a.category==='energy').reduce((s,a)=>s+a.amount,0);
      return `Your energy emissions total ${b.energy.toFixed(1)} kg CO₂e from ${kwh.toFixed(0)} kWh logged. That's ${total>0?Math.round(b.energy/total*100):0}% of your footprint. Reducing standby power and using LED bulbs could cut this by 15-20%.`;
    }
    if (m.includes('shopping') || m.includes('buy') || m.includes('purchase')) {
      const items = d.activities.filter(a=>a.category==='shopping').length;
      return `Your shopping emissions total ${b.shopping.toFixed(1)} kg CO₂e from ${items} purchases. Electronics have the highest impact at 50 kg each. Consider a 30-day waiting rule before non-essential purchases.`;
    }
    if (m.includes('week') || m.includes('summary') || m.includes('analyze')) return generateWeeklySummary(d);
    if (m.includes('worst') || m.includes('biggest') || m.includes('impact') || m.includes('most')) {
      return top ? `Your biggest impact area is ${top.category} at ${top.co2.toFixed(1)} kg CO₂e (${top.pct}% of your total ${total.toFixed(1)} kg). ${generateTip(d)}` : 'Not enough data yet.';
    }
    if (m.includes('best') || m.includes('lowest') || m.includes('good')) {
      const lowest = Object.entries(b).filter(e=>e[1]>0).sort((a,b)=>a[1]-b[1])[0];
      return lowest ? `Your lowest-impact category is ${lowest[0]} at just ${lowest[1].toFixed(1)} kg CO₂e. Keep it up! Your daily average is ${avg.toFixed(1)} kg vs the global average of ${Data.GLOBAL_AVG} kg.` : 'Log more data for comparison.';
    }
    if (m.includes('tip') || m.includes('help') || m.includes('advice') || m.includes('suggest') || m.includes('reduce')) return generateTip(d);

    return `Based on your data: daily average is ${avg.toFixed(1)} kg CO₂e (global avg: ${Data.GLOBAL_AVG} kg). ${top?`Your top category is ${top.category} at ${top.pct}%.`:''} ${generateTip(d)}`;
  }

  return { analyzeTopCategory, generateTip, generateWeeklySummary, chatRespond };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AI;
}
