const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs'),path=require('path');
const S=process.argv[2], OUT=S+'/cards';
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
.img{width:100%;height:420px;border-radius:18px;background:url(file://${OUT}/product.jpg) center 45%/cover}
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
const st=[
 ['a1',0.74,6.10,1,card(red,K('Thói quen mỗi ngày')+`<div class="ill"><span class="emo">☕</span></div>`+T('Cà phê để tỉnh táo?'))],
 ['a2',6.10,6.98,1,card(red,T('Mỗi ngày 2 ly')+boxes(['Sáng 1 ly','Chiều 1 ly','≈ 1 triệu<br>/tháng'],0))],
 ['a3',6.98,8.85,0,card(red,T('Mỗi ngày 2 ly')+boxes(['Sáng 1 ly','Chiều 1 ly','≈ 1 triệu<br>/tháng'],1))],
 ['a4',8.85,10.50,0,card(red,T('Mỗi ngày 2 ly')+boxes(['Sáng 1 ly','Chiều 1 ly','≈ 1 triệu<br>/tháng'],2))],
 ['b1',10.50,14.82,1,card(red,T('Hết tác dụng thì…')+list(['Cơn mệt lại quay về','Tối khó ngủ','Sáng dậy không nổi'],1))],
 ['b2',14.82,16.10,0,card(red,T('Hết tác dụng thì…')+list(['Cơn mệt lại quay về','Tối khó ngủ','Sáng dậy không nổi'],2))],
 ['b3',16.10,19.69,0,card(red,T('Hết tác dụng thì…')+list(['Cơn mệt lại quay về','Tối khó ngủ','Sáng dậy không nổi'],3))],
 ['c1',19.69,24.74,1,card(gold,K('Ngày này qua ngày khác')+T('Trả tiền để<br>“mượn” năng lượng'))],
 ['c2',24.74,27.54,0,card(gold,K('Ngày này qua ngày khác')+T('Trả tiền để<br>“mượn” năng lượng')+`<div class="s red">…chứ không tạo ra năng lượng thật</div>`)],
 ['d1',27.54,30.36,1,card(pink,`<div class="ill">${cell}</div><div class="cap">Cái thiếu thật sự: bên trong tế bào</div>`)],
 ['d2',30.36,32.58,0,card(pink,`<div class="ill">${cell}</div><div class="cap">Đó là Coenzyme Q10</div>`)],
 ['e1',32.58,34.58,1,card(green,`<div class="ill">${bat(1,'#3fae5f')}</div><div class="cap">Q10: “cục pin” tạo năng lượng</div>`)],
 ['e2',34.58,37.50,0,card(red,`<div class="ill">${bat(.18,'#d23a3a')}</div><div class="cap">Từ tuổi 30: “cục pin” yếu dần</div>`)],
 ['f1',37.50,42.55,1,card(red,K('Bù lại bằng ăn uống?')+`<div class="ill"><span class="emo">🥩</span></div>`+T('≈ 3 kg thịt bò/ngày'))],
 ['g1',42.55,44.73,1,card(green,K('Chỉ với')+T('Chưa tới 50.000đ<br>mỗi ngày'))],
 ['g2',44.73,47.57,0,card(green,K('Chỉ với')+T('Chưa tới 50.000đ<br>mỗi ngày')+`<div class="s red">= tiền 2 ly cà phê ☕☕</div>`)],
 ['h1',47.57,49.88,1,card(pink,`<div class="img"></div><div class="cap">2 viên RICH Coenzyme Q10</div>`)],
 ['h2',49.88,51.36,0,card(pink,`<div class="img"></div><div class="cap">2 viên RICH Coenzyme Q10</div><div class="cap2">AFC – Nhật Bản</div>`)],
 ['h3',51.36,52.92,0,card(pink,`<div class="img"></div><div class="cap">2 viên RICH Coenzyme Q10</div><div class="cap2">Dùng sau bữa ăn sáng</div>`)],
 ['i1',52.92,54.17,1,card(green,T('Hai viên mỗi ngày')+boxes(['2 viên','100 mg<br>Q10','≈ 3 kg<br>thịt bò'],0))],
 ['i2',54.17,56.92,0,card(green,T('Hai viên mỗi ngày')+boxes(['2 viên','100 mg<br>Q10','≈ 3 kg<br>thịt bò'],1))],
 ['i3',56.92,59.00,0,card(green,T('Hai viên mỗi ngày')+boxes(['2 viên','100 mg<br>Q10','≈ 3 kg<br>thịt bò'],2))],
 ['j1',59.00,61.47,1,card(green,T('Thành phần nổi bật')+list(['Q10 dạng khử – dễ hấp thu','Astaxanthin – chống oxy hóa','Tiêu đen – hấp thu tốt hơn'],1,'ck'))],
 ['j2',61.47,65.44,0,card(green,T('Thành phần nổi bật')+list(['Q10 dạng khử – dễ hấp thu','Astaxanthin – chống oxy hóa','Tiêu đen – hấp thu tốt hơn'],2,'ck'))],
 ['j3',65.44,67.93,0,card(green,T('Thành phần nổi bật')+list(['Q10 dạng khử – dễ hấp thu','Astaxanthin – chống oxy hóa','Tiêu đen – hấp thu tốt hơn'],3,'ck'))],
 ['k1',67.93,71.61,1,card(pink,K('Một hộp RICH')+T('120 viên')+`<div class="s red">Dùng được trong 2 tháng</div>`)],
 ['l1',71.61,76.01,1,card(gold,T('Cùng một số tiền')+`<div class="vs"><div class="b on"><div class="emo">☕☕</div><div class="l">2 ly cà phê<br>tỉnh táo vài tiếng</div></div><div class="b off"><div class="emo">🔋</div><div class="l">2 viên Q10<br>sạc lại “pin” cơ thể</div></div></div>`)],
 ['l2',76.01,80.67,0,card(gold,T('Cùng một số tiền')+`<div class="vs"><div class="b off"><div class="emo">☕☕</div><div class="l">2 ly cà phê<br>tỉnh táo vài tiếng</div></div><div class="b on" style="--ac:#2f7d4b;--soft:#e2f2e6"><div class="emo">🔋</div><div class="l">2 viên Q10<br>sạc lại “pin” cơ thể</div></div></div>`)],
 ['m1',80.67,83.67,1,card(pink,K('Mỗi ngày cô chú nhé')+T('Đổi 2 ly cà phê<br>lấy 2 viên Q10'))],
 ['n1',83.67,87.67,1,card(gold,`<div class="t" style="color:#a86b00">⚠ Lưu ý</div><div class="s">Thực phẩm này không phải là thuốc,<br>không có tác dụng thay thế thuốc chữa bệnh</div>`)],
 ['o1',87.67,90.30,1,card(pink,K('RICH Coenzyme Q10')+T('Cảm ơn cô chú<br>anh chị đã theo dõi!'))],
];
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
