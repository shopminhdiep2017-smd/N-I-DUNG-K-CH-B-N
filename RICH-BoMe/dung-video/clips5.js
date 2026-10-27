const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs'),cp=require('child_process');
const S=process.argv[2], OUT=S+'/v5/clips', F=S+'/fonts/';
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
@keyframes twinkle{0%,100%{opacity:.2}50%{opacity:1}}
`;
const bat=(a,b,dur,col,extra='')=>`<div style="position:relative;width:250px;height:110px;border:9px solid #fff;border-radius:20px;box-sizing:border-box">
 <div style="position:absolute;right:-30px;top:30px;width:18px;height:34px;background:#fff;border-radius:0 8px 8px 0"></div>
 <div style="position:absolute;left:8px;top:8px;bottom:8px;border-radius:8px;background:${col};--a:${a};--b:${b};animation:drain ${dur}s ease-in-out forwards;${extra}"></div></div>`;
const bg=(c1,c2)=>`background:radial-gradient(circle at 50% 40%,${c1},${c2})`;
const R=(d)=>`animation:rise .5s ${d}s both`;
const sc={
 b1:[4.6,`<div class="st" style="${bg('#4a3a2a','#140d08')}">
   <div class="c" style="left:38%"><span class="emo" style="font-size:130px">👵</span></div>
   <div class="c" style="left:62%"><span class="emo" style="font-size:130px">👴</span></div>
   <div style="position:absolute;left:430px;top:40px;${R(1)}"><span class="emo" style="font-size:70px">😮‍💨</span></div>
   <div class="cap" style="font-size:30px">Bố mẹ hay <b>mỏi người</b>, ngại đi lại</div></div>`],
 b2:[2.2,`<div class="st" style="${bg('#13204a','#04060f')}">
   <div class="c"><span class="emo" style="font-size:150px">😴</span></div>
   ${[0,0.6,1.2].map(d=>`<div style="position:absolute;left:360px;top:80px;color:#fff;font-weight:800;font-size:44px;animation:zz 1.8s ${d}s infinite">Z</div>`).join('')}
   <div class="cap">Ngủ nhiều mà vẫn <b>uể oải</b></div></div>`],
 b3:[2.7,`<div class="st" style="${bg('#20405a','#0b1622')}">
   <div class="c" style="top:44%;width:330px;height:150px;background:linear-gradient(135deg,#dfe6ee,#9fb0c2);border-radius:18px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(2,1fr);place-items:center">
   ${Array.from({length:8},(_,i)=>`<div style="width:46px;height:46px;border-radius:50%;background:${i%2?'#fff':'#ffd2d2'};box-shadow:inset 0 -6px 0 #d0d6de;animation:pop 1.1s ${0.1+i*0.22}s both"></div>`).join('')}</div>
   <div class="cap">Uống thuốc <b>huyết áp, mỡ máu</b></div></div>`],
 b4:[6.4,`<div class="st" style="${bg('#2a3f5a','#0b121c')}">
   <div style="position:absolute;left:50px;top:70px"><span class="emo" style="font-size:110px">🏙️</span></div>
   <div style="position:absolute;right:50px;top:70px"><span class="emo" style="font-size:110px">🏡</span></div>
   <div style="position:absolute;left:190px;right:190px;top:125px;border-top:6px dashed #fff;opacity:.7"></div>
   <div class="c" style="top:36%;${R(0.8)}"><span class="emo" style="font-size:80px;animation:ring .6s 1s infinite">📱</span></div>
   <div class="cap" style="font-size:29px">Con ở xa, chỉ biết <b>gọi điện hỏi thăm</b></div></div>`],
 b5:[3.6,`<div class="st" style="${bg('#4a2a3a','#140810')}">
   <div class="c" style="left:28%;top:48%"><span class="emo" style="font-size:140px">👵</span></div>
   <div style="position:absolute;left:250px;top:60px;background:#fff;color:#222;font-weight:800;font-size:32px;padding:18px 24px;border-radius:24px;${R(0.3)}">“Bố mẹ khỏe,<br>con đừng lo!”</div>
   <div class="cap">Bố mẹ <b>luôn nói là khỏe</b></div></div>`],
 b6:[2.2,`<div class="st" style="${bg('#4a3a10','#161004')}">
   <div class="c" style="animation:flip 2s ease-in-out infinite"><span class="emo" style="font-size:140px">⏳</span></div>
   <div class="cap">Tuổi tác <b>không biết nói dối</b></div></div>`],
 b7:[4.1,`<div class="st" style="${bg('#3a2a55','#120c1c')}">
   <div class="c"><span class="emo" style="font-size:150px">🤫</span></div>
   <div class="cap">Người lớn tuổi <b>thường giấu</b> mệt</div></div>`],
 b8:[12.3,`<div class="st" style="${bg('#1f3a5a','#08111c')}">
   <div style="position:absolute;left:0;right:0;top:22px;text-align:center"><span class="q" style="font-size:30px;position:relative">Bố mẹ có khỏe không?<span style="position:absolute;left:-6px;right:-6px;top:50%;height:6px;background:#e53935;transform:scaleX(0);transform-origin:left;animation:grow2 .5s 4.2s forwards"></span></span></div>
   <div style="position:absolute;left:40px;top:100px">
    <div style="${R(5.85)}"><span class="q">🌙 Đêm qua ngủ có ngon không?</span></div>
    <div style="${R(7.7)}"><span class="q">🚶 Sáng nay đi bộ được không?</span></div>
    <div style="${R(9.68)}"><span class="q">🍚 Bữa trưa ăn có ngon miệng không?</span></div></div>
   <div class="cap" style="font-size:30px">Hãy hỏi <b>cụ thể hơn</b></div></div>`],
 b9:[4.1,`<div class="st" style="${bg('#14502a','#04140a')}">
   <div class="c" style="left:42%"><span class="emo" style="font-size:110px">❤️</span></div>
   <div class="c" style="left:58%;top:40%;animation:bob 1.2s infinite"><span class="emo" style="font-size:120px">🔍</span></div>
   <div class="cap" style="font-size:29px">Hỏi cụ thể – <b>biết rõ sức khỏe thật</b></div></div>`],
 b10:[24.4,`<div class="st" style="${bg('#14502a','#04140a')}">
   <div style="position:absolute;left:0;right:0;top:26px;text-align:center;color:#fff;font-weight:800;font-size:34px">4 việc giúp bố mẹ khỏe hơn</div>
   <div style="position:absolute;left:24px;right:24px;top:100px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
    ${[['💧','Uống đủ<br>nước'],['🚶','Đi bộ<br>15–20 phút'],['🥗','Ăn đủ<br>cá, trứng, rau'],['🏥','Khám<br>định kỳ']].map(([e,l],i)=>`<div class="box off" id="x${i}"><div class="emo" style="font-size:54px">${e}</div><div>0${i+1}</div><div style="font-size:19px;margin-top:4px">${l}</div></div>`).join('')}</div>
   <div class="cap" style="font-size:30px" id="cp">Có <b>4 việc</b> rất quan trọng</div></div>`,(t)=>{const T=[3.68,8.61,14.42,19.66];let a=-1;T.forEach((x,i)=>{if(t>=x)a=i});for(let i=0;i<4;i++){const e=document.getElementById('x'+i);e.className='box '+(a<0?'':i==a?'on':i<a?'':'off')}}],
 b11:[8.8,`<div class="st" style="${bg('#5a3a1c','#1b1008')}">
   <div class="c" style="top:42%;width:360px;height:220px;border-radius:50%;background:radial-gradient(circle,#ffd7c9,#f19c8b);border:6px solid #e0715f">
    <div style="position:absolute;left:60px;top:70px;width:70px;height:70px;border-radius:50%;background:#b55b6e"></div>
    ${[[190,40],[240,120],[160,140],[270,60]].map(([x,y],i)=>`<div style="position:absolute;left:${x}px;top:${y}px;animation:glow 1.4s ${i*0.3}s infinite"><span class="emo" style="font-size:48px">🔋</span></div>`).join('')}</div>
   <div class="cap" style="font-size:30px"><b>Coenzyme Q10</b> – cục pin của tế bào</div></div>`],
 b12:[4.4,`<div class="st" style="${bg('#4a3a10','#161004')}">
   <div class="c" style="left:28%;color:#fff;font-weight:800;font-size:90px">60+</div>
   <div class="c" style="left:70%;transform:translate(-50%,-50%) scale(.7)">${bat('90%','12%',3,'#e53935','animation:drain 3s ease-in-out forwards, blink .5s 3s infinite')}</div>
   <div class="cap">Sau tuổi 60, <b>pin sụt giảm nhiều</b></div></div>`],
 b13:[6.1,`<div class="st" style="${bg('#3a2a55','#120c1c')}">
   <div class="c" style="left:32%"><span class="emo" style="font-size:130px">🧓</span></div>
   <div style="position:absolute;left:150px;top:30px;${R(0.6)}"><span class="emo" style="font-size:60px">😩</span></div>
   <div class="c" style="left:70%"><span class="emo" style="font-size:110px">🍲</span></div>
   <div class="cap" style="font-size:30px">Dễ mệt mỏi <b>dù ăn uống đủ</b></div></div>`],
 b14:[8.1,`<div class="st" style="${bg('#5a1515','#1a0505')}">
   <div class="c" style="left:30%"><span class="emo" style="font-size:130px">🥩</span></div>
   <div class="c" style="left:70%;color:#fff;font-weight:800;font-size:56px;text-align:center;line-height:1.1">≈ 3 ký<br><span style="font-size:30px">thịt bò / ngày</span></div>
   <div class="cap" style="font-size:30px">Bù <b>100 mg Q10</b> bằng đồ ăn?</div></div>`],
 b15:[3.8,`<div class="st" style="${bg('#5a1d3a','#1a0812')}">
   <div class="c" style="animation:bob 1s infinite"><span class="emo" style="font-size:150px">🎁</span></div>
   <div class="cap"><b>Món quà</b> cho bố mẹ</div></div>`],
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
