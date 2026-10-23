const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs'),cp=require('child_process');
const S=process.argv[2], OUT=S+'/v3/clips', F=S+'/fonts/';
const only=process.argv[3];
const css=`
@font-face{font-family:BVP;src:url(file://${F}BeVietnamPro-ExtraBold.ttf);font-weight:800}
@font-face{font-family:BVP;src:url(file://${F}BeVietnamPro-Bold.ttf);font-weight:700}
html,body{margin:0;width:600px;height:400px;overflow:hidden;font-family:BVP;background:#000}
.st{position:relative;width:600px;height:400px;overflow:hidden}
.cap{position:absolute;left:0;right:0;bottom:22px;text-align:center;color:#fff;font-weight:800;font-size:34px;text-shadow:0 3px 10px rgba(0,0,0,.6)}
.cap b{color:#ffe14d}
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
@keyframes twinkle{0%,100%{opacity:.2}50%{opacity:1}}
`;
const bat=(a,b,dur,col,extra='')=>`<div style="position:relative;width:250px;height:110px;border:9px solid #fff;border-radius:20px;box-sizing:border-box">
 <div style="position:absolute;right:-30px;top:30px;width:18px;height:34px;background:#fff;border-radius:0 8px 8px 0"></div>
 <div style="position:absolute;left:8px;top:8px;bottom:8px;border-radius:8px;background:${col};--a:${a};--b:${b};animation:drain ${dur}s ease-in-out forwards;${extra}"></div></div>`;
