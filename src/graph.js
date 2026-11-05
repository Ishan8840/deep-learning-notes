const NS = 'http://www.w3.org/2000/svg';
const shortNames = {
  'Convolutional neural networks':'CNN', 'Recurrent networks and LSTMs':'RNN / LSTM',
  'Variational autoencoders':'VAE', 'Denoising diffusion':'DDPM',
  'Generalized advantage estimation':'GAE', 'Proximal policy optimization':'PPO',
  'Markov decision processes':'MDP', 'Action chunking with transformers':'ACT',
  'Diffusion transformers':'DiT', 'Vision transformers':'ViT',
  'Mixture of Transformers':'MoT', 'Mixture of Experts':'MoE',
  'VITA Flow Matching':'VITA', 'A2A Flow Matching':'A2A', 'ALOHA Unleashed':'ALOHA',
};
const element = (name, attrs = {}) => {
  const el = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
};

export function knowledgeGraph(el, notes) {
  el.innerHTML = `<div class="graph-toolbar"><span>Knowledge graph <small>${notes.length} notes</small></span><div><button data-zoom="in" aria-label="Zoom in">+</button><button data-zoom="out" aria-label="Zoom out">−</button><button data-zoom="reset" aria-label="Reset graph view">↺</button></div></div><div class="graph-surface"></div><div class="graph-status" aria-live="polite">Drag to explore · Scroll to zoom · Select a note</div>`;
  const surface = el.querySelector('.graph-surface'), status = el.querySelector('.graph-status');
  const measure=document.createElement('canvas').getContext('2d'); measure.font='10.5px system-ui, sans-serif';
  const svg = element('svg', { role:'group', 'aria-label':'Knowledge graph. Drag nodes or background, zoom, or select a note.' });
  const viewport = element('g'); svg.append(viewport); surface.append(svg);
  const edges = [], unique = new Set();
  notes.forEach((n,i) => n.links.forEach(slug => {
    const j = notes.findIndex(n => n.slug === slug), id = [i,j].sort((a,b)=>a-b).join('-');
    if (j >= 0 && i !== j && !unique.has(id)) { unique.add(id); edges.push([i,j]); }
  }));
  const adjacent = notes.map((_,i) => new Set(edges.filter(e=>e.includes(i)).flat()));
  const nodes = notes.map((n,i) => {
    const angle = i * 2.39996, r = 65 + Math.sqrt(i)*28;
    return { n, x:Math.cos(angle)*r, y:Math.sin(angle)*r, vx:0, vy:0, radius:3.5+Math.min(3,adjacent[i].size*.3) };
  });
  const lines = edges.map(() => { const line = element('line', { class:'graph-edge' }); viewport.append(line); return line; });
  let width=600,height=470,scale=1,panX=0,panY=0,raf=0,disposed=false,alpha=1,group=null,focused=-1;
  let gesture=null,clickMoved=false;
  const pointers = new Map(); let pinch=null;
  const nodeElements = nodes.map((p,i) => {
    const g = element('g', { class:'graph-node', tabindex:'0', role:'link', 'aria-label':p.n.title });
    g.append(element('circle', { r:p.radius }));
    const title = element('title'); title.textContent = p.n.title; g.append(title);
    const text = element('text', { x:p.radius+6, y:4 }); text.textContent=shortNames[p.n.title]||p.n.title; g.append(text);
    const highlight = () => { focused=i; updateFocus(); status.textContent=`${p.n.title} · ${adjacent[i].size} connections`; };
    const unhighlight = () => { if (gesture?.node===i) return; focused=-1; updateFocus(); resetStatus(); };
    g.addEventListener('pointerenter',highlight); g.addEventListener('pointerleave',unhighlight);
    g.addEventListener('focus',highlight); g.addEventListener('blur',unhighlight);
    g.addEventListener('keydown',e => { if(e.key==='Enter') location.hash='#/'+p.n.slug; });
    g.addEventListener('click',e => { e.stopPropagation(); if (!clickMoved) location.hash='#/'+p.n.slug; });
    g.addEventListener('pointerdown',e => {
      if(e.button!==0)return;
      e.stopPropagation(); clickMoved=false; pointers.set(e.pointerId,point(e));
      gesture={node:i,startX:e.clientX,startY:e.clientY};
      svg.setPointerCapture(e.pointerId); highlight(); wake(.25);
    });
    viewport.append(g); return g;
  });
  function resetStatus() { status.textContent=group===null?'Drag to explore · Scroll to zoom · Select a note':`${notes.filter(n=>n.group===group).length} notes in this chapter · Connections remain visible`; }
  function updateFocus() {
    nodeElements.forEach((g,i) => {
      const bright=focused>=0?(i===focused||adjacent[focused].has(i)):(group===null||nodes[i].n.group===group);
      g.classList.toggle('is-muted',!bright);g.classList.toggle('is-focused',i===focused);
      g.classList.toggle('is-neighbor',focused>=0&&adjacent[focused].has(i));
    });
    placeLabels();
    lines.forEach((line,k) => {
      const connected=focused>=0?edges[k].includes(focused):group!==null&&edges[k].some(i=>nodes[i].n.group===group);
      line.classList.toggle('is-active',connected);line.classList.toggle('is-muted',focused>=0&&!connected);
    });
  }
  function placeLabels() {
    const occupied=[];
    const order=nodes.map((_,i)=>i).sort((a,b)=>{
      const score=i=>(i===focused?1000:focused>=0&&adjacent[focused].has(i)?100:0)+adjacent[i].size;
      return score(b)-score(a);
    });
    for(const i of order){
      const p=nodes[i],label=nodeElements[i].querySelector('text'),size=10.5/scale;
      label.style.fontSize=`${size}px`;
      const x=width/2+panX+(p.x+p.radius+6)*scale,y=height/2+panY+p.y*scale;
      const bounds={x:x-4,y:y-10,w:measure.measureText(label.textContent).width+14,h:19};
      const collision=occupied.some(r=>bounds.x<r.x+r.w&&bounds.x+bounds.w>r.x&&bounds.y<r.y+r.h&&bounds.y+bounds.h>r.y);
      const visible=i===focused||(!collision&&x+bounds.w<width-5&&y>15&&y<height-10);
      label.style.visibility=visible?'visible':'hidden';
      if(visible)occupied.push(bounds);
    }
  }
  function draw() {
    viewport.setAttribute('transform',`translate(${width/2+panX},${height/2+panY}) scale(${scale})`);
    svg.classList.toggle('is-zoomed',scale>1.15);
    placeLabels();
    nodes.forEach((p,i)=>nodeElements[i].setAttribute('transform',`translate(${p.x},${p.y})`));
    edges.forEach(([a,b],i)=>{for(const [key,value]of Object.entries({x1:nodes[a].x,y1:nodes[a].y,x2:nodes[b].x,y2:nodes[b].y}))lines[i].setAttribute(key,value);});
  }
  function physics() {
    nodes.forEach((p,i) => {
      for(let j=i+1;j<nodes.length;j++) {
        const q=nodes[j],dx=p.x-q.x,dy=p.y-q.y,d=Math.max(1,Math.hypot(dx,dy));
        const force=1100/(d*d)*alpha;
        p.vx+=dx/d*force;p.vy+=dy/d*force;q.vx-=dx/d*force;q.vy-=dy/d*force;
        // Keep node labels from sitting on top of neighboring nodes/labels.
        if(Math.abs(dy)<24 && Math.abs(dx)<105){const push=(105-Math.abs(dx))*.006*alpha,sign=dx>=0?1:-1;p.vx+=push*sign;q.vx-=push*sign;}
      }
      p.vx-=p.x*.0015*alpha;p.vy-=p.y*.0015*alpha;
    });
    edges.forEach(([a,b])=>{const p=nodes[a],q=nodes[b],dx=q.x-p.x,dy=q.y-p.y,d=Math.max(1,Math.hypot(dx,dy)),force=(d-95)*.004*alpha;p.vx+=dx/d*force;p.vy+=dy/d*force;q.vx-=dx/d*force;q.vy-=dy/d*force;});
    nodes.forEach((p,i)=>{if(gesture?.node===i){p.vx=p.vy=0;return;}p.vx*=.78;p.vy*=.78;p.x+=p.vx;p.y+=p.vy;});
  }
  function tick() { if(disposed)return;physics();draw();alpha*=.975;if(alpha>.008||gesture)raf=requestAnimationFrame(tick);else raf=0; }
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  function wake(strength=.4){if(disposed||motion.matches)return;alpha=Math.max(alpha,strength);if(!raf)raf=requestAnimationFrame(tick);}
  function fit() {
    const xs=nodes.map(p=>p.x),ys=nodes.map(p=>p.y);
    const minX=Math.min(...xs)-20,maxX=Math.max(...xs)+95,minY=Math.min(...ys)-24,maxY=Math.max(...ys)+24;
    scale=Math.min(1.25,(width-36)/(maxX-minX),(height-50)/(maxY-minY));
    panX=-(minX+maxX)/2*scale;panY=-(minY+maxY)/2*scale;draw();
  }
  // Settle before first paint; only a brief settling motion remains on initial display.
  for(let i=0;i<280;i++)physics();
  function point(e){const r=svg.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
  function zoom(next,x=width/2,y=height/2){next=Math.max(.35,Math.min(3,next));const f=next/scale;panX=x-width/2-(x-width/2-panX)*f;panY=y-height/2-(y-height/2-panY)*f;scale=next;draw();}
  svg.addEventListener('wheel',e=>{e.preventDefault();const p=point(e);zoom(scale*Math.exp(-e.deltaY*.0015),p.x,p.y);},{passive:false});
  svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointers.set(e.pointerId,point(e));svg.setPointerCapture(e.pointerId);gesture={node:-1,startX:e.clientX,startY:e.clientY,panX,panY};clickMoved=false;});
  svg.addEventListener('pointermove',e=>{
    if(!gesture)return;
    if(Math.hypot(e.clientX-gesture.startX,e.clientY-gesture.startY)>4)clickMoved=true;
    if(pointers.has(e.pointerId))pointers.set(e.pointerId,point(e));
    if(pointers.size===2){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)zoom(scale*d/pinch,(a.x+b.x)/2,(a.y+b.y)/2);pinch=d;return;}
    if(gesture.node>=0){const p=point(e),n=nodes[gesture.node];n.x=(p.x-width/2-panX)/scale;n.y=(p.y-height/2-panY)/scale;}
    else{panX=gesture.panX+e.clientX-gesture.startX;panY=gesture.panY+e.clientY-gesture.startY;}
    draw();
  });
  function release(e){
    const node=gesture?.node;
    pointers.delete(e.pointerId);pinch=null;gesture=null;
    // Pointer capture retargets clicks to the SVG; activate taps explicitly.
    if(node>=0&&!clickMoved&&e.type==='pointerup')location.hash='#/'+nodes[node].n.slug;
    focused=-1;updateFocus();resetStatus();wake(.3);
  }
  svg.addEventListener('pointerup',release);svg.addEventListener('pointercancel',release);
  el.querySelectorAll('[data-zoom]').forEach(button=>button.onclick=()=>{
    if(button.dataset.zoom==='reset')fit();else zoom(scale*(button.dataset.zoom==='in'?1.25:.8));
  });
  const resize=new ResizeObserver(()=>{const r=surface.getBoundingClientRect();width=r.width;height=r.height;svg.setAttribute('viewBox',`0 0 ${width} ${height}`);fit();});resize.observe(surface);
  const visibility=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting){cancelAnimationFrame(raf);raf=0;}else wake(.1);});visibility.observe(surface);
  const preference=()=>{if(motion.matches){cancelAnimationFrame(raf);raf=0;}};motion.addEventListener('change',preference);
  return {
    focusGroup(value){group=value;updateFocus();resetStatus();},
    destroy(){disposed=true;cancelAnimationFrame(raf);resize.disconnect();visibility.disconnect();motion.removeEventListener('change',preference);},
  };
}
