// Small, deterministic teaching examples. These are diagrams, not model outputs.
const ink = '#242424', blue = '#3569b0', amber = '#ad7034', muted = '#767676';
const clamp = x => Math.max(0, Math.min(1, x));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
function label(c, s, x, y, size = 12, color = muted, align = 'center') {
  c.fillStyle = color; c.font = `${size}px system-ui, sans-serif`; c.textAlign = align; c.fillText(s, x, y);
}
function path(c, points, color = '#dedede', width = 1, dashed = false) {
  c.strokeStyle = color; c.lineWidth = width; c.setLineDash(dashed ? [4, 5] : []);
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.setLineDash([]);
}
function dot(c, x, y, r = 4, color = blue) { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
function box(c, x, y, w, h, fill = '#efefef', stroke) {
  c.fillStyle = fill; c.fillRect(x, y, w, h); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.strokeRect(x, y, w, h); }
}
function arrow(c, a, b, color = blue) {
  path(c, [a, b], color, 1.5); const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
  path(c, [[b[0]-7*Math.cos(angle-.4),b[1]-7*Math.sin(angle-.4)],b,[b[0]-7*Math.cos(angle+.4),b[1]-7*Math.sin(angle+.4)]], color, 1.5);
}
function title(c, s, w) { label(c, s, w / 2, 32, 11); }
const layout = (w, h) => ({ left: 48, right: w - 35, top: 70, bottom: h - 90, mobile: w < 600 });
export const attentionWeights = (query = 2, causal = false) => {
  const q = [[.8,.1],[1,.2],[.7,.9],[.1,.7],[.2,.1],[.2,1]], k = [[.2,.1],[1,.3],[.5,.8],[.2,.7],[.1,.1],[.4,1]];
  const raw = k.map((v,i) => causal && i > query ? 0 : Math.exp((v[0]*q[query][0]+v[1]*q[query][1])/Math.sqrt(2)/.5));
  const sum = raw.reduce((a,b)=>a+b,0); return raw.map(x=>x/sum);
};
export const ppoObjective = (ratio, advantage, epsilon = .2) => Math.min(ratio*advantage, Math.max(1-epsilon,Math.min(1+epsilon,ratio))*advantage);
export const gaeContributions = lambda => [1,-.4,.8,1.3,-.2].map((d,i)=>d*(.95*lambda)**i);

