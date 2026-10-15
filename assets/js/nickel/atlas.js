/* Country and locality relationships, never vessel tracks or mine provenance. */
(function () {
  'use strict';
  const D=window.NICKEL_RESEARCH, G=window.NICKEL_GEOGRAPHY;
  if(!D||!G)return;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=(n,d=0)=>n.toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d});
  const shareLabel=(value,total)=>esc(window.NickelModel.destinationShareLabel(value,total));
  const xy=(lon,lat)=>[(lon+180)*960/360,(85-lat)*520/170];
  const ref=id=>`<a class="source-ref" href="#source-${id}">${esc(({geology:'Badan Geologi',imip:'IMIP',iwip:'IWIP',obi:'Badan Geologi',sorowako:'ESDM',processing2017:'ESDM',battery:'BKPM'})[id]||'WITS')}</a>`;
  const HUD=window.NickelAtlasHUD;
  function grid(bounds,step){
    const [x,y,w,h]=bounds;let lines='';
    for(let lon=-180;lon<=180;lon+=step){const px=xy(lon,0)[0];if(px>=x&&px<=x+w)lines+=`<line x1="${px}" x2="${px}" y1="${y}" y2="${y+h}"/>`;}
    for(let lat=-80;lat<=80;lat+=step){const py=xy(0,lat)[1];if(py>=y&&py<=y+h)lines+=`<line x1="${x}" x2="${x+w}" y1="${py}" y2="${py}"/>`;}
    return `<g class="holo-graticule" aria-hidden="true">${lines}</g>`;
  }
  const target=(x,y,r)=>`<g class="holo-reticle" aria-hidden="true" transform="translate(${x} ${y})"><circle class="reticle-orbit" r="${r}"/><circle class="reticle-pulse" r="${r*.65}"/><path d="M${-r-1} 0h2M${r-1} 0h2M0 ${-r-1}v2M0 ${r-1}v2"/></g>`;
  let layer='reserves',selected='Sulawesi Tenggara';
  const paths=G.map(c=>`<path class="map-land ${c.name==='Indonesia'?'map-indonesia':''}" d="${c.path}"/>`).join('');
  function domestic() {
    const reserves=layer==='reserves';
    const rows=reserves?D.reserves.provinces:D.sites;
    if(!rows.some(r=>r.name===selected))selected=reserves?'Sulawesi Tenggara':'Morowali / Bahodopi';
    const dots=rows.map(r=>{
      const [x,y]=xy(r.lon,r.lat),active=r.name===selected;
      const radius=reserves?.65+Math.sqrt(r.metal_reserves_tonnes/D.reserves.national_metal_reserves_tonnes)*2.4:1;
      return `${active?target(x,y,4):''}<g class="atlas-marker ${active?'selected':''}" data-map-point="${esc(r.name)}" role="button" tabindex="0" aria-label="${esc(r.name)}${reserves?': '+fmt(r.metal_reserves_tonnes)+' tonnes contained nickel reserves':': '+esc(r.kind)}" aria-pressed="${active}"><title>${esc(r.name)}</title><circle class="marker-hit" cx="${x}" cy="${y}" r="2.4"/><circle class="marker-ring" cx="${x}" cy="${y}" r="${radius+1}"/><circle class="marker-dot" cx="${x}" cy="${y}" r="${radius}"/></g>`;
    }).join('');
    $('domestic-map').innerHTML=`<svg viewBox="730 231 139 70" role="group" aria-label="Indonesia ${reserves?'contained-nickel reserves by approximate province anchor':'selected mining and industry localities'}. Select a point or use the named buttons below.">${grid([730,231,139,70],5)}${paths}<g class="island-labels"><text x="738" y="246">SUMATRA</text><text x="770" y="286">JAVA</text><text x="774" y="252">KALIMANTAN</text><text x="807" y="276">SULAWESI</text><text x="822" y="254">MALUKU</text><text x="843" y="282">PAPUA</text></g>${dots}</svg>`;
    const row=rows.find(r=>r.name===selected);
    $('atlas-detail').innerHTML=reserves?`<p class="technical">REPORTED RESERVES · DECEMBER 2024</p><h3>${esc(row.name)}</h3><div class="reserve-stats"><p><strong>${fmt(row.metal_reserves_tonnes/1e6,2)}m</strong><span>tonnes of contained nickel</span></p><p><strong>${fmt(row.metal_reserves_tonnes/D.reserves.national_metal_reserves_tonnes*100,1)}%</strong><span>of reported national metal reserves</span></p><p><strong>${fmt(row.ore_reserves_tonnes/1e9,3)}bn</strong><span>tonnes of ore reserves</span></p></div>`:`<p class="technical">${esc(row.kind).toUpperCase()}</p><h3>${esc(row.name)}</h3><p>${esc(row.detail)} ${ref(row.source)}</p>`;
    $('atlas-note').innerHTML=reserves?`Circle area approximately scales with reported contained-metal reserves. National total: ${fmt(D.reserves.national_metal_reserves_tonnes/1e6,2)}m tonnes of contained nickel, a stock rather than annual output. ${ref('geology')}`:'Selected documented localities. Markers are approximate display anchors. Sites are not sized by production. Individual facilities, permits and current operating output require separate verification.';
    $('atlas-choices').innerHTML=rows.map(r=>`<button type="button" data-map-point="${esc(r.name)}" aria-pressed="${r.name===selected}">${esc(r.name)}</button>`).join('');
    $('domestic-map').closest('.nickel-holo').querySelector('.holo-hud span:last-child').textContent=reserves?'RESERVES · DEC 2024':'SELECTED LOCALITIES';
    HUD?.mount('domestic-map',[730,231,139,70],xy(row.lon,row.lat));
    document.querySelectorAll('[data-map-point]').forEach(el=>{
      const choose=()=>{selected=el.dataset.mapPoint;const wasMap=el.tagName.toLowerCase()==='g';domestic();const controls=wasMap?$('domestic-map'):$('atlas-choices');[...controls.querySelectorAll('[data-map-point]')].find(b=>b.dataset.mapPoint===selected)?.focus({preventScroll:true});};
      el.addEventListener('click',choose);
      if(el.tagName.toLowerCase()==='g')el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});
    });
  }
  document.querySelectorAll('[data-atlas]').forEach(b=>b.addEventListener('click',()=>{
    layer=b.dataset.atlas;document.querySelectorAll('[data-atlas]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));domestic();
  }));
  $('reserves-table').innerHTML=D.reserves.provinces.map(r=>`<tr><th scope="row">${esc(r.name)}</th><td>${fmt(r.ore_reserves_tonnes)}</td><td>${fmt(r.metal_reserves_tonnes)}</td></tr>`).join('')+`<tr><th scope="row">National reported total</th><td>${fmt(D.reserves.national_ore_reserves_tonnes)}</td><td>${fmt(D.reserves.national_metal_reserves_tonnes)}</td></tr>`;
  const anchors={'China':[105,35],'India':[79,22],'Korea, Rep.':[128,36],'Japan':[138,37],'Netherlands':[5.3,52.1],'Norway':[9,61],'Italy':[12.5,42],'United Kingdom':[-2,54],'South Africa':[25,-29],'Malaysia':[102,4],'Germany':[10,51]};
  let selectedPartner='China';
  function exports() {
    const code=$('destination-product').value,d=D.destinations.find(r=>r.hs_code===code),total=d.world.trade_value_thousand_usd;
    const rows=[...d.partners].sort((a,b)=>b.trade_value_thousand_usd-a.trade_value_thousand_usd);
    const china=rows.find(r=>r.partner==='China'),share=china.trade_value_thousand_usd/total*100;
    const [ox,oy]=xy(119,-3);
    if(!rows.some(r=>r.partner===selectedPartner))selectedPartner='China';
    const selectedRow=rows.find(r=>r.partner===selectedPartner);
    const mapped=rows.filter(r=>(r.trade_value_thousand_usd/total>.01||r.partner===selectedPartner)&&anchors[r.partner]);
    const links=mapped.map((r,i)=>{const [x,y]=xy(...anchors[r.partner]),active=r.partner===selectedPartner,id='nickel-link-'+i;return `<path id="${id}" class="export-link ${active?'selected':''}" stroke-width="${.45+Math.sqrt(r.trade_value_thousand_usd/total)*1.25}" d="M${ox},${oy} C${ox+(x-ox)*.2},${oy-(oy-y)*.62} ${x-(x-ox)*.18},${y+(oy-y)*.16} ${x},${y}"/>${active?target(x,y,10)+[0,1,2].map(()=>`<g class="route-packet" data-route="${id}" aria-hidden="true" transform="translate(${ox} ${oy})"><circle r="5" class="packet-halo"/><circle r="1.6" class="packet-core"/></g>`).join(''):''}<g class="export-marker" data-destination="${esc(r.partner)}" role="button" tabindex="0" aria-label="${esc(r.partner)}: ${shareLabel(r.trade_value_thousand_usd,total)} of this product’s export value" aria-pressed="${active}"><circle class="marker-hit" cx="${x}" cy="${y}" r="7"/><circle class="export-dot" cx="${x}" cy="${y}" r="3"/><text class="export-label" visibility="${['Germany','United Kingdom'].includes(selectedPartner)&&r.partner==='Netherlands'?'hidden':'visible'}" x="${x+(r.partner==='Korea, Rep.'?8:5)}" y="${y+(['Korea, Rep.','Norway'].includes(r.partner)?10:-6)}">${esc(r.partner==='Korea, Rep.'?'S. Korea':r.partner)}</text></g>`;}).join('');
    $('export-map').innerHTML=`<svg viewBox="430 65 455 290" role="group" aria-label="Indonesia's 2024 HS${code} export relationships. Destinations above one percent plus any selected partner. Economic links, not vessel routes. Select a destination.">${grid([430,65,455,290],15)}${paths}${links}${target(ox,oy,13)}<circle class="export-origin" cx="${ox}" cy="${oy}" r="4"/><text class="export-label" x="${ox-26}" y="${oy+16}">INDONESIA</text></svg>`;
    $('export-headline').innerHTML=`<strong>${fmt(share,1)}%</strong><p>of this product’s export value went to China.<small>2024 · HS${code} · total reported value $${fmt(total/1e6,2)}bn</small></p>`;
    $('destination-count').textContent=`2024 · ${rows.length} destinations · share of this product’s export value`;
    $('destination-bars').innerHTML=rows.map(r=>`<button type="button" class="destination-row" data-destination="${esc(r.partner)}" aria-pressed="${r.partner===selectedPartner}"><span>${esc(r.partner)}</span><span class="destination-track" aria-hidden="true"><i style="width:${r.trade_value_thousand_usd/total*100}%"></i></span><strong>${shareLabel(r.trade_value_thousand_usd,total)}</strong></button>`).join('');
    $('destination-detail').innerHTML=`<p class="technical">RECORDED DESTINATION · 2024</p><h3>${esc(selectedPartner)}</h3><div class="destination-stat"><strong class="${selectedRow.trade_value_thousand_usd/total<.0001?'precise-share':''}">${shareLabel(selectedRow.trade_value_thousand_usd,total)}</strong><span>of this product’s export value</span></div><dl class="holo-record"><div><dt>Export value</dt><dd>$${selectedRow.trade_value_thousand_usd>=1000?fmt(selectedRow.trade_value_thousand_usd/1000,2)+'m':fmt(selectedRow.trade_value_thousand_usd*1000,0)}</dd></div><div><dt>Product mass</dt><dd>${selectedRow.product_weight_kg>=1e6?fmt(selectedRow.product_weight_kg/1e6,2)+'m kg':fmt(selectedRow.product_weight_kg)+' kg'}</dd></div><div><dt>Product classification</dt><dd>HS${code}<small>HS 1988/92 (H0), as used by WITS</small></dd></div></dl><p>${!anchors[selectedPartner]?'WITS reports this as a regional category, so no country point is assigned. ':''}This is where the export was reported as going. The table does not identify the final user. ${ref('wits'+code)}</p>`;
    $('export-map').closest('.nickel-holo').querySelector('.holo-hud span:last-child').textContent='2024 · HS'+code;
    HUD?.mount('export-map',[430,65,455,290],anchors[selectedPartner]?xy(...anchors[selectedPartner]):[ox,oy]);
    document.querySelectorAll('[data-destination]').forEach(el=>{
      const choose=()=>{selectedPartner=el.dataset.destination;const map=el.tagName.toLowerCase()==='g';exports();const parent=map?$('export-map'):$('destination-bars');[...parent.querySelectorAll('[data-destination]')].find(b=>b.dataset.destination===selectedPartner)?.focus({preventScroll:true});};
      el.addEventListener('click',choose);if(el.tagName.toLowerCase()==='g')el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});
    });
    $('destination-note').innerHTML=`Shares are based on export value for this product. Recorded destinations do not identify final users. ${ref('wits'+code)}<details class="trade-method"><summary>How to read small shares and the map</summary><p>Every destination in the WITS table is listed. The denominator is its original World export value. Extra decimal places show the arithmetic from published values, not extra precision in the source. ‘0.00% reported’ means the source rounded the value to zero, even where product mass is recorded. ‘Other Asia, nes’ is a reporting category and has no country marker. The map initially shows partners above 1%, then adds any selected country. Lines connect trading partners and do not trace ships. ${code==='750120'?'HS750120 includes nickel oxide sinters and other intermediate products. It is not a verified MHP-only series. ':''}The source uses HS 1988/92 (H0).</p></details>`;
    $('destination-table').innerHTML=[d.world,...rows].map(r=>`<tr><th scope="row">${esc(r.partner)}</th><td>${fmt(r.trade_value_thousand_usd,2)}</td><td>${shareLabel(r.trade_value_thousand_usd,total)}</td><td>${fmt(r.product_weight_kg)}</td></tr>`).join('');
  }
  $('destination-product').addEventListener('change',exports);
  domestic();exports();
})();
