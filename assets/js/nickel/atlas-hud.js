/* Shared native-SVG camera and relationship animation, adapted from the Coal atlas. */
(function () {
  'use strict';
  const consoles=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=false,raf=0,last=0,time=0;
  const enabled=()=>!paused&&!reduced.matches&&document.body.classList.contains('nickel-motion')&&!document.hidden;
  const lerp=(a,b,t)=>a+(b-a)*t;
  function paint(now){
    raf=0;const dt=last?Math.min(50,now-last):0;last=now;
    if(enabled())time+=dt/1000;
    let running=false;
    for(const state of consoles.values()){
      if(!state.visible)continue;
      if(state.move){
        const p=Math.min(1,(now-state.move.start)/900),e=p*p*p*(p*(p*6-15)+10);
        state.view=state.move.from.map((v,i)=>lerp(v,state.move.to[i],e));state.svg.setAttribute('viewBox',state.view.join(' '));
        if(p===1)state.move=null;else running=true;
      }
      if(enabled()){
        const packets=state.svg.querySelectorAll('.route-packet');
        if(packets.length)running=true;
        packets.forEach((packet,i)=>{
          const path=state.svg.querySelector('#'+packet.dataset.route);if(!path)return;
          const p=(time/9+i/3)%1,pos=path.getPointAtLength(path.getTotalLength()*p);
          packet.setAttribute('transform',`translate(${pos.x} ${pos.y})`);
          packet.style.opacity=String(Math.min(1,p*9,(1-p)*9));
        });
      }
    }
    if(running)raf=requestAnimationFrame(paint);else last=0;
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(paint);}
  const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{const state=consoles.get(e.target.id);if(state){state.visible=e.isIntersecting;e.target.closest('.nickel-holo').classList.toggle('is-visible',e.isIntersecting);}});schedule();},{rootMargin:'80px',threshold:0});
  function move(state,to){
    if(paused||reduced.matches||!document.body.classList.contains('nickel-motion')){state.view=to;state.svg.setAttribute('viewBox',to.join(' '));state.move=null;}
    else state.move={from:[...state.view],to,start:performance.now()};
    schedule();
  }
  function constrain(state,view){
    const [x,y,w,h]=state.base,[vx,vy,vw,vh]=view;
    return [Math.max(x,Math.min(x+w-vw,vx)),Math.max(y,Math.min(y+h-vh,vy)),vw,vh];
  }
  function zoom(state,factor,focus){
    const [x,y,w,h]=state.view,b=state.base,nw=Math.max(b[2]/4,Math.min(b[2],w/factor)),nh=nw*b[3]/b[2];
    const center=focus||[x+w/2,y+h/2];move(state,constrain(state,[center[0]-nw/2,center[1]-nh/2,nw,nh]));
  }
  function mount(id,base,focus){
    const host=document.getElementById(id),svg=host.querySelector('svg');
    const previous=consoles.get(id),state={host,svg,base,focus,view:previous?.view||base.slice(),visible:previous?.visible??false,move:null};
    consoles.set(id,state);svg.setAttribute('viewBox',state.view.join(' '));
    if(previous&&focus&&(focus[0]<state.view[0]||focus[0]>state.view[0]+state.view[2]||focus[1]<state.view[1]||focus[1]>state.view[1]+state.view[3]))move(state,constrain(state,[focus[0]-state.view[2]/2,focus[1]-state.view[3]/2,state.view[2],state.view[3]]));
    host.classList.add('holo-map');host.tabIndex=0;host.setAttribute('aria-label','Interactive map. Use the zoom and focus buttons, or arrow keys to pan. Drag with a mouse.');
    observer.observe(host);
    const console=host.closest('.nickel-holo');
    console.querySelectorAll('[data-camera]').forEach(button=>{button.onclick=()=>{
      const action=button.dataset.camera;
      if(action==='reset')move(state,base.slice());
      else if(action==='focus')zoom(state,state.view[2]/(base[2]/2.6),state.focus);
      else zoom(state,action==='in'?1.4:1/1.4);
    };});
    host.onkeydown=event=>{
      if(event.target!==host)return;
      const steps={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
      if(steps[event.key]){event.preventDefault();const [a,b]=steps[event.key];move(state,constrain(state,[state.view[0]+a*state.view[2]*.15,state.view[1]+b*state.view[3]*.15,state.view[2],state.view[3]]));}
      else if(event.key==='+'||event.key==='='){event.preventDefault();zoom(state,1.4);}
      else if(event.key==='-'){event.preventDefault();zoom(state,1/1.4);}
      else if(event.key==='Escape'){event.preventDefault();move(state,base.slice());}
    };
    let drag;
    svg.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('[role="button"]'))return;
      state.move=null;drag={x:e.clientX,y:e.clientY,view:[...state.view]};svg.setPointerCapture(e.pointerId);host.classList.add('is-dragging');
    });
    svg.addEventListener('pointermove',e=>{
      if(!drag)return;const rect=svg.getBoundingClientRect();
      state.view=constrain(state,[drag.view[0]-(e.clientX-drag.x)*drag.view[2]/rect.width,drag.view[1]-(e.clientY-drag.y)*drag.view[3]/rect.height,drag.view[2],drag.view[3]]);
      svg.setAttribute('viewBox',state.view.join(' '));
    });
    const stop=()=>{drag=null;host.classList.remove('is-dragging');};svg.addEventListener('pointerup',stop);svg.addEventListener('pointercancel',stop);svg.addEventListener('lostpointercapture',stop);
    schedule();
  }
  function setMotion(){
    document.body.dataset.atlasMotion=enabled()?'on':'off';
    document.querySelectorAll('[data-map-motion]').forEach(b=>{b.setAttribute('aria-pressed',String(!paused&&!reduced.matches));b.textContent=paused||reduced.matches?'Map motion: off':'Map motion: on';});
    if(!enabled())document.querySelectorAll('.route-packet').forEach(p=>p.style.opacity='0');schedule();
  }
  document.querySelectorAll('[data-map-motion]').forEach(b=>b.addEventListener('click',()=>{paused=!paused;setMotion();}));
  new MutationObserver(setMotion).observe(document.body,{attributes:true,attributeFilter:['class']});
  reduced.addEventListener('change',setMotion);document.addEventListener('visibilitychange',setMotion);
  addEventListener('pagehide',()=>{if(raf)cancelAnimationFrame(raf);raf=0;last=0;});
  window.NickelAtlasHUD={mount};setMotion();
})();
