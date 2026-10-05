/* Visual-only staff designs. Personalize director here without changing agent data or behavior. */
(function (root) {
  'use strict';
  const World = root.LonghandWorld = root.LonghandWorld || {};
  const DESIGNS = Object.freeze({
    director: { coat: '#344357', shade: '#222d3e', shirt: '#ece7dc', skin: '#c9a38b', hair: '#aba9a4', hairShade: '#747b82', trousers: '#26303d', accent: '#b49a70', style: 'executive', glasses: true, tool: 'folio' },
    researcher: { coat: '#8e8270', shade: '#5e5b55', shirt: '#e1ddd3', skin: '#bd8c70', hair: '#4d3c32', hairShade: '#302e2d', trousers: '#303b48', accent: '#8796a3', style: 'part', tool: 'paper' },
    'researcher-ii': { coat: '#455669', shade: '#303d50', shirt: '#e2ddd1', skin: '#d6b093', hair: '#343333', hairShade: '#23282d', trousers: '#303a46', accent: '#ab9b80', style: 'bun', tool: 'laptop' },
    analyst: { coat: '#596775', shade: '#3a4755', shirt: '#c7d1d2', skin: '#a9785d', hair: '#282b30', hairShade: '#1e242a', trousers: '#2c3540', accent: '#8ca6b3', style: 'wave', glasses: true, tool: 'tablet' },
    'analyst-ii': { coat: '#64717c', shade: '#424e5c', shirt: '#dddcd3', skin: '#c69a7e', hair: '#644638', hairShade: '#43352f', trousers: '#303a46', accent: '#9baebb', style: 'bob', glasses: true, tool: 'tablet' },
    editor: { coat: '#77746e', shade: '#51565b', shirt: '#e4e1d8', skin: '#d1ad91', hair: '#8b8e8b', hairShade: '#555f68', trousers: '#303b48', accent: '#a59679', style: 'sweep', tool: 'paper' },
    'editor-ii': { coat: '#434e5c', shade: '#2c3643', shirt: '#e2ddd1', skin: '#aa795e', hair: '#39312e', hairShade: '#262729', trousers: '#313b49', accent: '#baa990', style: 'long', tool: 'proof' },
    associate: { coat: '#686d72', shade: '#454e59', shirt: '#dcd4c3', skin: '#d5b393', hair: '#4e4037', hairShade: '#302e2d', trousers: '#374353', accent: '#8d9eae', style: 'ponytail', tool: 'laptop' }
  });
  Object.values(DESIGNS).forEach(Object.freeze);

  function createSprite(document, id) {
    const p = DESIGNS[id] || DESIGNS.researcher;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 38');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.classList.add('world-sprite');
    const rect = (x, y, width, height, fill) => {
      const pixel = document.createElementNS(svg.namespaceURI, 'rect');
      Object.entries({ x, y, width, height, fill }).forEach(([key, value]) => pixel.setAttribute(key, value));
      svg.append(pixel);
    };
    const outline = '#202731';
    // Hair sits behind the shoulders; faces stay neutral and proportionate.
    if (['bob', 'long', 'ponytail'].includes(p.style)) {
      rect(7, 3, 11, p.style === 'bob' ? 12 : 16, p.hairShade);
      rect(6, 6, 2, p.style === 'bob' ? 7 : 12, p.hair);
      rect(17, 5, 2, p.style === 'bob' ? 9 : 13, p.hair);
    }
    if (p.style === 'bun') { rect(16, 1, 4, 5, p.hairShade); rect(17, 2, 3, 3, p.hair); }
    if (p.style === 'ponytail') { rect(18, 5, 3, 11, p.hairShade); rect(19, 6, 2, 8, p.hair); rect(18, 6, 2, 1, p.accent); }
    rect(8, 3, 9, 10, p.skin);
    rect(7, 5, 1, 4, p.skin); rect(17, 6, 1, 3, p.skin);
    rect(15, 9, 2, 3, '#00000015');
    rect(8, 1, 8, 3, p.hairShade); rect(7, 3, 11, 2, p.hair);
    rect(7, 5, 2, 3, p.hairShade);
    if (p.style === 'part' || p.style === 'executive' || p.style === 'sweep') {
      rect(9, 2, 6, 1, p.hair); rect(10, 3, 5, 2, p.hair);
      rect(15, 3, 2, 3, p.hairShade); rect(9, 4, 2, 2, p.hair);
    }
    if (p.style === 'wave') { rect(8, 0, 3, 2, p.hair); rect(13, 1, 3, 1, p.hair); rect(9, 4, 3, 2, p.hair); }
    if (p.style === 'bob' || p.style === 'long') { rect(8, 4, 3, 2, p.hair); rect(16, 4, 2, 7, p.hairShade); }
    rect(10, 7, 1, 1, outline); rect(14, 7, 1, 1, outline);
    rect(12, 9, 1, 1, '#00000020'); rect(11, 11, 3, 1, '#00000025');
    if (p.glasses) {
      rect(9, 6, 3, 1, '#4f5a65'); rect(13, 6, 3, 1, '#4f5a65');
      rect(9, 7, 1, 2, '#4f5a65'); rect(15, 7, 1, 2, '#4f5a65');
      rect(10, 8, 2, 1, '#4f5a65'); rect(13, 8, 2, 1, '#4f5a65'); rect(12, 7, 1, 1, '#4f5a65');
    }
    rect(10, 12, 5, 3, p.skin);
    // Tailored jacket, light shirt and understated lapels, with trousers for every staff member.
    rect(7, 14, 11, 13, p.coat); rect(6, 15, 1, 11, p.shade);
    rect(18, 15, 2, 10, p.shade); rect(4, 16, 2, 8, p.coat);
    rect(10, 14, 5, 7, p.shirt); rect(10, 15, 1, 4, p.shade); rect(15, 15, 1, 5, p.shade);
    rect(8, 15, 2, 2, p.shade); rect(15, 18, 2, 2, p.shade);
    rect(7, 25, 11, 2, p.shade); rect(4, 24, 2, 2, p.skin); rect(18, 25, 2, 2, p.skin);
    rect(8, 27, 4, 9, p.trousers); rect(14, 27, 4, 9, p.trousers);
    rect(8, 27, 1, 8, p.shade); rect(16, 28, 1, 7, '#00000020');
    rect(7, 36, 5, 2, outline); rect(14, 36, 5, 2, outline);
    rect(8, 36, 3, 1, '#525d68'); rect(15, 36, 3, 1, '#525d68');
    if (p.style === 'executive') {
      rect(12, 15, 1, 7, p.accent); rect(11, 16, 1, 2, p.accent);
      rect(12, 23, 1, 1, p.accent); rect(12, 25, 1, 1, p.accent);
      rect(8, 18, 2, 1, p.shirt); rect(4, 23, 2, 1, p.accent);
    } else if (p.style === 'part' || p.style === 'sweep') rect(12, 15, 1, 5, p.accent);
    // Documents, a tablet or a closed research laptop give each silhouette a work context.
    if (p.tool === 'paper' || p.tool === 'proof') {
      rect(16, 19, 6, 9, '#b2b6b6'); rect(16, 19, 5, 8, '#e3ded1');
      rect(17, 21, 3, 1, '#8f999f'); rect(17, 23, 3, 1, '#8f999f');
      rect(17, 25, p.tool === 'proof' ? 2 : 3, 1, p.accent); rect(16, 23, 1, 2, p.skin);
    } else if (p.tool === 'tablet' || p.tool === 'laptop') {
      rect(13, 20, 10, 7, outline); rect(14, 21, 8, 5, p.tool === 'tablet' ? '#526b7b' : '#758591');
      if (p.tool === 'tablet') {
        rect(15, 24, 1, 1, '#c2cdd0'); rect(17, 23, 1, 2, '#c2cdd0'); rect(19, 22, 1, 3, '#c2cdd0');
      } else { rect(17, 23, 2, 1, '#c3c7c4'); rect(13, 27, 10, 1, '#9fa9af'); }
      rect(13, 24, 2, 2, p.skin);
    } else {
      rect(18, 19, 4, 9, '#4d4b46'); rect(19, 20, 2, 1, p.accent); rect(18, 24, 1, 2, p.skin);
    }
    return svg;
  }
  World.Visual = Object.freeze({ DESIGNS, createSprite });
})(globalThis);
