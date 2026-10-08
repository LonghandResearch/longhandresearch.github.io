(function () {
  'use strict';
  const D=window.COAL_RESEARCH,M=window.CoalModel;
  if(!D||!M)return;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=(v,d=1)=>new Intl.NumberFormat('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v);
  const signed=(v,d=1)=>(v>0?'+':'')+num(v,d);
  const money=(v,d=2)=>(v<0?'-':'')+'$'+num(Math.abs(v),d);
  const svg=(label,content,w=620,h=310)=>`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${content}</svg>`;
  const table=(host,rows,unit)=>{
    $(host).innerHTML=`<table><caption class="sr-only">${esc(unit)}</caption><thead><tr><th scope="col">Period</th><th scope="col">${esc(unit)}</th><th scope="col">Status</th></tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${esc(r.year||r.period)}</th><td>${num(r.value,r.year? (unit==='Billion tonnes'?2:0):1)}</td><td>${esc(r.status||'Observed average')}</td></tr>`).join('')}</tbody></table>`;
  };
  function bars(host,rows,max,label) {
    const w=620,h=310,l=65,r=25,t=38,b=48,iw=w-l-r,ih=h-t-b,bw=iw/rows.length*.38;
    let g=`<defs><pattern id="${host}-hatch" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 7 7 0" stroke="var(--chart-fill)" stroke-width="2"/></pattern></defs>`;
    for(let i=0;i<=4;i++){const v=max*i/4,y=t+ih*(1-i/4);g+=`<path class="chart-axis" d="M${l} ${y}H${w-r}"/><text x="${l-12}" y="${y+4}" text-anchor="end">${num(v,0)}</text>`;}
    rows.forEach((d,i)=>{const x=l+iw*(i+.5)/rows.length,ht=d.value/max*ih,forecast=/forecast/i.test(d.status);g+=`<rect x="${x-bw/2}" y="${t+ih-ht}" width="${bw}" height="${ht}" fill="${forecast?'url(#'+host+'-hatch)':'var(--chart-fill)'}" stroke="var(--chart-fill)"/><text class="value-label" x="${x}" y="${t+ih-ht-13}" text-anchor="middle">${num(d.value,0)}</text><text x="${x}" y="${h-25}" text-anchor="middle">${d.year}</text><text x="${x}" y="${h-8}" text-anchor="middle" class="chart-status">${esc(d.status)}</text>`;});
    $(host).innerHTML=svg(label,g);
  }
  const series=D.consumption;
  let cg='';
  for(const v of [8.7,8.8,8.9,9]){const y=238-(v-8.7)/.3*185;cg+=`<path class="chart-axis" d="M65 ${y}H590"/><text x="50" y="${y+4}" text-anchor="end">${num(v)}</text>`;}
  const cx=i=>105+i*210,cy=v=>238-(v-8.7)/.3*185;
  cg+=`<path class="chart-line forecast-line" d="${series.map((d,i)=>(i?'L':'M')+cx(i)+' '+cy(d.value)).join(' ')}"/>`;
  series.forEach((d,i)=>{cg+=`<circle class="point" cx="${cx(i)}" cy="${cy(d.value)}" r="5"/><text class="value-label" x="${cx(i)}" y="${cy(d.value)-18}" text-anchor="middle">${num(d.value,2)}</text><text x="${cx(i)}" y="280" text-anchor="middle">${d.year}</text><text x="${cx(i)}" y="299" text-anchor="middle" class="chart-status">${d.status}</text>`;});
  $('consumption-chart').innerHTML=svg('Global coal consumption: 8.84 billion tonnes preliminary in 2025, 8.94 forecast in 2026, 8.91 conditional forecast in 2027. Axis 8.7 to 9.0 billion tonnes.',cg);
  table('consumption-values',series,'Billion tonnes');
  bars('trade-chart',D.thermalSeaborne,1200,'Seaborne thermal coal demand: 1,074 million tonnes preliminary in 2025 and 1,062 forecast in 2026. Axis starts at zero.');
  table('trade-values',D.thermalSeaborne,'Million tonnes');
  bars('exports-chart',D.indonesiaExports,600,'Indonesia thermal coal exports: 557 million tonnes in 2024, 517 in 2025, both preliminary, and 495 forecast in 2026. Axis starts at zero.');
  table('exports-values',D.indonesiaExports,'Million tonnes');

  // Keep customs coverage and issuer accounting separate from the illustrative lab.
  function renderCoverage() {
    const x=118,scale=445/600;
    let g='';
    for(const v of [0,150,300,450,600]){
      const xx=x+v*scale;
      g+=`<path class="chart-axis" d="M${xx} 42V272"/><text x="${xx}" y="296" text-anchor="middle">${v}</text>`;
    }
    D.coverageBridge.forEach((r,i)=>{
      const yy=52+i*118,total=(r.coalKt+r.ligniteKt)/1000;
      g+=`<text class="value-label" x="18" y="${yy+21}">${r.year}</text><text x="18" y="${yy+44}">BPS</text>`;
      g+=`<rect x="${x}" y="${yy}" width="${r.coalKt/1000*scale}" height="32" fill="var(--teal)"/><rect x="${x+r.coalKt/1000*scale}" y="${yy}" width="${r.ligniteKt/1000*scale}" height="32" fill="var(--chart-fill)"/><text class="value-label" x="${x+total*scale+9}" y="${yy+22}">${num(total,1)}</text>`;
      g+=`<text x="18" y="${yy+70}">IEA thermal</text><rect x="${x}" y="${yy+49}" width="${r.ieaThermalMt*scale}" height="25" fill="none" stroke="var(--ink)" stroke-width="1.5"/><text x="${x+r.ieaThermalMt*scale+9}" y="${yy+67}">${num(r.ieaThermalMt,0)}</text>`;
    });
    g+=`<rect x="118" y="322" width="10" height="10" fill="var(--teal)"/><text x="135" y="332">BPS coal</text><rect x="250" y="322" width="10" height="10" fill="var(--chart-fill)"/><text x="267" y="332">BPS lignite</text><rect x="398" y="322" width="10" height="10" fill="none" stroke="var(--ink)"/><text x="415" y="332">IEA thermal estimate</text>`;
    $('coverage-chart').innerHTML=svg(`Export coverage check, million tonnes. ${D.coverageBridge.map(r=>`${r.year}: BPS coal plus lignite ${num((r.coalKt+r.ligniteKt)/1000,4)}, IEA preliminary thermal estimate ${r.ieaThermalMt}`).join('. ')}. Definitions are not harmonised. Axis begins at zero.`,g,650,352);
    $('coverage-values').innerHTML=`<table><caption>Million tonnes / BPS records and preliminary IEA estimates, definitions not harmonised</caption><thead><tr><th scope="col">Year</th><th scope="col">BPS coal</th><th scope="col">BPS lignite</th><th scope="col">Derived BPS sum</th><th scope="col">IEA thermal</th><th scope="col">Sum minus IEA</th></tr></thead><tbody>${D.coverageBridge.map(r=>{const total=(r.coalKt+r.ligniteKt)/1000;return `<tr><th scope="row">${r.year}</th><td>${num(r.coalKt/1000,4)}</td><td>${num(r.ligniteKt/1000,4)}</td><td>${num(total,4)}</td><td>${num(r.ieaThermalMt,0)}</td><td>${num(total-r.ieaThermalMt,4)}</td></tr>`;}).join('')}</tbody></table>`;
  }
  function pairedCompanyBars(host,rows,keys,labels,max,unit,divisor=1) {
    const l=60,t=40,bottom=250,iw=520,barWidth=58,height=210;
    let g='';
    const ticks=unit==='Rupiah trillion'?5:4;
    for(let i=0;i<=ticks;i++){
      const v=max*i/ticks,yy=bottom-v/max*height;
      g+=`<path class="chart-axis" d="M${l} ${yy}H590"/><text x="${l-12}" y="${yy+4}" text-anchor="end">${num(v,0)}</text>`;
    }
    rows.forEach((r,i)=>{
      const centre=l+iw*(i+.5)/rows.length;
      keys.forEach((key,k)=>{
        const value=r[key]/divisor,x=centre+(k-.5)*72-barWidth/2,ht=value/max*height;
        g+=`<rect x="${x}" y="${t+height-ht}" width="${barWidth}" height="${ht}" fill="${k?'var(--chart-fill)':'var(--teal)'}"/><text class="value-label" x="${x+barWidth/2}" y="${t+height-ht-11}" text-anchor="middle">${num(value,unit==='Rupiah trillion'?3:1)}</text>`;
      });
      g+=`<text x="${centre}" y="278" text-anchor="middle">${esc(r.period)}</text>`;
    });
    g+=`<rect x="62" y="305" width="10" height="10" fill="var(--teal)"/><text x="80" y="315">${esc(labels[0])}</text><rect x="335" y="305" width="10" height="10" fill="var(--chart-fill)"/><text x="353" y="315">${esc(labels[1])}</text>`;
    $(host).innerHTML=svg(`${unit}. ${rows.map(r=>`${r.period}: ${labels.map((label,i)=>label+' '+num(r[keys[i]]/divisor,3)).join(', ')}`).join('. ')}. Zero-based axis.`,g,620,340);
  }
  function companyTable(host,caption,rows,metrics) {
    $(host).innerHTML=`<table><caption>${esc(caption)}</caption><thead><tr><th scope="col">Metric</th>${rows.map(r=>`<th scope="col">${esc(r.period)}</th>`).join('')}</tr></thead><tbody>${metrics.map(([label,key,divisor,d])=>`<tr><th scope="row">${esc(label)}</th>${rows.map(r=>`<td>${num(r[key]/divisor,d)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  renderCoverage();
  const bayan=D.companies.bayan,ptba=D.companies.ptba;
  pairedCompanyBars('bayan-chart',bayan.periods,['aspUsdT','cashCostUsdT'],['Selling price','Inclusive cash cost'],60,'US dollars per tonne');
  $('bayan-readout').textContent=`Derived unit spread: ${bayan.periods.map(r=>`${r.period} ${money(r.aspUsdT-r.cashCostUsdT,1)}/t`).join(' → ')}. H1 2026 capex: ${money(bayan.capexQuarterlyUsdM.reduce((sum,r)=>sum+r.actual,0),1)}m, derived from the two quarterly actuals.`;
  companyTable('bayan-values','Company presentation / units stated per row',bayan.periods,[['Sales / Mt','salesMt',1,1],['Production / Mt','productionMt',1,1],['Selling price / USD per tonne','aspUsdT',1,1],['Inclusive cash cost / USD per tonne','cashCostUsdT',1,1],['Revenue / USD million','revenueUsdM',1,1],['EBITDA / USD million','ebitdaUsdM',1,1]]);
  pairedCompanyBars('ptba-chart',ptba.periods,['operatingCashRpM','assetPurchasesRpM'],['Net operating cash','Cash asset purchases'],5,'Rupiah trillion',1e6);
  $('ptba-readout').textContent=`Operating cash less selected asset purchases, derived: ${ptba.periods.map(r=>`${r.period} Rp${num((r.operatingCashRpM-r.assetPurchasesRpM)/1e6,3)}tn`).join(' → ')}. This subtotal excludes other investing and financing flows.`;
  const ptbaRows=ptba.periods.map((r,i)=>({...r,...Object.fromEntries(Object.entries(ptba.costComponentsRpM).map(([key,values])=>[key,values[i]]))}));
  companyTable('ptba-values','Consolidated financial statement / rupiah million, unrounded source figures',ptbaRows,[['Revenue','revenueRpM',1,0],['Cost of revenue','costRevenueRpM',1,0],['Mining services / within cost of revenue','miningServices',1,0],['Coal transportation / within cost of revenue','coalTransportation',1,0],['Fuel and lubricants / within cost of revenue','fuelLubricants',1,0],['Gross profit','grossProfitRpM',1,0],['Operating profit','operatingProfitRpM',1,0],['Profit attributable to owners','ownerProfitRpM',1,0],['Net operating cash','operatingCashRpM',1,0],['Cash purchases of fixed assets / bearer plants','assetPurchasesRpM',1,0],['Lease-liability payments','leasePaymentsRpM',1,0],['Reclamation / mine-closure deposits','reclamationDepositsRpM',1,0]]);
  const operation=ptba.operations;
  $('ptba-values').insertAdjacentHTML('beforeend',`<p>${esc(operation.period)} company operational disclosure: production ${num(operation.productionMt,2)} Mt, sales ${num(operation.salesMt,2)} Mt, domestic sales ${num(operation.domesticSalesMt,2)} Mt (${num(operation.domesticSalesMt/operation.salesMt*100,1)}% of sales), export sales ${num(operation.exportSalesMt,2)} Mt.</p>`);

  let priceView='quarterly',priceIndex=4;
  function renderPrice() {
    const rows=D.australianPrice[priceView],w=matchMedia('(max-width: 760px)').matches?600:900,h=310,l=65,r=25,t=35,b=45,ih=h-t-b;
    const x=i=>l+35+(w-l-r-70)*i/Math.max(rows.length-1,1),y=v=>t+ih*(1-v/200);
    let g='';
    for(const v of [0,50,100,150,200]){const yy=y(v);g+=`<path class="chart-axis" d="M${l} ${yy}H${w-r}"/><text x="${l-10}" y="${yy+4}" text-anchor="end">${v}</text>`;}
    g+=`<path class="chart-line" d="${rows.map((d,i)=>(i?'L':'M')+x(i)+' '+y(d.value)).join(' ')}"/>`;
    rows.forEach((d,i)=>{g+=`<circle class="point" cx="${x(i)}" cy="${y(d.value)}" r="${i===priceIndex?7:4}"/><text class="value-label" x="${x(i)}" y="${y(d.value)-17}" text-anchor="middle">${num(d.value)}</text><text x="${x(i)}" y="${h-14}" text-anchor="middle">${d.period}</text>`;});
    $('price-chart').innerHTML=svg(`Australian coal ${priceView} averages, USD per tonne. ${rows.map(d=>d.period+': '+d.value).join(', ')}.`,g,w,h);
    $('price-periods').innerHTML=rows.map((d,i)=>`<button type="button" data-period="${i}" aria-pressed="${i===priceIndex}">${d.period}</button>`).join('');
    $('price-periods').querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{priceIndex=Number(btn.dataset.period);renderPrice();$('price-periods').querySelector(`[data-period="${priceIndex}"]`).focus();}));
    const d=rows[priceIndex],prev=rows[priceIndex-1];
    $('price-readout').textContent=`${d.period}: ${money(d.value,1)}/t ${priceView} average${prev?' / '+signed(M.change(d.value,prev.value))+'% from '+prev.period:''}.`;
    table('price-values',rows,'USD / tonne');
  }
  document.querySelectorAll('[data-price-view]').forEach(btn=>btn.addEventListener('click',()=>{
    priceView=btn.dataset.priceView;priceIndex=D.australianPrice[priceView].length-1;
    document.querySelectorAll('[data-price-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));renderPrice();
  }));renderPrice();
  matchMedia('(max-width: 760px)').addEventListener('change',renderPrice);

  const project=(lon,lat)=>[(lon+180)*960/360,(85-lat)*520/170];
  let selectedMarket='india', mapView='world', mapFleet=[];
  function setMapView(view) {
    mapView=view;
    $('coal-map').dataset.view=view;
    $('coal-map').setAttribute('viewBox',view==='world'?'0 0 960 520':'540 70 420 350');
    document.querySelectorAll('[data-map-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapView===view)));
  }
  function renderMap() {
    const geo=window.COAL_GEOGRAPHY||[],market=D.markets.find(m=>m.id===selectedMarket);
    const origin=project(116,-2),world=mapView==='world';
    let g=`<title id="map-title">Indonesian coal export destinations and regional context</title><desc id="map-description">BPS revised 2025 destination volumes are shown in the panel. Viet Nam is regional context only. Connecting lines are conceptual, not vessel routes or a volume scale.</desc><g aria-hidden="true">`;
    for(const f of geo){g+=`<path class="map-country ${f.name==='Indonesia'?'origin':f.name===market.name.replace('Viet Nam','Vietnam')?'selected':''}" d="${f.path}"/>`;}
    const destination=project(market.lon,market.lat),midX=(destination[0]+origin[0])/2,midY=Math.min(origin[1],destination[1])-35;
    const path=`M${origin[0]} ${origin[1]}Q${midX} ${midY} ${destination[0]} ${destination[1]}`;
    for(const m of D.markets.filter(m=>m.id!==selectedMarket&&(world||m.id!=='spain'))){
      const p=project(m.lon,m.lat);
      g+=`<path class="map-network" d="M${origin[0]} ${origin[1]}Q${(p[0]+origin[0])/2} ${Math.min(origin[1],p[1])-35} ${p[0]} ${p[1]}"/>`;
    }
    g+=`<path id="selected-trade-path" class="map-route active" d="${path}"/><path class="map-pulse" d="${path}"/>`;
    g+=`<circle class="map-halo" cx="${origin[0]}" cy="${origin[1]}" r="${world?12:7}"/><circle class="map-halo destination-halo" cx="${destination[0]}" cy="${destination[1]}" r="${world?12:7}"/>`;
    g+=`<g class="map-fleet">${[0,1,2].map(i=>`<g class="map-carrier" data-carrier="${i}"><circle r="${world?12:7}" fill="#dfbc7d" opacity=".12"/><g transform="scale(${world?1:.6})"><path d="M-11-4H4L12 0 4 4H-11Z" fill="#f4d693" stroke="#142d36" stroke-width="1.5"/><path d="M-7-2h2v4h-2Zm4 0h2v4h-2Zm4 0h2v4H1Z" fill="#6f644a"/></g></g>`).join('')}</g>`;
    for(const m of D.markets){const p=project(m.lon,m.lat),active=m.id===selectedMarket;
      g+=`<circle class="map-point ${active?'active':''}" cx="${p[0]}" cy="${p[1]}" r="${world?(active?7:4):(active?4:2)}"/>`;
      if(active)g+=`<text x="${p[0]+(world?0:m.label[0])}" y="${p[1]+(world?-20:m.label[1])}" text-anchor="${world?'middle':'start'}">${esc(m.name)}</text>`;
    }
    g+=`<circle class="map-point" cx="${origin[0]}" cy="${origin[1]}" r="${world?6:3.8}"/><text x="${origin[0]-18}" y="${origin[1]+(world?26:20)}">Indonesia</text></g>`;
    $('coal-map').innerHTML=g;
    const route=$('selected-trade-path'),length=route.getTotalLength();
    mapFleet=Array.from($('coal-map').querySelectorAll('.map-carrier'),(node,i)=>({node,route,length,phase:i/3}));
    positionFleet(0);
    $('market-buttons').innerHTML=D.markets.map(m=>`<button type="button" data-market="${m.id}" aria-pressed="${m.id===selectedMarket}">${esc(m.name)}</button>`).join('');
    $('market-buttons').querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
      selectedMarket=btn.dataset.market;
      if(selectedMarket==='spain')setMapView('world');
      renderMap();$('market-buttons').querySelector(`[data-market="${selectedMarket}"]`).focus();
    }));
    $('market-name').textContent=market.name;$('market-heading').textContent=market.heading;
    $('market-body').textContent=market.body;$('market-watch').textContent=market.watch;
    const measured=market.exportKt!==null,share=measured?market.exportKt/D.destinationSeries.total*100:null;
    $('market-volume').textContent=measured?num(market.exportKt/1000,2)+' Mt':'Context only';
    $('market-share').textContent=measured?num(share,share<1?2:1)+'%':'Not reported here';
    const source=D.sources.find(record=>record.id===(measured?'bps-destinations':'trade'));
    $('market-record').href=source.url;
    $('market-record').textContent=measured?'BPS / Revised 2025 record ↗':'IEA / Regional context ↗';
  }
  document.querySelectorAll('[data-map-view]').forEach(btn=>btn.addEventListener('click',()=>{
    // Spain is outside the Asia crop. Keep a visible selection when switching regions.
    if(btn.dataset.mapView==='asia'&&selectedMarket==='spain')selectedMarket='india';
    setMapView(btn.dataset.mapView);renderMap();
  }));
  setMapView('world');renderMap();
  $('destination-total').textContent=num(D.destinationSeries.total/1000,2)+' million tonnes';
  $('destination-other').textContent=num(D.destinationSeries.other/1000,2)+' million tonnes';
  const percent=D.transition.cleanAndStoragePercent,c=2*Math.PI*82;
  $('transition-chart').innerHTML=`<circle cx="150" cy="122" r="82" fill="none" stroke="var(--rule-2)" stroke-width="19"/><circle cx="150" cy="122" r="82" fill="none" stroke="var(--teal)" stroke-width="19" stroke-dasharray="${c*percent/100} ${c}" transform="rotate(-90 150 122)"/><text x="150" y="125" text-anchor="middle" style="font-size:46px;font-family:var(--font-serif)">${percent}%</text><text x="150" y="148" text-anchor="middle" style="font-size:10px">New / renewable + storage</text><circle cx="44" cy="239" r="4" fill="var(--teal)"/><text x="57" y="243" style="font-size:10px">${percent}% / Planned clean energy + storage</text><circle cx="44" cy="261" r="4" fill="var(--rule-2)"/><text x="57" y="265" style="font-size:10px">${100-percent}% / Other planned capacity</text>`;

  function inputs(){return Object.fromEntries(Object.keys(M.baseline).map(k=>[k,Number($(k).value)]));}
  function renderLab() {
    const input=inputs(),r=M.calculate(input);
    Object.entries(input).forEach(([k,v])=>$(k+'-output').textContent=k==='volume'?num(v,0)+' Mt/year':k==='charge'?num(v,0)+'%':'$'+num(v,0)+'/t');
    $('cash-contribution').innerHTML=`${money(r.contribution)} <span>billion</span>`;
    $('cash-contribution').classList.toggle('loss',r.contribution<0);
    $('gross-revenue').textContent=money(r.revenue)+'bn';
    $('contribution-margin').textContent=r.margin===null?'Not applicable':num(r.margin)+'%';
    $('break-even').textContent=money(r.breakEven,1)+'/t';
    $('lab-explanation').textContent=(r.contribution<0?'Negative contribution: ':'')+'Before fixed costs, capital expenditure, income tax and financing.';
    const rows=[['Gross revenue',r.revenue,false],['Revenue-linked charge',r.revenueCharge,true],['Production + inland costs',r.operatingCost,true]];
    const scale=Math.max(r.revenue,r.revenueCharge,r.operatingCost,.001);
    $('cash-bridge').innerHTML=rows.map(([label,value,deduction])=>`<div class="bridge-row"><span>${label}</span><div class="bridge-track" aria-hidden="true"><div class="bridge-fill ${deduction?'deduction':''}" style="width:${Math.max(0,value/scale*100)}%"></div></div><strong>${deduction?'−':''}${money(value)}bn</strong></div>`).join('');
    const changes=[-30,-15,0,15,30];
    let heat=`<div role="row" style="display:contents"><span role="columnheader" class="sensitivity-label">Volume / Price</span>${changes.map(p=>`<span role="columnheader" class="sensitivity-label">${signed(p,0)}%</span>`).join('')}</div>`;
    for(const v of changes){heat+=`<div role="row" style="display:contents"><span class="sensitivity-label" role="rowheader">${signed(v,0)}%</span>`;
      for(const p of changes){const rr=M.calculate({...input,price:input.price*(1+p/100),volume:input.volume*(1+v/100)});heat+=`<span role="cell" class="sensitivity-cell ${rr.contribution<0?'negative':''} ${v===0&&p===0?'current':''}" aria-label="Volume ${signed(v,0)} percent, price ${signed(p,0)} percent, contribution ${money(rr.contribution)} billion dollars">${num(rr.contribution,2)}</span>`;}
      heat+='</div>';
    }
    $('sensitivity-grid').setAttribute('role','table');$('sensitivity-grid').setAttribute('aria-label','Illustrative annual cash contribution sensitivity in US dollars billion');$('sensitivity-grid').innerHTML=heat;
    $('lab-live').textContent=`Scenario: ${num(input.volume,0)} million tonnes, selling price ${money(input.price,0)} per tonne. Cash contribution ${money(r.contribution)} billion dollars. Break-even price ${money(r.breakEven,1)} per tonne.`;
  }
  $('coal-assumptions').addEventListener('input',renderLab);
  $('coal-assumptions').addEventListener('submit',e=>e.preventDefault());
  $('coal-assumptions').addEventListener('reset',e=>{e.preventDefault();for(const [k,v]of Object.entries(M.baseline))$(k).value=v;renderLab();});renderLab();

  const groups=Map.groupBy?Map.groupBy(D.sources,s=>s.publisher):D.sources.reduce((m,s)=>{if(!m.has(s.publisher))m.set(s.publisher,[]);m.get(s.publisher).push(s);return m;},new Map());
  $('coal-sources').innerHTML=Array.from(groups,([publisher,sources])=>`<details class="source-group"><summary>${esc(publisher)}</summary><ol>${sources.map(s=>`<li id="source-${esc(s.id)}"><div><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><p>${esc(s.date)}</p></div><div><p>${esc(s.locator)}</p><p>${esc(s.note)}</p></div></li>`).join('')}</ol></details>`).join('');
  const chainStages = {
    mine: ['At the mine', 'Coal quality and production cost shape the cargo before it moves.'],
    port: ['At the port', 'Inland transport and loading add cost before the coal reaches its buyer.'],
    buyer: ['At the buyer', 'The contract and coal specification determine the price the producer receives.']
  };
  let cycleTime=0, cycleStage='', mapTime=0;
  const stages=Object.keys(chainStages);
  function showChainStage(stage) {
    cycleStage=stage;
    $('coal-chain').dataset.stage = stage;
    $('chain-heading').textContent = chainStages[stage][0];
    $('chain-caption').textContent = chainStages[stage][1];
    document.querySelectorAll('[data-chain-stage]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.chainStage === stage)));
  }
  document.querySelectorAll('[data-chain-stage]').forEach(button => button.addEventListener('click', () => {
    cycleTime=stages.indexOf(button.dataset.chainStage)*6;
    showChainStage(button.dataset.chainStage);
    $('chain-progress').style.transform=`scaleX(${cycleTime/18})`;
  }));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let motion=!reduced.matches;
  function setMotion(){document.documentElement.dataset.coalMotion=motion?'on':'off';
    scheduleMotion();
  }
  reduced.addEventListener('change',()=>{motion=!reduced.matches;setMotion();});
  function positionFleet(seconds) {
    for(const item of mapFleet){
      const progress=(seconds/12+item.phase)%1,distance=progress*item.length;
      const point=item.route.getPointAtLength(distance),next=item.route.getPointAtLength(Math.min(distance+1,item.length));
      const angle=Math.atan2(next.y-point.y,next.x-point.x)*180/Math.PI;
      item.node.setAttribute('transform',`translate(${point.x} ${point.y}) rotate(${angle})`);
      item.node.style.opacity=String(Math.min(1,progress*12,(1-progress)*12));
    }
  }
  let frame=null,lastFrame=null;
  function scheduleMotion() {
    const visible=document.querySelector('.coal-object.is-visible,.map-console.is-visible');
    if(motion&&!document.hidden&&visible){if(frame===null)frame=requestAnimationFrame(animateScene);}
    else {if(frame!==null)cancelAnimationFrame(frame);frame=null;lastFrame=null;}
  }
  function animateScene(now) {
    frame=null;
    const delta=lastFrame===null?0:Math.min((now-lastFrame)/1000,.05);lastFrame=now;
    if($('coal-chain').classList.contains('is-visible')){
      cycleTime=(cycleTime+delta)%18;
      const stage=stages[Math.floor(cycleTime/6)];
      if(stage!==cycleStage)showChainStage(stage);
      $('chain-progress').style.transform=`scaleX(${cycleTime/18})`;
    }
    if($('coal-map').closest('.map-console').classList.contains('is-visible')){mapTime+=delta;positionFleet(mapTime);}
    scheduleMotion();
  }
  document.addEventListener('visibilitychange',scheduleMotion);
  showChainStage('mine');
  setMotion();
  if('IntersectionObserver'in window){const ambient=new IntersectionObserver(entries=>{entries.forEach(e=>e.target.classList.toggle('is-visible',e.isIntersecting));scheduleMotion();},{threshold:.12});document.querySelectorAll('.coal-object,.map-console').forEach(el=>ambient.observe(el));
    const sectionObserver=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)document.querySelectorAll('.coal-section-nav a').forEach(a=>a.setAttribute('aria-current',String(a.hash==='#'+e.target.id)));},{rootMargin:'-15% 0px -65% 0px'});document.querySelectorAll('section[id],.company-evidence[id]').forEach(el=>sectionObserver.observe(el));
  } else {document.querySelectorAll('.coal-object,.map-console').forEach(el=>el.classList.add('is-visible'));scheduleMotion();}
})();
