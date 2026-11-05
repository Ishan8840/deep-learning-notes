const clamp = (x, a=0, b=1) => Math.max(a, Math.min(b, x));
const ease = x => { x=clamp(x); return x*x*(3-2*x); };
const lerp = (a,b,t) => a+(b-a)*t;
const INK='#171717', MUTED='#777', BLUE='#3569b0', ORANGE='#b97839';
export const convolutionImage = Array.from({length:64},(_,i)=>{const x=i%8,y=Math.floor(i/8);return x>=3&&x<=5&&y>=1&&y<=6?1:0;});
export const convolutionKernel=[-1,0,1,-1,0,1,-1,0,1];
export function convolutionValue(index) {const x=index%6,y=Math.floor(index/6);return convolutionKernel.reduce((sum,k,j)=>sum+k*convolutionImage[(y+Math.floor(j/3))*8+x+j%3],0);}
function text(ctx,value,x,y,size=12,color=MUTED,align='center'){ctx.fillStyle=color;ctx.font=`${size}px system-ui, sans-serif`;ctx.textAlign=align;ctx.fillText(value,x,y);}
function line(ctx,x1,y1,x2,y2,color='#ddd',width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function rect(ctx,x,y,w,h,fill,stroke){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);}}
function dot(ctx,x,y,r,color,alpha=1){ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}

function convolutionScene(ctx,t,w,h) {
  const mobile=w<600, unit=mobile?20:24;
  const input={x:mobile?28:48,y:mobile?55:75}, kernel={x:mobile?246:334,y:mobile?102:115}, output={x:mobile?130:555,y:mobile?294:99};
  const progress=clamp((t-.055)/.87)*36, index=Math.min(35,Math.floor(progress)), fraction=progress-index;
  const previous=Math.max(0,index-1), slide=ease(fraction/.35);
  const fx=lerp(previous%6,index%6,slide),fy=lerp(Math.floor(previous/6),Math.floor(index/6),slide);
  const done=fraction>.64||t>=.925, value=convolutionValue(index);
  text(ctx,'IMAGE',input.x+4*unit,input.y-22,10);text(ctx,'8 × 8',input.x+4*unit,input.y+8*unit+23,11);
  convolutionImage.forEach((v,i)=>rect(ctx,input.x+i%8*unit,input.y+Math.floor(i/8)*unit,unit-1,unit-1,v?'#444':'#f0f0f0'));
  ctx.fillStyle='#3569b014';ctx.fillRect(input.x+fx*unit,input.y+fy*unit,3*unit-1,3*unit-1);ctx.strokeStyle=BLUE;ctx.lineWidth=2;ctx.strokeRect(input.x+fx*unit-1,input.y+fy*unit-1,3*unit+1,3*unit+1);
  const ku=mobile?22:25;text(ctx,'FILTER',kernel.x+ku*1.5,kernel.y-24,10);
  convolutionKernel.forEach((v,i)=>{rect(ctx,kernel.x+i%3*ku,kernel.y+Math.floor(i/3)*ku,ku-1,ku-1,'#f3f3f3');text(ctx,String(v),kernel.x+(i%3+.5)*ku,kernel.y+(Math.floor(i/3)+.66)*ku,12,INK);});
  text(ctx,'× then Σ',kernel.x+ku*1.5,kernel.y+3*ku+25,11);
  const ou=mobile?20:24;text(ctx,'FEATURE MAP',output.x+3*ou,output.y-22,10);text(ctx,'6 × 6',output.x+3*ou,output.y+6*ou+23,11);
  for(let i=0;i<36;i++){const reveal=i<index||(i===index&&done),v=convolutionValue(i);const color=v>0?BLUE:ORANGE;ctx.globalAlpha=reveal?1:.3;rect(ctx,output.x+i%6*ou,output.y+Math.floor(i/6)*ou,ou-1,ou-1,'#f0f0f0');if(reveal&&v){ctx.globalAlpha=Math.abs(v)/3;rect(ctx,output.x+i%6*ou,output.y+Math.floor(i/6)*ou,ou-1,ou-1,color);}ctx.globalAlpha=1;}
  ctx.strokeStyle=BLUE;ctx.lineWidth=1.5;ctx.strokeRect(output.x+index%6*ou-1,output.y+Math.floor(index/6)*ou-1,ou+1,ou+1);
  if(!mobile){line(ctx,265,150,315,150);line(ctx,428,150,535,150);if(fraction>.35&&fraction<.7)dot(ctx,lerp(428,535,(fraction-.35)/.35),150,3,BLUE);}
  else{line(ctx,270,215,270,258);line(ctx,270,258,190,270);}
  const y=mobile?490:290;
  text(ctx,done?`Σ(pixel × weight) = ${value}`:'Multiply the window by the filter. Add the products.',w/2,y,mobile?12:14,INK);
  text(ctx,`Window ${index+1} / 36 · stride 1 · no padding`,w/2,y+25,11);
  if(t>.93)text(ctx,'The same filter detects an edge wherever it appears.',w/2,y+52,11,BLUE);
  return t<.055?'One filter. The same weights at every position.':t>.925?'Each local response becomes one pixel in the feature map.':'Slide, multiply, sum. Repeat across the image.';
}

