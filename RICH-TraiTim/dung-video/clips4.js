const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs'),cp=require('child_process');
const S=process.argv[2], OUT=S+'/v4/clips', F=S+'/fonts/';
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
@keyframes beat{0%,100%{transform:translate(-50%,-50%) scale(1)}15%{transform:translate(-50%,-50%) scale(1.22)}30%{transform:translate(-50%,-50%) scale(1)}45%{transform:translate(-50%,-50%) scale(1.15)}}
@keyframes ecg{from{transform:translateX(0)}to{transform:translateX(-300px)}}
@keyframes climb{0%{transform:translate(0,0)}100%{transform:translate(330px,-140px)}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes shrink{from{height:var(--a)}to{height:var(--b)}}
@keyframes twinkle{0%,100%{opacity:.2}50%{opacity:1}}
`;
const bat=(a,b,dur,col,extra='')=>`<div style="position:relative;width:250px;height:110px;border:9px solid #fff;border-radius:20px;box-sizing:border-box">
 <div style="position:absolute;right:-30px;top:30px;width:18px;height:34px;background:#fff;border-radius:0 8px 8px 0"></div>
 <div style="position:absolute;left:8px;top:8px;bottom:8px;border-radius:8px;background:${col};--a:${a};--b:${b};animation:drain ${dur}s ease-in-out forwards;${extra}"></div></div>`;
const bg=(c1,c2)=>`background:radial-gradient(circle at 50% 40%,${c1},${c2})`;
const sc={
 h1:[4.3,`<div class="st" style="${bg('#2d4a63','#0d1722')}">
   ${[0,1,2,3,4].map(i=>`<div style="position:absolute;left:${90+i*80}px;top:${290-i*45}px;width:${520-90-i*80}px;height:${45+i*45}px;background:#cfd8e3;border-top:6px solid #fff"></div>`).join('')}
   <div style="position:absolute;left:80px;top:150px;animation:climb 4s linear forwards"><span class="emo" style="font-size:90px;animation:bob .5s infinite">🧍</span></div>
   <div style="position:absolute;left:60px;top:30px;animation:rise .6s 2s both"><span class="emo" style="font-size:80px">😮‍💨</span></div>
   <div class="cap" style="font-size:30px">Ngoài 40, leo cầu thang đã <b>hụt hơi</b></div></div>`],
 h2:[2.4,`<div class="st" style="${bg('#5a1520','#1a0508')}">
   <div class="c" style="top:38%;animation:beat .55s infinite"><span class="emo" style="font-size:150px">❤️</span></div>
   <div style="position:absolute;left:0;top:250px;width:900px;animation:ecg 1s linear infinite"><svg width="900" height="80" viewBox="0 0 900 80"><polyline fill="none" stroke="#ff5a6a" stroke-width="5" points="0,40 30,40 40,20 50,60 60,5 70,75 80,40 100,40 100,40 130,40 140,20 150,60 160,5 170,75 180,40 200,40 200,40 230,40 240,20 250,60 260,5 270,75 280,40 300,40 300,40 330,40 340,20 350,60 360,5 370,75 380,40 400,40 400,40 430,40 440,20 450,60 460,5 470,75 480,40 500,40 500,40 530,40 540,20 550,60 560,5 570,75 580,40 600,40 600,40 630,40 640,20 650,60 660,5 670,75 680,40 700,40 700,40 730,40 740,20 750,60 760,5 770,75 780,40 800,40 800,40 830,40 840,20 850,60 860,5 870,75 880,40 900,40"/></svg></div>
   <div class="cap">Hồi hộp, <b>tim đập nhanh</b></div></div>`],
 h3:[2.7,`<div class="st" style="${bg('#203a5a','#08111c')}">
   <div class="c" style="left:36%;width:230px;height:200px;background:#e8edf3;border-radius:22px;border:6px solid #9fb0c2">
    <div style="margin:22px;background:#9fd8b0;border-radius:10px;height:110px;color:#123;font-weight:800;font-size:54px;display:flex;align-items:center;justify-content:center" id="bp">110/70</div></div>
   <div class="c" style="left:76%;animation:rise .6s .8s both"><span class="emo" style="font-size:100px">🩸</span></div>
   <div class="cap">Để ý <b>huyết áp, mỡ máu</b></div></div>`,(t)=>{const k=Math.min(1,t/1.6);document.getElementById('bp').textContent=Math.round(110+40*k)+'/'+Math.round(70+25*k)}],
 h4:[4.3,`<div class="st" style="${bg('#5a2a3a','#1a0a10')}">
   <div class="c" style="top:40%;animation:glow 1.6s infinite"><span class="emo" style="font-size:160px">🫶</span></div>
   <div class="c" style="top:30%;animation:beat 1.2s infinite"><span class="emo" style="font-size:70px">❤️</span></div>
   <div class="cap">Quan tâm <b>trái tim</b> nhiều hơn</div></div>`],
 h5:[4.1,`<div class="st" style="${bg('#4a1520','#14050a')}">
   <div class="c" style="left:27%;animation:beat .8s infinite"><span class="emo" style="font-size:130px">🫀</span></div>
   <div class="c" style="left:66%;color:#fff;font-weight:800;font-size:76px" id="cnt">0</div>
   <div class="cap">Tim đập <b>~100.000 lần</b> mỗi ngày</div></div>`,(t)=>{const v=Math.round(100000*Math.min(1,t/2.6));document.getElementById('cnt').textContent=v.toLocaleString('vi-VN')}],
 h6:[3.6,`<div class="st" style="${bg('#5a3a1c','#1b1008')}">
   <div class="c" style="animation:beat 1s infinite"><span class="emo" style="font-size:140px">🫀</span></div>
   ${[[120,70],[420,70],[90,200],[450,200],[270,20]].map(([x,y],i)=>`<div style="position:absolute;left:${x}px;top:${y}px;animation:glow 1.4s ${i*0.25}s infinite"><span class="emo" style="font-size:56px">🔋</span></div>`).join('')}
   <div class="cap" style="font-size:30px">Nơi cần nhiều <b>Coenzyme Q10</b> nhất</div></div>`],
 h7:[3.4,`<div class="st" style="${bg('#4a3a10','#161004')}">
   <div class="c" style="left:26%;color:#fff;font-weight:800;font-size:90px">40+</div>
   <div style="position:absolute;left:330px;bottom:100px;display:flex;gap:18px;align-items:flex-end;height:220px">
    ${['95%','80%','55%','30%'].map((h,i)=>`<div style="width:44px;background:${i>1?'#e53935':'#ffb300'};border-radius:8px 8px 0 0;--a:95%;--b:${h};animation:shrink 1.6s ${0.3+i*0.2}s both"></div>`).join('')}</div>
   <div class="cap">Sau tuổi 40, <b>Q10 giảm nhanh</b></div></div>`],
 h8:[4.6,`<div class="st" style="${bg('#3a2a55','#120c1c')}">
   <div class="c" style="left:30%"><span class="emo" style="font-size:140px">😩</span></div>
   <div class="c" style="left:72%;transform:translate(-50%,-50%) scale(.7)">${bat('60%','10%',2,'#e53935','animation:drain 2s ease-in-out forwards, blink .5s 2s infinite')}</div>
   <div class="cap">Tim thiếu pin, <b>cơ thể nhanh mệt</b></div></div>`],
 h9:[2.6,`<div class="st" style="${bg('#14502a','#04140a')}">
   <div class="c" style="left:28%;animation:beat 1s infinite"><span class="emo" style="font-size:120px">❤️</span></div>
   <div class="c" style="left:56%"><span class="emo" style="font-size:60px">⚡</span></div>
   <div class="c" style="left:80%;transform:translate(-50%,-50%) scale(.6)">${bat('10%','96%',2.2,'#43d36b')}</div>
   <div class="cap"><b>Chăm sóc trái tim</b> mỗi ngày</div></div>`],
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
