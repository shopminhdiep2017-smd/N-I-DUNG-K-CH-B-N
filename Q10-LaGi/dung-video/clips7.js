const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs'),cp=require('child_process');
const S=process.argv[2], OUT=S+'/v7/clips', F=S+'/fonts/';
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
 q1:[5.7,`<div class="st" style="${bg('#1f3a5a','#08111c')}">
   <div class="c" style="left:36%"><span class="emo" style="font-size:150px;animation:bob 1s infinite">❓</span></div>
   <div class="c" style="left:66%;color:#ffe14d;font-weight:800;font-size:90px;${R(0.3)}">Q10</div>
   <div class="cap"><b>Coenzyme Q10</b> là gì?</div></div>`],
 q2:[4.7,`<div class="st" style="${bg('#14502a','#04140a')}">
   <div class="c" style="top:42%"><span class="emo" style="font-size:170px">🧍</span></div>
   <div class="c" style="top:38%;width:70px;height:70px;border-radius:50%;background:radial-gradient(circle,#ffe14d,rgba(255,225,77,0));animation:glow 1.2s infinite"></div>
   <div class="cap">Q10 <b>có sẵn trong cơ thể</b></div></div>`],
 q3:[3.3,`<div class="st" style="${bg('#5a3a1c','#1b1008')}">
   <div class="c" style="top:42%;width:360px;height:220px;border-radius:50%;background:radial-gradient(circle,#ffd7c9,#f19c8b);border:6px solid #e0715f">
    <div style="position:absolute;left:60px;top:70px;width:70px;height:70px;border-radius:50%;background:#b55b6e"></div>
    ${[[190,40],[240,120],[160,140],[270,60]].map(([x,y],i)=>`<div style="position:absolute;left:${x}px;top:${y}px;animation:glow 1.4s ${i*0.3}s infinite"><span class="emo" style="font-size:48px">🔋</span></div>`).join('')}</div>
   <div class="cap" style="font-size:30px">Cung cấp <b>năng lượng</b> cho tế bào</div></div>`],
 q4:[6.3,`<div class="st" style="${bg('#5a1d3a','#1a0812')}">
   <div style="position:absolute;left:0;right:0;top:26px;text-align:center;color:#fff;font-weight:800;font-size:34px">Đặc biệt cần cho</div>
   <div style="position:absolute;left:50px;right:50px;top:95px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
    ${[['❤️','Tim'],['💪','Cơ bắp'],['🧠','Não bộ']].map(([e,l],i)=>`<div class="box off" id="x${i}"><div class="emo" style="font-size:64px">${e}</div><div style="font-size:26px;margin-top:6px">${l}</div></div>`).join('')}</div>
   <div class="cap" style="font-size:30px">Tim, cơ bắp và <b>não bộ</b></div></div>`,(t)=>{const T=[0,1.94,2.9];let a=0;T.forEach((x,i)=>{if(t>=x)a=i});for(let i=0;i<3;i++){document.getElementById('x'+i).className='box '+(i==a?'on':i<a?'':'off')}}],
 q5:[7.6,`<div class="st" style="${bg('#4a3a10','#161004')}">
   <div class="c" style="left:24%"><span class="emo" style="font-size:110px">⏳</span></div>
   <div class="c" style="left:50%;${R(2.4)}"><span class="emo" style="font-size:110px">💻</span></div>
   <div class="c" style="left:76%;${R(4.3)}"><span class="emo" style="font-size:110px">😫</span></div>
   <div class="cap" style="font-size:30px">Tuổi tác, <b>căng não, căng sức</b></div></div>`],
 q6:[6.3,`<div class="st" style="${bg('#3a2a55','#120c1c')}">
   <div class="c" style="transform:translate(-50%,-50%) scale(.85)">${bat('85%','10%',4,'#e53935','animation:drain 4s ease-in-out forwards, blink .5s 4s infinite')}</div>
   <div class="cap">Thiếu hụt <b>năng lượng</b></div></div>`],
 q7:[3.9,`<div class="st" style="${bg('#3a2a55','#120c1c')}">
   <div class="c"><span class="emo" style="font-size:150px">😩</span></div>
   ${[0,0.6,1.2].map(d=>`<div style="position:absolute;left:370px;top:70px;color:#fff;font-weight:800;font-size:40px;animation:zz 1.8s ${d}s infinite">z</div>`).join('')}
   <div class="cap"><b>Uể oải</b>, mệt mỏi</div></div>`],
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
