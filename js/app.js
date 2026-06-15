/* ============================================================
   ECOTRACK — Main App Controller
   ============================================================ */
/**
 * Main application controller module managing navigation, tabs, cursor effects, forms, chat, and database interaction.
 */
const App = (() => {
  let db, cat = 'transport', range = 'week';

  /**
   * Initializes database state, listeners, layouts, and interactive modules.
   */
  function init() {
    db = Data.load();
    setupNav(); setupTabs(); setupCursor(); setupTilt();
    setupScrollReveal(); setupLogForm(); setupChat();
    setupSettings(); setupModal();
    renderDashboard(); renderLogForm(); renderRecent();
    lucide.createIcons();
  }
  document.addEventListener('DOMContentLoaded', init);

  /**
   * Scans scrolling action to toggle nav header scrolled styling state.
   */
  function setupNav() {
    let last = 0;
    window.addEventListener('scroll', () => {
      if (performance.now() - last < 50) return; last = performance.now();
      document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 20);
    }, {passive:true});
  }

  /**
   * Sets up tab selection button event listeners.
   */
  function setupTabs() {
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  /**
   * Switches views between tabs (Dashboard, Log, Insights, AI Advisor, Settings).
   * @param {string} tab - The target tab key name.
   */
  function switchTab(tab) {
    document.querySelectorAll('.nav-tab').forEach(b => { b.classList.toggle('active', b.dataset.tab===tab); b.setAttribute('aria-selected', b.dataset.tab===tab); });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id===`tab-${tab}`));
    // Re-trigger reveal
    const reveal = document.querySelector(`#tab-${tab} .reveal`);
    if (reveal) { reveal.classList.remove('visible'); requestAnimationFrame(()=>reveal.classList.add('visible')); }
    // Re-render
    if (tab==='dashboard') renderDashboard();
    if (tab==='insights') renderInsights();
    if (tab==='log') { renderLogForm(); renderRecent(); }
    window.scrollTo({top:0,behavior:'smooth'});
    lucide.createIcons();
  }

  /**
   * Configures 3D fluid custom cursor trailing movements.
   */
  function setupCursor() {
    const c = document.getElementById('cursor');
    let cx=0,cy=0,tx=0,ty=0;
    document.addEventListener('mousemove', e => { tx=e.clientX; ty=e.clientY; });
    (function loop() {
      cx += (tx-cx)*0.18; cy += (ty-cy)*0.18;
      c.style.left = cx+'px'; c.style.top = cy+'px';
      requestAnimationFrame(loop);
    })();
    const hover = 'button,a,input,select,.chip,.cat-btn,.tilt-card,.nav-tab,.toggle-btn';
    document.addEventListener('mouseover', e => { if(e.target.closest(hover)) c.classList.add('hover'); });
    document.addEventListener('mouseout', e => { if(e.target.closest(hover)) c.classList.remove('hover'); });
  }

  /**
   * Sets up mouse parallax card tilt effects.
   */
  function setupTilt() {
    document.addEventListener('mousemove', e => {
      document.querySelectorAll('.tilt-card').forEach(card => {
        const r = card.getBoundingClientRect();
        if (e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) return;
        const x = (e.clientX-r.left)/r.width-0.5;
        const y = (e.clientY-r.top)/r.height-0.5;
        card.style.transform = `rotateX(${-y*8}deg) rotateY(${x*8}deg)`;
        const inner = card.querySelector('.tilt-inner');
        if (inner) inner.style.transform = `translateZ(10px) rotateX(${y*2}deg) rotateY(${-x*2}deg)`;
      });
    });
    document.addEventListener('mouseleave', () => {
      document.querySelectorAll('.tilt-card').forEach(c => c.style.transform = '');
    }, true);
    document.addEventListener('mouseout', e => {
      if (e.target.classList?.contains('tilt-card')) e.target.style.transform = '';
    });
  }

  /**
   * Uses IntersectionObserver to reveal elements as they enter the viewport.
   */
  function setupScrollReveal() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
    }, {threshold:0.1});
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    // Trigger first visible
    setTimeout(() => document.querySelectorAll('.tab-panel.active .reveal').forEach(r=>r.classList.add('visible')), 100);
  }

  /**
   * Updates state data and renders primary stats indicators.
   */
  function renderDashboard() {
    const today = Utils.today();
    Utils.animateNum(document.getElementById('stat-today'), Data.dayTotal(db, today));
    Utils.animateNum(document.getElementById('stat-week'), Data.weekTotal(db));
    const avg = Data.avgDaily(db);
    Utils.animateNum(document.getElementById('stat-global'), avg>0 ? Math.round(avg/Data.GLOBAL_AVG*100) : 0);
    Utils.animateNum(document.getElementById('stat-streak'), Data.streak(db));
    Charts.renderDonut(db);
    Charts.renderTrend(db);
    document.getElementById('ai-insight-text').textContent = AI.generateTip(db);
  }

  /**
   * Configures category select and log activity form buttons.
   */
  function setupLogForm() {
    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        cat = btn.dataset.cat;
        document.querySelectorAll('.cat-btn').forEach(b => { b.classList.toggle('active',b.dataset.cat===cat); b.setAttribute('aria-pressed',b.dataset.cat===cat); });
        renderLogForm();
      });
    });
    document.getElementById('log-form').addEventListener('submit', e => {
      e.preventDefault();
      const type = document.getElementById('log-type').value;
      const amt = parseFloat(document.getElementById('log-amount').value);
      const date = document.getElementById('log-date').value;
      if (!amt || amt<=0) return toast('⚠️','Enter a valid amount');
      const co2 = Data.calc(cat, type, amt, db.settings?.region);
      db.activities.push({ id:Utils.id(), category:cat, type, amount:amt, co2, date, time:new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}) });
      Data.save(db);
      document.getElementById('log-amount').value=''; updateCO2Badge();
      const f = Data.FACTORS[cat][type];
      toast('✅',`${f.icon} ${f.label} — ${co2.toFixed(1)} kg CO₂e`);
      renderRecent();
    });
    document.getElementById('log-amount')?.addEventListener('input', updateCO2Badge);
    document.getElementById('log-type')?.addEventListener('change', updateCO2Badge);
    document.getElementById('log-date').value = Utils.today();

    // Quick chips
    document.querySelectorAll('.chip[data-quick]').forEach(chip => {
      chip.addEventListener('click', () => {
        const q = JSON.parse(chip.dataset.quick);
        const co2 = Data.calc(q.cat, q.type, q.amt, db.settings?.region);
        db.activities.push({ id:Utils.id(), category:q.cat, type:q.type, amount:q.amt, co2, date:Utils.today(), time:new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}) });
        Data.save(db);
        const f = Data.FACTORS[q.cat][q.type];
        toast('⚡',`${f.icon} ${f.label} — ${co2.toFixed(1)} kg`);
        renderRecent();
      });
    });
  }

  /**
   * Renders the input fields and types selection in the logger form.
   */
  function renderLogForm() {
    const sel = document.getElementById('log-type');
    const factors = Data.FACTORS[cat];
    sel.innerHTML = Object.entries(factors).map(([k,v])=>`<option value="${k}">${v.icon} ${v.label} (${v.factor}/${v.unit})</option>`).join('');
    updateCO2Badge();
    lucide.createIcons();
  }

  /**
   * Performs dynamic calculation estimates to show real-time emission output.
   */
  function updateCO2Badge() {
    const type = document.getElementById('log-type')?.value;
    const amt = parseFloat(document.getElementById('log-amount')?.value)||0;
    const co2 = Data.calc(cat, type, amt, db.settings?.region);
    document.getElementById('co2-est').textContent = co2.toFixed(1);
  }

  /**
   * Displays the recently logged user actions in list view.
   */
  function renderRecent() {
    const list = document.getElementById('recent-list');
    const recent = [...db.activities].reverse().slice(0,8);
    if (!recent.length) {
      list.innerHTML = `<div class="empty-state">
        <svg width="56" height="56" viewBox="0 0 100 100" fill="none" aria-hidden="true"><circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.06)" stroke-width="2"/><path d="M40 65 L40 45 L55 35 L70 45 L70 65" stroke="var(--green)" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="55" cy="55" r="6" stroke="var(--green)" stroke-width="2" fill="none"/><path d="M55 61 L55 70" stroke="var(--green)" stroke-width="2" stroke-linecap="round"/></svg>
        <p>No activities yet — log one above</p></div>`;
      return;
    }
    list.innerHTML = recent.map(a => {
      const f = Data.FACTORS[a.category]?.[a.type];
      return `<div class="recent-item"><span class="recent-icon">${f?.icon||'📋'}</span><div class="recent-info"><div class="recent-title">${f?.label||a.type} — ${a.amount} ${f?.unit||''}</div><div class="recent-meta">${Utils.formatDate(a.date)}${a.time?' · '+a.time:''}</div></div><span class="recent-co2">${a.co2.toFixed(1)} kg</span><button class="recent-del" onclick="App.delActivity('${a.id}')" aria-label="Delete activity"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div>`;
    }).join('');
  }

  /**
   * Deletes logged activity by item identifier.
   * @param {string} id - Activity identifier.
   */
  function delActivity(id) { db.activities=db.activities.filter(a=>a.id!==id); Data.save(db); renderRecent(); toast('🗑️','Deleted'); }

  /**
   * Gathers data context to render charts inside the Insights tab.
   */
  function renderInsights() {
    const dates = range==='week' ? Utils.weekDates() : Utils.monthDates();
    Charts.renderBar(db, dates);
    const weekCO2 = Data.weekTotal(db), goal = db.settings?.goal||50;
    const pct = Math.min(weekCO2/goal*100,100);
    document.getElementById('goal-fill').style.width = pct+'%';
    document.getElementById('goal-text').textContent = `${weekCO2.toFixed(1)} / ${goal} kg CO₂e this week`;
    document.getElementById('ai-summary-text').textContent = AI.generateWeeklySummary(db);

    document.querySelectorAll('.toggle-btn').forEach(b=>{
      b.onclick = () => { range=b.dataset.range; document.querySelectorAll('.toggle-btn').forEach(x=>x.classList.toggle('active',x===b)); renderInsights(); };
    });
  }

  /**
   * Submits prompt selection templates and text submissions.
   */
  function setupChat() {
    document.getElementById('chat-form').addEventListener('submit', e => { e.preventDefault(); sendChat(); });
    document.querySelectorAll('.chip[data-prompt]').forEach(c => {
      c.addEventListener('click', () => { document.getElementById('chat-input').value=c.dataset.prompt; sendChat(); });
    });
  }

  /**
   * Sends user chat message and displays local AI query response.
   */
  function sendChat() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim(); if (!msg) return;
    const log = document.getElementById('chat-log');
    const empty = log.querySelector('.chat-empty'); if(empty) empty.remove();
    log.innerHTML += `<div class="msg msg-user">${Utils.escape(msg)}</div>`;
    const reply = AI.chatRespond(msg, db);
    log.innerHTML += `<div class="msg msg-ai">${Utils.escape(reply)}</div>`;
    input.value = '';
    log.scrollTop = log.scrollHeight;
  }

  /**
   * Sets up goals setting and data exports click listeners.
   */
  function setupSettings() {
    const goalIn = document.getElementById('setting-goal');
    const regionIn = document.getElementById('setting-region');
    goalIn.value = db.settings?.goal || 50;
    regionIn.value = db.settings?.region || 'global';
    goalIn.addEventListener('change', () => { db.settings.goal=+goalIn.value||50; Data.save(db); toast('⚙️','Goal updated'); });
    regionIn.addEventListener('change', () => { db.settings.region=regionIn.value; Data.save(db); toast('⚙️','Region updated'); });
    document.getElementById('btn-export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(db,null,2)],{type:'application/json'});
      const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
      a.download=`ecotrack-${Utils.today()}.json`; a.click(); toast('📁','Exported');
    });
    document.getElementById('btn-clear').addEventListener('click', () => document.getElementById('modal').classList.remove('hidden'));
  }

  /**
   * Handles modal dialog configuration cancel and confirm events.
   */
  function setupModal() {
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-confirm').addEventListener('click', () => {
      Data.clear(); db=Data.load(); closeModal();
      renderDashboard(); renderRecent(); toast('🗑️','All data cleared');
    });
  }

  /**
   * Closes data wiping validation confirmation window dialog.
   */
  function closeModal() { document.getElementById('modal').classList.add('hidden'); }

  /**
   * Generates micro ambient banner notifications on user interactions.
   * @param {string} icon - The visual icon indicator.
   * @param {string} text - Message description payload.
   */
  function toast(icon, text) {
    const wrap = document.getElementById('toast-wrap');
    const t = document.createElement('div'); t.className='toast';
    t.innerHTML=`<span class="toast-icon">${icon}</span><span>${text}</span>`;
    wrap.appendChild(t);
    setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(),300); }, 2000);
  }

  return { delActivity, closeModal, init };
})();