function digitValue(x,y,soft=false){const dx=(x-13.5)/7.5,dy=(y-13.5)/7.5;const upper=Math.abs(Math.hypot(dx,(dy+.65)*1.2)-.68),lower=Math.abs(Math.hypot(dx,(dy-.65)*1.2)-.76);const distance=Math.min(upper,lower);return soft?Math.exp(-distance*distance/.055):distance<.19?1:0;}
function image(ctx,cx,cy,size,alpha=1,reconstruction=false){ctx.globalAlpha=alpha;const cell=size/28;for(let y=0;y<28;y++)for(let x=0;x<28;x++){const v=digitValue(x,y,reconstruction),shade=Math.round(250-v*210);rect(ctx,cx-size/2+x*cell,cy-size/2+y*cell,cell+.2,cell+.2,`rgb(${shade},${shade},${shade})`);}ctx.globalAlpha=1;}
function vaeScene(ctx,t,w,h){const mobile=w<600;
  const a=mobile?[w/2,105]:[120,160],z=mobile?[w/2,280]:[400,160],b=mobile?[w/2,465]:[680,160],size=mobile?100:135;
  const encoding=ease((t-.12)/.27),sampling=ease((t-.41)/.12),decoding=ease((t-.56)/.29);
  text(ctx,'INPUT',a[0],a[1]-size/2-20,10);text(ctx,'RECONSTRUCTION',b[0],b[1]-size/2-20,10);
  image(ctx,...a,size,t<.12?1:.18);image(ctx,...b,size,decoding>.98?1:.09,true);
  if(mobile){line(ctx,a[0],a[1]+65,z[0],z[1]-45);line(ctx,z[0],z[1]+45,b[0],b[1]-70);}else{line(ctx,a[0]+80,a[1],z[0]-55,z[1]);line(ctx,z[0]+55,z[1],b[0]-80,b[1]);text(ctx,'ENCODE',260,115,10);text(ctx,'DECODE',540,115,10);}
  if(t<.41){const c=[lerp(a[0],z[0],encoding),lerp(a[1],z[1],encoding)];for(let i=0;i<196;i++){const x=i%14,y=Math.floor(i/14),v=digitValue(x*2,y*2);const angle=i*2.39996,r=5+Math.sqrt(i)*1.9;const sx=(x-6.5)*size/14,sy=(y-6.5)*size/14;const px=c[0]+lerp(sx,Math.cos(angle)*r,encoding),py=c[1]+lerp(sy,Math.sin(angle)*r*.65,encoding);dot(ctx,px,py,lerp(size/30,1.3,encoding),INK,(.12+.8*v)*(1-encoding*.7));}}
  if(t>=.32){const fade=clamp((t-.32)/.1);ctx.globalAlpha=fade*(1-decoding*.7);ctx.strokeStyle=BLUE;ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.beginPath();ctx.ellipse(...z,34,23,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;dot(ctx,...z,2,BLUE,fade);text(ctx,'μ, σ',z[0],z[1]-34,12,BLUE);}
  const sample=[z[0]+15,z[1]-9];if(t>=.41&&t<.56){dot(ctx,lerp(z[0],sample[0],sampling),lerp(z[1],sample[1],sampling),3,BLUE);text(ctx,'z = μ + σ ⊙ ε',mobile?z[0]:z[0],z[1]+52,12,INK);}
  if(t>=.56&&t<.9){for(let i=0;i<196;i++){const x=i%14,y=Math.floor(i/14),v=digitValue(x*2,y*2,true);const px=lerp(sample[0],b[0]+(x-6.5)*size/14,decoding),py=lerp(sample[1],b[1]+(y-6.5)*size/14,decoding);dot(ctx,px,py,lerp(1.3,size/30,decoding),INK,(.12+.8*v));}}
  if(t>=.8)image(ctx,...b,size,clamp((t-.8)/.1),true);
  text(ctx,'784 pixels',a[0],a[1]+size/2+22,11);text(ctx,'2D latent',z[0],z[1]+(t>=.41&&t<.56?73:48),11);text(ctx,'784 probabilities',b[0],b[1]+size/2+22,11);
  return t<.12?'Start with an image.':t<.41?'The encoder compresses the image into a latent distribution.':t<.56?'Sample z from that distribution using reparameterization.':t<.9?'The decoder expands z into pixel probabilities.':'Reconstruction preserves structure, without copying every pixel exactly.';
}

export function visualFilm(el,type){const isCNN=type==='cnn',duration=isCNN?22000:16000;const motion=matchMedia('(prefers-reduced-motion: reduce)');let progress=0,playing=false,raf=0,last=0,visible=false,started=false,disposed=false;
  el.innerHTML=`<figure class="visual-film" data-film="${type}"><canvas role="img" aria-label="${isCNN?'Animated convolution: a filter slides over an image and fills the feature map.':'Animated VAE: an image is encoded into a latent distribution, sampled, and reconstructed.'}"></canvas><figcaption class="film-caption"></figcaption><div class="film-controls"><button class="film-play" aria-label="Play animation">Play</button><input class="film-seek" type="range" min="0" max="1000" value="0" aria-label="Animation timeline"><output class="film-time">0:00</output><button class="film-replay" aria-label="Restart animation">↺</button></div><p class="film-note">${isCNN?'Computed example: an 8 × 8 image and a 3 × 3 vertical-edge filter. Blue = positive response; amber = negative response.':'Schematic of the VAE mechanism, not a trained reconstruction. Compression means encoding features; the decoder predicts pixels rather than resizing the input.'}</p></figure>`;
  const canvas=el.querySelector('canvas'),ctx=canvas.getContext('2d'),play=el.querySelector('.film-play'),seek=el.querySelector('.film-seek');let width=800,height=360;
  function draw(){if(disposed)return;ctx.clearRect(0,0,width,height);ctx.fillStyle='#fafafa';ctx.fillRect(0,0,width,height);const caption=(isCNN?convolutionScene:vaeScene)(ctx,progress,width,height);el.querySelector('.film-caption').textContent=caption;seek.value=Math.round(progress*1000);el.querySelector('.film-time').textContent='0:'+String(Math.floor(progress*duration/1000)).padStart(2,'0');}
  function resize(){const mobile=canvas.getBoundingClientRect().width<500;width=mobile?380:800;height=mobile?(isCNN?560:570):360;canvas.style.aspectRatio=`${width}/${height}`;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
  function stop(){playing=false;cancelAnimationFrame(raf);play.textContent=progress>=1?'Replay':'Play';play.setAttribute('aria-label',progress>=1?'Replay animation':'Play animation');}
  function tick(now){if(!playing||disposed)return;progress=clamp(progress+(now-last)/duration);last=now;draw();if(progress===1){stop();return;}raf=requestAnimationFrame(tick);}
  function start(){if(progress===1)progress=0;playing=true;started=true;play.textContent='Pause';play.setAttribute('aria-label','Pause animation');last=performance.now();raf=requestAnimationFrame(tick);}
  play.onclick=()=>playing?stop():start();seek.oninput=()=>{stop();started=true;progress=+seek.value/1000;draw();};el.querySelector('.film-replay').onclick=()=>{stop();progress=0;draw();if(!motion.matches)start();};
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)stop();else if(!started&&!motion.matches&&!document.hidden)start();},{threshold:.25});observer.observe(canvas);
  const visibility=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',visibility);const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);resize();
  return ()=>{disposed=true;stop();observer.disconnect();resizeObserver.disconnect();document.removeEventListener('visibilitychange',visibility);};
}
