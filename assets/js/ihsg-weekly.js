(function () {
  'use strict';
  const d = window.IHSGWeeklyData;
  const math = window.IHSGWeeklyMath;
  if (!d || !math) return;
  const m = math.metrics(d);
  const $ = id => document.getElementById(id);
  const number = (n, places = 2) => n.toLocaleString('en-US', { minimumFractionDigits: places, maximumFractionDigits: places });
  const signed = (n, places = 2) => `${n < -0.0000001 ? '−' : n > 0.0000001 ? '+' : ''}${number(Math.abs(n), places)}`;
  const percent = n => `${signed(n)}%`;
  const sourceLink = key => `<a href="${d.sources[key].url}">${d.sources[key].label}</a>`;
  document.querySelectorAll('[data-metric]').forEach(el => {
    const value = m[el.dataset.metric];
    if (value === undefined) return;
    el.textContent = el.dataset.format === 'number' ? signed(value) : el.dataset.metric === 'giveback' ? number(value) + '%' : percent(value);
  });

  // Closing observations only. The y-axis intentionally does not start at zero.
  const chartWidth = 740, chartHeight = 280;
  const x = i => 60 + i * 125;
  const y = close => 232 - (close - 6200) / 280 * 205;
  const points = d.closes.map((row, i) => `${x(i)},${y(row.close)}`).join(' ');
  $('index-chart').innerHTML = `<svg viewBox="0 0 ${chartWidth} ${chartHeight}" role="img" aria-labelledby="index-svg-title index-svg-desc">
    <title id="index-svg-title">IHSG closing levels, 18 to 25 September 2026</title>
    <desc id="index-svg-desc">The prior Friday close was 6,441.159. The index rebounded on Wednesday, then ended the week at 6,241.892. Truncated vertical scale from 6,200 to 6,480. A full data table follows.</desc>
    ${[6200,6300,6400].map(v => `<line class="chart-rule" x1="60" x2="700" y1="${y(v)}" y2="${y(v)}"/><text class="chart-axis" x="49" y="${y(v)+4}" text-anchor="end">${number(v,0)}</text>`).join('')}
    <line class="chart-baseline" x1="60" x2="700" y1="${y(d.closes[0].close)}" y2="${y(d.closes[0].close)}"/>
    <polyline class="index-line" pathLength="1" points="${points}"/>
    ${d.closes.map((row,i) => `<circle class="index-point" id="index-point-${i}" cx="${x(i)}" cy="${y(row.close)}" r="4.5"/><text class="chart-axis" x="${x(i)}" y="259" text-anchor="middle">${row.label}</text>`).join('')}
    <text class="chart-annotation" x="${x(3)}" y="${y(d.closes[3].close)-20}" text-anchor="middle">BI holds</text>
  </svg>`;
  $('index-dates').innerHTML = d.closes.map((row,i) => `<button type="button" data-close="${i}" aria-pressed="${i===5}">${row.label}</button>`).join('');
  function selectClose(i) {
    const row = d.closes[i];
    $('index-readout').innerHTML = `<strong>${row.label}: ${number(row.close,3)}</strong><span>${i ? percent(math.change(row.close,d.closes[i-1].close)) + ' vs previous close' : 'Previous-week baseline'} · ${row.note}</span>`;
    document.querySelectorAll('[data-close]').forEach(btn => btn.setAttribute('aria-pressed',String(Number(btn.dataset.close)===i)));
    document.querySelectorAll('.index-point').forEach((point,j) => point.classList.toggle('selected',i===j));
  }
  $('index-dates').addEventListener('click', e => { const btn=e.target.closest('[data-close]'); if(btn) selectClose(Number(btn.dataset.close)); });
  selectClose(5);
  $('close-rows').innerHTML = d.closes.map((row,i) => `<tr><th scope="row">${row.date}</th><td>${number(row.close,3)}</td><td>${i ? percent(math.change(row.close,d.closes[i-1].close)) : 'Baseline'}</td><td>${sourceLink(row.source)}</td></tr>`).join('');
  $('return-math').textContent = `(6,241.892 ÷ 6,441.159 − 1) × 100 = ${percent(m.weekly)}. Recovery required: (6,441.159 ÷ 6,241.892 − 1) × 100 = ${percent(m.recovery)}.`;
  $('rebound-math').textContent = `Wednesday gain: 6,374.912 − 6,277.044 = ${number(m.rebound,3)} points. Thursday + Friday loss: 6,374.912 − 6,241.892 = ${number(m.reversal,3)} points. Loss ÷ gain = ${number(m.giveback,1)}%.`;

  const sectorRows = d.sectors.slice().sort((a,b) => b.weekly-a.weekly);
  $('sector-bars').innerHTML = sectorRows.map(row => {
    const v = row.weekly, left = (Math.min(v,0)+6)/7*100, width = Math.abs(v)/7*100;
    return `<div class="sector-row"><span>${row.name}</span><div class="sector-track" aria-hidden="true"><span class="sector-bar ${v<0?'loss':'gain'}" style="left:${left}%;width:${width}%"></span></div><strong>${percent(v)}</strong></div>`;
  }).join('');
  $('sector-rows').innerHTML = sectorRows.map(row => `<tr><th scope="row">${row.name}</th><td>${percent(row.weekly)}</td></tr>`).join('');
  $('sector-summary').textContent = `${sectorRows.filter(row => row.weekly > 0).length} of 11 sector indices finished the week higher. Fixed −6% to +1% scale.`;

  $('flow-bars').innerHTML = d.foreignFlow.map(row => `<div class="liquidity-row"><span>${row.label}</span><div class="liquidity-track" aria-hidden="true"><span class="loss" style="width:${Math.abs(row.netBn)/1500*100}%"></span></div><strong>${signed(row.netBn)}bn</strong></div>`).join('');
  $('flow-rows').innerHTML = d.foreignFlow.map(row => `<tr><th scope="row">${row.date}</th><td>${signed(row.netBn)}bn</td></tr>`).join('') + `<tr class="table-total"><th scope="row">Week total</th><td>${signed(m.foreignNet)}bn</td></tr>`;
  $('flow-math').textContent = `−(${d.foreignFlow.map(row => number(Math.abs(row.netBn))).join(' + ')}) = ${signed(m.foreignNet)}bn. Thursday accounts for ${number(m.thursdayFlowShare,1)}% of the week's net selling. Three weeks: ${signed(d.prior2WeekNetBn)} − ${number(Math.abs(d.priorWeekNetBn))} − ${number(Math.abs(m.foreignNet))} = ${signed(m.threeWeekNetBn)}bn.`;

  $('activity-rows').innerHTML = d.activity.map(row => {
    const places = row.key === 'cap' ? 0 : 3;
    const calculated = row.key === 'cap' ? math.change(row.current,row.prior) : math.change(d.weeklyTotals.current[row.key],d.weeklyTotals.prior[row.key]);
    return `<tr><th scope="row">${row.label}<small>${row.unit}</small></th><td>${number(row.prior,places)}</td><td>${number(row.current,places)}</td><td>${percent(calculated)}</td><td>${percent(row.reportedPct)}</td></tr>`;
  }).join('');
  $('liquidity-math').textContent = `Previous: Rp${number(d.weeklyTotals.prior.value/1e12,4)}tn ÷ ${number(d.weeklyTotals.prior.volume/1e9,4)}bn shares = Rp${number(m.unitValuePrior)}. Current: Rp${number(d.weeklyTotals.current.value/1e12,4)}tn ÷ ${number(d.weeklyTotals.current.volume/1e9,4)}bn shares = Rp${number(m.unitValueCurrent)}. Change = ${percent(m.unitValueChange)}.`;
  $('liquidity-bars').innerHTML = [['Previous week',m.unitValuePrior],['Report week',m.unitValueCurrent]].map(([label,value]) => `<div class="liquidity-row"><span>${label}</span><div class="liquidity-track"><span style="width:${value/600*100}%"></span></div><strong>Rp${number(value)}</strong></div>`).join('');

  $('laggard-bars').innerHTML = d.indexLaggards.map(row => `<div class="liquidity-row"><span>${row.ticker}</span><div class="liquidity-track" aria-hidden="true"><span class="loss" style="width:${Math.abs(row.points)/30*100}%"></span></div><strong>${signed(row.points)} pts</strong></div>`).join('');
  $('laggard-math').textContent = `${d.indexLaggards.map(row => signed(row.points)).join(' + ')} = ${signed(m.laggardPoints)} IHSG points. That equals ${number(m.laggardShare,1)}% of the net ${number(Math.abs(m.points))}-point weekly decline before positive-stock offsets; it is not a share of gross negative contributions.`;
  $('policy-math').textContent = `Fed midpoint = (3.75% + 4.00%) ÷ 2 = 3.875%. BI-Rate less midpoint = 5.75% − 3.875% = 1.875 percentage points = ${number(m.policyGapBps,1)} bps.`;
  $('level-rows').innerHTML = [['6,200',6200,'Psychological reference'],['6,300',6300,'Round-number recovery reference'],['6,374.912',6374.912,'Wednesday close'],['6,441.159',6441.159,'Prior Friday close']].map(([label,value,meaning]) => `<tr><th scope="row">${label}</th><td>${percent(math.change(value,d.closes[5].close))}</td><td>${meaning}</td></tr>`).join('');

  const equityInput = $('equity-return'), fxInput = $('fx-change');
  function updateLab() {
    const equity = Number(equityInput.value), fx = Number(fxInput.value);
    const usd = math.usdReturn(equity,fx);
    $('equity-output').textContent = percent(equity);
    $('fx-output').textContent = percent(fx);
    $('usd-result').textContent = percent(usd);
    $('usd-result').className = usd < 0 ? 'negative' : 'positive';
    $('usd-wealth').textContent = `$100 becomes $${number(100+usd)} before costs and dividends.`;
    $('lab-formula').textContent = `(1 + ${number(equity,4)} / 100) ÷ (1 + ${number(fx,4)} / 100) − 1 = ${percent(usd)} in USD.`;
    $('fx-breakeven').textContent = Math.abs(equity) < 1e-8 ? 'With flat local prices, USD/IDR must also stay flat to break even.' : `For a flat USD return, USD/IDR would need to ${equity < 0 ? 'fall' : 'rise'} ${number(Math.abs(equity))}% over the same holding period.`;
  }
  function resetLab() { equityInput.value = String(m.weekly); fxInput.value = String(m.fxWeekly); updateLab(); }
  [equityInput,fxInput].forEach(input => input.addEventListener('input',updateLab));
  $('lab-reset').addEventListener('click',resetLab);
  $('fx-matrix').innerHTML = [-2,0,m.fxWeekly,2,4].map(fx => {
    const observed = fx === m.fxWeekly;
    return `<tr${observed?' class="table-total"':''}><th scope="row">${percent(fx)}</th><td>${percent(math.usdReturn(m.weekly,fx))}</td><td>${observed?'BI JISDOR endpoints':fx<0?'Rupiah strengthens':fx>0?'Rupiah weakens':'Unchanged exchange rate'}</td></tr>`;
  }).join('');
  $('fx-math').textContent = `JISDOR: Rp${number(d.jisdor[0].rate,0)} on 18 Sep to Rp${number(d.jisdor.at(-1).rate,0)} on 25 Sep. FX move = (17,917 ÷ 17,745 − 1) × 100 = ${percent(m.fxWeekly)}. Indicative USD price return = (6,241.892 ÷ 6,441.159) ÷ (17,917 ÷ 17,745) − 1 = ${percent(m.usdProxy)}.`;
  resetLab();

  // A single quiet reveal per figure. Values stay readable throughout.
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!motionPreference.matches && 'IntersectionObserver' in window) {
    const figures = document.querySelectorAll('.research-figure');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.closest('.research-figure').classList.add('figure-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -24px 0px' });
    figures.forEach(figure => {
      const target = figure.querySelector('.chart-scroll, #sector-bars, #flow-bars, #liquidity-bars, #laggard-bars');
      if (!target) return;
      figure.classList.add('figure-motion');
      observer.observe(target);
    });
    motionPreference.addEventListener('change', event => {
      if (!event.matches) return;
      observer.disconnect();
      figures.forEach(figure => figure.classList.remove('figure-motion'));
    });
  }

  $('download-data').addEventListener('click', () => {
    const rows = [['series','observation','period','value','unit','status','source_or_formula']];
    d.closes.forEach(r => rows.push(['IHSG','close',r.date,r.close,'index points','IDX reported',d.sources.daily.url]));
    d.sectors.forEach(r => rows.push(['sector',r.name,d.period,r.weekly,'% weekly','IDX reported',d.sources.weekly.url]));
    d.foreignFlow.forEach(r => rows.push(['foreign flow','market net',r.date,r.netBn,'Rp bn','IDX reported, all venues combined',d.sources.daily.url]));
    rows.push(['foreign flow','market net',d.period,d.weeklyNetBn,'Rp bn','IDX weekly reported',d.sources.weekly.url]);
    rows.push(['foreign flow','market net','7–11 Sep',d.prior2WeekNetBn,'Rp bn','IDX weekly reported',d.sources.prior2.url]);
    rows.push(['foreign flow','market net','14–18 Sep',d.priorWeekNetBn,'Rp bn','IDX weekly reported',d.sources.prior.url]);
    for (const key of ['value','volume','frequency']) {
      rows.push(['stock trading',key,'14–18 Sep',d.weeklyTotals.prior[key],key==='value'?'IDR':key==='volume'?'shares':'trades','IDX weekly total',d.sources.prior.url]);
      rows.push(['stock trading',key,d.period,d.weeklyTotals.current[key],key==='value'?'IDR':key==='volume'?'shares':'trades','IDX weekly total',d.sources.weekly.url]);
    }
    for (const key of ['regular','cash','negotiated','total']) rows.push(['venue trading value',key,d.period,d.venues[key],'IDR','IDX reported; not foreign-flow split',d.sources.weekly.url]);
    d.indexLaggards.forEach(r => { rows.push(['index mover',r.ticker+' price',d.period,r.pricePct,'% weekly','IDX reported',d.sources.weekly.url]); rows.push(['index mover',r.ticker+' contribution',d.period,r.points,'IHSG points','IDX reported',d.sources.weekly.url]); });
    d.jisdor.forEach(r => rows.push(['USD/IDR JISDOR','reference rate',r.date,r.rate,'IDR per USD','BI reported',d.sources.jisdor.url]));
    rows.push(['calculation','JISDOR-based USD price return',d.period,m.usdProxy,'%','indicative, time-mismatched proxy','(IHSG_end/IHSG_start)/(JISDOR_end/JISDOR_start)-1']);
    ['bi','fedLow','fedHigh'].forEach(key => rows.push(['policy',key,key==='bi'?'2026-09-23':'2026-09-16',d.policy[key],'%','reported',d.sources[key==='bi'?'bi':'fed'].url]));
    rows.push(['calculation','USD return','selected scenario',math.usdReturn(Number(equityInput.value),Number(fxInput.value)),'%','scenario',`equity=${equityInput.value}%; USD/IDR=${fxInput.value}%; ((1+equity/100)/(1+fx/100)-1)*100`]);
    const csv = rows.map(row => row.map(value => '"'+String(value).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}));
    const link = document.createElement('a'); link.href = url; link.download = 'ihsg-weekly-2026-09-25-data.csv'; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),1000);
  });
})();
