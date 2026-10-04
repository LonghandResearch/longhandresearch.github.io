(function () {
  'use strict';
  const D = window.IDN_RESEARCH;
  const $ = id => document.getElementById(id);
  const nf = (n, d=2) => new Intl.NumberFormat('en-US', {minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
  const esc = text => String(text ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sources = new Map(D.sources.map(s=>[s.source_id,s]));
  document.querySelectorAll('[data-newsletter]').forEach(host=>{
    const copy=D.newsletter[Number(host.dataset.newsletter)];
    host.innerHTML='<h3>'+esc(copy.title)+'</h3>'+copy.paragraphs.map(p=>'<p>'+esc(p)+'</p>').join('');
  });
  $('flow-illustration').innerHTML=D.flow_svg;
  let period='annual', region='Greater Jakarta & West Java', year=2030, caseName='base';
  const fields=['capacity','utilization','pue','wue','electricityTariff','waterTariff'];
  const price = v => v >= 1e12 ? ['Rp'+nf(v/1e12),'trillion'] : v >= 1e9 ? ['Rp'+nf(v/1e9),'billion'] : v >= 1e6 ? ['Rp'+nf(v/1e6),'million'] : ['Rp'+nf(v,0),''];
  const money = v => {const [n,u]=price(v);return n+' '+u;};
  const volume = v => v>=1e6 ? nf(v/1e6)+' million m³' : nf(v,0)+' m³';
  const safeUrl = url => /^https?:\/\//i.test(url || '') ? url : '#';
  function input() {
    const values=Object.fromEntries(fields.map(k=>[k,$(k).value.trim()===''?NaN:Number($(k).value)]));
    values.utilization/=100;
    return {...values,hours:D.hours,nationalTwh:D.national.consumption_twh};
  }
  function preset(name) {
    caseName=name;
    const s=D.scenarios[name];
    $('utilization').value=s.utilization*100; $('pue').value=s.pue; $('wue').value=s.wue_l_per_kwh;
    document.querySelectorAll('[data-case]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.case===name));
    $('case-label').textContent=name[0].toUpperCase()+name.slice(1)+' expansion assumptions';
    update();
  }
  function update() {
    $('utilization-value').textContent=$('utilization').value+'%';
    $('pue-value').textContent=nf(Number($('pue').value)); $('wue-value').textContent=nf(Number($('wue').value));
    let i,r;
    try {i=input();r=window.IDN_MODEL.calculate(i);} catch(e) {$('input-error').textContent=e.message;$('input-error').hidden=false;$('results').classList.add('invalid');return;}
    $('input-error').hidden=true;$('results').classList.remove('invalid');
    $('capacity-range').value=i.capacity;
    const divisor=period==='annual'?1:12, suffix=period==='annual'?'per year':'per month';
    const [en,eu]=price(r.electricityCost/divisor),[wn,wu]=price(r.waterCost/divisor);
    $('electricity-cost').innerHTML=esc(en)+' <small>'+esc(eu)+'</small>';
    $('water-cost').innerHTML=esc(wn)+' <small>'+esc(wu)+'</small>';
    $('electricity-volume').textContent=nf(r.facilityTwh/divisor)+' TWh '+suffix;
    $('water-volume').textContent=volume(r.waterM3/divisor)+' '+suffix;
    const itShare=r.facilityKwh ? r.itKwh/r.facilityKwh*100 : 0;
    const overheadShare=r.facilityKwh?100-itShare:0;
    const label=(value,share)=>share>15?nf(value/1e9)+' TWh':'';
    $('energy-bars').innerHTML='<div class="build-bar" role="img" aria-label="'+esc(nf(r.itKwh/1e9)+' TWh IT plus '+nf(r.overheadKwh/1e9)+' TWh overhead')+'"><span class="it-part" style="width:'+itShare+'%">'+label(r.itKwh,itShare)+'</span><span class="overhead-part" style="width:'+overheadShare+'%">'+label(r.overheadKwh,overheadShare)+'</span></div>';
    const waterTests=[0,.2,.5,1,1.5], waterMax=Math.max(1,r.itKwh*1.5/1000);
    $('water-chart').innerHTML='<text x="15" y="17">Million m³ / year</text>'+waterTests.map((w,j)=>{
      const value=r.itKwh*w/1000, height=value/waterMax*78, x=25+j*116;
      return '<g><rect x="'+x+'" y="'+(111-height)+'" width="80" height="'+Math.max(1,height)+'" fill="'+(Math.abs(i.wue-w)<.001?'var(--teal)':'#8bb8a6')+'"/><text x="'+(x+40)+'" y="'+(101-height)+'" text-anchor="middle">'+nf(value/1e6)+'</text><text x="'+(x+40)+'" y="136" text-anchor="middle">WUE '+nf(w,1)+'</text></g>';
    }).join('');
    $('average-load').textContent=nf(r.averageLoadMw,0)+' MW';$('daily-water').textContent=nf(r.waterDaily,0)+' m³';$('national-share').textContent=nf(r.nationalShare)+'%';
    const waterShare=r.electricityCost+r.waterCost ? r.waterCost/(r.electricityCost+r.waterCost)*100 : 0;
    $('calculation-story').textContent='At '+nf(i.capacity,0)+' MW IT, the selected load factor draws '+nf(r.itKwh/1e9)+' TWh of server electricity each year. Facility overhead adds '+nf(r.overheadKwh/1e9)+' TWh. Water represents '+nf(waterShare)+'% of these modeled resource costs. Its local availability still needs a separate supply check.';
    $('flow-it').textContent=nf(r.itKwh/1e9)+' TWh / year';$('flow-overhead').textContent=nf(r.overheadKwh/1e9)+' TWh / year';$('flow-water').textContent=volume(r.waterM3)+' consumed / year';
    document.querySelectorAll('[data-flow-value]').forEach(el=>{el.textContent=el.dataset.flowValue==='water'?volume(r.waterM3):nf((el.dataset.flowValue==='it'?r.itKwh:r.overheadKwh)/1e9)+' TWh';});
    $('live-status').textContent=nf(i.capacity,0)+' MW IT. '+nf(r.facilityTwh)+' TWh electricity per year. '+nf(r.waterM3,0)+' cubic meters of cooling water per year.';
    $('case-comparison').innerHTML='<div class="compare-head"><span>Case</span><span>TWh / year</span><span>Electricity / year</span><span>Water m³ / year</span></div>'+Object.entries(D.scenarios).map(([name,s])=>{
      const c=window.IDN_MODEL.calculate({...i,utilization:s.utilization,pue:s.pue,wue:s.wue_l_per_kwh});
      return '<div class="compare-row '+name+'"><strong>'+name[0].toUpperCase()+name.slice(1)+'</strong><span>'+nf(c.facilityTwh)+'</span><span>'+esc(money(c.electricityCost))+'</span><span>'+nf(c.waterM3,0)+'</span></div>';
    }).join('');
  }
  fields.forEach(k=>$(k).addEventListener('input',()=>{
    if(['utilization','pue','wue'].includes(k)) {caseName='custom';document.querySelectorAll('[data-case]').forEach(b=>b.setAttribute('aria-pressed','false'));$('case-label').textContent='Custom expansion assumptions';}
    update();
  }));
  $('controls').addEventListener('submit',e=>e.preventDefault());
  $('capacity-range').addEventListener('input',()=>{$('capacity').value=$('capacity-range').value;update();});
  document.querySelectorAll('[data-capacity]').forEach(b=>b.addEventListener('click',()=>{$('capacity').value=b.dataset.capacity;update();}));
  document.querySelectorAll('[data-case]').forEach(b=>b.addEventListener('click',()=>preset(b.dataset.case)));
  document.querySelectorAll('[data-period]').forEach(b=>b.addEventListener('click',()=>{period=b.dataset.period;document.querySelectorAll('[data-period]').forEach(x=>x.setAttribute('aria-pressed',x===b));update();}));
  $('reset').addEventListener('click',()=>{$('capacity').value=1000;$('electricityTariff').value=D.tariffs.electricity_rp_per_kwh;$('waterTariff').value=D.tariffs.water_rp_per_m3;period='annual';document.querySelectorAll('[data-period]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.period==='annual'));preset('base');});
  const locations=[['Greater Jakarta & West Java',107.1,-6.4],['Batam',104.05,1.08],['Bintan',104.47,1.05],['Surabaya',112.75,-7.26],['Other / undisclosed',null,null]];
  $('region-buttons').innerHTML=locations.map(([name])=>'<button data-region="'+esc(name)+'" aria-pressed="false">'+esc(name)+'</button>').join('');
  let mapFocused=false;
  const regionCopy={
    'Greater Jakarta & West Java':'The principal disclosed operating cluster and additional West Java records.',
    Batam:'Island projects where power delivery and water allocation need local checks.',
    Bintan:'A large announced campus. Planned capacity is distinct from operating load.',
    Surabaya:'Disclosed capacity beyond the Greater Jakarta market boundary.',
    'Other / undisclosed':'Records retained without a plotted regional centroid.'
  };
  const metricFields=['operational_mw','under_construction_mw','committed_mw','planned_mw','potential_mw'];
  const includedProjects=()=>D.projects.filter(p=>p.include_in_inventory===true);
  const inRegion=p=>region==='Other / undisclosed'?!locations.some(([n])=>n===p.map_region):p.map_region===region;
  function renderMap() {
    const point=locations.find(([name])=>name===region);
    const focus=mapFocused&&point[1]!==null;
    $('project-map').setAttribute('viewBox',focus&&window.matchMedia('(max-width:780px)').matches?'190 80 630 340':'0 0 980 460');
    const scale=focus?(region==='Batam'||region==='Bintan'?230:85):19.1;
    const center=focus?[point[1],point[2]]:[118.4,-3];
    const xy=([lon,lat])=>[490+(lon-center[0])*scale,230+(center[1]-lat)*scale];
    const polys=D.map.geometry.type==='MultiPolygon'?D.map.geometry.coordinates:[D.map.geometry.coordinates];
    const land=polys.map(poly=>poly.map(ring=>ring.map((p,j)=>{const [x,y]=xy(p);return (j?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);}).join('')+'Z').join('')).join('');
    const minLon=center[0]-490/scale,maxLon=center[0]+490/scale,minLat=center[1]-230/scale,maxLat=center[1]+230/scale;
    const step=focus?(scale>100?.5:2):5;
    let grid='';
    for(let lon=Math.ceil(minLon/step)*step;lon<=maxLon;lon+=step){
      const [x]=xy([lon,0]);grid+='<path class="map-grid" d="M'+x+' 0V460"/><text class="map-coordinate" x="'+(x+7)+'" y="448">'+nf(lon,step<1?1:0)+'°E</text>';
    }
    for(let lat=Math.ceil(minLat/step)*step;lat<=maxLat;lat+=step){
      const [,y]=xy([0,lat]);grid+='<path class="map-grid '+(lat===0?'equator':'')+'" d="M0 '+y+'H980"/>';
    }
    const islands=[['SUMATRA',100,-2.5],['JAVA',111,-9.3],['KALIMANTAN',113,1],['SULAWESI',121,-4],['PAPUA',136,-4]];
    const labels=focus?'':islands.map(([n,lo,la])=>{const [x,y]=xy([lo,la]);return '<text class="map-island-label" x="'+x+'" y="'+y+'">'+n+'</text>';}).join('');
    const boxes={'Greater Jakarta & West Java':[210,358,270],Batam:[100,46,155],Bintan:[310,65,155],Surabaya:[515,342,190]};
    const marks=locations.filter(([,lon])=>lon!==null).map(([name,lon,lat])=>{
      const [x,y]=xy([lon,lat]),active=name===region;
      if(focus&&(x<20||x>940||y<25||y>395))return '';
      const short=name==='Greater Jakarta & West Java'?'Jakarta / West Java':name;
      let [bx,by,bw]=focus?[Math.min(760,x+24),Math.max(45,y-64),name==='Greater Jakarta & West Java'?270:170]:boxes[name];
      if(focus&&name==='Batam'){bx=Math.max(20,x-195);by=Math.max(45,y-90);}
      const count=includedProjects().filter(p=>p.map_region===name).length;
      const cy=by+(y>by?57:0),cx=Math.max(bx+20,Math.min(bx+bw-20,x));
      return '<g class="map-region '+(active?'selected':'')+'" data-map-region="'+esc(name)+'">'+
        '<path class="map-leader" d="M'+x+' '+y+'L'+cx+' '+cy+'"/><circle class="map-halo" cx="'+x+'" cy="'+y+'" r="'+(active?23:15)+'"/><circle class="map-marker" cx="'+x+'" cy="'+y+'" r="6"/>'+
        '<g class="map-callout-button" role="button" tabindex="0" aria-label="Select '+esc(name)+' project region" aria-pressed="'+active+'"><rect class="map-callout" x="'+bx+'" y="'+by+'" width="'+bw+'" height="57" rx="5"/><text class="map-place-label" x="'+(bx+14)+'" y="'+(by+23)+'">'+esc(short)+'</text><text class="map-count" x="'+(bx+14)+'" y="'+(by+43)+'">'+count+' all-status records</text></g></g>';
    }).join('');
    $('project-map').innerHTML='<defs><linearGradient id="map-ocean" x2="1" y2="1"><stop stop-color="#102f37"/><stop offset="1" stop-color="#0b1d27"/></linearGradient><linearGradient id="map-terrain" x2=".6" y2="1"><stop stop-color="#517b72"/><stop offset="1" stop-color="#284d4f"/></linearGradient><radialGradient id="map-light"><stop stop-color="#82c9ad" stop-opacity=".18"/><stop offset="1" stop-color="#82c9ad" stop-opacity="0"/></radialGradient></defs>'+
      '<rect width="980" height="460" fill="url(#map-ocean)"/><ellipse cx="305" cy="230" rx="365" ry="245" fill="url(#map-light)"/>'+
      '<g class="ocean-contours"><path d="M-80 420Q70 190 245 275T650 150T1080 270"/><path d="M-80 445Q70 215 245 300T650 175T1080 295"/><path d="M-80 470Q70 240 245 325T650 200T1080 320"/></g>'+grid+
      '<path class="map-land-shadow" d="'+land+'" transform="translate(0 5)"/><path class="map-land" d="'+land+'"/>'+labels+marks+
      '<g class="map-compass" transform="translate(930 36)"><path d="M0 28V0M-5 8L0 0L5 8"/><text y="44" text-anchor="middle">N</text></g>';
    document.querySelectorAll('[data-region]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.region===region));
    $('map-selection').textContent=region;
    $('map-description').textContent=regionCopy[region];
    $('map-focus').disabled=point[1]===null;
    $('map-focus').textContent=focus?'Return to Indonesia':'Focus selected region';
    $('map-focus').setAttribute('aria-pressed',String(focus));
  }
  function selectRegion(name) {
    region=name;renderMap();renderProjects();
  }
  function renderProjects() {
    $('region-name').textContent=region;
    const status=$('project-status').value;
    const selected=D.projects.filter(p=>p.include_in_inventory===true && (region==='Other / undisclosed'?!locations.some(([n])=>n===p.map_region):p.map_region===region) && (status==='all'||p.status===status));
    const disclosed=selected.filter(p=>p.capacity_basis==='IT'&&metricFields.some(k=>p[k]!==null&&p[k]>0)).length;
    $('map-records').textContent=nf(selected.length,0);
    $('map-known').textContent=nf(disclosed,0);
    $('map-unknown').textContent=nf(selected.length-disclosed,0);
    $('project-list').innerHTML=selected.length?selected.map(p=>{
      const s=sources.get(p.source_id),values=[['Operational',p.operational_mw],['Construction',p.under_construction_mw],['Committed',p.committed_mw],['Planned',p.planned_mw],['Potential',p.potential_mw]].filter(([,v])=>v!==null && v>0);
      const capacity=p.capacity_basis==='IT' && values.length?values.map(([n,v])=>n+' '+nf(v,1)+' MW IT').join('. '):'IT capacity undisclosed';
      const connection=p.power_connection_mva!==null?'Connection '+nf(p.power_connection_mva,0)+' MVA. ':'';
      return '<article class="project-row"><h3>'+esc(p.facility)+'</h3><p class="company">'+esc(p.company)+' / '+esc(p.location)+'</p><p class="project-capacity">'+esc(capacity)+'</p><p>'+esc(p.status.replace(/_/g,' '))+'. '+esc(connection)+'</p><a href="'+esc(safeUrl(s?.url))+'" target="_blank" rel="noopener noreferrer">'+esc(p.source_id)+' source ↗</a></article>';
    }).join(''):'<p class="micro">No included records match this selection. This does not establish that no projects exist.</p>';
  }
  document.querySelectorAll('[data-region]').forEach(b=>b.addEventListener('click',()=>selectRegion(b.dataset.region)));
  $('project-map').addEventListener('click',e=>{const marker=e.target.closest('[data-map-region]');if(marker)selectRegion(marker.dataset.mapRegion);});
  $('project-map').addEventListener('keydown',e=>{const marker=e.target.closest('[data-map-region]');if(marker&&['Enter',' '].includes(e.key)){e.preventDefault();selectRegion(marker.dataset.mapRegion);[...document.querySelectorAll('.map-callout-button')].find(b=>b.getAttribute('aria-label')==='Select '+region+' project region')?.focus();}});
  $('map-focus').addEventListener('click',()=>{mapFocused=!mapFocused;renderMap();});
  window.addEventListener('resize',renderMap);
  $('flow-enlarge').addEventListener('click',()=>{const enlarged=$('flow-illustration').classList.toggle('enlarged');$('flow-enlarge').setAttribute('aria-pressed',String(enlarged));$('flow-enlarge').textContent=enlarged?'Fit diagram':'Enlarge diagram';});
  $('project-status').addEventListener('change',renderProjects);
  const outlookCases=[['Conservative','#758671'],['Base Case','#32796b'],['Aggressive AI Boom','#ae762b']];
  function renderOutlook() {
    const X=y=>85+(y-2030)*230,Y=v=>260-v/45*220;
    let svg='';for(let value=0;value<=40;value+=10)svg+='<path class="axis" d="M65 '+Y(value)+'H600"/><text x="35" y="'+(Y(value)+4)+'">'+value+'</text>';
    svg+='<text x="65" y="20">Facility TWh / year</text>';
    [2030,2031,2032].forEach(y=>{svg+='<text x="'+(X(y)-16)+'" y="288">'+y+'</text>';});
    outlookCases.forEach(([name,color],idx)=>{
      const rows=D.outlook.filter(r=>r.outlook_case===name).sort((a,b)=>a.year-b.year);
      svg+='<path d="'+rows.map((r,j)=>(j?'L':'M')+X(r.year)+' '+Y(r.facility_electricity_twh)).join('')+'" fill="none" stroke="'+color+'" stroke-width="3"/>';
      rows.forEach(r=>{svg+='<circle cx="'+X(r.year)+'" cy="'+Y(r.facility_electricity_twh)+'" r="'+(r.year===year?5:3)+'" fill="'+color+'"/>';});
      svg+='<text x="'+(65+idx*210)+'" y="320" style="fill:'+color+'">'+esc(name)+'</text>';
    });
    $('outlook-chart').innerHTML=svg;
    $('outlook-values').innerHTML=outlookCases.map(([name,color])=>{const r=D.outlook.find(r=>r.outlook_case===name&&r.year===year);return '<article class="outlook-case"><h3><i style="background:'+color+'"></i>'+esc(name)+'</h3><strong>'+nf(r.facility_electricity_twh)+' TWh</strong><span>'+nf(r.it_capacity_mw,0)+' MW IT</span><p>'+esc(money(r.electricity_cost_rp))+' electricity / year</p><p>'+esc(volume(r.water_m3_per_year))+' direct cooling water / year</p></article>';}).join('');
  }
  document.querySelectorAll('[data-year]').forEach(b=>b.addEventListener('click',()=>{year=Number(b.dataset.year);document.querySelectorAll('[data-year]').forEach(x=>x.setAttribute('aria-pressed',x===b));renderOutlook();}));
  const keySources=[
    ['ELEC001','ESDM. Indonesia electricity statistics, 2025','National electricity consumption used for the scale comparison.'],
    ['ELEC002','PLN. Electricity tariffs, Q3 2026','I-4 high-voltage energy rate. Contract qualification is an assumption.'],
    ['ELEC004','Cushman & Wakefield. H2 2025 capacity','Dated Greater Jakarta operational IT market estimate.'],
    ['ELEC006','Cushman & Wakefield. H1 2026 pipeline','Jakarta construction and planned capacity anchors.'],
    ['WB001','PAM JAYA. Industrial water tariffs','Jakarta marginal price proxy. Effective in 2025.'],
    ['WB008','Digital Edge. Indonesia efficiency specifications','Published PUE values. Measurement year and operating status are unclear.'],
    ['WB017','LBNL. Data center energy and water study','Foreign technical benchmark. U.S. modeled cooling-water consumption.']
  ];
  $('source-list').innerHTML=keySources.map(([id,title,note])=>{const s=sources.get(id);return '<li><a href="'+esc(safeUrl(D.reader_urls[id]||s.url))+'" target="_blank" rel="noopener noreferrer">'+esc(title)+'</a><br>'+esc(note)+'</li>';}).join('');
  const current=D.current.find(r=>r.case==='base');$('current-base').innerHTML=nf(current.facility_electricity_twh)+' <small>TWh / year</small>';
  const base=D.scenarios.base, headline=window.IDN_MODEL.calculate({capacity:1000,utilization:base.utilization,pue:base.pue,wue:base.wue_l_per_kwh,electricityTariff:D.tariffs.electricity_rp_per_kwh,waterTariff:D.tariffs.water_rp_per_m3,hours:D.hours,nationalTwh:D.national.consumption_twh});
  const ledger=document.querySelector('.hero-ledger');
  ledger.querySelector('.ledger-row strong').innerHTML=nf(headline.facilityTwh)+' <small>TWh</small>';
  ledger.querySelector('.ledger-row p').textContent=money(headline.electricityCost)+' in energy charges';
  ledger.querySelector('.ledger-row.water strong').innerHTML=nf(headline.waterM3/1e6)+' <small>million m³</small>';
  ledger.querySelector('.ledger-row.water p').textContent=money(headline.waterCost)+' at the Jakarta price proxy';
  ledger.querySelector(':scope > .micro').textContent='Base expansion case. '+nf(base.utilization*100,0)+'% average electrical load, PUE '+nf(base.pue)+' and consumptive WUE '+nf(base.wue_l_per_kwh)+' L/IT kWh.';
  document.querySelector('.evidence-grid article strong').innerHTML=nf(D.baseline.it_capacity_mw,0)+' <small>MW IT</small>';
  document.querySelector('.evidence-grid article:nth-child(2) p').textContent='The current-fleet base case uses '+nf(current.utilization*100,0)+'% electrical loading and PUE '+nf(current.pue)+'. Efficient new-build PUE should not be applied to the entire existing fleet.';
  $('national-share').previousElementSibling.textContent='Share of '+D.national.year+' national electricity';
  $('electricityTariff').value=D.tariffs.electricity_rp_per_kwh;$('waterTariff').value=D.tariffs.water_rp_per_m3;
  $('theme').addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('theme').setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme');});
  preset('base');renderMap();renderProjects();renderOutlook();
})();
