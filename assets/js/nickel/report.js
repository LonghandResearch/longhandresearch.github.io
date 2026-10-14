(function () {
  'use strict';
  const report = window.NICKEL_RESEARCH;
  const M = window.NickelModel;
  if (!report || !M) return;
  const D = report.datasets;
  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = (n,d=0) => Number.isFinite(n) ? n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}) : 'Unavailable';
  const percent = n => Number.isFinite(n) ? `${n<0?'−':n>0?'+':''}${number(Math.abs(n),1)}%` : 'Unavailable';
  const source = id => `<a href="#source-${id}" class="source-ref">${esc(({worldbank:'World Bank',usgs:'USGS',bps:'BPS',wits720260:'WITS'})[id]||'Source')}</a>`;
  const annual = M.annualPrices(D.prices.monthly);
  const price2025 = annual.find(r=>r.year===2025).mean;
  const production=D.production.observations;
  let series='price',productCode='720260';
  const latestShare=production.find(r=>r.year===2025).indonesia_share_of_rounded_world_total*100;
  const dest=report.destinations.find(r=>r.hs_code==='720260');
  const china=dest.partners.find(r=>r.partner==='China').trade_value_thousand_usd/dest.world.trade_value_thousand_usd*100;
  $('hero-ledger').innerHTML=`<div class="ledger-item"><strong>${number(latestShare,1)}%</strong><p>Indonesia’s share of world mine output</p><small>2025 estimate / contained Ni ${source('usgs',2)}</small></div><div class="ledger-item"><strong>${percent(M.change(price2025,annual.find(r=>r.year===2021).mean))}</strong><p>Nickel benchmark: 2025 vs 2021</p><small>Annual mean / nominal USD ${source('worldbank',1)}</small></div><div class="ledger-item"><strong>${number(china,1)}%</strong><p>Ferro-nickel export value sent to China</p><small>2024 / HS720260 ${source('wits720260',5)}</small></div>`;
  function renderHistory() {
    const price = series==='price';
    const data = price ? annual.map(r=>({year:r.year,value:r.mean,partial:r.months<12,readout:`${r.year}${r.months<12?' (January to September)':''}: USD${number(r.mean)} per tonne, average of ${r.months} monthly observations.`})) : production.map(r=>({year:r.year,value:r.indonesia_share_of_rounded_world_total*100,partial:r.Indonesia.estimated,readout:`${r.year}${r.Indonesia.estimated?' estimate':''}: ${number(r.indonesia_share_of_rounded_world_total*100,1)}% of rounded world mine production.`}));
    $('history-chart-label').textContent = price ? 'ANNUAL AVERAGE / NOMINAL USD PER TONNE' : 'MINE PRODUCTION / CONTAINED NICKEL';
    $('history-chart-title').textContent = price ? 'The price behind the expansion' : 'Indonesia takes a larger share';
    const width = Math.max(220,Math.round($('history-chart').getBoundingClientRect().width));
    const height = 250; const left=47,right=17,top=23,bottom=35;
    const ceiling = price ? 30000 : 80;
    const x = i=>left+i/(data.length-1)*(width-left-right);
    const y = value=>height-bottom-value/ceiling*(height-top-bottom);
    const coords = data.map((r,i)=>[x(i),y(r.value)]);
    const path = coords.map(([px,py],i)=>`${i?'L':'M'}${px.toFixed(2)},${py.toFixed(2)}`).join(' ');
    const grid = Array.from({length:5},(_,i)=>{const v=ceiling*i/4;return `<line class="gridline" x1="${left}" x2="${width-right}" y1="${y(v)}" y2="${y(v)}"/><text class="axis-label" x="${left-8}" y="${y(v)+3}" text-anchor="end">${price?number(v/1000,v%1000?1:0)+'k':number(v)+'%'}</text>`;}).join('');
    const labelStep = width<480 ? 3 : 2;
    const labels = data.map((r,i)=>i===data.length-1||(i%labelStep===0&&x(data.length-1)-x(i)>50) ? `<text class="axis-label" x="${x(i)}" y="${height-11}" text-anchor="${i===data.length-1?'end':'middle'}">${r.year}${r.partial?'*':''}</text>` : '').join('');
    const dots = data.map((r,i)=>`<g class="chart-control" role="button" tabindex="0" data-history-point="${i}" aria-label="${esc(r.readout)}"><title>${esc(r.readout)}</title><circle cx="${x(i)}" cy="${y(r.value)}" r="12" fill="transparent"/><circle class="data-point" cx="${x(i)}" cy="${y(r.value)}" r="4"/></g>`).join('');
    $('history-chart').innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="group" aria-label="${price?'Annual nickel benchmark means, 2016 to September 2026':'Indonesia share of global contained-nickel mine production, 2016 to 2025'}. Select a point to read its value.">${grid}<path class="chart-area" d="${path} L${x(data.length-1)},${y(0)} L${x(0)},${y(0)} Z"/><path class="chart-line" pathLength="1" d="${path}"/>${labels}${dots}</svg><p class="point-readout" id="history-readout" aria-live="polite">${esc(data[data.length-1].readout)}</p>`;
    $('history-chart-note').innerHTML = price ? `Annual means calculated from the World Bank's monthly observations. *2026 covers January to September, not a full year. This is not an ore, NPI or MHP price. ${source('worldbank',1)}` : `Indonesia's mine output divided by the rounded world total. *2025 estimated. Mixed USGS editions; later revisions have not been fully reconciled. Mine production is not primary refined production. ${source('usgs',2)}`;
    const readPoint = target=>{ const index=Number(target.dataset.historyPoint);if(Number.isInteger(index)&&data[index]) $('history-readout').textContent=data[index].readout; };
    $('history-chart').querySelectorAll('[data-history-point]').forEach(dot=>{
      dot.addEventListener('pointerenter',()=>readPoint(dot)); dot.addEventListener('focus',()=>readPoint(dot)); dot.addEventListener('click',()=>readPoint(dot));
      dot.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();readPoint(dot);} });
    });
  }
  document.querySelectorAll('[data-history]').forEach(button=>button.addEventListener('click',()=>{
    series=button.dataset.history;
    document.querySelectorAll('[data-history]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    renderHistory();
  }));
  function renderBaseline() {
    const year=Number($('baseline').value);
    const base=annual.find(r=>r.year===year);
    $('baseline-result').innerHTML = `${percent(M.change(price2025,base.mean))}<span>2025 annual mean vs ${year}</span>`;
  }
  $('baseline').addEventListener('change',renderBaseline);
  $('history-table').innerHTML=annual.map(r=>{
    const p=production.find(v=>v.year===r.year);
    return `<tr><th scope="row">${r.year}${r.months<12?' (Jan to Sep)':''}</th><td>${number(r.mean)}</td><td>${p?number(p.Indonesia.tonnes_nickel_content)+(p.Indonesia.estimated?'*':''):'Unavailable'}</td><td>${p?number(p['World total (rounded)'].tonnes_nickel_content):'Unavailable'}</td><td>${p?number(p.indonesia_share_of_rounded_world_total*100,1)+'%':'Unavailable'}</td></tr>`;
  }).join('');

  function renderTrade() {
    const p=D.trade.selected_hs6_products.find(r=>r.hs_code===productCode),c=M.tradeComparison(p);
    $('trade-metrics').innerHTML=[['Product weight',c.weight],['FOB export value',c.value],['FOB / product tonne',c.unit]].map(([label,value])=>`<div><strong>${percent(value)}</strong><span>${label}</span></div>`).join('');
    const width=Math.max(220,Math.round($('trade-chart').getBoundingClientRect().width)),left=width<480?74:117,right=35,plot=width-left-right;
    const values=[['Weight',100+c.weight],['FOB value',100+c.value]],ceiling=Math.max(150,Math.ceil(Math.max(100,...values.map(r=>r[1]))/50)*50);
    const length=v=>v/ceiling*plot;
    const ticks=Array.from({length:4},(_,i)=>ceiling*i/3);
    const grid=ticks.map(v=>`<line class="gridline" x1="${left+length(v)}" x2="${left+length(v)}" y1="30" y2="163"/><text class="axis-label" x="${left+length(v)}" y="187" text-anchor="middle">${number(v)}</text>`).join('');
    $('trade-chart').innerHTML=`<svg viewBox="0 0 ${width} 208" role="img" aria-label="${esc(p.description)}. Product weight index in 2025: ${number(values[0][1],1)}. FOB value index: ${number(values[1][1],1)}. 2024 equals 100."><text class="axis-label" x="${left}" y="15">2024</text><rect x="${left+34}" y="7" width="12" height="7" fill="var(--rule-2)"/><text class="axis-label" x="${left+63}" y="15">2025</text><rect x="${left+97}" y="7" width="12" height="7" fill="var(--accent)"/>${grid}${values.map(([label,v],i)=>`<text class="axis-label" x="${left-10}" y="${64+i*67}" text-anchor="end">${label}</text><rect x="${left}" y="${46+i*67}" width="${length(100)}" height="11" fill="var(--rule-2)"/><rect x="${left}" y="${62+i*67}" width="${length(v)}" height="15" fill="var(--accent)"/><text class="axis-label" x="${left+length(v)+6}" y="${74+i*67}">${number(v,1)}</text>`).join('')}</svg>`;
    $('trade-caption').textContent=p.description+' / HS'+p.hs_code;
    $('trade-table').innerHTML=p.observations.map(r=>`<tr><th scope="row">${r.year}</th><td>${number(r.net_product_weight_kg)}</td><td>${number(r.fob_usd)}</td><td>${number(M.unitValue(r),2)}</td></tr>`).join('');
    $('trade-definition').textContent=`BPS HS2022 classification. Document page ${p.pdf_page}, printed page ${p.printed_page}. ${productCode==='750120'?'The intermediates category is not verified as exclusively MHP. ':''}FOB unit values use total receipts and net product mass; they are not profits or grade-adjusted contract prices.`;
  }
  $('trade-product').addEventListener('change',()=>{productCode=$('trade-product').value;renderTrade();});
  const sourceGroups=[
    {label:'USGS',title:'Mine production',note:'Annual contained-nickel output; 2025 is an estimate.',links:[['usgs','Production history']]},
    {label:'World Bank',title:'The nickel price cycle',note:'Monthly benchmark observations, 2016 to September 2026.',links:[['worldbank','Monthly price workbook']]},
    {label:'Badan Geologi',title:'Where the reserves are',note:'Province reserve table, updated December 2024.',links:[['geology','National reserve report']]},
    {label:'BPS / UN Comtrade via WITS',title:'What Indonesia exports, and to whom',note:'BPS product comparisons: 2024 to 2025. WITS destinations: 2024.',links:[['bps','BPS exports'],['wits720260','Ferronickel'],['wits750110','Matte'],['wits750120','Intermediates']]},
    {label:'IEA',title:'Demand and production risks',note:'Battery chemistry, energy, chemical inputs and conditional supply outlooks.',links:[['ev','EV batteries'],['security','Energy and inputs'],['acid','Sulphur disruption'],['outlook','Supply outlook']]},
    {label:'ESDM',title:'The policy behind processing',note:'The 2020 ore ban and the dated June 2026 quota-review statement.',links:[['oreban','Ore export ban'],['quota','Quota-review checkpoint']]}
  ];
  const coreIds=new Set(sourceGroups.flatMap(g=>g.links.map(([id])=>id)));
  $('source-register').innerHTML=sourceGroups.map(g=>`<li class="core-source"><p class="technical">${esc(g.label)}</p><h4>${esc(g.title)}</h4><p>${esc(g.note)}</p><div class="source-links">${g.links.map(([id,label])=>{const record=report.sources.find(s=>s.id===id);return `<a id="source-${id}" href="${esc(record.url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;}).join('')}</div></li>`).join('');
  $('supporting-register').innerHTML=report.sources.filter(s=>!coreIds.has(s.id)).map(s=>`<li id="source-${s.id}"><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a><p>${esc(s.locator)}</p><p>${esc(s.note)}</p></li>`).join('');
  function followAnchor(hash,behavior='smooth'){
    if(!hash || hash.length<2)return;
    const target=document.getElementById(hash.slice(1));if(!target)return;
    for(let parent=target.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
    target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':behavior});
  }
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if(!link || !document.getElementById(link.hash.slice(1)) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    event.preventDefault();
    if(location.hash!==link.hash)history.pushState(history.state,'',link.hash);
    followAnchor(link.hash);
  });
  addEventListener('hashchange',()=>followAnchor(location.hash));

  renderHistory();renderBaseline();renderTrade();
  // Resolve deep links after charts and fonts establish the final reading layout.
  const restoreAnchor=()=>requestAnimationFrame(()=>followAnchor(location.hash,'instant'));
  document.fonts?.ready.then(restoreAnchor);
  addEventListener('pageshow',restoreAnchor);
  if ('ResizeObserver' in window) {
    let previousWidth=0;
    const observer=new ResizeObserver(entries=>{
      const w=Math.round(entries[0].contentRect.width);
      if(w!==previousWidth){previousWidth=w;renderHistory();renderTrade();}
    });
    observer.observe(document.querySelector('.research-body'));
  }
  if ('IntersectionObserver' in window) {
    const links=[...document.querySelectorAll('.chapter-rail nav a')];
    const observer=new IntersectionObserver(entries=>{
      const active=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
      if(active)links.forEach(a=>{if(a.hash==='#'+active.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    },{rootMargin:'-90px 0px -55% 0px',threshold:0});
    document.querySelectorAll('.research-section').forEach(section=>observer.observe(section));
  }
})();