const bg=(c1,c2)=>`background:radial-gradient(circle at 50% 40%,${c1},${c2})`;
const sc={
 s1:[2.9,`<div class="st" style="${bg('#5a2330','#1a0b10')}">
   ${[0,0.5,1].map(d=>`<div class="c" style="width:180px;height:180px;margin:0;border:6px solid #ff4d5e;border-radius:50%;animation:pulse 1.5s ${d}s infinite"></div>`).join('')}
   <div class="c" style="animation:shake .35s infinite"><span class="emo" style="font-size:170px">🤕</span></div>
   <div class="cap"><b>Đau đầu</b> vài lần mỗi tuần</div></div>`],
 s2:[3.1,`<div class="st" style="${bg('#3b3f4a','#14161b')}">
   <div class="c" style="top:58%"><span class="emo" style="font-size:150px">😫</span></div>
   <div style="position:absolute;left:50%;top:30px;animation:drop 1.4s ease-in forwards"><div style="background:#2b2b2b;border:4px solid #888;border-radius:14px;color:#fff;font-weight:800;font-size:30px;padding:10px 22px">100 kg</div></div>
   <div style="position:absolute;left:40px;top:120px;animation:rise .8s .2s both"><span class="emo" style="font-size:70px">📑</span></div>
   <div style="position:absolute;right:40px;top:110px;animation:rise .8s .5s both"><span class="emo" style="font-size:70px">💼</span></div>
   <div class="cap"><b>Áp lực công việc</b> – đầu nặng trĩu</div></div>`],
 s3:[2.9,`<div class="st" style="${bg('#20405a','#0b1622')}">
   <div class="c" style="top:46%;width:330px;height:150px;background:linear-gradient(135deg,#dfe6ee,#9fb0c2);border-radius:18px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(2,1fr);place-items:center">
   ${Array.from({length:8},(_,i)=>`<div style="width:46px;height:46px;border-radius:50%;background:#fff;box-shadow:inset 0 -6px 0 #d0d6de;animation:pop 1.2s ${0.2+i*0.28}s both"></div>`).join('')}</div>
   <div class="cap">Luôn mang theo <b>vỉ thuốc giảm đau</b></div></div>`],
 s4:[4.5,`<div class="st" style="${bg('#3a2a55','#120c1c')}">
   <div class="c" style="left:33%"><span class="emo" style="font-size:150px">🧠</span></div>
   <div class="c" style="left:72%;transform:translate(-50%,-50%) scale(.7)">${bat('70%','12%',2.5,'#e53935','animation:drain 2.5s ease-in-out forwards, blink .5s 2.5s infinite')}</div>
   <div class="cap">Não <b>thiếu năng lượng</b></div></div>`],
 s5:[6.2,`<div class="st" style="${bg('#183a3a','#081414')}">
   <div style="position:absolute;left:40px;right:40px;top:60px;color:#fff;font-weight:800;font-size:26px">
    <div>Cân nặng của não</div><div style="height:34px;background:#334;border-radius:17px;margin:8px 0 26px;overflow:hidden"><div style="height:100%;background:#7fb3ff;--w:4%;animation:grow 1s .3s both"></div></div>
    <div>Năng lượng não dùng</div><div style="height:34px;background:#334;border-radius:17px;margin-top:8px;overflow:hidden"><div style="height:100%;background:#ffcc33;--w:20%;animation:grow 1.4s 2.6s both"></div></div>
    <div style="font-size:60px;color:#ffe14d;margin-top:6px;animation:rise .6s 3.4s both">~20%</div></div>
   <div class="cap" style="font-size:30px">Não dùng tới <b>~20% năng lượng</b> cơ thể</div></div>`],
 s6:[5.9,`<div class="st" style="${bg('#5a3a1c','#1b1008')}">
   <div class="c" style="top:42%;width:360px;height:220px;border-radius:50%;background:radial-gradient(circle,#ffd7c9,#f19c8b);border:6px solid #e0715f">
    <div style="position:absolute;left:60px;top:70px;width:70px;height:70px;border-radius:50%;background:#b55b6e"></div>
    ${[[190,40],[240,120],[160,140],[270,60]].map(([x,y],i)=>`<div style="position:absolute;left:${x}px;top:${y}px;animation:glow 1.4s ${i*0.3}s infinite"><span class="emo" style="font-size:48px">🔋</span></div>`).join('')}</div>
   <div class="cap" style="font-size:30px"><b>Coenzyme Q10</b> – cục pin của tế bào</div></div>`],
 s7:[2.6,`<div class="st" style="${bg('#4a3a10','#161004')}">
   <div class="c" style="left:30%;color:#fff;font-weight:800;font-size:84px" id="age">20+</div>
   <div class="c" style="left:70%;transform:translate(-50%,-50%) scale(.7)">${bat('92%','22%',2.4,'#ffb300')}</div>
   <div class="cap">Từ <b>tuổi 30</b>, pin yếu dần</div></div>`,(t)=>{const a=Math.min(35,20+Math.floor(t*8));document.getElementById('age').textContent=a+'+'}],
 s8:[4.0,`<div class="st" style="${bg('#13204a','#04060f')}">
   ${Array.from({length:18},(_,i)=>`<div style="position:absolute;left:${(i*97)%580}px;top:${(i*53)%200}px;width:5px;height:5px;border-radius:50%;background:#fff;animation:twinkle ${1+i%3*0.5}s ${i*0.13}s infinite"></div>`).join('')}
   <div style="position:absolute;left:60px;top:50px"><span class="emo" style="font-size:110px">🌙</span></div>
   <div class="c" style="left:66%;top:42%;width:170px;height:170px;border-radius:50%;background:#fff;border:8px solid #cfd8e3">
    <div style="position:absolute;left:81px;top:30px;width:8px;height:55px;background:#222;transform-origin:4px 55px;animation:spin 8s linear infinite"></div>
    <div style="position:absolute;left:82px;top:12px;width:6px;height:73px;background:#e53935;transform-origin:3px 73px;animation:spin 1.2s linear infinite"></div></div>
   <div class="cap"><b>Thức khuya</b>, căng thẳng</div></div>`],
 s9:[3.3,`<div class="st" style="${bg('#5a1515','#1a0505')}">
   <div class="c" style="left:30%;animation:shake .25s infinite"><span class="emo" style="font-size:140px">🧠</span></div>
   <div class="c" style="left:70%;top:46%;width:230px;height:120px;overflow:hidden">
    <div style="position:absolute;left:0;top:0;width:230px;height:230px;border-radius:50%;background:conic-gradient(from -90deg,#43a047 0 60deg,#fdd835 60deg 120deg,#e53935 120deg 180deg,transparent 180deg)"></div>
    <div style="position:absolute;left:35px;top:35px;width:160px;height:160px;border-radius:50%;background:#1a0505"></div>
    <div style="position:absolute;left:111px;top:20px;width:8px;height:96px;background:#fff;transform-origin:4px 96px;animation:needle 1.6s ease-out forwards"></div></div>
   <div class="cap">Não <b>quá tải</b>, đầu óc nặng nề</div></div>`],
 s10:[3.2,`<div class="st" style="${bg('#14502a','#04140a')}">
   <div class="c" style="left:28%"><span class="emo" style="font-size:130px">🧠</span></div>
   <div class="c" style="left:58%"><span class="emo" style="font-size:60px">⚡</span></div>
   <div class="c" style="left:80%;transform:translate(-50%,-50%) scale(.6)">${bat('10%','96%',2.6,'#43d36b')}</div>
   <div class="cap"><b>Sạc pin</b> cho bộ não</div></div>`],
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