function attention(c,t,w,h,o) {
  const words = ['The','cat','sat','on','the','mat'], q = +o.query, weights = attentionWeights(q,o.causal);
  const x = i => 38 + i * (w-76)/5, sourceY = 88, targetY = h-140;
  const phase=t<.5?smooth((t-.1)/.4):1-smooth((t-.5)/.4);
  title(c,o.causal?'CAUSAL ATTENTION':'SCALED DOT-PRODUCT ATTENTION',w);
  box(c,x(q)-25,sourceY-22,50,34,'#e8edf5'); label(c,words[q],x(q),sourceY,14,blue);
  label(c,t<.5?'query':'context',x(q),sourceY+28,10);
  weights.forEach((weight,i)=>{
    const active = weight > 0;
    path(c,[[x(q),sourceY+40],[x(i),targetY-30]],active?'#cad5e4':'#e9e9e9',active?1+weight*6:1,!active);
    if(active && t>.1 && t<.9) dot(c,mix(x(q),x(i),phase),mix(sourceY+40,targetY-30,phase),3+weight*6,blue);
    label(c,words[i],x(i),targetY,12,active?ink:'#aaa');
    box(c,x(i)-16,targetY+17,32,55,'#eee');
    box(c,x(i)-16,targetY+72-weight*55*smooth(t/.4),32,weight*55*smooth(t/.4),active?blue:'#ddd');
    label(c,`${Math.round(weight*100)}%`,x(i),targetY+91,10,active?ink:muted);
  });
  return t<.3?'Compare a query with every allowed key.':t<.7?'Softmax turns the scores into weights that sum to one.':o.causal?'Future positions have zero weight. Mix the allowed value vectors.':'Use these weights to mix the value vectors into one context vector.';
}
function gradient(c,t,w,h,o) {
  const {left,right,bottom} = layout(w,h), rate=+o.rate, n=Math.min(10,Math.floor(t*10)), f=t===1?0:smooth(t*10-n);
  const values=Array.from({length:12},(_,i)=>2.7*(1-2*rate)**i), x=v=>(left+right)/2+v*(right-left)/7, y=v=>bottom-v*v*(bottom-75)/10;
  title(c,'GRADIENT DESCENT · L(w) = w²',w);
  path(c,[[left,bottom],[right,bottom]]);
  path(c,Array.from({length:100},(_,i)=>{const v=-3+i*6/99;return [x(v),y(v)];}), '#999',1.5);
  values.slice(0,n+1).filter(v=>Math.abs(v)<3.1).forEach(v=>dot(c,x(v),y(v),2,'#b9c9de'));
  const v=mix(values[n],values[n+1],f), out=Math.abs(v)>3.1;
  if(!out){dot(c,x(v),y(v),5); const slope=2*values[n]; const a=values[n]; if(Math.abs(a)<3) path(c,[[x(a-.25),y(a)-(-.25*slope)*(bottom-75)/10],[x(a+.25),y(a)-(.25*slope)*(bottom-75)/10]],amber,2);}
  label(c,`η = ${rate.toFixed(2)}     step ${n}     w = ${values[n].toFixed(3)}`,w/2,h-48,12,ink);
  return out?'The steps grow instead of shrink: this learning rate is too large.':t<.15?'The gradient gives the local uphill direction.':rate>1?'A large learning rate overshoots and diverges.':'Move against the gradient: w ← w − η · 2w. The loss falls.';
}
const noiseSamples = (() => {
  let seed=42;
  const uniform=()=>{seed=(1664525*seed+1013904223)>>>0;return (seed+.5)/4294967296;};
  return Array.from({length:1024},()=>Math.sqrt(-2*Math.log(uniform()))*Math.cos(2*Math.PI*uniform()));
})();
const noise = i => noiseSamples[i % noiseSamples.length];
function diffusion(c,t,w,h) {
  const size=Math.min(w-100,h-160), cell=size/28, x=(w-size)/2,y=65;
  const a=Math.cos(t*Math.PI/2)**2;
  title(c,'FORWARD DIFFUSION',w);
  for(let i=0;i<784;i++) { const dx=(i%28-13.5)/8,dy=(Math.floor(i/28)-13.5)/8;
    const signal=Math.abs(Math.hypot(dx,dy)-.8)<.2?1:-1;
    const v=Math.round(Math.max(0,Math.min(255,128+65*(Math.sqrt(a)*signal+Math.sqrt(1-a)*noise(i)))));
    box(c,x+i%28*cell,y+Math.floor(i/28)*cell,cell+.2,cell+.2,`rgb(${v},${v},${v})`);
  }
  label(c,`signal power ${Math.round(a*100)}%   ·   noise power ${Math.round((1-a)*100)}%`,w/2,h-55,11,ink);
  return t<.3?'Start with an image and gradually add Gaussian noise.':t<.8?'The signal shrinks as the noise contribution grows.':'At the noisy endpoint, structure is lost. Generation learns the reverse process.';
}
function flow(c,t,w,h,o) {
  const mobile=w<600, a=[mobile?100:180,h/2], b=[w-(mobile?100:180),h/2], r=mobile?58:85;
  title(c,'CONDITIONAL FLOW-MATCHING PATHS',w);
  for(let i=0;i<45;i++){const angle=i*2.39996,rad=Math.sqrt((i+.5)/45)*r, p=[a[0]+Math.cos(angle)*rad,a[1]+Math.sin(angle)*rad], q=[b[0]+Math.cos(i/45*Math.PI*2)*r,b[1]+Math.sin(i/45*Math.PI*2)*r];
    path(c,[p,q],'#e9e9e9');dot(c,...p,1.5,'#ccc');dot(c,...q,1.5,'#ccc');
    const v=[mix(p[0],q[0],t),mix(p[1],q[1],t)]; dot(c,...v,2.5);if(i%9===0)arrow(c,v,[v[0]+(q[0]-p[0])*.1,v[1]+(q[1]-p[1])*.1]);
  }
  label(c,o.source||'noise samples',a[0],h-70,11);label(c,o.target||'data samples',b[0],h-70,11);
  label(c,`xₜ = (1 − t)x₀ + tx₁       t = ${t.toFixed(2)}`,w/2,h-35,11,ink);
  return t<.25?'Pair a source sample with a target sample during training.':t<.8?'At each intermediate point, learn the target velocity x₁ − x₀.':'These are training paths. At inference, integrate the learned velocity field.';
}
function advantage(c,t,w,h,o) {
  const v=gaeContributions(+o.lambda), n=t*5, baseline=h*.57, unit=(w-64)/5,scale=65;
  title(c,'GENERALIZED ADVANTAGE ESTIMATION',w);path(c,[[30,baseline],[w-25,baseline]]);
  let total=0;
  v.forEach((value,i)=>{const fraction=smooth(n-i),shown=value*fraction;total+=shown;
    box(c,42+i*unit,shown>=0?baseline-shown*scale:baseline,unit*.45,Math.abs(shown)*scale,shown>=0?blue:amber);
    label(c,`δ${i}`,42+i*unit+unit*.225,baseline+65,12); label(c,value.toFixed(2),42+i*unit+unit*.225,baseline-95,11,i<n?ink:'#aaa');
  });
  label(c,`Σ (γλ)ˡ δₜ₊ₗ = ${total.toFixed(3)}`,w/2,h-45,15,ink);
  return t<.2?'Begin with the current temporal-difference error.':t<.85?'Add future TD errors, discounted by successive powers of γλ.':'Larger λ carries credit farther. At λ = 0, only the first error remains.';
}
function recurrent(c,t,w,h) {
  const inputs=[1,0,-1,.5], states=[0];inputs.forEach(x=>states.push(Math.tanh(.8*states.at(-1)+x)));
  const step=Math.min(3,Math.floor(t*4)),f=smooth((t*4-step)*1.4),unit=(w-60)/4,cy=h/2;
  title(c,'RECURRENT MEMORY',w);
  for(let i=0;i<4;i++) {const x=30+(i+.5)*unit;
    if(i<3) {path(c,[[x+24,cy],[x+unit-24,cy]],'#ccc');if(i===step&&t<1)dot(c,mix(x+24,x+unit-24,f),cy,4);}
    box(c,x-23,cy-23,46,46,i<=step?'#e8edf5':'#eee',i===step?blue:undefined);label(c,`h${i+1}`,x,cy+4,14,i<=step?blue:muted);
    arrow(c,[x,cy-85],[x,cy-31],i===step?blue:'#ccc');label(c,`x = ${inputs[i]}`,x,cy-102,11);
    label(c,i<=step?states[i+1].toFixed(2):'—',x,cy+53,12,ink);
  }
  label(c,'hₜ = tanh(0.8hₜ₋₁ + xₜ)',w/2,h-50,13,ink);
  return step===0?'Read the first input and update the hidden state.':'The next step receives both a new input and the state carried from the past.';
}
function patches(c,t,w,h,o) {
  const mobile=w<600,side=mobile?150:190,cell=side/4,origin=[(w-side)/2,65],p=smooth((t-.15)/.65);
  title(c,o.noisy?'NOISY LATENT PATCHES':'IMAGE → PATCH TOKENS',w);
  for(let i=0;i<16;i++) { const sx=origin[0]+i%4*cell,sy=origin[1]+Math.floor(i/4)*cell;
    const tx=30+i%8*(w-60)/8,ty=h-170+Math.floor(i/8)*55,tw=(w-76)/8;
    const x=mix(sx,tx,p),y=mix(sy,ty,p),ww=mix(cell-2,tw,p),hh=mix(cell-2,32,p);
    const projection=smooth((t-.72)/.2);
    box(c,x,y,ww,hh,'#e9e9e9');
    for(let py=0;py<7;py++)for(let px=0;px<7;px++){
      const gx=(i%4*7+px-13.5)/9,gy=(Math.floor(i/4)*7+py-13.5)/9;
      const signal=Math.abs(Math.hypot(gx,gy)-.8)<.22?1:0;
      const v=o.noisy?clamp(.5+.25*noise(i*49+py*7+px)) : signal;
      const shade=Math.round(mix(245-v*190,100+((i+py)%5)*25,projection));
      box(c,x+px*ww/7,y+py*hh/7,ww/7+.1,hh/7+.1,`rgb(${shade},${shade},${shade})`);
    }
    if(t>.65)label(c,String(i+1),x+ww/2,y+hh+13,10,muted);
  }
  label(c,'shared linear projection + position',w/2,h-44,12,ink);
  return t<.15?o.noisy?'Begin with a noisy latent grid.':'Split the image into fixed-size, nonoverlapping patches.':t<.8?'Flatten each patch and project it with the same learned matrix.':'Patch positions are retained as embeddings. The transformer sees a sequence.';
}
function lora(c,t,w,h) {
  const mobile=w<600,x0=35,x1=w-35,mid=w/2,cy=h/2;
  title(c,'FROZEN WEIGHTS + LOW-RANK UPDATE',w);
  const matrix=(x,y,rows,cols,active)=>{const size=mobile?9:12;for(let r=0;r<rows;r++)for(let k=0;k<cols;k++)box(c,x+(k-cols/2)*size,y+(r-rows/2)*size,size-2,size-2,active?`rgba(53,105,176,${.2+.6*((r+k)%4)/3})`:'#d2d2d2');};
  path(c,[[x0,cy],[x0+25,cy-80],[x1-25,cy-80],[x1,cy]],'#ccc');
  path(c,[[x0,cy],[x0+25,cy+80],[x1-25,cy+80],[x1,cy]],'#b6c7df');
  matrix(mid,cy-80,6,6,false);label(c,'W₀ · frozen',mid,cy-135,12);
  matrix(mid-45,cy+80,2,6,true);matrix(mid+45,cy+80,6,2,true);
  label(c,'A',mid-45,cy+135,12,blue);label(c,'B',mid+45,cy+135,12,blue);
  if(t>.12&&t<.85){
    const p=clamp((t-.12)/.73),vertices=sign=>[[x0,cy],[x0+25,cy+sign*80],[x1-25,cy+sign*80],[x1,cy]];
    for(const sign of [-1,1]){const points=vertices(sign),segment=Math.min(2,Math.floor(p*3)),f=p*3-segment;
      dot(c,mix(points[segment][0],points[segment+1][0],f),mix(points[segment][1],points[segment+1][1],f),4,sign<0?ink:blue);}
  }
  dot(c,x0,cy,4,ink);label(c,'x',x0,cy+25,13,ink);dot(c,x1,cy,12,'#fff');label(c,'+',x1,cy+5,20,ink);
  label(c,'h = W₀x + B(Ax)',w/2,h-30,14,ink);
  return t<.3?'Keep the large pretrained matrix fixed.':t<.75?'A compresses the update to rank r; B maps it back to the output dimension.':'Add the low-rank correction to the original output. Only A and B are trained.';
}
function clip(c,t,w,h) {
  const size=Math.min(w-140,h-155),cell=size/3,left=(w-size)/2,top=80,p=smooth(t);
  title(c,'IMAGE–TEXT CONTRASTIVE LEARNING',w);
  for(let i=0;i<3;i++) {label(c,`text ${i+1}`,left+(i+.5)*cell,top-15,11);label(c,`image ${i+1}`,left-12,top+(i+.5)*cell,11,muted,'right');
    for(let j=0;j<3;j++){const score=mix(.35,i===j?.9:.08,p);box(c,left+j*cell,top+i*cell,cell-3,cell-3,`rgba(53,105,176,${score})`);label(c,score.toFixed(2),left+(j+.5)*cell,top+(i+.5)*cell+4,12,i===j&&t>.6?'white':ink);}
  }
  label(c,'relative similarity · matching pairs on the diagonal',w/2,h-35,w<600?10:12,ink);
  return t<.3?'Compare every image embedding with every text embedding in the batch.':t<.8?'Increase matching scores relative to mismatched pairs.':'Train in both directions: image → text and text → image.';
}
function experts(c,t,w,h) {
  const cy=h/2,left=45,right=w-45,middle=w/2,ys=[cy-100,cy-50,cy,cy+50,cy+100],weights=[0,.7,0,.3,0];
  title(c,'SPARSE EXPERT ROUTING · TOP 2',w);
  weights.forEach((v,i)=>{path(c,[[left,cy],[middle-30,ys[i]]],v?'#b8c9df':'#e7e7e7',v?1.5:1);
    path(c,[[middle+30,ys[i]],[right,cy]],v?'#b8c9df':'#e7e7e7',v?1.5:1);
    box(c,middle-28,ys[i]-16,56,32,v?'#e7edf5':'#f0f0f0');label(c,`E${i+1}`,middle,ys[i]+4,12,v?blue:muted);
    label(c,String(v),middle+43,ys[i]+4,11,v?blue:'#aaa');
    if(v&&t>.12&&t<.9){const p=clamp((t-.12)/.78),first=p<.5;dot(c,first?mix(left,middle-30,p*2):mix(middle+30,right,(p-.5)*2),first?mix(cy,ys[i],p*2):mix(ys[i],cy,(p-.5)*2),3+v*3);}
  });
  dot(c,left,cy,5,ink);label(c,'token',left,cy+25,11);dot(c,right,cy,5);label(c,'mix',right,cy+25,11);
  label(c,'y = 0.7E₂(x) + 0.3E₄(x)',w/2,h-40,13,ink);
  return t<.3?'The router keeps the two highest-scoring experts.':t<.7?'Only selected experts process this token. The others stay inactive.':'Combine their outputs with normalized router weights.';
}
function ppo(c,t,w,h,o) {
  const {left,right,bottom}=layout(w,h),a=+o.sign,x=r=>left+(r-.4)/1.2*(right-left),y=v=>a>0?bottom-(v-.3)/1.4*(bottom-65):65+(-v-.3)/1.4*(bottom-65);
  title(c,'PPO · CLIPPED SURROGATE',w);
  box(c,x(.8),65,x(1.2)-x(.8),bottom-65,'#edf0f4');
  path(c,[[left,bottom],[right,bottom]],'#bbb');
  path(c,Array.from({length:80},(_,i)=>{const r=.4+i*1.2/79;return[x(r),y(r*a)];}),'#bbb',1,true);
  path(c,Array.from({length:80},(_,i)=>{const r=.4+i*1.2/79;return[x(r),y(ppoObjective(r,a))];}),blue,2);
  [.8,1,1.2].forEach(r=>label(c,String(r),x(r),bottom+24,11));
  const ratio=.4+t*1.2;dot(c,x(ratio),y(ppoObjective(ratio,a)),5);
  label(c,`r = ${ratio.toFixed(2)}     A = ${a>0?'+1':'−1'}     objective = ${ppoObjective(ratio,a).toFixed(2)}`,w/2,h-38,11,ink);
  return t<.2?'The ratio compares new and old probabilities for the same action.':a>0?'For positive advantage, improvement flattens above r = 1.2.':'For negative advantage, improvement flattens below r = 0.8.';
}
function act(c,t,w,h) {
  const left=55,unit=(w-85)/7,top=90,rows=4,now=3+clamp(t)*2,col=Math.floor(now),cy=h-85;
  title(c,'OVERLAPPING ACTION CHUNKS',w);
  for(let i=0;i<rows;i++){label(c,`t${i}`,left-20,top+i*45+15,11);for(let j=0;j<4;j++){
    const x=left+(i+j)*unit,chosen=i+j===col;box(c,x,top+i*45,unit-3,28,chosen?'#e0e8f3':'#eaeaea');label(c,String(i+j),x+(unit-3)/2,top+i*45+18,11,chosen?blue:muted);
    if(chosen){path(c,[[x+unit/2,top+i*45+30],[left+(col+.5)*unit,cy]],'#b7c9df');if(t>.15&&t<.9){const f=(t*3)%1;dot(c,x+unit/2,mix(top+i*45+30,cy,f),2.5);}}
  }}
  path(c,[[left+now*unit,top-12],[left+now*unit,top+rows*45]],blue,1.5);
  dot(c,left+(col+.5)*unit,cy,5);label(c,`execute action for time ${col}`,w/2,h-35,12,ink);
  return t<.25?'Each policy query predicts a chunk of future actions.':t<.75?'Several chunks contain predictions for the same execution time.':'Combine those overlapping predictions with a weighted average.';
}
function policy(c,t,w,h) {
  const left=40,right=w-40,top=80,bottom=h-80,denoise=smooth(clamp(t/.72));
  title(c,'DENOISE AN ACTION SEQUENCE',w);
  const points=Array.from({length:12},(_,i)=>[mix(left,right,i/11),mix(top+(noise(i+42)+3)/6*(bottom-top),bottom-30-(bottom-top-70)*Math.sin(i/11*Math.PI*.8),denoise)]);
  path(c,points,'#a6bbd8',2);points.forEach((p,i)=>dot(c,...p,3,i<3&&t>.75?blue:'#aaa'));
  if(t>.75){const f=clamp((t-.75)/.25)*2,idx=Math.min(1,Math.floor(f));dot(c,mix(points[idx][0],points[idx+1][0],f-idx),mix(points[idx][1],points[idx+1][1],f-idx),6,blue);}
  label(c,'current observation conditions every denoising step',w/2,h-36,w<600?10:12,ink);
  return t<.3?'Start with a noisy candidate action sequence.':t<.72?'Condition on the observation and iteratively refine the actions.':'Execute a short prefix, observe again, and replan the next sequence.';
}
function mdp(c,t,w,h) {
  const side=Math.min(w-100,h-145),cell=side/4,x=(w-side)/2,y=65,route=[12,8,9,5,6,2,3],p=t*6,index=Math.min(5,Math.floor(p)),f=smooth(p-index);
  title(c,'STATE → ACTION → NEXT STATE + REWARD',w);
  for(let i=0;i<16;i++)box(c,x+i%4*cell,y+Math.floor(i/4)*cell,cell-2,cell-2,i===3?'#e4ecf5':'#eee');
  const pos=i=>[x+(i%4+.5)*cell,y+(Math.floor(i/4)+.5)*cell];
  path(c,route.slice(0,index+1).map(pos),'#becce0',2);const a=pos(route[index]),b=pos(route[index+1]);dot(c,mix(a[0],b[0],f),mix(a[1],b[1],f),7);
  label(c,'+1',...pos(3),13,blue);label(c,t===1?'terminal reward = +1':'step reward = −0.01',w/2,h-36,12,ink);
  return t<.2?'The agent observes its current grid cell: the state.':t<.9?'An action changes the state, and the environment returns a reward.':'Repeat until the terminal state. This toy environment has deterministic transitions.';
}

