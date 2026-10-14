/* Native scrolling: one continuous material movement, no automatic panel swaps. */
(function () {
  'use strict';
  const body=document.body,reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const cover=document.querySelector('.nickel-cover'),prologue=document.querySelector('.nickel-prologue');
  const frame=prologue.querySelector('.prologue-frame'),toggle=document.querySelector('.motion-control');
  const words=[...prologue.querySelectorAll('.prologue-word')],renderer=window.NickelSpecimen;
  let paused=false,queued=0,lastTime=0,playhead=scrollY,observer;
  const off=()=>paused||reduced.matches,clamp=v=>Math.max(0,Math.min(1,v));
  const lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*t*(t*(t*6-15)+10);
  const offset=()=>document.querySelector('.masthead').getBoundingClientRect().height+16;
  const progress=document.createElement('div');progress.className='reading-progress';progress.setAttribute('aria-hidden','true');document.querySelector('.masthead').append(progress);
  const pose=r=>({x:r.left+r.width*.51,y:r.top+r.height*.51,scale:r.width/680*76});
  function paint() {
    const delta=scrollY-playhead,top=offset(),pin=body.classList.contains('nickel-pin');
    const p=prologue.getBoundingClientRect(),c=cover.getBoundingClientRect();
    const pp=clamp((top-p.top-delta)/Math.max(1,p.height-frame.offsetHeight));
    words.forEach((word,i)=>{word.style.opacity=String(.72+.28*ease(clamp((pp-i/(words.length+8))/.38)));});
    if(!renderer)return;
    const poses=[],hero=pose(cover.querySelector('.nickel-art').getBoundingClientRect());
    if(pin&&p.bottom+delta>top-120) {
      const destination=pose(prologue.querySelector('.nickel-art').getBoundingClientRect());
      const travel=ease(clamp(playhead/Math.max(1,p.top+scrollY-top)));
      hero.y+=scrollY;
      destination.y-=Math.max(0,p.top-top);destination.y-=Math.min(0,p.bottom-frame.offsetHeight-top);
      const release=Math.min(0,p.bottom+delta-frame.offsetHeight-top);
      poses.push({x:lerp(hero.x,destination.x,travel),y:lerp(hero.y,destination.y,travel)+release,scale:lerp(hero.scale,destination.scale,travel),yaw:-.6+travel*.8+pp*.4,pitch:.48,roll:pp*.08,split:pp*.65,alpha:clamp((p.bottom+delta-top)/120)});
    } else if(!pin&&c.bottom>0&&c.top<innerHeight)poses.push({...hero,y:hero.y+delta,yaw:-.6,pitch:.48,roll:0,split:0,alpha:1});
    renderer.render(poses);
  }
  function tick(time) {
    queued=0;
    const dt=Math.min(50,Math.max(1,time-(lastTime||time-16)));lastTime=time;
    playhead=lerp(playhead,scrollY,1-Math.exp(-dt/135));
    const height=document.documentElement.scrollHeight-innerHeight;
    progress.style.transform=`scaleX(${height>0?clamp(scrollY/height):0})`;
    if(off()){playhead=scrollY;lastTime=0;return;}
    paint();
    if(Math.abs(playhead-scrollY)>.08)queue();else lastTime=0;
  }
  function queue(){if(!queued)queued=requestAnimationFrame(tick);}
  function size(){
    const contentHeight=Math.max(frame.querySelector('div').offsetHeight,frame.querySelector('.prologue-visual').offsetHeight)+frame.querySelector('.prologue-axis').offsetHeight+96;
    body.classList.toggle('nickel-pin',!off()&&innerWidth>900&&innerHeight>700&&contentHeight<innerHeight-offset());queue();
  }
  function configure(){
    body.classList.toggle('nickel-motion',!off());toggle.hidden=reduced.matches;toggle.setAttribute('aria-pressed',String(!off()));toggle.querySelector('span').textContent=off()?'Off':'On';
    observer?.disconnect();
    if(off()){words.forEach(w=>w.style.removeProperty('opacity'));renderer?.clear();}
    document.querySelectorAll('.nickel-reveal').forEach(el=>el.classList.add('is-visible'));
    if(!off()&&'IntersectionObserver' in window){
      observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}}),{rootMargin:'0px 0px 80px 0px',threshold:0});
      document.querySelectorAll('.research-section > :is(h2,.chart-panel,.argument-note)').forEach(el=>{el.classList.add('nickel-reveal');if(el.getBoundingClientRect().top>innerHeight){el.classList.remove('is-visible');observer.observe(el);}});
    }
    playhead=scrollY;size();
  }
  toggle.addEventListener('click',()=>{paused=!paused;configure();});
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',()=>{playhead=scrollY;size();});
  addEventListener('pageshow',size);addEventListener('pagehide',()=>{if(queued)cancelAnimationFrame(queued);queued=0;});
  document.addEventListener('nickel:assets-ready',queue);reduced.addEventListener('change',configure);
  document.fonts?.ready.then(size);configure();
})();
