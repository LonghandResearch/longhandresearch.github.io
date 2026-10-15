/* Native reading flow; reduced motion follows the reader's system preference. */
(function () {
  'use strict';
  const body=document.body,reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const progress=document.createElement('div');
  progress.className='reading-progress';progress.setAttribute('aria-hidden','true');
  document.querySelector('.masthead').append(progress);
  let frame=0,observer;
  const clamp=v=>Math.max(0,Math.min(1,v));
  function tick(){
    frame=0;
    const height=document.documentElement.scrollHeight-innerHeight;
    progress.style.transform=`scaleX(${height>0?clamp(scrollY/height):0})`;
  }
  function queue(){if(!frame)frame=requestAnimationFrame(tick);}
  function configure(){
    body.classList.toggle('nickel-motion',!reduced.matches);
    observer?.disconnect();
    document.querySelectorAll('.nickel-reveal').forEach(el=>el.classList.add('is-visible'));
    if(!reduced.matches&&'IntersectionObserver' in window){
      observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
      }),{rootMargin:'0px 0px 60px 0px',threshold:0});
      document.querySelectorAll('.research-section > :is(h2,.chart-panel,.argument-note),.process-route').forEach(el=>{
        el.classList.add('nickel-reveal');
        if(el.getBoundingClientRect().top>innerHeight){el.classList.remove('is-visible');observer.observe(el);}
      });
    }
    queue();
  }
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);
  addEventListener('pageshow',queue);
  addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;});
  reduced.addEventListener('change',configure);configure();
})();
