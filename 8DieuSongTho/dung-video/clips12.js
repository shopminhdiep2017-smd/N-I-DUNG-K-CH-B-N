const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs'),cp=require('child_process');
const S=process.argv[2], OUT=S+'/v12/clips', F=S+'/fonts/';
const only=process.argv[3];
const css=`
@font-face{font-family:BVP;src:url(file://${F}BeVietnamPro-ExtraBold.ttf);font-weight:800}
@font-face{font-family:BVP;src:url(file://${F}BeVietnamPro-Bold.ttf);font-weight:700}
html,body{margin:0;width:600px;height:400px;overflow:hidden;font-family:BVP;background:#000}
.st{position:relative;width:600px;height:400px;overflow:hidden}
.cap{position:absolute;left:0;right:0;bottom:22px;text-align:center;color:#fff;font-weight:800;font-size:34px;text-shadow:0 3px 10px rgba(0,0,0,.6)}
.cap b{color:#ffe14d}
.box{background:#fff;border-radius:16px;padding:10px 6px;text-align:center;color:#222;font-weight:800;font-size:22px;transition:none}
.box.on{background:#ffe14d;transform:scale(1.08)}
.box.off{opacity:.35}
.q{background:#fff;color:#1f3a5a;border-radius:14px;padding:8px 16px;font-weight:800;font-size:25px;margin:8px 0;display:inline-block}
.emo{font-family:'Noto Color Emoji';display:inline-block;line-height:1}
.c{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%)}
@keyframes pulse{0%{transform:translate(-50%,-50%) scale(.6);opacity:.9}100%{transform:translate(-50%,-50%) scale(1.8);opacity:0}}
@keyframes shake{0%,100%{transform:translate(-50%,-50%) rotate(0)}25%{transform:translate(-52%,-50%) rotate(-3deg)}75%{transform:translate(-48%,-50%) rotate(3deg)}}
@keyframes drop{0%{transform:translate(-50%,-260px)}55%{transform:translate(-50%,62px)}65%{transform:translate(-50%,48px)}75%,100%{transform:translate(-50%,62px)}}
@keyframes rise{0%{transform:translateY(40px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes pop{0%,40%{transform:scale(1);opacity:1}60%{transform:translateY(-30px) scale(1.2);opacity:1}100%{transform:translateY(-90px) scale(.9);opacity:0}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:.15}}
@keyframes drain{from{width:var(--a)}to{width:var(--b)}}
@keyframes grow{from{width:0}to{width:var(--w)}}
@keyframes glow{0%,100%{filter:drop-shadow(0 0 4px #ffd54a)}50%{filter:drop-shadow(0 0 22px #ffd54a)}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes needle{0%{transform:rotate(-80deg)}70%{transform:rotate(62deg)}80%{transform:rotate(52deg)}90%,100%{transform:rotate(66deg)}}
@keyframes fill{from{width:8%}to{width:96%}}
@keyframes beat{0%,100%{transform:translate(-50%,-50%) scale(1)}15%{transform:translate(-50%,-50%) scale(1.22)}30%{transform:translate(-50%,-50%) scale(1)}45%{transform:translate(-50%,-50%) scale(1.15)}}
@keyframes ecg{from{transform:translateX(0)}to{transform:translateX(-300px)}}
@keyframes climb{0%{transform:translate(0,0)}100%{transform:translate(330px,-140px)}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes shrink{from{height:var(--a)}to{height:var(--b)}}
@keyframes zz{0%{transform:translate(0,0);opacity:0}30%{opacity:1}100%{transform:translate(40px,-80px);opacity:0}}
@keyframes ring{0%,100%{transform:rotate(0)}20%{transform:rotate(-14deg)}40%{transform:rotate(14deg)}60%{transform:rotate(-10deg)}80%{transform:rotate(10deg)}}
@keyframes flip{0%,100%{transform:translate(-50%,-50%) rotate(0)}45%,55%{transform:translate(-50%,-50%) rotate(180deg)}}
@keyframes grow2{to{transform:scaleX(1)}}
@keyframes hit{0%{transform:translate(0,0);opacity:0}20%{opacity:1}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
@keyframes crack{0%,40%{opacity:0}50%,100%{opacity:1}}
@keyframes fillup{to{width:92%}}
@keyframes togreen{to{background:#43d36b}}
@keyframes dash{to{stroke-dashoffset:0}}
@keyframes twinkle{0%,100%{opacity:.2}50%{opacity:1}}
`;
const bat=(a,b,dur,col,extra='')=>`<div style="position:relative;width:250px;height:110px;border:9px solid #fff;border-radius:20px;box-sizing:border-box">
 <div style="position:absolute;right:-30px;top:30px;width:18px;height:34px;background:#fff;border-radius:0 8px 8px 0"></div>
 <div style="position:absolute;left:8px;top:8px;bottom:8px;border-radius:8px;background:${col};--a:${a};--b:${b};animation:drain ${dur}s ease-in-out forwards;${extra}"></div></div>`;
