const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs'),path=require('path');
const S=process.argv[2], OUT=S+'/v2/cards';
const F=S+'/fonts/';
const css=`
@font-face{font-family:BVP;src:url(file://${F}BeVietnamPro-SemiBold.ttf);font-weight:600}
@font-face{font-family:BVP;src:url(file://${F}BeVietnamPro-Bold.ttf);font-weight:700}
@font-face{font-family:BVP;src:url(file://${F}BeVietnamPro-ExtraBold.ttf);font-weight:800}
@font-face{font-family:PF;src:url(file://${F}PlayfairDisplay.ttf);font-weight:400 900}
html,body{margin:0;background:transparent}
#w{display:inline-block;padding:20px 30px 40px}
.card{width:900px;box-sizing:border-box;background:#f8f4ed;border-radius:26px;padding:30px 40px 40px;box-shadow:0 14px 34px rgba(0,0,0,.28);text-align:center;position:relative;font-family:BVP;color:#1f1f1f}
.card:after{content:"";position:absolute;left:50%;bottom:0;width:160px;height:6px;margin-left:-80px;background:var(--ac);border-radius:3px 3px 0 0}
.k{font-weight:700;font-size:25px;letter-spacing:5px;color:var(--ac);text-transform:uppercase;margin-bottom:6px}
.t{font-family:PF;font-weight:800;font-size:60px;line-height:1.15}
.s{font-weight:700;font-size:30px;margin-top:12px;color:#333}
.s.red{color:var(--ac)}
.boxes{display:flex;gap:16px;margin-top:22px}
.b{flex:1;background:#fff;border:2px solid #e2ddd4;border-radius:16px;padding:16px 8px 18px}
.b .n{font-family:PF;font-weight:800;font-size:46px}
.b .l{font-weight:700;font-size:25px;line-height:1.25;margin-top:4px}
.b.on{background:var(--soft);border-color:var(--ac);color:var(--ac)}
.b.off{opacity:.33}
.list{text-align:left;margin:18px 0 0 30px}
.li{font-weight:700;font-size:32px;margin:12px 0;display:flex;align-items:center;gap:18px}
.dot{width:26px;height:26px;border-radius:50%;border:3px solid #999;box-sizing:border-box;flex:none}
.li.on .dot{background:var(--ac);border-color:var(--ac)}
.li.ck .dot{background:#2f8f4e;border-color:#2f8f4e;position:relative}
.li.ck .dot:after{content:"";position:absolute;left:7px;top:2px;width:7px;height:13px;border:solid #fff;border-width:0 4px 4px 0;transform:rotate(45deg)}
.li.off{opacity:.3}
.ill{display:flex;justify-content:center;align-items:center;gap:30px;margin:6px 0 4px}
.emo{font-family:'Noto Color Emoji';font-size:120px;line-height:1.1}
.img{width:100%;height:420px;border-radius:18px;background:none center 45%/cover}
.cap{font-weight:800;font-size:34px;margin-top:18px}
.cap2{font-weight:700;font-size:28px;color:var(--ac);margin-top:6px}
.vs{display:flex;gap:18px;margin-top:20px;align-items:stretch}
.vs .b{padding:14px 10px}
.vs .emo{font-size:80px}
`;
const red='--ac:#b3202a;--soft:#fbe4e6', green='--ac:#2f7d4b;--soft:#e2f2e6', pink='--ac:#c2185b;--soft:#fce4ef', gold='--ac:#a86b00;--soft:#fff1d6';
const card=(v,inner)=>`<div class="card" style="${v}">${inner}</div>`;
const K=t=>t?`<div class="k">${t}</div>`:'', T=t=>`<div class="t">${t}</div>`;
const boxes=(items,act)=>`<div class="boxes">${items.map((x,i)=>`<div class="b ${i==act?'on':i>act?'off':''}"><div class="n">0${i+1}</div><div class="l">${x}</div></div>`).join('')}</div>`;
const list=(items,n,cls='on')=>`<div class="list">${items.map((x,i)=>`<div class="li ${i<n?cls:'off'}"><span class="dot"></span>${x}</div>`).join('')}</div>`;
const cell=`<svg width="300" height="190" viewBox="0 0 300 190"><ellipse cx="150" cy="95" rx="140" ry="85" fill="#fde2e4" stroke="#e58a95" stroke-width="5"/><circle cx="105" cy="85" r="30" fill="#c86b7a" opacity=".85"/>${[[190,60],[215,120],[150,145],[70,135],[240,80]].map(([x,y])=>`<g transform="translate(${x},${y}) rotate(${x%60})"><ellipse rx="26" ry="13" fill="#f4a259" stroke="#c76b1e" stroke-width="3"/><path d="M-18 0 q6 -9 12 0 t12 0 t12 0" fill="none" stroke="#c76b1e" stroke-width="2.5"/></g>`).join('')}</svg>`;
const bat=(lvl,col)=>`<svg width="300" height="150" viewBox="0 0 300 150"><rect x="10" y="20" width="250" height="110" rx="18" fill="#fff" stroke="#333" stroke-width="8"/><rect x="262" y="50" width="22" height="50" rx="6" fill="#333"/><rect x="24" y="34" width="${222*lvl}" height="82" rx="10" fill="${col}"/>${lvl>.5?'<path d="M140 40 l-24 42 h22 l-10 32 l34 -46 h-22 l12 -28z" fill="#fff"/>':''}</svg>`;
const B=(items,act)=>`<div class="boxes">${items.map((x,i)=>`<div class="b ${act<0?'':i==act?'on':i>act?'off':''}"><div class="n">0${i+1}</div><div class="l">${x}</div></div>`).join('')}</div>`;
const E=(e,sz)=>`<span class="emo" style="font-size:${sz||120}px">${e}</span>`;
const L1=['Hay quên','Đầu óc lơ mơ','Có nên uống gì bổ não?'];
const L2=['Huyết áp cao','Mỡ máu cao','Đường huyết cao'];
const L3=['Thiếu ngủ','Căng thẳng','Rối loạn tuyến giáp','Thiếu vi chất'];
const X4=['Đo huyết áp<br>định kỳ','Kiểm tra mỡ máu, đường huyết','Vận động,<br>ngủ đủ giấc','Bớt mặn, bớt đồ chế biến'];
const H={
 a1:card(red,K('Muốn não minh mẫn')+`<div class="ill">${E('🧠')}${E('❤️',100)}</div>`+T('Hãy chăm sóc<br>trái tim trước')),
 b1:card(red,T('Dạo này…')+list(L1,1)), b2:card(red,T('Dạo này…')+list(L1,2)), b3:card(red,T('Dạo này…')+list(L1,3)),
 c1:card(red,K('Nhưng thực tế')+`<div class="ill">${E('❤️',100)}</div>`+T('Ít ai nghĩ đến trái tim')),
 d1:card(gold,T('Bộ não')+B(['Nặng chỉ khoảng<br>2% cơ thể','Dùng khoảng<br>1/5 lượng oxy'],0)),
 d2:card(gold,T('Bộ não')+B(['Nặng chỉ khoảng<br>2% cơ thể','Dùng khoảng<br>1/5 lượng oxy'],1)),
 e1:card(red,`<div class="ill">${E('🫀')}<span class="emo" style="font-size:70px">➡️</span>${E('🧠')}</div><div class="cap">Máu mang oxy lên não<br>đều do tim bơm lên</div>`),
 f0:card(pink,T('Hình dung đơn giản')+B(['Tim<br>= máy bơm','Mạch máu<br>= đường ống','Não<br>= nơi nhận'],-1)),
 f1:card(pink,T('Hình dung đơn giản')+B(['Tim<br>= máy bơm','Mạch máu<br>= đường ống','Não<br>= nơi nhận'],0)),
 f2:card(pink,T('Hình dung đơn giản')+B(['Tim<br>= máy bơm','Mạch máu<br>= đường ống','Não<br>= nơi nhận'],1)),
 f3:card(pink,T('Hình dung đơn giản')+B(['Tim<br>= máy bơm','Mạch máu<br>= đường ống','Não<br>= nơi nhận'],2)),
 g1:card(red,K('Kéo dài sẽ hại mạch máu não')+list(L2,1)), g2:card(red,K('Kéo dài sẽ hại mạch máu não')+list(L2,2)), g3:card(red,K('Kéo dài sẽ hại mạch máu não')+list(L2,3)),
 h1:card(red,K('Lâu ngày')+T('Tăng nguy cơ')+B(['Đột quỵ','Suy giảm<br>trí nhớ'],0)),
 h2:card(red,K('Lâu ngày')+T('Tăng nguy cơ')+B(['Đột quỵ','Suy giảm<br>trí nhớ'],1)),
 i0:card(gold,K('Tuy vậy')+T('Hay quên có<br>nhiều nguyên nhân')),
 i1:card(gold,T('Có thể do')+list(L3,1)), i2:card(gold,T('Có thể do')+list(L3,2)), i3:card(gold,T('Có thể do')+list(L3,3)), i4:card(gold,T('Có thể do')+list(L3,4)),
 j1:card(green,K('Không phải cứ quên là do tim mạch')+`<div class="ill">${E('🫀',100)}</div>`),
 j2:card(green,K('Không phải cứ quên là do tim mạch')+`<div class="ill">${E('🫀',100)}</div>`+T('Chăm sóc tim mạch:<br>cách thiết thực nhất')),
 k0:card(green,T('Bắt đầu từ việc nhỏ')+B(X4,-1)),
 k1:card(green,T('Bắt đầu từ việc nhỏ')+B(X4,0)), k2:card(green,T('Bắt đầu từ việc nhỏ')+B(X4,1)),
 k3:card(green,T('Bắt đầu từ việc nhỏ')+B(X4,2)), k4:card(green,T('Bắt đầu từ việc nhỏ')+B(X4,3)),
};
const st=JSON.parse(fs.readFileSync(S+'/v2/states.json')).map(x=>[x.id,x.s,x.e,x.f,H[x.id]]);
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'}).catch(()=>chromium.launch());
 const p=await b.newPage({viewport:{width:1000,height:1200}});
 const meta=[];
 for(const [id,s,e,f,h] of st){
  fs.writeFileSync(OUT+'/tmp.html',`<html><head><meta charset=utf-8><style>${css}</style></head><body><div id="w">${h}</div></body></html>`); await p.goto('file://'+OUT+'/tmp.html'); await p.waitForLoadState('load');
  await p.evaluate(()=>document.fonts.ready);
  await p.locator('#w').screenshot({path:`${OUT}/${id}.png`,omitBackground:true});
  meta.push({id,s,e,f});
 }
 fs.writeFileSync(OUT+'/cards.json',JSON.stringify(meta));
 await b.close();
})();
