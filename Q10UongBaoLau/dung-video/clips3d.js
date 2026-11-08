const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs'),cp=require('child_process');
const S=process.argv[2], OUT=S+'/'+process.argv[3], F=S+'/fonts/', I=S+'/f3d/';
const only=process.argv[4];
const css=`
@font-face{font-family:BVP;src:url(file://${F}BeVietnamPro-ExtraBold.ttf);font-weight:800}
html,body{margin:0;width:600px;height:400px;overflow:hidden;font-family:BVP;background:#000}
.st{position:relative;width:600px;height:400px;overflow:hidden;perspective:700px}
.floor{position:absolute;left:-300px;right:-300px;top:250px;height:400px;transform-origin:50% 0;transform:rotateX(72deg);
 background-image:linear-gradient(rgba(255,255,255,.22) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.22) 2px,transparent 2px);background-size:60px 60px;animation:floormove 3s linear infinite}
@keyframes floormove{from{background-position:0 0}to{background-position:0 60px}}
.glow{position:absolute;left:50%;top:40%;width:520px;height:340px;margin:-170px 0 0 -260px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,.28),transparent)}
.obj{position:absolute;top:58px;width:190px;height:190px;transform-style:preserve-3d}
.obj .in{width:100%;height:100%;animation:enter .9s cubic-bezier(.2,.8,.3,1.2) both, float 2.4s ease-in-out infinite}
.obj img{width:100%;height:100%;animation:turn 3.2s ease-in-out infinite;filter:drop-shadow(0 18px 18px rgba(0,0,0,.45))}
.sh{position:absolute;top:262px;width:150px;height:26px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.55),transparent);animation:shadow 2.4s ease-in-out infinite, fadein .9s both}
@keyframes enter{0%{transform:translateZ(-900px) rotateY(-120deg);opacity:0}100%{transform:translateZ(0) rotateY(0);opacity:1}}
@keyframes float{0%,100%{translate:0 0}50%{translate:0 -16px}}
@keyframes turn{0%,100%{transform:rotateY(-24deg) rotateX(6deg)}50%{transform:rotateY(24deg) rotateX(-4deg)}}
@keyframes shadow{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(.8);opacity:.6}}
@keyframes fadein{from{opacity:0}to{opacity:1}}
.badge{position:absolute;left:22px;top:16px;font-weight:800;font-size:46px;color:#ffe14d;transform:rotateY(18deg) rotateX(8deg);
 text-shadow:1px 1px 0 #c79a00,2px 2px 0 #b58a00,3px 3px 0 #a07a00,4px 4px 0 #8a6a00,5px 5px 0 #745800,6px 6px 10px rgba(0,0,0,.6);animation:fadein .5s both}
.title{position:absolute;right:26px;top:20px;width:300px;text-align:right;font-weight:800;font-size:44px;line-height:1.05;color:#ffe14d;
 text-shadow:1px 1px 0 #c79a00,2px 2px 0 #a07a00,3px 3px 0 #8a6a00,4px 4px 8px rgba(0,0,0,.6);transform:rotateY(-16deg);animation:enter .9s .2s both}
.cap{position:absolute;left:0;right:0;bottom:18px;text-align:center;color:#fff;font-weight:800;font-size:32px;white-space:nowrap;text-shadow:0 3px 0 rgba(0,0,0,.35),0 4px 12px rgba(0,0,0,.6)}
.cap b{color:#ffe14d}
.shine{position:absolute;top:-50px;bottom:-50px;width:120px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);transform:skewX(-20deg);animation:shine 3.5s 1s ease-in-out infinite}
@keyframes shine{0%{left:-200px}60%,100%{left:760px}}
`;
const scene=(c1,c2,objs,cap,extra='')=>`<div class="st" style="background:radial-gradient(circle at 50% 35%,${c1},${c2})"><div class="floor"></div><div class="glow"></div>
 ${objs.map(([img,x,d,sz])=>`<div class="sh" style="left:${x+(sz||190)/2-75}px;animation-delay:${d}s,${d}s"></div><div class="obj" style="left:${x}px;width:${sz||190}px;height:${sz||190}px;top:${sz?58+(190-sz)/2:58}px"><div class="in" style="animation-delay:${d}s,${d+0.9}s"><img src="file://${I}${img}.png" style="animation-delay:${d}s"></div></div>`).join('')}
 ${extra}<div class="shine"></div><div class="cap">${cap}</div></div>`;
const sc=JSON.parse(fs.readFileSync(process.argv[5]));
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage({viewport:{width:600,height:400}});
 for(const [id,o] of Object.entries(sc)){
  if(only&&only!=='all'&&only!==id) continue;
  const extra=(o.badge?`<div class="badge">${o.badge}</div>`:'')+(o.title?`<div class="title">${o.title}</div>`:'');
  const html=scene(o.c1,o.c2,o.objs,o.cap,extra);
  fs.writeFileSync(OUT+'/'+id+'.html',`<html><head><meta charset=utf-8><style>${css}</style></head><body>${html}</body></html>`);
  await p.goto('file://'+OUT+'/'+id+'.html'); await p.evaluate(()=>document.fonts.ready);
  await p.waitForTimeout(300);
  const dir=OUT+'/'+id; fs.mkdirSync(dir,{recursive:true});
  const n=Math.ceil(o.dur*30)+3;
  for(let f=0;f<n;f++){
   await p.evaluate(ms=>{document.getAnimations().forEach(a=>{a.pause();a.currentTime=ms})},f*1000/30);
   await p.screenshot({path:`${dir}/${String(f).padStart(4,'0')}.png`});
  }
  cp.execSync(`ffmpeg -v error -y -framerate 30 -i ${dir}/%04d.png -c:v libx264 -crf 16 -pix_fmt yuv420p ${OUT}/${id}.mp4 && rm -r ${dir}`);
  console.log(id,n);
 }
 await b.close();
})();