const bg=(c1,c2)=>`background:radial-gradient(circle at 50% 40%,${c1},${c2})`;
const R=(d)=>`animation:rise .5s ${d}s both`;
const sc={
 x0:[2.6,`<div class="st" style="${bg('#5a1d2a','#1a0810')}">
   <div class="c" style="left:22%"><span class="emo" style="font-size:120px">👵</span></div>
   <div class="c" style="left:64%;color:#ffe14d;font-weight:800;font-size:76px;white-space:nowrap"><div style="${R(0.3)}">8 điều</div></div>
   <div class="cap">Muốn <b>sống thọ</b> hãy nhớ</div></div>`],
 x1:[4.0,`<div class="st" style="${bg('#3a2a55','#120c1c')}">
   <div style="position:absolute;left:22px;top:16px;background:#ffe14d;color:#222;font-weight:800;font-size:36px;border-radius:14px;padding:4px 14px">01</div>
   <div class="c" style="left:28%;top:40%"><span class="emo" style="font-size:110px">💼</span></div>
   <div class="c" style="left:50%;top:40%;color:#fff;font-weight:800;font-size:54px">→</div>
   <div class="c" style="left:72%;top:40%"><div style="${R(0.5)}"><span class="emo" style="font-size:110px">😌</span></div></div>
   <div class="cap" style="font-size:30px;white-space:nowrap">Lao động <span style="color:#ff6b6b">ít ↓</span> · Nghỉ ngơi <span style="color:#5be37d">nhiều ↑</span></div></div>`],
 x2:[4.0,`<div class="st" style="${bg('#1f3a5a','#08111c')}">
   <div style="position:absolute;left:22px;top:16px;background:#ffe14d;color:#222;font-weight:800;font-size:36px;border-radius:14px;padding:4px 14px">02</div>
   <div class="c" style="left:28%;top:40%"><span class="emo" style="font-size:110px">🧂</span></div>
   <div class="c" style="left:50%;top:40%;color:#fff;font-weight:800;font-size:54px">→</div>
   <div class="c" style="left:72%;top:40%"><div style="${R(0.5)}"><span class="emo" style="font-size:110px">🥗</span></div></div>
   <div class="cap" style="font-size:30px;white-space:nowrap">Ăn mặn <span style="color:#ff6b6b">ít ↓</span> · Ăn nhạt <span style="color:#5be37d">nhiều ↑</span></div></div>`],
 x3:[4.0,`<div class="st" style="${bg('#14502a','#04140a')}">
   <div style="position:absolute;left:22px;top:16px;background:#ffe14d;color:#222;font-weight:800;font-size:36px;border-radius:14px;padding:4px 14px">03</div>
   <div class="c" style="left:28%;top:40%"><span class="emo" style="font-size:110px">🥩</span></div>
   <div class="c" style="left:50%;top:40%;color:#fff;font-weight:800;font-size:54px">→</div>
   <div class="c" style="left:72%;top:40%"><div style="${R(0.5)}"><span class="emo" style="font-size:110px">🥬</span></div></div>
   <div class="cap" style="font-size:30px;white-space:nowrap">Ăn thịt <span style="color:#ff6b6b">ít ↓</span> · Rau xanh <span style="color:#5be37d">nhiều ↑</span></div></div>`],
 x4:[4.0,`<div class="st" style="${bg('#13204a','#04060f')}">
   <div style="position:absolute;left:22px;top:16px;background:#ffe14d;color:#222;font-weight:800;font-size:36px;border-radius:14px;padding:4px 14px">04</div>
   <div class="c" style="left:28%;top:40%"><span class="emo" style="font-size:110px">🌙</span></div>
   <div class="c" style="left:50%;top:40%;color:#fff;font-weight:800;font-size:54px">→</div>
   <div class="c" style="left:72%;top:40%"><div style="${R(0.5)}"><span class="emo" style="font-size:110px">😴</span></div></div>
   <div class="cap" style="font-size:30px;white-space:nowrap">Thức khuya <span style="color:#ff6b6b">ít ↓</span> · Ngủ sớm <span style="color:#5be37d">nhiều ↑</span></div></div>`],
 x5:[4.0,`<div class="st" style="${bg('#5a3a1c','#1b1008')}">
   <div style="position:absolute;left:22px;top:16px;background:#ffe14d;color:#222;font-weight:800;font-size:36px;border-radius:14px;padding:4px 14px">05</div>
   <div class="c" style="left:28%;top:40%"><span class="emo" style="font-size:110px">😠</span></div>
   <div class="c" style="left:50%;top:40%;color:#fff;font-weight:800;font-size:54px">→</div>
   <div class="c" style="left:72%;top:40%"><div style="${R(0.5)}"><span class="emo" style="font-size:110px">😄</span></div></div>
   <div class="cap" style="font-size:30px;white-space:nowrap">Giận <span style="color:#ff6b6b">ít ↓</span> · Cười <span style="color:#5be37d">nhiều ↑</span></div></div>`],
 x6:[4.0,`<div class="st" style="${bg('#4a3a10','#161004')}">
   <div style="position:absolute;left:22px;top:16px;background:#ffe14d;color:#222;font-weight:800;font-size:36px;border-radius:14px;padding:4px 14px">06</div>
   <div class="c" style="left:28%;top:40%"><span class="emo" style="font-size:110px">🍚</span></div>
   <div class="c" style="left:50%;top:40%;color:#fff;font-weight:800;font-size:54px">→</div>
   <div class="c" style="left:72%;top:40%"><div style="${R(0.5)}"><span class="emo" style="font-size:110px">🦷</span></div></div>
   <div class="cap" style="font-size:30px;white-space:nowrap">Ăn thật chậm · Nhai thật kỹ</div></div>`],
 x7:[4.0,`<div class="st" style="${bg('#183a3a','#081414')}">
   <div style="position:absolute;left:22px;top:16px;background:#ffe14d;color:#222;font-weight:800;font-size:36px;border-radius:14px;padding:4px 14px">07</div>
   <div class="c" style="left:28%;top:40%"><span class="emo" style="font-size:110px">🚗</span></div>
   <div class="c" style="left:50%;top:40%;color:#fff;font-weight:800;font-size:54px">→</div>
   <div class="c" style="left:72%;top:40%"><div style="${R(0.5)}"><span class="emo" style="font-size:110px">🚶</span></div></div>
   <div class="cap" style="font-size:30px;white-space:nowrap">Ngồi xe <span style="color:#ff6b6b">ít ↓</span> · Đi bộ <span style="color:#5be37d">nhiều ↑</span></div></div>`],
 x8:[4.0,`<div class="st" style="${bg('#5a1d3a','#1a0812')}">
   <div style="position:absolute;left:22px;top:16px;background:#ffe14d;color:#222;font-weight:800;font-size:36px;border-radius:14px;padding:4px 14px">08</div>
   <div class="c" style="left:28%;top:40%"><span class="emo" style="font-size:110px">🍬</span></div>
   <div class="c" style="left:50%;top:40%;color:#fff;font-weight:800;font-size:54px">→</div>
   <div class="c" style="left:72%;top:40%"><div style="${R(0.5)}"><span class="emo" style="font-size:110px">🍎</span></div></div>
   <div class="cap" style="font-size:30px;white-space:nowrap">Ăn đường <span style="color:#ff6b6b">ít ↓</span> · Hoa quả <span style="color:#5be37d">nhiều ↑</span></div></div>`],
};
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage({viewport:{width:600,height:400}});
 for(const [id,[dur,html,hook]] of Object.entries(sc)){
  if(only&&only!==id) continue;
  fs.writeFileSync(OUT+'/'+id+'.html',`<html><head><meta charset=utf-8><style>${css}</style></head><body>${html}</body></html>`);
  await p.goto('file://'+OUT+'/'+id+'.html'); await p.evaluate(()=>document.fonts.ready);
  const dir=OUT+'/'+id; fs.mkdirSync(dir,{recursive:true});
  const n=Math.ceil(dur*30)+3;
  for(let f=0;f<n;f++){
   const t=f/30;
   await p.evaluate(([ms,t,h])=>{document.getAnimations().forEach(a=>{a.pause();a.currentTime=ms}); if(h) (new Function('t',h))(t)},[t*1000,t,hook?`(${hook.toString()})(t)`:null]);
   await p.screenshot({path:`${dir}/${String(f).padStart(4,'0')}.png`});
  }
  cp.execSync(`ffmpeg -v error -y -framerate 30 -i ${dir}/%04d.png -c:v libx264 -crf 16 -pix_fmt yuv420p ${OUT}/${id}.mp4 && rm -r ${dir}`);
  console.log(id,n);
 }
 await b.close();
})();
