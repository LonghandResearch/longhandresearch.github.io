/* AI-generated material cutouts, composed with GPU transforms and shallow parallax. */
(function () {
  'use strict';
  const layer=document.createElement('div');layer.className='nickel-floating-specimen';
  layer.setAttribute('aria-hidden','true');layer.hidden=true;document.body.append(layer);
  const materials=['metal','ore'];let lastPoses=[],enabled=false;
  const rigs=Array.from({length:2},()=>{
    const rig=document.createElement('div');rig.className='floating-material-pose';rig.hidden=true;
    materials.forEach(material=>{
      const image=document.createElement('img');image.className='floating-'+material;
      image.alt='';image.width=1536;image.height=1024;image.decoding='async';image.draggable=false;
      image.src=new URL(`assets/img/research/nickel-${material}-illustration.png`,document.baseURI).href;
      rig.append(image);
    });layer.append(rig);return rig;
  });
  const images=rigs.flatMap(rig=>[...rig.querySelectorAll('img')]);
  const ready=()=>images.every(image=>image.complete&&image.naturalWidth>0);
  function render(poses) {
    enabled=true;lastPoses=poses;
    if(!ready()){layer.hidden=true;document.body.classList.remove('nickel-material-ready');return;}
    let visible=0;
    rigs.forEach((rig,index)=>{
      const pose=poses[index];
      if(!pose||pose.alpha<=0||pose.scale<=0||pose.y < -600||pose.y>innerHeight+600){rig.hidden=true;return;}
      const factor=pose.scale/76,w=680*factor,h=w/1.3;
      const phase=Math.min(1,Math.max(0,(pose.yaw+.6)/2.8)),travel=Math.sin(phase*Math.PI);
      rig.style.transform=`translate3d(${pose.x-w*.51}px,${pose.y-h*.51}px,0) scale(${factor})`;
      rig.style.opacity=String(pose.alpha);
      rig.style.setProperty('--metal-x',travel*12+'px');rig.style.setProperty('--metal-y',-pose.split*18+'px');
      rig.style.setProperty('--ore-x',-travel*16+'px');rig.style.setProperty('--ore-y',pose.split*12+'px');
      rig.style.setProperty('--metal-tilt',pose.roll*.26+travel*.022+'rad');
      rig.style.setProperty('--ore-tilt',-pose.roll*.34-travel*.028+'rad');
      rig.hidden=false;visible++;
    });
    layer.hidden=!visible;document.body.classList.add('nickel-material-ready');
  }
  images.forEach(image=>{
    image.onload=()=>{if(enabled&&ready()){render(lastPoses);document.dispatchEvent(new CustomEvent('nickel:assets-ready'));}};
    image.onerror=()=>{layer.hidden=true;document.body.classList.remove('nickel-material-ready');};
  });
  window.NickelSpecimen={render,clear(){enabled=false;layer.hidden=true;document.body.classList.remove('nickel-material-ready');}};
})();
