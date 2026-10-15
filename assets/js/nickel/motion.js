/* Native reading flow, with motion contained inside the opening illustration. */
(function () {
  'use strict';
  const body=document.body,reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const cover=document.querySelector('.nickel-cover'),pair=cover.querySelector('.material-pair');
  const toggle=document.querySelector('.motion-control');
  const progress=document.createElement('div');
  progress.className='reading-progress';progress.setAttribute('aria-hidden','true');
  document.querySelector('.masthead').append(progress);
  let paused=false,frame=0,observer,lastTime=0,current=0;
  const clamp=v=>Math.max(0,Math.min(1,v)),off=()=>paused||reduced.matches;
  function tick(time){
    frame=0;
    const height=document.documentElement.scrollHeight-innerHeight;
    progress.style.transform=`scaleX(${height>0?clamp(scrollY/height):0})`;
    if(off()){pair.style.removeProperty('transform');lastTime=0;return;}
    const box=cover.getBoundingClientRect(),target=clamp(-box.top/Math.max(1,box.height));
    const dt=Math.min(40,Math.max(1,time-(lastTime||time-16)));
    current+=(target-current)*(1-Math.exp(-dt/100));lastTime=time;
    pair.style.transform=`translate3d(0,${(current*12).toFixed(2)}px,0)`;
    if(Math.abs(target-current)>.001)queue();else lastTime=0;
  }
  function queue(){if(!frame)frame=requestAnimationFrame(tick);}
  function configure(){
    body.classList.toggle('nickel-motion',!off());
    body.classList.remove('nickel-pin','nickel-material-ready');
    toggle.hidden=reduced.matches;toggle.setAttribute('aria-pressed',String(!off()));
    toggle.querySelector('span').textContent=off()?'Off':'On';
    observer?.disconnect();
    document.querySelectorAll('.nickel-reveal').forEach(el=>el.classList.add('is-visible'));
    if(!off()&&'IntersectionObserver' in window){
      observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
      }),{rootMargin:'0px 0px 60px 0px',threshold:0});
      document.querySelectorAll('.research-section > :is(h2,.chart-panel,.argument-note),.process-route,.nickel-prologue').forEach(el=>{
        el.classList.add('nickel-reveal');
        if(el.getBoundingClientRect().top>innerHeight){el.classList.remove('is-visible');observer.observe(el);}
      });
    }
    queue();
  }
  toggle.addEventListener('click',()=>{paused=!paused;configure();});
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);
  addEventListener('pageshow',queue);
  addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;lastTime=0;});
  reduced.addEventListener('change',configure);configure();
})();