export const mechanisms = {
  attention:{scene:attention,duration:12,title:'Attention weights',note:'Computed from hand-chosen 2D queries and keys. Connections show weights; the context is a weighted sum of value vectors.',options:{query:{label:'Query token',values:[['0','The'],['1','cat'],['2','sat'],['3','on'],['4','the'],['5','mat']],value:'2'}}},
  transformer:{scene:attention,duration:12,title:'Causal attention',note:'A decoder-only attention example. Future keys are masked before softmax; this is not the full encoder–decoder Transformer.',defaults:{causal:true},options:{query:{label:'Query token',values:[['0','The'],['1','cat'],['2','sat'],['3','on'],['4','the'],['5','mat']],value:'2'}}},
  gradient:{scene:gradient,duration:16,title:'Gradient descent',note:'Exact scalar updates for L(w) = w². The moving dot interpolates between optimization steps.',options:{rate:{label:'Learning rate',value:'.2',values:[['.2','0.2 · converge'],['.8','0.8 · oscillate'],['1.05','1.05 · diverge']]}}},
  diffusion:{scene:diffusion,duration:14,title:'Forward diffusion',note:'xₜ = √ᾱₜ x₀ + √(1 − ᾱₜ) ε, using a fixed illustrative noise sample while seeking. Playing backward would not be learned denoising.'},
  flow:{scene:flow,duration:14,title:'Flow matching',note:'Illustrative paired training samples and straight conditional paths. The learned marginal flow is not necessarily straight.'},
  vita:{scene:flow,duration:14,title:'Observation-to-action flow',defaults:{source:'observation latents',target:'action latents'},note:'Schematic training pairs in a 2D projection: the source is encoded observation, not Gaussian noise. Inference integrates a learned field and decodes the action latent.'},
  a2a:{scene:flow,duration:14,title:'History-to-action flow',defaults:{source:'history latents',target:'future action latents'},note:'Schematic training pairs in a 2D projection. History supplies the source; visual observations condition the learned flow. These lines are not robot trajectories.'},
  advantage:{scene:advantage,duration:12,title:'Credit across time',note:'Exact sum for γ = 0.95 and TD errors [1, −0.4, 0.8, 1.3, −0.2]. Blue adds credit; amber subtracts it.',options:{lambda:{label:'Lambda λ',value:'.8',values:[['0','0 · current error'],['.8','0.8 · decaying trace'],['1','1 · longest trace']]}}},
  recurrent:{scene:recurrent,duration:14,title:'Recurrent hidden state',note:'Computed scalar RNN with h₀ = 0. One hidden unit illustrates recurrence; this does not depict LSTM gates.'},
  patches:{scene:patches,duration:13,title:'Patch tokenization',note:'Sixteen schematic patches, shown in two rows for readability. Flattening and projection preserve patch identity; positional embeddings provide location.'},
  dit:{scene:patches,duration:13,title:'Latent patch tokenization',defaults:{noisy:true},note:'Schematic tokenization of a noisy latent grid. DiT uses transformer blocks to denoise latent patches, with timestep and class conditioning; shown colors are patch identifiers.'},
  lora:{scene:lora,duration:13,title:'Low-rank adaptation',note:'Schematic rank-2 update for a 6 × 6 matrix: 24 trainable parameters instead of 36. The scaling factor is omitted for clarity.'},
  clip:{scene:clip,duration:13,title:'Contrastive alignment',note:'Schematic relative similarities, not training measurements or probabilities. The objective applies cross-entropy along both rows and columns.'},
  experts:{scene:experts,duration:12,title:'Sparse expert routing',note:'Toy top-2 gate with weights [0, 0.7, 0, 0.3, 0]. Expert specialization and load balancing are learned, not preset by topic.'},
  ppo:{scene:ppo,duration:15,title:'PPO clipping',note:'Exact per-sample maximization objective, ε = 0.2. Dashed: unclipped. Blue: PPO minimum. Clipping modifies the objective; it does not constrain actual ratios.',options:{sign:{label:'Advantage',value:'1',values:[['1','+1 · favor action'],['-1','−1 · discourage action']]}}},
  act:{scene:act,duration:14,title:'Action chunk overlap',note:'Schematic four-step chunks. Boxes identify execution times, not action magnitudes. Temporal ensembling weights predictions for the same time.'},
  policy:{scene:policy,duration:15,title:'Action diffusion',note:'Schematic 2D action sequence and a three-action execution prefix. This interpolation illustrates refinement, not output from a trained policy.'},
  mdp:{scene:mdp,duration:15,title:'Agent–environment interaction',note:'A fixed policy in a toy 4 × 4 deterministic grid. Each move earns −0.01; entering the terminal cell earns +1.'},
};
