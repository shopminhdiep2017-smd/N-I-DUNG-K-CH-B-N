const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs'),cp=require('child_process');
const S=process.argv[2], OUT=S+'/v6/clips', F=S+'/fonts/';
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
@keyframes twinkle{0%,100%{opacity:.2}50%{opacity:1}}
`;
const bat=(a,b,dur,col,extra='')=>`<div style="position:relative;width:250px;height:110px;border:9px solid #fff;border-radius:20px;box-sizing:border-box">
 <div style="position:absolute;right:-30px;top:30px;width:18px;height:34px;background:#fff;border-radius:0 8px 8px 0"></div>
 <div style="position:absolute;left:8px;top:8px;bottom:8px;border-radius:8px;background:${col};--a:${a};--b:${b};animation:drain ${dur}s ease-in-out forwards;${extra}"></div></div>`;
const bg=(c1,c2)=>`background:radial-gradient(circle at 50% 40%,${c1},${c2})`;
const R=(d)=>`animation:rise .5s ${d}s both`;
const sc={
 d1:[5.9,`<div class="st" style="${bg('#4a3a2a','#140d08')}">
   <div class="c" style="left:38%"><span class="emo" style="font-size:150px">🪞</span></div>
   <div class="c" style="left:62%;${R(0.5)}"><span class="emo" style="font-size:120px">😟</span></div>
   <div class="cap" style="font-size:30px">Da <b>xỉn màu</b>, <b>nếp nhăn</b> rõ hơn</div></div>`],
 d2:[6.6,`<div class="st" style="${bg('#4a2a3a','#140810')}">
   ${['🧴','🫙','🧴'].map((e,i)=>`<div class="c" style="left:${28+i*22}%;${R(0.2+i*0.3)}"><span class="emo" style="font-size:100px">${e}</span></div>`).join('')}
   <div style="position:absolute;right:40px;top:30px;${R(1.4)}"><span class="emo" style="font-size:70px">💸</span></div>
   <div class="cap" style="font-size:30px">Kem đắt tiền <b>vẫn chưa cải thiện</b></div></div>`],
 d3:[5.9,`<div class="st" style="${bg('#5a3a10','#1a1004')}">
   <div class="c"><span class="emo" style="font-size:150px;animation:bob 1s infinite">⚠️</span></div>
   <div class="cap" style="font-size:30px">Thói quen nhỏ khiến da <b>lão hóa nhanh</b></div></div>`],
 d4:[30.9,`<div class="st" style="${bg('#5a1d3a','#1a0812')}">
   <div style="position:absolute;left:0;right:0;top:26px;text-align:center;color:#fff;font-weight:800;font-size:34px">5 điều giữ da trẻ lâu</div>
   <div style="position:absolute;left:16px;right:16px;top:100px;display:grid;grid-template-columns:repeat(5,1fr);gap:9px">
    ${[['☀️','Chống<br>nắng'],['😴','Ngủ<br>trước 11h'],['💧','Uống<br>đủ nước'],['🧼','Rửa mặt<br>nhẹ nhàng'],['🥦','Rau xanh,<br>trái cây']].map(([e,l],i)=>`<div class="box off" id="x${i}"><div class="emo" style="font-size:46px">${e}</div><div>0${i+1}</div><div style="font-size:17px;margin-top:4px">${l}</div></div>`).join('')}</div>
   <div class="cap" style="font-size:30px"><b>5 điều đơn giản</b> giữ da trẻ lâu</div></div>`,(t)=>{const T=[4.38,12.67,17.9,21.62,26.49];let a=-1;T.forEach((x,i)=>{if(t>=x)a=i});for(let i=0;i<5;i++){document.getElementById('x'+i).className='box '+(a<0?'':i==a?'on':i<a?'':'off')}}],
 d5:[2.5,`<div class="st" style="${bg('#3a2a55','#120c1c')}">
   <div class="c" style="left:40%"><span class="emo" style="font-size:130px">🧴</span></div>
   <div class="c" style="left:64%;${R(0.4)}"><span class="emo" style="font-size:100px">❌</span></div>
   <div class="cap" style="font-size:30px">Chăm bên ngoài thôi <b>chưa đủ</b></div></div>`],
 d6:[5.8,`<div class="st" style="${bg('#5a3a1c','#1b1008')}">
   <div class="c" style="top:42%;width:360px;height:220px;border-radius:50%;background:radial-gradient(circle,#ffe3d6,#f3b39e);border:6px solid #e08a70">
    <div style="position:absolute;left:60px;top:70px;width:70px;height:70px;border-radius:50%;background:#c27a6a"></div>
    ${[[190,40],[240,120],[160,140],[270,60]].map(([x,y],i)=>`<div style="position:absolute;left:${x}px;top:${y}px;animation:glow 1.4s ${i*0.3}s infinite"><span class="emo" style="font-size:48px">🔋</span></div>`).join('')}</div>
   <div class="cap" style="font-size:29px">Tế bào da cần năng lượng – <b>Q10</b></div></div>`],
 d7:[3.1,`<div class="st" style="${bg('#4a3a10','#161004')}">
   <div class="c" style="left:28%;color:#fff;font-weight:800;font-size:90px">30+</div>
   <div class="c" style="left:70%;transform:translate(-50%,-50%) scale(.7)">${bat('90%','25%',2.6,'#ffb300')}</div>
   <div class="cap">Từ tuổi 30, <b>Q10 giảm dần</b></div></div>`],
 d8:[4.4,`<div class="st" style="${bg('#5a1515','#1a0505')}">
   <div class="c" style="top:46%"><span class="emo" style="font-size:120px">😣</span></div>
   ${[['☀️',40,30,'150px','90px'],['💨',440,30,'-150px','90px'],['💥',40,200,'150px','-40px'],['⚡',460,200,'-150px','-40px']].map(([e,x,y,dx,dy],i)=>`<div style="position:absolute;left:${x}px;top:${y}px;--dx:${dx};--dy:${dy};animation:hit 1.3s ${i*0.3}s infinite"><span class="emo" style="font-size:64px">${e}</span></div>`).join('')}
   <div class="cap" style="font-size:29px">Gốc tự do, nắng, bụi, căng thẳng</div></div>`],
 d9:[6.9,`<div class="st" style="${bg('#3a2a55','#120c1c')}">
   <div class="c" style="left:30%;transform:translate(-50%,-50%) scale(.6)">${bat('50%','10%',2,'#e53935','animation:drain 2s ease-in-out forwards, blink .5s 2s infinite')}</div>
   <div class="c" style="left:70%"><span class="emo" style="font-size:120px">🛡️</span></div>
   <div class="c" style="left:70%;color:#e53935;font-weight:800;font-size:120px;animation:crack 1.6s forwards">✕</div>
   <div class="cap" style="font-size:29px">Thiếu năng lượng, <b>thiếu bảo vệ</b></div></div>`],
 d10:[4.4,`<div class="st" style="${bg('#5a1d3a','#1a0812')}">
   <div class="c" style="animation:glow 1.4s infinite"><span class="emo" style="font-size:140px">😊</span></div>
   ${[[150,60],[420,70],[130,200],[440,190]].map(([x,y],i)=>`<div style="position:absolute;left:${x}px;top:${y}px;animation:twinkle 1.2s ${i*0.3}s infinite"><span class="emo" style="font-size:50px">✨</span></div>`).join('')}
   <div class="cap"><b>Chăm da từ bên trong</b></div></div>`],
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
