/* ============================================================
   ECOTRACK — Charts Module
   ============================================================ */
const Charts = (() => {
  let donut, trend, bar;
  const C = { transport:'#00ff87', energy:'#fb923c', food:'#f87171', shopping:'#7c3aed' };

  Chart.defaults.color = '#6b7f72';
  Chart.defaults.font.family = "'Inter',sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.plugins.legend.display = false;
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;
  const tip = { backgroundColor:'rgba(8,12,10,0.92)', padding:10, cornerRadius:8, titleFont:{weight:'600'} };

  function renderDonut(d) {
    const ctx = document.getElementById('donut-chart');
    if (!ctx) return;
    const b = Data.catBreakdown(d, [Utils.today()]);
    const vals = Object.values(b), has = vals.some(v=>v>0);
    if (donut) donut.destroy();
    donut = new Chart(ctx, {
      type:'doughnut',
      data:{
        labels:['Transport','Energy','Food','Shopping'],
        datasets:[{ data:has?vals:[1,1,1,1],
          backgroundColor:has?Object.values(C):Array(4).fill('rgba(255,255,255,0.03)'),
          borderWidth:0, hoverOffset:6 }]
      },
      options:{ cutout:'74%', plugins:{ tooltip:{...tip, enabled:has, callbacks:{label:c=>` ${c.parsed.toFixed(1)} kg`}} },
        animation:{duration:300} },
      plugins:[{
        id:'center',
        afterDraw(chart) {
          const {width:w,height:h,ctx:x} = chart; x.save();
          const t = has ? vals.reduce((a,b)=>a+b,0) : 0;
          x.font = '800 1.4rem Inter,sans-serif'; x.fillStyle='#e8ede9';
          x.textAlign='center'; x.textBaseline='middle';
          x.fillText(t.toFixed(1), w/2, h/2-6);
          x.font = '400 0.65rem Inter,sans-serif'; x.fillStyle='#6b7f72';
          x.fillText('kg CO₂e', w/2, h/2+12); x.restore();
        }
      }]
    });
  }

  function renderTrend(d) {
    const ctx = document.getElementById('trend-chart');
    if (!ctx) return;
    const wk = Utils.weekDates();
    const vals = wk.map(dt=>Data.dayTotal(d,dt));
    const labels = wk.map(dt=>new Date(dt+'T12:00:00').toLocaleDateString('en',{weekday:'short'}));
    if (trend) trend.destroy();
    const g = ctx.getContext('2d').createLinearGradient(0,0,0,220);
    g.addColorStop(0,'rgba(0,255,135,0.15)'); g.addColorStop(1,'rgba(0,255,135,0)');
    trend = new Chart(ctx, {
      type:'line',
      data:{ labels,
        datasets:[
          { data:vals, borderColor:'#00ff87', backgroundColor:g, borderWidth:2, fill:true, tension:0.4,
            pointRadius:4, pointHoverRadius:6, pointBackgroundColor:'#00ff87', pointBorderColor:'#080c0a', pointBorderWidth:2 },
          { data:wk.map(()=>d.settings?.goal/7||7.1), borderColor:'rgba(248,113,113,0.3)', borderWidth:1,
            borderDash:[6,4], fill:false, pointRadius:0, tension:0 }
        ]
      },
      options:{
        scales:{
          x:{grid:{color:'rgba(255,255,255,0.03)'}},
          y:{beginAtZero:true, grid:{color:'rgba(255,255,255,0.03)'}, ticks:{callback:v=>v+'kg'}}
        },
        plugins:{tooltip:{...tip, callbacks:{label:c=>c.datasetIndex===1?`Target: ${c.parsed.y.toFixed(1)}kg`:`${c.parsed.y.toFixed(1)} kg CO₂e`}}},
        animation:{duration:300}
      }
    });
  }

  function renderBar(d, dates) {
    const ctx = document.getElementById('bar-chart');
    if (!ctx) return;
    const b = Data.catBreakdown(d, dates);
    if (bar) bar.destroy();
    bar = new Chart(ctx, {
      type:'bar',
      data:{
        labels:['Transport','Energy','Food','Shopping'],
        datasets:[{ data:Object.values(b), backgroundColor:Object.values(C),
          borderRadius:8, borderSkipped:false, barThickness:36 }]
      },
      options:{
        scales:{
          x:{grid:{display:false}, ticks:{font:{weight:'500'}}},
          y:{beginAtZero:true, grid:{color:'rgba(255,255,255,0.03)'}, ticks:{callback:v=>v+'kg'}}
        },
        plugins:{tooltip:{...tip, callbacks:{label:c=>` ${c.parsed.y.toFixed(1)} kg`}}},
        animation:{duration:300}
      }
    });
  }

  return { renderDonut, renderTrend, renderBar, C };
})();
