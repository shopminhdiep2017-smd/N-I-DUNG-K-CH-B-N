const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs'),cp=require('child_process');
const S=process.argv[2], OUT=S+'/v11/clips', F=S+'/fonts/';
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
const W=(st,inner)=>`<div class="c" style="${st}"><div style="${'${R}'}">${inner}</div></div>`;
const sc={
 g1:[6.8,`<div class="st" style="${bg('#3a2a55','#120c1c')}">
   <div class="c" style="left:32%"><span class="emo" style="font-size:130px">😟</span></div>
   <div class="c" style="left:70%;color:#ffe14d;font-weight:800;font-size:58px;white-space:nowrap"><div style="${R(0.8)}">Nghiện?</div></div>
   <div class="cap" style="font-size:30px">Uống Q10 lâu <b>có bị nghiện</b> không?</div></div>`],
 g2:[5.1,`<div class="st" style="${bg('#14502a','#04140a')}">
   <div class="c" style="left:36%"><span class="emo" style="font-size:130px">✅</span></div>
   <div class="c" style="left:66%;top:42%"><span class="emo" style="font-size:150px">🧍</span></div>
   <div class="c" style="left:66%;top:36%;width:60px;height:60px;border-radius:50%;background:radial-gradient(circle,#ffe14d,rgba(255,225,77,0));animation:glow 1.2s infinite"></div>
   <div class="cap" style="font-size:29px"><b>Không gây nghiện</b> – có sẵn trong cơ thể</div></div>`],
 g3:[3.2,`<div class="st" style="${bg('#4a3a10','#161004')}">
   <div class="c" style="left:28%;color:#fff;font-weight:800;font-size:90px">30+</div>
   <div class="c" style="left:70%;transform:translate(-50%,-50%) scale(.7)">${bat('90%','30%',2.6,'#ffb300')}</div>
   <div class="cap">Cơ thể <b>tự tạo ra ít dần</b></div></div>`],
 g4:[4.5,`<div class="st" style="${bg('#1f3a5a','#08111c')}">
   <div class="c" style="left:36%"><span class="emo" style="font-size:130px">📱</span></div>
   <div class="c" style="left:70%;transform:translate(-50%,-50%) scale(.6)">${bat('80%','10%',2,'#e53935','animation:drain 2s ease-in-out forwards, fillup 1.6s 2.4s ease-in-out forwards, togreen .3s 2.4s forwards')}</div>
   <div class="c" style="left:70%;top:24%"><div style="${R(2.3)}"><span class="emo" style="font-size:56px">🔌</span></div></div>
   <div class="cap" style="font-size:30px">Như pin điện thoại – <b>cần sạc mỗi ngày</b></div></div>`],
 g5:[5.9,`<div class="st" style="${bg('#183a3a','#081414')}">
   <svg class="c" style="top:44%" width="460" height="220" viewBox="0 0 460 220">
    <line x1="20" y1="150" x2="440" y2="150" stroke="#9fd8b0" stroke-width="4" stroke-dasharray="12 10"/>
    <text x="440" y="175" fill="#9fd8b0" font-family="BVP" font-weight="700" font-size="20" text-anchor="end">mức tự nhiên</text>
    <polyline points="20,60 160,60 230,110 300,148 440,150" fill="none" stroke="#ffe14d" stroke-width="8" stroke-linejoin="round" stroke-dasharray="600" stroke-dashoffset="600" style="animation:dash 2.6s .3s forwards"/>
    <text x="40" y="45" fill="#fff" font-family="BVP" font-weight="800" font-size="22">Đang bổ sung</text>
    <text x="210" y="95" fill="#fff" font-family="BVP" font-weight="800" font-size="22">Ngưng</text></svg>
   <div class="cap" style="font-size:27px">Ngưng: về mức tự nhiên, <b>không thấp hơn</b></div></div>`],
 g6:[6.2,`<div class="st" style="${bg('#4a2a3a','#140810')}">
   <div class="c" style="left:26%"><span class="emo" style="font-size:110px">📅</span></div>
   <div class="c" style="left:50%"><span class="emo" style="font-size:90px;display:inline-block;animation:spin 3s linear infinite">🔁</span></div>
   <div class="c" style="left:76%"><div style="${R(4.6)}"><span class="emo" style="font-size:110px">👩‍⚕️</span></div></div>
   <div class="cap" style="font-size:30px">Dùng theo <b>liệu trình</b></div></div>`],
 g7:[6.9,`<div class="st" style="${bg('#5a1d2a','#1a0810')}">
   <div class="c" style="left:30%"><span class="emo" style="font-size:120px">🪸</span></div>
   <div class="c" style="left:50%;color:#fff;font-weight:800;font-size:56px">+</div>
   <div class="c" style="left:70%;width:160px;height:120px">${[[20,30],[70,10],[110,40],[40,75],[90,80],[130,90],[0,90]].map(([x,y])=>`<div style="position:absolute;left:${x}px;top:${y}px;width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#6b5a4a,#1a120c)"></div>`).join('')}</div>
   <div class="cap" style="font-size:30px">Chiết xuất <b>tảo đỏ</b> và <b>tiêu đen</b></div></div>`],
 g8:[3.4,`<div class="st" style="${bg('#14502a','#04140a')}">
   <div class="c" style="left:34%;transform:translate(-50%,-50%) scale(.65)">${bat('15%','96%',2.4,'#43d36b')}</div>
   <div class="c" style="left:72%;color:#ffe14d;font-weight:800;font-size:44px;text-align:center;line-height:1.15;white-space:nowrap">&lt;50.000đ<br><span style="font-size:28px;color:#fff">mỗi ngày</span></div>
   <div class="cap"><b>Sạc lại pin</b> cho cơ thể</div></div>`],
 g9:[7.2,`<div class="st" style="${bg('#1f3a5a','#08111c')}">
   <div class="c" style="left:38%"><span class="emo" style="font-size:130px">💬</span></div>
   <div class="c" style="left:66%;color:#ffe14d;font-weight:800;font-size:54px"><div style="${R(0.4)}">Q10?</div></div>
   <div class="cap" style="font-size:30px">Bình luận <b>câu hỏi</b> cho Hương</div></div>`],
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
