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
  const price = v => v >= 1e18 ? ['Rp'+new Intl.NumberFormat('en-US',{notation:'scientific',maximumFractionDigits:2}).format(v),''] : v >= 1e12 ? ['Rp'+nf(v/1e12),'trillion'] : v >= 1e9 ? ['Rp'+nf(v/1e9),'billion'] : v >= 1e6 ? ['Rp'+nf(v/1e6),'million'] : ['Rp'+nf(v,0),''];
  const money = v => {const [n,u]=price(v);return n+' '+u;};
  const volume = v => v>=1e6 ? nf(v/1e6)+' million m³' : nf(v,0)+' m³';
  const energy = kwh => kwh>=1e9?nf(kwh/1e9)+' TWh':kwh>=1e6?nf(kwh/1e6)+' GWh':kwh>=1000?nf(kwh/1000)+' MWh':nf(kwh,1)+' kWh';
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
    try {i=input();r=window.IDN_MODEL.calculate(i);} catch(e) {
      $('input-error').textContent=e.message;$('input-error').hidden=false;$('results').classList.add('invalid');
      ['electricity-cost','water-cost','electricity-volume','water-volume','average-load','daily-water','national-share','flow-it','flow-overhead','flow-water','energy-it-label','energy-overhead-label'].forEach(id=>$(id).textContent='Unavailable');
      document.querySelectorAll('[data-flow-value]').forEach(el=>{el.textContent='Unavailable';});
      $('energy-bars').innerHTML='';$('water-chart').innerHTML='';
      $('water-chart').setAttribute('aria-label','Water comparisons unavailable while calculator inputs are invalid.');
      $('case-comparison').innerHTML='<p class="micro">Enter valid calculator inputs to compare operating cases.</p>';
      $('calculation-story').textContent='Enter valid inputs to calculate resource demand.';
      $('flow-error').hidden=false;$('live-status').textContent='Resource values unavailable while calculator inputs are invalid.';
      return;
    }
    $('input-error').hidden=true;$('results').classList.remove('invalid');$('flow-error').hidden=true;
    $('capacity-range').value=i.capacity;
    const divisor=period==='annual'?1:12, suffix=period==='annual'?'per year':'per month';
    const [en,eu]=price(r.electricityCost/divisor),[wn,wu]=price(r.waterCost/divisor);
    $('electricity-cost').innerHTML=esc(en)+' <small>'+esc(eu)+'</small>';
    $('water-cost').innerHTML=esc(wn)+' <small>'+esc(wu)+'</small>';
    $('electricity-volume').textContent=energy(r.facilityKwh/divisor)+' '+suffix;
    $('water-volume').textContent=volume(r.waterM3/divisor)+' '+suffix;
    const itShare=r.facilityKwh ? r.itKwh/r.facilityKwh*100 : 0;
    const overheadShare=r.facilityKwh?100-itShare:0;
    const label=(value,share)=>share>15?energy(value):'';
    $('energy-unit').textContent='Annual electricity';
    $('energy-it-label').textContent=energy(r.itKwh);$('energy-overhead-label').textContent=energy(r.overheadKwh);
    $('energy-bars').innerHTML='<div class="build-bar" role="img" aria-label="'+esc(energy(r.itKwh)+' IT plus '+energy(r.overheadKwh)+' overhead')+'"><span class="it-part" style="width:'+itShare+'%">'+label(r.itKwh,itShare)+'</span><span class="overhead-part" style="width:'+overheadShare+'%">'+label(r.overheadKwh,overheadShare)+'</span></div>';
    const waterTests=[...new Set([0,.2,.5,1,1.5,i.wue])].sort((a,b)=>a-b), waterMax=Math.max(1,r.itKwh*Math.max(...waterTests)/1000),barStep=580/waterTests.length,barWidth=Math.min(80,barStep*.69);
    const waterDiv=waterMax>=1e6?1e6:waterMax>=1000?1000:1,waterUnits=waterDiv===1e6?'Million m³ / year':waterDiv===1000?'Thousand m³ / year':'m³ / year';
    $('water-chart').setAttribute('aria-label','Annual consumptive cooling-water comparisons. '+waterTests.map(w=>'WUE '+nf(w,2)+' liters per IT kWh: '+volume(r.itKwh*w/1000)+'.').join(' '));
    $('water-chart').innerHTML='<text x="15" y="17">'+waterUnits+'</text>'+waterTests.map((w,j)=>{
      const value=r.itKwh*w/1000, height=value/waterMax*78, x=10+j*barStep+(barStep-barWidth)/2;
      return '<g><rect x="'+x+'" y="'+(111-height)+'" width="'+barWidth+'" height="'+Math.max(1,height)+'" fill="'+(Math.abs(i.wue-w)<.001?'var(--teal)':'#8bb8a6')+'"/><text x="'+(x+barWidth/2)+'" y="'+(101-height)+'" text-anchor="middle">'+nf(value/waterDiv)+'</text><text x="'+(x+barWidth/2)+'" y="136" text-anchor="middle">'+nf(w,w*10===Math.round(w*10)?1:2)+'</text></g>';
    }).join('');
    $('average-load').textContent=nf(r.averageLoadMw,r.averageLoadMw>0&&r.averageLoadMw<10?2:0)+' MW';$('daily-water').textContent=nf(r.waterDaily,r.waterDaily>0&&r.waterDaily<100?1:0)+' m³';$('national-share').textContent=r.nationalShare>0&&r.nationalShare<.01?'<0.01%':nf(r.nationalShare)+'%';
    const costScale=Math.max(r.electricityCost,r.waterCost),waterShare=costScale?((r.waterCost/costScale)/(r.electricityCost/costScale+r.waterCost/costScale))*100:null;
    const costStory=waterShare===null?'The selected inputs imply no modeled resource charges.':'Water represents '+nf(waterShare)+'% of these modeled resource costs.';
    $('calculation-story').textContent='At '+nf(i.capacity,Number.isInteger(i.capacity)?0:2)+' MW IT, the selected load factor draws '+energy(r.itKwh)+' of server electricity each year. Facility overhead adds '+energy(r.overheadKwh)+'. '+costStory+' Local water availability needs a separate supply check.';
    $('flow-it').textContent=energy(r.itKwh)+' / year';$('flow-overhead').textContent=energy(r.overheadKwh)+' / year';$('flow-water').textContent=volume(r.waterM3)+' consumed / year';
    document.querySelectorAll('[data-flow-value]').forEach(el=>{el.textContent=el.dataset.flowValue==='water'?volume(r.waterM3):energy(el.dataset.flowValue==='it'?r.itKwh:r.overheadKwh);});
    $('live-status').textContent=nf(i.capacity,Number.isInteger(i.capacity)?0:2)+' MW IT. '+energy(r.facilityKwh)+' electricity per year. '+nf(r.waterM3,0)+' cubic meters of cooling water per year.';
    $('case-comparison').innerHTML='<div class="compare-head"><span>Case</span><span>TWh / year</span><span>Electricity / year</span><span>Water m³ / year</span></div>'+Object.entries(D.scenarios).map(([name,s])=>{
      let c;try{c=window.IDN_MODEL.calculate({...i,utilization:s.utilization,pue:s.pue,wue:s.wue_l_per_kwh});}catch{return '<div class="compare-row"><strong>'+esc(name[0].toUpperCase()+name.slice(1))+'</strong><span>Unavailable</span><span>Numerical limit</span><span>Unavailable</span></div>';}
      return '<div class="compare-row '+name+'"><strong>'+name[0].toUpperCase()+name.slice(1)+'</strong><span>'+nf(c.facilityTwh,c.facilityTwh>0&&c.facilityTwh<.01?5:2)+'</span><span>'+esc(money(c.electricityCost))+'</span><span>'+nf(c.waterM3,0)+'</span></div>';
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
    const activeMapRegion=document.activeElement?.closest('[data-map-region]')?.dataset.mapRegion;
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
    if(activeMapRegion)[...document.querySelectorAll('.map-callout-button')].find(b=>b.getAttribute('aria-label')==='Select '+activeMapRegion+' project region')?.focus();
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
  $('flow-enlarge').addEventListener('click',()=>{const enlarged=$('flow-illustration').classList.toggle('enlarged');$('flow-enlarge').setAttribute('aria-pressed',String(enlarged));$('flow-enlarge').textContent=enlarged?'Fit diagram':'Enlarge diagram';});
  $('project-status').addEventListener('change',renderProjects);
  const outlookCases=[['Conservative','var(--case-low)'],['Base Case','var(--case-base)'],['Aggressive AI Boom','var(--gold)']];
  let outlookFocus=null;
  function renderOutlook() {
    const activeYear=document.activeElement?.closest('[data-outlook-year]')?.dataset.outlookYear;
    const compact=window.matchMedia('(max-width:600px)').matches;
    const width=compact?500:800, left=compact?44:62, right=compact?305:590, top=42, bottom=330;
    const years=[...new Set(D.outlook.map(r=>r.year))].sort((a,b)=>a-b);
    const max=Math.max(...D.outlook.map(r=>r.facility_electricity_twh));
    const ceiling=Math.max(10,Math.ceil(max*1.12/10)*10),tick=ceiling/5;
    const X=y=>left+(y-years[0])/(years.at(-1)-years[0])*(right-left),Y=v=>bottom-v/ceiling*(bottom-top);
    $('outlook-chart').setAttribute('viewBox','0 0 '+width+' 410');
    $('outlook-selected-year').textContent=year+' comparison';
    const selectedX=X(year);
    let svg='';
    for(let value=tick/2;value<ceiling;value+=tick)svg+='<path class="outlook-grid-minor" d="M'+left+' '+Y(value)+'H'+right+'"/>';
    for(let i=0;i<years.length-1;i++)svg+='<path class="outlook-grid-minor" d="M'+((X(years[i])+X(years[i+1]))/2)+' '+top+'V'+bottom+'"/>';
    for(let value=0;value<=ceiling+.001;value+=tick)svg+='<path class="axis" d="M'+left+' '+Y(value)+'H'+right+'"/><text class="outlook-tick" x="'+(left-12)+'" y="'+(Y(value)+5)+'" text-anchor="end">'+nf(value,0)+'</text>';
    years.forEach(y=>{svg+='<path class="axis" d="M'+X(y)+' '+top+'V'+bottom+'"/>';});
    svg+='<path class="outlook-selection-line" d="M'+selectedX+' '+top+'V'+bottom+'"/>';
    outlookCases.forEach(([name,color],idx)=>{
      const rows=D.outlook.filter(r=>r.outlook_case===name).sort((a,b)=>a.year-b.year),dim=outlookFocus&&outlookFocus!==name;
      svg+='<g class="outlook-series '+(dim?'dimmed':'')+'" style="--series-color:'+color+'" pointer-events="none">'+
        '<path d="'+rows.map((r,j)=>(j?'L':'M')+X(r.year)+' '+Y(r.facility_electricity_twh)).join('')+'" fill="none" stroke="'+color+'" stroke-width="'+(idx===1?4:3)+'" stroke-linejoin="round"/>';
      rows.forEach(r=>{
        const x=X(r.year),y=Y(r.facility_electricity_twh);
        if(r.year===year)svg+='<circle cx="'+x+'" cy="'+y+'" r="17" fill="'+color+'" opacity=".16"/>';
        svg+='<circle cx="'+x+'" cy="'+y+'" r="'+(r.year===year?11:9)+'" fill="'+color+'" stroke="var(--plot-paper)" stroke-width="2"/>';
      });
      const last=rows.at(-1);
      svg+='<path class="outlook-end-rule" d="M'+(right+9)+' '+Y(last.facility_electricity_twh)+'h15"/><text class="outlook-end-value" x="'+(right+34)+'" y="'+(Y(last.facility_electricity_twh)+7)+'">'+nf(last.facility_electricity_twh)+'</text></g>';
    });
    years.forEach(y=>{
      const x=X(y);
      svg+='<g class="outlook-year-target" data-outlook-year="'+y+'" role="button" tabindex="0" aria-label="Select '+y+' outlook year" aria-pressed="'+(y===year)+'">'+
        '<rect class="outlook-hit" x="'+(x-25)+'" y="'+top+'" width="50" height="345" rx="4"/>'+
        '<text class="outlook-year-label '+(y===year?'selected':'')+'" x="'+x+'" y="370" text-anchor="middle">'+y+'</text></g>';
    });
    $('outlook-chart').innerHTML=svg;
    $('outlook-chart').setAttribute('aria-label','Annual facility electricity scenarios from '+years[0]+' to '+years.at(-1)+'. Select a year to update the three resource panels.');
    $('outlook-end-year').textContent=years.at(-1);
    document.querySelectorAll('[data-year]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.year)===year));
    document.querySelectorAll('[data-outlook-case]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.outlookCase===outlookFocus));
    $('outlook-values').innerHTML=outlookCases.map(([name,color])=>{
      const r=D.outlook.find(r=>r.outlook_case===name&&r.year===year);
      return '<article class="outlook-case '+(outlookFocus===name?'focused':'')+'" style="--series-color:'+color+'"><h3><i></i>'+esc(name)+'</h3><div class="outlook-demand"><strong>'+nf(r.facility_electricity_twh)+' <small>TWh</small></strong><span>'+nf(r.it_capacity_mw,0)+' MW IT</span></div><dl><div><dt>Electricity / year</dt><dd>'+esc(money(r.electricity_cost_rp))+'</dd></div><div><dt>Cooling consumption / year</dt><dd>'+esc(volume(r.water_m3_per_year))+'</dd></div></dl></article>';
    }).join('');
    $('outlook-live').textContent=year+' outlook. '+outlookCases.map(([name])=>{const r=D.outlook.find(r=>r.outlook_case===name&&r.year===year);return name+': '+nf(r.facility_electricity_twh)+' TWh.';}).join(' ');
    if(activeYear)document.querySelector('[data-outlook-year="'+activeYear+'"]')?.focus();
  }
  function chooseOutlookYear(value) {year=Number(value);renderOutlook();}
  document.querySelectorAll('[data-year]').forEach(b=>b.addEventListener('click',()=>chooseOutlookYear(b.dataset.year)));
  document.querySelectorAll('[data-outlook-case]').forEach(b=>b.addEventListener('click',()=>{outlookFocus=outlookFocus===b.dataset.outlookCase?null:b.dataset.outlookCase;renderOutlook();}));
  $('outlook-chart').addEventListener('click',e=>{const hit=e.target.closest('[data-outlook-year]');if(hit)chooseOutlookYear(hit.dataset.outlookYear);});
  $('outlook-chart').addEventListener('keydown',e=>{
    const hit=e.target.closest('[data-outlook-year]');if(!hit)return;
    if(['Enter',' '].includes(e.key)){e.preventDefault();chooseOutlookYear(hit.dataset.outlookYear);}
    if(['ArrowLeft','ArrowRight'].includes(e.key)){
      e.preventDefault();const years=[2030,2031,2032],index=years.indexOf(Number(hit.dataset.outlookYear));
      chooseOutlookYear(years[Math.max(0,Math.min(years.length-1,index+(e.key==='ArrowRight'?1:-1)))]);
      document.querySelector('[data-outlook-year="'+year+'"]')?.focus();
    }
  });
  let resizePending=false;
  window.addEventListener('resize',()=>{if(resizePending)return;resizePending=true;requestAnimationFrame(()=>{renderMap();renderOutlook();resizePending=false;});});
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
  $('national-share').previousElementSibling.textContent='Share of '+D.national.year+' national consumption';
  $('electricityTariff').value=D.tariffs.electricity_rp_per_kwh;$('waterTariff').value=D.tariffs.water_rp_per_m3;
  $('theme').addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('theme').setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme');});
  function jumpToChapter(id) {
    const target=id?$(id):null;
    if(id&&!target)return;
    if(target){
      target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
      const inset=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||0;
      window.scrollTo({top:Math.max(0,window.scrollY+target.getBoundingClientRect().top-inset),behavior:'auto'});
    }
    else window.scrollTo({top:0,behavior:'auto'});
  }
  document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',e=>{
    if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    const hash=link.getAttribute('href');e.preventDefault();
    if(location.hash!==hash)location.hash=hash;
    jumpToChapter(hash.slice(1));
  }));
  window.addEventListener('hashchange',()=>jumpToChapter(location.hash.slice(1)));
  preset('base');renderMap();renderProjects();renderOutlook();
  const restoreChapter=()=>requestAnimationFrame(()=>{if(location.hash)jumpToChapter(location.hash.slice(1));});
  if(document.readyState==='complete')restoreChapter();else window.addEventListener('load',restoreChapter,{once:true});
})();
