/* Visual-only staff portraits. Personalize DESIGNS.director here; agent data and behavior stay independent. */
(function (root) {
  'use strict';
  const World = root.LonghandWorld = root.LonghandWorld || {};
  const DESIGNS = Object.freeze({
    director: { coat: '#37434b', shade: '#263139', shirt: '#d9dbd1', skin: '#b58b6d', hair: '#252b2d', hairShade: '#1d2529', trousers: '#33404a', accent: '#8b9a9d', hairStyle: 'center-part', outfit: 'smart-casual', pose: 'director', stance: 'balanced', build: 'average', glasses: true },
    researcher: { coat: '#827a6c', shade: '#5c5b55', shirt: '#ddd9cd', skin: '#c29b7e', hair: '#574637', hairShade: '#3a3530', trousers: '#36414b', accent: '#ac9879', hairStyle: 'part', outfit: 'cardigan', pose: 'reading', stance: 'offset', build: 'slim', glasses: false },
    'researcher-ii': { coat: '#637581', shade: '#415461', shirt: '#d9dfdf', skin: '#946b51', hair: '#292e32', hairShade: '#20272c', trousers: '#3c4145', accent: '#9eaeb3', hairStyle: 'crop', outfit: 'shirt', pose: 'laptop', stance: 'relaxed', build: 'broad', glasses: false },
    'researcher-female': { coat: '#c4bca9', shade: '#8f928c', shirt: '#e7e2d7', skin: '#b58b70', hair: '#443a34', hairShade: '#2d3030', trousers: '#35414a', accent: '#a89a7e', hairStyle: 'bun', outfit: 'longline', pose: 'notes', stance: 'close', build: 'female', glasses: false },
    analyst: { coat: '#4f626e', shade: '#334953', shirt: '#c4d0d2', skin: '#d2ad8f', hair: '#665447', hairShade: '#443e39', trousers: '#2d3b46', accent: '#9bafb8', hairStyle: 'sweep', outfit: 'knit', pose: 'tablet', stance: 'balanced', build: 'slim', glasses: true },
    'analyst-ii': { coat: '#414f60', shade: '#2a3848', shirt: '#dddacb', skin: '#9c7159', hair: '#2f3437', hairShade: '#242d33', trousers: '#343d47', accent: '#a1937a', hairStyle: 'fade', outfit: 'jacket', pose: 'crossed', stance: 'close', build: 'broad', glasses: true },
    'analyst-female': { coat: '#4b545d', shade: '#303f4b', shirt: '#a9b7ba', skin: '#d1aa8b', hair: '#6b4b3b', hairShade: '#473b34', trousers: '#35424e', accent: '#a5b7bd', hairStyle: 'bob', outfit: 'shortjacket', pose: 'analysis', stance: 'offset', build: 'female', glasses: true },
    editor: { coat: '#7d827d', shade: '#505e60', shirt: '#e3ded0', skin: '#b38b70', hair: '#a0a19a', hairShade: '#646e71', trousers: '#3b4851', accent: '#b1a185', hairStyle: 'temples', outfit: 'jacket', pose: 'proofs', stance: 'balanced', build: 'broad', glasses: false },
    'editor-ii': { coat: '#655e57', shade: '#424b50', shirt: '#d9d5c9', skin: '#98705a', hair: '#3d3732', hairShade: '#292d2e', trousers: '#46525c', accent: '#a99b80', hairStyle: 'curl', outfit: 'knit', pose: 'folio', stance: 'offset', build: 'slim', glasses: true },
    'editor-female': { coat: '#586678', shade: '#394a5d', shirt: '#e0ddd2', skin: '#c6a188', hair: '#403735', hairShade: '#2d3033', trousers: '#3a454f', accent: '#baa98a', hairStyle: 'tucked', outfit: 'longline', pose: 'edit', stance: 'relaxed', build: 'female', glasses: false },
    associate: { coat: '#8a8c86', shade: '#5a696c', shirt: '#d7cdbc', skin: '#cbab8c', hair: '#665140', hairShade: '#413c36', trousers: '#344454', accent: '#9bafba', hairStyle: 'ponytail', outfit: 'shortjacket', pose: 'associate', stance: 'offset', build: 'female', glasses: false }
  });
  Object.values(DESIGNS).forEach(Object.freeze);

  function createSprite(document, id) {
    const p = DESIGNS[id] || DESIGNS.researcher;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 48 80');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.classList.add('world-sprite');
    const rect = (x, y, width, height, fill) => {
      const block = document.createElementNS(svg.namespaceURI, 'rect');
      Object.entries({ x, y, width, height, fill }).forEach(([key, value]) => block.setAttribute(key, value));
      svg.append(block);
    };
    const shape = (points, fill) => {
      const block = document.createElementNS(svg.namespaceURI, 'polygon');
      block.setAttribute('points', points.map(point => point.join(',')).join(' '));
      block.setAttribute('fill', fill);
      svg.append(block);
    };
    const tint = (color, amount) => '#' + [1, 3, 5].map(offset => {
      const channel = parseInt(color.slice(offset, offset + 2), 16);
      return Math.max(0, Math.min(255, channel + amount)).toString(16).padStart(2, '0');
    }).join('');
    const edge = '#25313b', leather = '#273038', skinShade = tint(p.skin, -26), skinLight = tint(p.skin, 11);
    const female = p.build === 'female', broad = p.build === 'broad';
    const left = broad ? 13 : female ? 15 : 14;
    const right = broad ? 36 : female ? 34 : 35;
    const headX = p.pose === 'reading' || p.pose === 'notes' ? 22 : 23;
    const longHair = ['bob', 'tucked', 'ponytail', 'bun'].includes(p.hairStyle);

    // Hair behind the neck and jacket; the head is less than one fifth of the full figure.
    if (longHair) {
      shape([[18,6],[20,6],[20,3],[29,3],[29,5],[32,5],[32,18],[30,18],[30,23],[18,23]], p.hairShade);
      rect(18,9,2,p.hairStyle === 'bob' ? 12 : 9,p.hair);
      if (p.hairStyle === 'tucked') { rect(30,9,2,18,p.hairShade); rect(31,11,1,13,p.hair); }
      if (p.hairStyle === 'bob') { rect(30,8,3,14,p.hairShade); rect(31,10,1,10,p.hair); rect(19,19,2,3,p.hair); }
      if (p.hairStyle === 'bun') { rect(31,4,4,5,p.hairShade); rect(32,4,3,3,p.hair); rect(31,8,2,1,p.accent); }
      if (p.hairStyle === 'ponytail') {
        shape([[31,7],[34,7],[34,10],[36,10],[36,21],[34,21],[34,27],[32,27],[32,17],[31,17]],p.hairShade);
        rect(34,11,1,10,p.hair); rect(31,8,3,1,p.accent);
      }
    }

    // Long trouser lines, proper shoes and a discreet centre seam replace chibi proportions.
    rect(left+3,47,right-left-4,5,p.trousers);
    const leftLeg = p.stance === 'relaxed' ? left+1 : left+3;
    const rightLeg = p.stance === 'close' ? 26 : p.stance === 'offset' ? 29 : 28;
    const legWidth = female || p.build === 'average' ? 8 : broad ? 9 : 7;
    const leftFoot = p.stance === 'offset' ? 76 : 77;
    shape([[leftLeg,51],[leftLeg+legWidth,51],[leftLeg+legWidth,60],[leftLeg+legWidth-1,60],[leftLeg+legWidth-1,leftFoot],[leftLeg,leftFoot]],p.trousers);
    shape([[rightLeg,51],[rightLeg+legWidth,51],[rightLeg+legWidth,77],[rightLeg,77],[rightLeg,64],[rightLeg-1,64],[rightLeg-1,58],[rightLeg,58]],tint(p.trousers,-8));
    rect(leftLeg+1,54,1,19,tint(p.trousers,16)); rect(rightLeg+1,55,1,17,tint(p.trousers,7));
    rect(leftLeg+legWidth-2,59,1,13,tint(p.trousers,-18)); rect(rightLeg+legWidth-2,56,1,18,tint(p.trousers,-20));
    rect(leftLeg-1,leftFoot,legWidth+2,3,leather); rect(leftLeg-2,leftFoot+1,2,2,leather);
    rect(rightLeg,77,legWidth+3,3,leather); rect(rightLeg+legWidth+2,78,1,2,leather);
    rect(leftLeg,leftFoot,legWidth-1,1,'#687178'); rect(rightLeg+2,77,legWidth-1,1,'#596670');

    // Tailored shoulders are stepped in single pixels, with a warm-lit left side and cool right side.
    shape([[left+3,23],[right-3,23],[right-3,24],[right,24],[right,27],[right+1,27],[right+1,36],[right-1,36],[right-1,49],[left+1,49],[left+1,36],[left-1,36],[left-1,27],[left,27],[left,24],[left+3,24]],p.shade);
    shape([[left+3,24],[right-4,24],[right-4,25],[right-1,25],[right-1,46],[left+2,46],[left+2,35],[left,35],[left,28],[left+1,28],[left+1,25],[left+3,25]],p.coat);
    rect(left+2,27,1,14,tint(p.coat,17)); rect(right-3,29,2,17,tint(p.coat,-15));
    rect(left+3,46,right-left-5,2,p.shade);
    rect(22,23,7,12,p.shirt); rect(23,25,1,13,tint(p.shirt,-18));
    // Collars and lapels use sharply cut seams, rather than a bold uniform outline.
    shape([[21,23],[24,23],[24,26],[22,26],[22,29],[20,29],[20,26],[19,26],[19,24],[21,24]],tint(p.coat,12));
    shape([[27,23],[30,23],[30,24],[32,24],[32,27],[30,27],[30,31],[28,31],[28,27],[27,27]],p.shade);
    rect(24,22,2,3,p.shirt); rect(27,22,2,3,tint(p.shirt,-18));
    rect(24,36,1,1,p.accent); rect(24,41,1,1,p.accent); rect(left+4,40,5,1,tint(p.coat,-20));
    if (p.outfit === 'longline') {
      rect(left+2,44,right-left-4,9,p.coat); rect(left+2,51,right-left-4,2,p.shade);
      rect(24,39,1,13,p.shade); rect(25,46,1,1,p.accent); rect(right-3,44,1,7,tint(p.coat,-18));
      rect(left+4,47,5,1,p.shade);
    } else if (p.outfit === 'shirt') {
      rect(left+2,29,right-left-4,19,p.coat); rect(24,27,1,21,tint(p.coat,20));
      rect(26,29,1,1,p.shirt); rect(26,35,1,1,p.shirt); rect(26,41,1,1,p.shirt);
      rect(left+4,30,5,5,tint(p.coat,7)); rect(left+4,34,5,1,p.shade);
      rect(left+2,48,right-left-4,2,'#3a4248'); rect(24,48,3,2,'#919a9a');
    } else if (p.outfit === 'knit') {
      rect(left+2,29,right-left-4,18,p.coat); rect(23,26,6,3,p.shade);
      rect(left+3,32,1,13,tint(p.coat,12)); rect(left+2,46,right-left-4,2,p.shade);
      rect(left+3,46,right-left-6,1,tint(p.coat,-8));
    } else if (p.outfit === 'shortjacket') {
      rect(left+2,45,right-left-4,3,p.shade); rect(24,39,4,6,p.shirt);
      rect(left+4,39,4,1,tint(p.coat,-22)); rect(right-8,39,4,1,tint(p.coat,-22));
    } else if (p.outfit === 'cardigan') {
      rect(23,28,2,19,p.shade); rect(25,30,2,16,p.shirt); rect(23,43,1,1,p.accent);
      rect(left+3,44,5,2,p.shade); rect(right-9,44,5,2,p.shade);
    } else if (p.outfit === 'smart-casual') {
      // An open neutral jacket and clean shirt keep the Director approachable, without a tie or luxury details.
      rect(23,27,6,19,p.shirt); rect(24,28,1,17,tint(p.shirt,-17));
      rect(27,30,1,1,p.accent); rect(27,36,1,1,p.accent); rect(27,42,1,1,p.accent);
      rect(left+4,41,5,1,p.shade); rect(right-9,41,5,1,p.shade);
      rect(left+3,31,1,12,tint(p.coat,11)); rect(right-3,31,1,12,tint(p.coat,-10));
    } else if (p.outfit === 'executive') {
      shape([[23,28],[28,28],[28,33],[30,33],[30,45],[25,48],[21,45],[21,33],[23,33]],'#24323e');
      rect(25,25,2,13,p.accent); rect(24,25,3,2,tint(p.accent,9)); rect(25,39,1,1,p.accent); rect(25,43,1,1,p.accent);
      rect(left+4,30,5,1,p.shirt); rect(left+4,31,3,1,tint(p.shirt,-22));
      rect(left+4,40,5,1,p.shade); rect(right-9,41,5,1,p.shade); rect(right-3,31,1,7,tint(p.coat,8));
    }

    // Neutral faces have a subtle nose, brow and jaw, without smiles or enlarged eyes.
    rect(headX-1,17,6,6,skinShade); rect(headX,18,4,4,p.skin);
    shape([[20,6],[28,6],[28,7],[30,7],[30,16],[29,16],[29,18],[27,18],[27,20],[22,20],[22,19],[20,19],[20,16],[19,16],[19,8],[20,8]],p.skin);
    rect(20,8,2,8,skinLight); rect(28,9,2,7,skinShade); rect(27,17,2,1,skinShade); rect(24,19,3,1,skinShade);
    rect(18,11,2,4,p.skin); rect(30,11,1,4,skinShade); rect(18,12,1,2,skinShade);
    rect(22,10,2,1,tint(p.hairShade,9)); rect(27,10,2,1,tint(p.hairShade,9));
    rect(23,12,1,1,'#394046'); rect(28,12,1,1,'#394046');
    rect(26,13,1,3,skinShade); rect(25,16,2,1,tint(p.skin,-15));
    rect(23,17,3,1,tint(p.skin,-24)); rect(22,16,1,1,skinLight);
    shape([[20,3],[27,3],[27,4],[30,4],[30,6],[31,6],[31,9],[29,9],[29,7],[23,7],[23,8],[20,8],[20,11],[18,11],[18,6],[19,6],[19,4],[20,4]],p.hairShade);
    rect(20,4,8,2,p.hair); rect(19,6,3,1,p.hair); rect(29,6,1,3,p.hair);
    if (p.hairStyle === 'center-part') {
      // A one-pixel central part and two dark sweeps remain legible at the existing map scale.
      rect(20,4,5,3,p.hair); rect(26,4,4,3,p.hair); rect(25,4,1,2,skinShade);
      rect(25,6,1,2,p.skin); rect(22,7,3,2,p.hair); rect(26,7,3,2,p.hair);
      rect(21,5,3,1,tint(p.hair,15)); rect(27,5,2,1,tint(p.hair,11));
      rect(19,8,1,3,p.hairShade); rect(29,8,1,3,p.hairShade);
    } else if (['part','executive','temples','sweep'].includes(p.hairStyle)) {
      rect(21,5,7,1,tint(p.hair,17)); rect(22,6,4,1,p.hair); rect(25,7,3,1,p.hairShade);
      if (p.hairStyle === 'sweep') { rect(21,2,5,2,p.hair); rect(23,2,3,1,tint(p.hair,12)); }
      if (p.hairStyle === 'temples') { rect(18,8,2,4,p.hair); rect(29,8,2,3,p.hair); rect(19,9,1,2,tint(p.hair,20)); }
      if (p.hairStyle === 'executive') { rect(28,5,2,1,tint(p.hair,19)); rect(29,8,1,3,tint(p.hair,27)); }
    } else if (p.hairStyle === 'crop' || p.hairStyle === 'fade') {
      rect(20,3,3,1,p.hair); rect(25,3,3,1,p.hair); rect(21,5,1,1,tint(p.hair,11)); rect(25,5,1,1,tint(p.hair,14));
      rect(19,9,1,3,tint(p.hair,25)); rect(29,8,1,3,tint(p.hair,17));
      if (p.hairStyle === 'fade') { rect(19,10,1,2,tint(p.skin,-38)); rect(29,10,1,2,tint(p.skin,-38)); }
    } else if (p.hairStyle === 'curl') {
      rect(20,2,3,2,p.hairShade); rect(24,2,3,2,p.hair); rect(28,3,2,2,p.hair);
      rect(20,5,2,2,tint(p.hair,12)); rect(25,4,2,2,tint(p.hair,10)); rect(28,6,2,1,tint(p.hair,11)); rect(19,8,2,2,p.hair);
    } else if (longHair) {
      rect(20,5,4,2,p.hair); rect(21,7,2,2,p.hair); rect(19,8,2,4,p.hairShade);
      rect(28,5,2,4,p.hair); rect(29,9,2,2,p.hairShade);
      if (p.hairStyle === 'bob') { rect(19,12,2,7,p.hair); rect(30,12,2,7,p.hairShade); }
      if (p.hairStyle === 'tucked') { rect(30,13,1,6,p.hair); rect(30,12,1,1,p.accent); }
    }
    if (p.glasses) {
      rect(21,11,4,1,'#64727b'); rect(26,11,4,1,'#64727b'); rect(21,12,1,2,edge); rect(24,12,1,2,edge);
      rect(26,12,1,2,edge); rect(29,12,1,2,edge); rect(22,14,3,1,'#485762'); rect(27,14,3,1,'#485762'); rect(25,12,1,1,edge);
      rect(22,12,2,1,tint(p.skin,7)); rect(27,12,2,1,tint(p.skin,5));
    }

    // The arm and object composition is unique to each role, rather than one repeated standing pose.
    const sleeve = (x,y,w,h,rolled = false) => {
      rect(x,y,w,h,p.shade); rect(x+1,y,w-2,h-1,p.coat); rect(x+1,y+1,1,h-3,tint(p.coat,13));
      if (rolled) { rect(x,y+h-3,w,3,tint(p.coat,21)); rect(x+1,y+h,w-2,5,p.skin); rect(x+w-2,y+h,1,4,skinShade); }
    };
    const hand = (x,y,w=4,h=5) => { rect(x,y,w,h,skinShade); rect(x,y,w-1,h-1,p.skin); rect(x,y+1,1,h-2,skinLight); };
    const paper = (x,y,w,h,proof=false) => {
      rect(x+1,y+1,w,h,'#6d7a7d'); rect(x,y,w,h,'#e2dece'); rect(x+1,y+1,w-2,1,'#f1ecdd');
      rect(x+2,y+4,w-4,1,'#879494'); rect(x+2,y+7,w-5,1,'#a1aaa4'); rect(x+2,y+10,w-4,1,'#a1aaa4');
      if (proof) { rect(x+3,y+7,4,1,'#9b7960'); rect(x+w-3,y+9,1,3,'#9b7960'); }
    };
    const tablet = (x,y,w,h) => {
      rect(x,y,w,h,edge); rect(x+1,y+1,w-2,h-2,'#738a97'); rect(x+2,y+2,w-4,h-4,'#344f5e');
      rect(x+3,y+4,w-6,1,'#c5d0cc'); rect(x+3,y+h-5,2,2,'#829dab'); rect(x+7,y+h-8,2,5,'#9cb1b8'); rect(x+11,y+h-10,2,7,'#b6c7c8');
      rect(x+w-2,y+2,1,h-4,'#566e7a');
    };
    const laptop = (x,y,w,h) => {
      rect(x,y,w,h,edge); rect(x+1,y+1,w-2,h-2,'#9caaae'); rect(x+2,y+2,w-4,h-4,'#7c8d96');
      rect(x+Math.floor(w/2)-1,y+Math.floor(h/2),3,1,'#c7d0ce'); rect(x-1,y+h,w+2,2,'#b3bfbe'); rect(x,y+h+1,w,1,'#596b76');
    };

    if (p.pose === 'director') {
      sleeve(left-2,28,5,17); hand(left-1,45); rect(left-1,42,4,2,p.accent); rect(left,42,2,1,'#b7c2c0');
      sleeve(right-1,28,5,13); rect(right-2,39,5,5,p.coat); hand(right-3,42,5,4);
      rect(right-2,43,6,15,'#424f58'); rect(right-1,44,4,13,'#6b797d'); rect(right-1,45,3,2,p.shirt); rect(right-2,57,6,1,edge);
      rect(right-1,49,3,1,'#aab4b2'); rect(right-1,52,2,1,'#aab4b2');
      rect(right-3,43,3,2,p.skin); rect(right,47,1,8,'#8d9a9b');
    } else if (p.pose === 'reading') {
      sleeve(left-2,28,5,9); shape([[left-1,35],[left+3,35],[left+3,37],[23,37],[23,41],[left+1,41],[left+1,39],[left-1,39]],p.coat);
      sleeve(right-1,28,5,8); rect(29,34,9,4,p.coat); paper(23,28,13,16); hand(21,38,4,4); hand(34,35,4,4);
      rect(22,37,1,3,p.accent); rect(24,44,1,3,p.shade);
    } else if (p.pose === 'laptop') {
      sleeve(left-2,28,6,9,true); sleeve(right-1,28,6,9,true);
      rect(left+1,40,6,3,p.skin); rect(29,40,7,3,skinShade); laptop(18,38,20,12); hand(16,46,5,4); hand(35,45,4,4);
      rect(left-2,35,6,1,p.shirt); rect(right-1,35,6,1,p.shirt);
    } else if (p.pose === 'notes') {
      sleeve(left-2,28,5,16); hand(left-1,44,4,5); sleeve(right-1,28,5,8);
      shape([[32,34],[37,34],[37,39],[35,39],[35,42],[30,42],[30,38],[32,38]],p.coat);
      paper(25,32,13,17); hand(33,39,4,5); rect(24,35,1,9,'#6a7f87'); hand(22,39,4,3);
      rect(24,35,1,2,p.accent); rect(left+2,45,1,6,tint(p.coat,12));
    } else if (p.pose === 'tablet') {
      sleeve(left-2,28,5,10); sleeve(right-1,28,5,15); rect(left+1,36,12,5,p.coat);
      tablet(22,33,16,17); hand(20,40,5,4); hand(34,45,5,4); rect(left+2,39,9,1,tint(p.coat,15));
    } else if (p.pose === 'crossed') {
      sleeve(left-2,28,6,11); sleeve(right-1,28,6,10);
      shape([[left-1,36],[left+3,36],[left+3,38],[30,38],[30,43],[left+1,43],[left+1,41],[left-1,41]],p.shade);
      shape([[right-3,35],[right+3,35],[right+3,40],[right,40],[right,44],[22,44],[22,40],[right-3,40]],p.coat);
      rect(21,40,11,1,tint(p.coat,14)); hand(19,40,5,4); hand(29,36,5,4);
      paper(left-3,42,10,15,false); rect(left-2,40,8,2,'#86969d'); hand(left+2,42,3,4);
    } else if (p.pose === 'analysis') {
      sleeve(left-2,28,5,12); sleeve(right-1,28,5,8); rect(left+1,39,15,4,p.coat);
      tablet(22,29,17,19); hand(21,41,5,4); hand(35,33,4,5); rect(left+2,39,8,1,tint(p.coat,15));
      rect(33,32,5,1,p.skin); rect(34,31,4,1,skinShade);
    } else if (p.pose === 'proofs') {
      sleeve(left-2,28,5,17); hand(left-1,45); sleeve(right-1,28,5,11); rect(31,37,8,5,p.coat);
      paper(29,38,13,19,true); paper(28,36,13,19,true); hand(34,42,5,5); rect(30,47,6,1,'#a58d6f');
      rect(left-1,42,4,1,'#c2c7bb');
    } else if (p.pose === 'folio') {
      sleeve(left-2,28,5,14); hand(left-1,42); sleeve(right-1,28,5,14); hand(right-1,42,4,5);
      rect(left-4,43,9,16,'#8e897b'); rect(left-3,44,7,14,'#b6b19d'); rect(left-3,46,6,1,'#737c7b');
      rect(left-2,49,4,1,'#e3ddc9'); rect(left+3,44,1,14,'#d2c8af'); hand(left+1,45,4,5);
      rect(right,42,1,8,'#9eafb3'); rect(right,42,1,2,'#d0d6ca');
    } else if (p.pose === 'edit') {
      sleeve(left-2,28,5,12); rect(left+1,38,8,5,p.coat); sleeve(right-1,28,5,8);
      rect(31,34,7,5,p.coat); hand(30,32,4,5); rect(29,29,1,11,'#b4c2c3'); rect(29,29,1,3,p.accent);
      paper(16,36,13,19,true); paper(17,35,13,18,true); hand(17,41,4,5); rect(21,47,6,1,'#ad8a6f');
    } else if (p.pose === 'associate') {
      sleeve(left-2,28,5,14); sleeve(right-1,28,5,12); rect(left+1,40,9,4,p.coat);
      laptop(15,42,24,12); hand(14,46,4,5); hand(35,45,5,4); rect(right-2,39,4,6,p.coat);
      rect(left-1,38,4,1,p.shirt); rect(right,38,4,1,p.shirt);
    }
    return svg;
  }
  World.Visual = Object.freeze({ DESIGNS, createSprite });
})(globalThis);
