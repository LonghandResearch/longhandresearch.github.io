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
    el.textContent = el.dataset.format === 'number' ? number(value) : el.dataset.metric === 'giveback' ? number(value) + '%' : percent(value);
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
    <polyline class="index-line" points="${points}"/>
    ${d.closes.map((row,i) => `<circle class="index-point" id="index-point-${i}" cx="${x(i)}" cy="${y(row.close)}" r="4.5"/><text class="chart-axis" x="${x(i)}" y="259" text-anchor="middle">${row.label}</text>`).join('')}
    <text class="chart-annotation" x="${x(3)}" y="${y(d.closes[3].close)-20}" text-anchor="middle">BI holds</text>
  </svg>`;
  const dateButtons = d.closes.map((row,i) => `<button type="button" data-close="${i}" aria-pressed="${i===5}">${row.label}</button>`).join('');
  $('index-dates').innerHTML = dateButtons;
  function selectClose(i) {
    const row = d.closes[i];
    $('index-readout').innerHTML = `<strong>${row.label}: ${number(row.close)}</strong><span>${i ? percent(math.change(row.close,d.closes[i-1].close)) + ' vs previous close' : 'Previous-week baseline'} · ${row.note}</span>`;
    document.querySelectorAll('[data-close]').forEach(btn => btn.setAttribute('aria-pressed',String(Number(btn.dataset.close)===i)));
    document.querySelectorAll('.index-point').forEach((point,j) => point.classList.toggle('selected',i===j));
  }
  $('index-dates').addEventListener('click', e => { const btn=e.target.closest('[data-close]'); if(btn) selectClose(Number(btn.dataset.close)); });
  selectClose(5);
  $('close-rows').innerHTML = d.closes.map((row,i) => `<tr><th scope="row">${row.date}</th><td>${number(row.close,3)}</td><td>${i ? percent(math.change(row.close,d.closes[i-1].close)) : 'Baseline'}</td><td>${sourceLink(row.source)}</td></tr>`).join('');
  $('return-math').textContent = `(6,241.892 ÷ 6,441.159 − 1) × 100 = ${percent(m.weekly)}. Recovery required: (6,441.159 ÷ 6,241.892 − 1) × 100 = ${percent(m.recovery)}.`;
  $('rebound-math').textContent = `Wednesday gain: 6,374.910 − 6,277.044 = ${number(m.rebound,3)} points. Thursday + Friday loss: 6,374.910 − 6,241.892 = ${number(m.reversal,3)} points. Loss ÷ gain = ${number(m.giveback,1)}%.`;

  function renderSectors() {
    const day=$('sector-day').value;
    const rows=d.sectors.slice().sort((a,b)=>b[day]-a[day]);
    $('sector-bars').innerHTML=rows.map(row=>{
      const v=row[day], left=(Math.min(v,0)+3)/7*100, width=Math.abs(v)/7*100;
      return `<div class="sector-row"><span>${row.name}</span><div class="sector-track" aria-hidden="true"><span class="sector-bar ${v<0?'loss':'gain'}" style="left:${left}%;width:${width}%"></span></div><strong>${percent(v)}</strong></div>`;
    }).join('');
    $('sector-summary').textContent = `${day==='fri'?'Friday, 25 September':'Wednesday, 23 September'}: ${rows.filter(r=>r[day]>0).length} of 11 sectors rose. Daily returns; fixed −3% to +4% scale.`;
  }
  $('sector-day').addEventListener('change',renderSectors);
  renderSectors();
  $('sector-rows').innerHTML=d.sectors.map(row=>`<tr><th scope="row">${row.name}</th><td>${percent(row.wed)}</td><td>${percent(row.fri)}</td></tr>`).join('');
  const breadthParts=[['Advanced',d.breadth.up,'gain'],['Declined',d.breadth.down,'loss'],['Unchanged',d.breadth.unchanged,'flat']];
  $('breadth-bar').innerHTML=breadthParts.map(([label,count,cls])=>`<span class="${cls}" style="width:${count/m.breadthTotal*100}%" title="${label}: ${count}"></span>`).join('');
  $('breadth-labels').innerHTML=breadthParts.map(([label,count,cls])=>`<span><i class="${cls}"></i>${count} ${label.toLowerCase()}</span>`).join('');
  $('breadth-math').textContent=`558 ÷ (558 + 118) × 100 = ${number(m.declinerShare,1)}% decliners among movers. Unchanged names are excluded from this ratio. Advance/decline ratio = 118 ÷ 558 = ${number(m.advanceDecline)}. The reported breadth universe contains ${m.breadthTotal} names, not every IDX listing.`;

  $('activity-rows').innerHTML=d.activity.map(row=>`<tr><th scope="row">${row.label}<small>${row.unit}</small></th><td>${number(row.prior)}</td><td>${number(row.current)}</td><td>${percent(math.change(row.current,row.prior))}</td><td>${percent(row.reportedPct)}</td></tr>`).join('');
  $('liquidity-math').textContent=`Previous: Rp15.22tn ÷ 28.61bn shares = Rp${number(m.unitValuePrior)} per traded share. Current: Rp11.98tn ÷ 29.20bn shares = Rp${number(m.unitValueCurrent)}. Change = ${percent(m.unitValueChange)}.`;
  $('liquidity-bars').innerHTML=[['Previous week',m.unitValuePrior],['Report week',m.unitValueCurrent]].map(([label,value])=>`<div class="liquidity-row"><span>${label}</span><div class="liquidity-track"><span style="width:${value/600*100}%"></span></div><strong>Rp${number(value)}</strong></div>`).join('');
  $('bank-bars').innerHTML=d.bankFlows.map(row=>`<div class="liquidity-row"><span>${row.ticker}</span><div class="liquidity-track"><span class="loss" style="width:${Math.abs(row.netBn)/1000*100}%"></span></div><strong>${signed(row.netBn)}bn</strong></div>`).join('');
  $('policy-math').textContent=`Fed midpoint = (3.75% + 4.00%) ÷ 2 = 3.875%. BI-Rate less midpoint = 5.75% − 3.875% = 1.875 percentage points = ${number(m.policyGapBps,1)} bps.`;
  $('level-rows').innerHTML=[['6,200',6200,'Psychological reference'],['6,300',6300,'Round-number recovery reference'],['6,374.91',6374.91,'Wednesday close'],['6,441.159',6441.159,'Prior Friday close']].map(([label,value,meaning])=>`<tr><th scope="row">${label}</th><td>${percent(math.change(value,d.closes[5].close))}</td><td>${meaning}</td></tr>`).join('');

  const equityInput=$('equity-return'), fxInput=$('fx-change');
  function updateLab() {
    const equity=Number(equityInput.value), fx=Number(fxInput.value);
    const usd=math.usdReturn(equity,fx);
    $('equity-output').textContent=percent(equity);
    $('fx-output').textContent=percent(fx);
    $('usd-result').textContent=percent(usd);
    $('usd-result').className=usd<0?'negative':'positive';
    $('usd-wealth').textContent=`$100 becomes $${number(100+usd)} before costs and dividends.`;
    $('lab-formula').textContent=`(1 + ${number(equity,4)} / 100) ÷ (1 + ${number(fx)} / 100) − 1 = ${percent(usd)} in USD.`;
    $('fx-breakeven').textContent=Math.abs(equity)<1e-8 ? 'With flat local prices, USD/IDR must also stay flat to break even.' : `For a flat USD return, USD/IDR would need to ${equity<0?'fall':'rise'} ${number(Math.abs(equity))}% over the same holding period.`;
  }
  equityInput.value=m.weekly.toFixed(4);
  fxInput.value='0';
  [equityInput,fxInput].forEach(input=>input.addEventListener('input',updateLab));
  $('lab-reset').addEventListener('click',()=>{equityInput.value=m.weekly.toFixed(4);fxInput.value='0';updateLab();});
  $('fx-matrix').innerHTML=[-3,-1,0,1,3].map(fx=>{
    const value=math.usdReturn(m.weekly,fx);
    return `<tr><th scope="row">${percent(fx)}</th><td>${percent(value)}</td><td>${fx<0?'Rupiah strengthens':fx>0?'Rupiah weakens':'Unchanged exchange rate'}</td></tr>`;
  }).join('');
  updateLab();

  $('download-data').addEventListener('click',()=>{
    const rows=[['series','observation','period','value','unit','status','source_or_formula']];
    d.closes.forEach(r=>rows.push(['IHSG','close',r.date,r.close,'index points','reported',d.sources[r.source].url]));
    d.sectors.forEach(r=>['wed','fri'].forEach(day=>rows.push(['sector',r.name,day==='wed'?'2026-09-23':'2026-09-25',r[day],'% daily','reported',d.sources[day].url])));
    breadthParts.forEach(([label,count])=>rows.push(['breadth',label,'2026-09-25',count,'names','reported',d.sources.fri.url]));
    d.activity.forEach(r=>{
      rows.push(['activity',r.label,'previous week',r.prior,r.unit,'rounded reported',d.sources.weekly.url]);
      rows.push(['activity',r.label,d.period,r.current,r.unit,'rounded reported',d.sources.weekly.url]);
      rows.push(['activity',r.label,d.period,r.reportedPct,'% weekly','publisher percentage',d.sources.weekly.url]);
      rows.push(['activity',r.label,d.period,math.change(r.current,r.prior),'% weekly','calculated','(current / prior - 1) * 100']);
    });
    d.bankFlows.forEach(r=>rows.push(['foreign flow',r.ticker,d.flowScope,r.netBn,'Rp bn','reported',d.sources.banks.url]));
    rows.push(['foreign flow','market net sell','2026-09-25',d.fridayNetBn,'Rp bn','reported; venue unspecified',d.sources.weekly.url]);
    rows.push(['foreign flow','YTD market net sell','2026 YTD through 25 Sep',d.ytdNetTn,'Rp tn','reported; venue unspecified',d.sources.weekly.url]);
    ['bi','fedLow','fedHigh'].forEach(key=>rows.push(['policy',key,key==='bi'?'2026-09-23':'2026-09-16',d.policy[key],'%','reported',d.sources[key==='bi'?'bi':'fed'].url]));
    rows.push(['calculation','USD return','hypothetical selected scenario',math.usdReturn(Number(equityInput.value),Number(fxInput.value)),'%','scenario',`equity=${equityInput.value}%; USD/IDR=${fxInput.value}%; ((1+equity/100)/(1+fx/100)-1)*100`]);
    const csv=rows.map(row=>row.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}));
    const link=document.createElement('a');link.href=url;link.download='ihsg-weekly-2026-09-25-data.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
})();
