// Tạo 10 hình ảnh minh họa (1080x1350) cho "10 quy tắc sống khỏe, sống thọ".
// Chạy: node generate.js  -> xuất PNG vào thư mục ./images
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const NO = (x, y, r = 46) => `
  <g transform="translate(${x},${y})">
    <circle r="${r}" fill="#E5383B" stroke="#fff" stroke-width="8"/>
    <path d="M${-r * 0.4} ${-r * 0.4} L${r * 0.4} ${r * 0.4} M${r * 0.4} ${-r * 0.4} L${-r * 0.4} ${r * 0.4}" stroke="#fff" stroke-width="${r * 0.22}" stroke-linecap="round"/>
  </g>`;

const clock = (x, y, r, h, m, face = '#fff', ink = '#1d3557') => {
  const ha = ((h % 12) + m / 60) * 30 - 90, ma = m * 6 - 90;
  const rad = a => (a * Math.PI) / 180;
  let ticks = '';
  for (let i = 0; i < 12; i++) {
    const a = rad(i * 30);
    ticks += `<line x1="${Math.cos(a) * r * 0.78}" y1="${Math.sin(a) * r * 0.78}" x2="${Math.cos(a) * r * 0.9}" y2="${Math.sin(a) * r * 0.9}" stroke="${ink}" stroke-width="${i % 3 ? 4 : 8}" stroke-linecap="round"/>`;
  }
  return `<g transform="translate(${x},${y})">
    <circle r="${r}" fill="${face}" stroke="${ink}" stroke-width="12"/>${ticks}
    <line x1="0" y1="0" x2="${Math.cos(rad(ha)) * r * 0.5}" y2="${Math.sin(rad(ha)) * r * 0.5}" stroke="${ink}" stroke-width="12" stroke-linecap="round"/>
    <line x1="0" y1="0" x2="${Math.cos(rad(ma)) * r * 0.72}" y2="${Math.sin(rad(ma)) * r * 0.72}" stroke="#E5383B" stroke-width="8" stroke-linecap="round"/>
    <circle r="10" fill="${ink}"/></g>`;
};

const moon = (x, y, r, bg) => `<g transform="translate(${x},${y})"><circle r="${r}" fill="#FFD166"/><circle cx="${r * 0.45}" cy="${-r * 0.3}" r="${r * 0.85}" fill="${bg}"/></g>`;
const stars = (pts) => pts.map(([x, y, s]) => `<path transform="translate(${x},${y}) scale(${s})" d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3Z" fill="#fff" opacity=".85"/>`).join('');
const drop = (x, y, s, c = '#4CC9F0') => `<path transform="translate(${x},${y}) scale(${s})" d="M0 -30 C14 -10 22 2 22 12 A22 22 0 0 1 -22 12 C-22 2 -14 -10 0 -30Z" fill="${c}"/>`;

const rules = [
  {
    title: 'Không để cơ thể<br>thiếu nước',
    tip: 'Uống đủ 1,5 – 2 lít nước mỗi ngày, chia đều thành nhiều lần, đừng đợi khát mới uống.',
    bg: '#E0F4FF', accent: '#0077B6', dark: '#023E8A',
    art: `
      <ellipse cx="400" cy="560" rx="260" ry="34" fill="#0077B6" opacity=".12"/>
      <path d="M260 120 L540 120 L500 540 Q498 560 478 560 L322 560 Q302 560 300 540 Z" fill="#fff" stroke="#023E8A" stroke-width="12" stroke-linejoin="round"/>
      <path d="M280 260 Q340 240 400 260 T525 258 L502 535 Q500 548 486 548 L314 548 Q300 548 298 535 Z" fill="#4CC9F0"/>
      <path d="M280 260 Q340 240 400 260 T525 258" fill="none" stroke="#0096C7" stroke-width="8"/>
      <rect x="330" y="300" width="22" height="200" rx="11" fill="#fff" opacity=".55"/>
      <circle cx="420" cy="360" r="14" fill="#fff" opacity=".7"/><circle cx="460" cy="430" r="9" fill="#fff" opacity=".7"/><circle cx="400" cy="470" r="11" fill="#fff" opacity=".7"/>
      ${drop(150, 220, 2.2)}${drop(650, 170, 1.6, '#48CAE4')}${drop(660, 400, 2.4, '#00B4D8')}${drop(140, 450, 1.3, '#90E0EF')}
      <g transform="translate(600,560)"><rect x="-70" y="-40" width="140" height="80" rx="40" fill="#023E8A"/><text x="0" y="14" text-anchor="middle" font-size="40" font-weight="800" fill="#fff">2L</text></g>`,
  },
  {
    title: 'Không ăn quá no<br>sau 8 giờ tối',
    tip: 'Ăn tối nhẹ nhàng, cách giờ ngủ 2 – 3 tiếng để dạ dày nghỉ ngơi và giấc ngủ sâu hơn.',
    bg: '#2B2D42', accent: '#FFB703', dark: '#14152B', light: true,
    art: `
      ${moon(140, 130, 70, '#2B2D42')}${stars([[300, 80, 1.4], [660, 90, 1], [720, 240, 1.6], [90, 330, 1]])}
      ${clock(560, 210, 130, 20, 0, '#FFF8E7', '#14152B')}
      <g transform="translate(560,210)"><rect x="-58" y="150" width="116" height="52" rx="26" fill="#FFB703"/><text y="188" text-anchor="middle" font-size="34" font-weight="800" fill="#14152B">20:00</text></g>
      <ellipse cx="290" cy="500" rx="230" ry="60" fill="#fff"/><ellipse cx="290" cy="490" rx="170" ry="40" fill="#EDF2F4"/>
      <path d="M150 470 Q290 300 430 470 Z" fill="#E76F51"/><path d="M190 455 Q290 340 390 455" fill="none" stroke="#F4A261" stroke-width="14"/>
      <circle cx="230" cy="440" r="22" fill="#2A9D8F"/><circle cx="350" cy="430" r="26" fill="#E9C46A"/><circle cx="290" cy="400" r="20" fill="#F4A261"/>
      <path d="M260 340 Q250 300 270 270 M310 340 Q300 300 320 270" stroke="#fff" stroke-width="6" fill="none" opacity=".6" stroke-linecap="round"/>
      ${NO(470, 330, 56)}`,
  },
  {
    title: 'Không thức khuya<br>quá 11 giờ đêm',
    tip: 'Ngủ trước 23h, đủ 7 – 8 tiếng mỗi đêm để cơ thể phục hồi và tái tạo năng lượng.',
    bg: '#3A0CA3', accent: '#F72585', dark: '#240046', light: true,
    art: `
      ${moon(650, 110, 80, '#3A0CA3')}${stars([[100, 100, 1.5], [260, 60, 1], [460, 140, 1.2], [80, 260, 1]])}
      <text x="440" y="250" font-size="70" font-weight="800" fill="#fff" opacity=".9">Z</text><text x="520" y="200" font-size="54" font-weight="800" fill="#fff" opacity=".7">z</text><text x="580" y="160" font-size="40" font-weight="800" fill="#fff" opacity=".5">z</text>
      <rect x="70" y="420" width="600" height="80" rx="20" fill="#7209B7"/>
      <rect x="70" y="340" width="24" height="220" rx="12" fill="#240046"/><rect x="646" y="380" width="24" height="180" rx="12" fill="#240046"/>
      <rect x="110" y="360" width="150" height="70" rx="35" fill="#fff"/>
      <circle cx="210" cy="345" r="50" fill="#FFD6A5"/><path d="M165 330 Q210 270 258 330 Q240 300 210 300 Q180 300 165 330Z" fill="#3D2C2E"/>
      <path d="M190 350 Q198 358 206 350 M220 350 Q228 358 236 350" stroke="#3D2C2E" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M240 380 Q440 330 640 400 L640 440 L240 440Z" fill="#F72585"/>
      ${clock(560, 560, 80, 23, 0, '#fff', '#240046')}
      <g transform="translate(330,590)"><rect x="-80" y="-36" width="160" height="72" rx="36" fill="#F72585"/><text y="14" text-anchor="middle" font-size="40" font-weight="800" fill="#fff">23:00</text></g>`,
  },
  {
    title: 'Không để điện thoại<br>dưới gối khi ngủ',
    tip: 'Đặt điện thoại xa giường, tắt thông báo để ánh sáng và âm thanh không làm gián đoạn giấc ngủ.',
    bg: '#FFF1E6', accent: '#E85D04', dark: '#6A040F',
    art: `
      <ellipse cx="400" cy="560" rx="300" ry="30" fill="#6A040F" opacity=".1"/>
      <path d="M120 360 Q100 250 200 240 L600 240 Q700 250 680 360 Q700 470 600 480 L200 480 Q100 470 120 360Z" fill="#fff" stroke="#6A040F" stroke-width="10"/>
      <path d="M200 300 Q400 280 600 300 M200 420 Q400 440 600 420" stroke="#FFD8BE" stroke-width="10" fill="none" stroke-linecap="round"/>
      <g transform="translate(400,140) rotate(-12)">
        <rect x="-70" y="-120" width="140" height="240" rx="24" fill="#1d3557"/>
        <rect x="-58" y="-100" width="116" height="190" rx="10" fill="#A8DADC"/>
        <circle cy="104" r="8" fill="#457B9D"/>
        <rect x="-40" y="-80" width="80" height="14" rx="7" fill="#fff"/><rect x="-40" y="-56" width="54" height="14" rx="7" fill="#fff"/>
        <circle cx="38" cy="-104" r="14" fill="#E5383B"/>
      </g>
      <g fill="none" stroke="#E85D04" stroke-width="10" stroke-linecap="round">
        <path d="M570 70 Q610 120 570 170"/><path d="M610 40 Q670 120 610 200"/>
        <path d="M230 70 Q190 120 230 170"/><path d="M190 40 Q130 120 190 200"/>
      </g>
      ${NO(640, 470, 62)}`,
  },
  {
    title: 'Không tự ý ngủ ngay<br>sau khi uống thuốc',
    tip: 'Uống thuốc với đủ nước, ngồi thẳng 15 – 30 phút rồi mới nằm, và luôn theo chỉ dẫn của bác sĩ.',
    bg: '#E9F5DB', accent: '#2D6A4F', dark: '#1B4332',
    art: `
      <g transform="translate(200,260) rotate(-35)">
        <rect x="-120" y="-50" width="240" height="100" rx="50" fill="#fff" stroke="#1B4332" stroke-width="10"/>
        <path d="M0 -50 L-70 -50 A50 50 0 0 0 -70 50 L0 50Z" fill="#E5383B"/>
        <rect x="-120" y="-50" width="240" height="100" rx="50" fill="none" stroke="#1B4332" stroke-width="10"/>
        <rect x="-90" y="-30" width="60" height="14" rx="7" fill="#fff" opacity=".6"/>
      </g>
      <circle cx="120" cy="470" r="44" fill="#52B788" stroke="#1B4332" stroke-width="8"/><line x1="90" y1="470" x2="150" y2="470" stroke="#1B4332" stroke-width="8"/>
      <circle cx="260" cy="490" r="34" fill="#FFD166" stroke="#1B4332" stroke-width="8"/>
      <path d="M420 300 L560 300 L545 540 L435 540Z" fill="#fff" stroke="#1B4332" stroke-width="10" stroke-linejoin="round"/>
      <path d="M426 380 L554 380 L545 530 L435 530Z" fill="#95D5B2"/>
      ${clock(620, 140, 90, 0, 30, '#fff', '#1B4332')}
      <g transform="translate(620,280)"><rect x="-110" y="-30" width="220" height="60" rx="30" fill="#2D6A4F"/><text y="12" text-anchor="middle" font-size="32" font-weight="800" fill="#fff">15–30 phút</text></g>
      <g transform="translate(650,470)"><rect x="-70" y="-30" width="140" height="70" rx="14" fill="#B7E4C7" stroke="#1B4332" stroke-width="8"/><rect x="-60" y="-56" width="50" height="34" rx="12" fill="#fff" stroke="#1B4332" stroke-width="6"/></g>
      ${NO(740, 390, 38)}`,
  },
  {
    title: 'Không uống quá nhiều<br>nước ngọt có ga',
    tip: 'Nước ngọt chứa nhiều đường. Hãy thay bằng nước lọc, trà không đường hoặc nước ép tự nhiên.',
    bg: '#FFE5EC', accent: '#C9184A', dark: '#590D22',
    art: `
      <ellipse cx="380" cy="580" rx="220" ry="26" fill="#590D22" opacity=".12"/>
      <g transform="translate(330,330)">
        <path d="M-130 -200 Q-130 -230 -100 -235 L100 -235 Q130 -230 130 -200 L130 210 Q130 240 100 245 L-100 245 Q-130 240 -130 210Z" fill="#C9184A" stroke="#590D22" stroke-width="10"/>
        <rect x="-100" y="-255" width="200" height="26" rx="10" fill="#ADB5BD" stroke="#590D22" stroke-width="8"/>
        <path d="M-130 -40 Q0 -90 130 -40 L130 70 Q0 20 -130 70Z" fill="#fff"/>
        <text y="28" text-anchor="middle" font-size="54" font-weight="800" fill="#C9184A">SODA</text>
        <rect x="-100" y="-190" width="24" height="380" rx="12" fill="#fff" opacity=".3"/>
      </g>
      <g fill="#FFCCD5" stroke="#C9184A" stroke-width="5">
        <circle cx="330" cy="40" r="16"/><circle cx="380" cy="10" r="10"/><circle cx="290" cy="0" r="8"/>
      </g>
      <g transform="translate(610,430)">
        <rect x="-60" y="-60" width="120" height="120" rx="14" fill="#fff" stroke="#590D22" stroke-width="8"/>
        <rect x="-10" y="-130" width="100" height="100" rx="12" fill="#fff" stroke="#590D22" stroke-width="8"/>
        <rect x="-110" y="-10" width="80" height="80" rx="10" fill="#fff" stroke="#590D22" stroke-width="8"/>
        <text x="0" y="110" text-anchor="middle" font-size="36" font-weight="800" fill="#590D22">ĐƯỜNG</text>
      </g>
      ${NO(470, 130, 56)}`,
  },
  {
    title: 'Không tắm quá khuya,<br>đặc biệt sau 10 giờ tối',
    tip: 'Nên tắm sớm, dùng nước ấm và lau khô người, tóc kỹ trước khi đi ngủ để tránh nhiễm lạnh.',
    bg: '#14213D', accent: '#4CC9F0', dark: '#0B132B', light: true,
    art: `
      ${moon(120, 110, 60, '#14213D')}${stars([[260, 70, 1.2], [80, 260, 1], [720, 520, 1.3]])}
      <path d="M660 40 L660 120 Q660 160 620 160 L520 160" fill="none" stroke="#ADB5BD" stroke-width="22" stroke-linecap="round"/>
      <path d="M420 170 Q420 120 520 120 Q620 120 620 170 Z" fill="#CED4DA" stroke="#6C757D" stroke-width="8"/>
      <rect x="410" y="168" width="220" height="20" rx="10" fill="#6C757D"/>
      ${[0, 1, 2, 3, 4].map(i => [0, 1, 2].map(j => drop(440 + i * 40 + (j % 2) * 18, 250 + j * 90 + (i % 2) * 30, 0.8, '#4CC9F0')).join('')).join('')}
      <path d="M380 560 Q520 520 660 560" stroke="#4CC9F0" stroke-width="10" fill="none" opacity=".5" stroke-linecap="round"/>
      ${clock(220, 400, 120, 22, 0, '#fff', '#0B132B')}
      <g transform="translate(220,570)"><rect x="-80" y="-34" width="160" height="68" rx="34" fill="#4CC9F0"/><text y="14" text-anchor="middle" font-size="38" font-weight="800" fill="#0B132B">22:00</text></g>
      ${NO(320, 300, 50)}`,
  },
  {
    title: 'Không sử dụng tai nghe<br>liên tục quá 60 phút',
    tip: 'Áp dụng quy tắc 60/60: âm lượng dưới 60%, nghe không quá 60 phút rồi cho tai nghỉ ngơi.',
    bg: '#FFF3B0', accent: '#E09F3E', dark: '#335C67',
    art: `
      <path d="M170 380 Q170 90 400 90 Q630 90 630 380" fill="none" stroke="#335C67" stroke-width="40" stroke-linecap="round"/>
      <path d="M170 380 Q170 90 400 90 Q630 90 630 380" fill="none" stroke="#540B0E" stroke-width="10" opacity=".2"/>
      <rect x="110" y="330" width="130" height="200" rx="50" fill="#E09F3E" stroke="#335C67" stroke-width="12"/>
      <rect x="560" y="330" width="130" height="200" rx="50" fill="#E09F3E" stroke="#335C67" stroke-width="12"/>
      <rect x="140" y="360" width="30" height="140" rx="15" fill="#fff" opacity=".4"/><rect x="590" y="360" width="30" height="140" rx="15" fill="#fff" opacity=".4"/>
      <g fill="#335C67"><path d="M330 360 L360 360 L400 320 L400 470 L360 430 L330 430Z"/></g>
      <g fill="none" stroke="#335C67" stroke-width="10" stroke-linecap="round"><path d="M425 360 Q445 395 425 430"/><path d="M450 335 Q485 395 450 455"/></g>
      <g transform="translate(400,560)"><rect x="-120" y="-44" width="240" height="88" rx="44" fill="#9E2A2B"/><text y="18" text-anchor="middle" font-size="50" font-weight="800" fill="#fff">60 phút</text></g>
      ${NO(660, 160, 54)}`,
  },
  {
    title: 'Không gội đầu ngay<br>sau khi ăn quá no',
    tip: 'Sau bữa ăn no, nên nghỉ ngơi khoảng 30 – 60 phút để hệ tiêu hóa làm việc rồi hãy gội đầu.',
    bg: '#F3E8FF', accent: '#7B2CBF', dark: '#3C096C',
    art: `
      <ellipse cx="220" cy="520" rx="170" ry="40" fill="#fff" stroke="#3C096C" stroke-width="8"/>
      <path d="M60 470 Q60 590 220 590 Q380 590 380 470 Z" fill="#C77DFF" stroke="#3C096C" stroke-width="10"/>
      <path d="M90 460 Q220 400 350 460" fill="#FFF3B0" stroke="#3C096C" stroke-width="8"/>
      <path d="M120 440 Q140 420 160 440 Q180 420 200 440 Q220 420 240 440 Q260 420 280 440 Q300 420 320 440" fill="none" stroke="#E09F3E" stroke-width="8" stroke-linecap="round"/>
      <path d="M180 380 Q170 340 190 310 M240 380 Q230 340 250 310" stroke="#9D4EDD" stroke-width="7" fill="none" opacity=".6" stroke-linecap="round"/>
      <g transform="translate(560,300)">
        <circle r="120" fill="#FFD6A5" stroke="#3C096C" stroke-width="10"/>
        <g fill="#fff" stroke="#9D4EDD" stroke-width="6">
          <circle cx="-90" cy="-90" r="50"/><circle cx="-20" cy="-130" r="58"/><circle cx="60" cy="-120" r="54"/><circle cx="115" cy="-60" r="44"/><circle cx="-125" cy="-20" r="36"/>
        </g>
        <path d="M-50 10 Q-40 20 -30 10 M30 10 Q40 20 50 10" stroke="#3C096C" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M-30 60 Q0 40 30 60" stroke="#3C096C" stroke-width="7" fill="none" stroke-linecap="round"/>
        ${drop(-150, 90, 0.9, '#9D4EDD')}${drop(150, 80, 0.8, '#C77DFF')}
      </g>
      <g transform="translate(560,520)"><rect x="-110" y="-34" width="220" height="68" rx="34" fill="#7B2CBF"/><text y="13" text-anchor="middle" font-size="34" font-weight="800" fill="#fff">chờ 30–60′</text></g>
      ${NO(380, 220, 50)}`,
  },
  {
    title: 'Không lạm dụng<br>thực phẩm chế biến sẵn', small: true,
    tip: 'Ưu tiên rau xanh, trái cây, thực phẩm tươi tự nấu. Hạn chế mì gói, xúc xích, đồ hộp nhiều muối.',
    bg: '#FEFAE0', accent: '#BC6C25', dark: '#283618',
    art: `
      <g transform="translate(200,280)">
        <rect x="-110" y="-120" width="220" height="230" rx="16" fill="#E63946" stroke="#283618" stroke-width="10"/>
        <rect x="-110" y="-60" width="220" height="90" fill="#FFD166"/>
        <rect x="-110" y="-120" width="220" height="230" rx="16" fill="none" stroke="#283618" stroke-width="10"/>
        <text y="0" text-anchor="middle" font-size="44" font-weight="800" fill="#283618">MÌ GÓI</text>
        <path d="M-80 70 Q-60 50 -40 70 T0 70 T40 70 T80 70" stroke="#fff" stroke-width="7" fill="none"/>
      </g>
      <g transform="translate(170,505)">
        <rect x="-90" y="-60" width="180" height="120" rx="16" fill="#ADB5BD" stroke="#283618" stroke-width="10"/>
        <rect x="-90" y="-20" width="180" height="40" fill="#BC6C25"/>
        <ellipse cy="-60" rx="90" ry="18" fill="#DEE2E6" stroke="#283618" stroke-width="8"/>
      </g>
      <g transform="translate(360,560) rotate(-15)"><rect x="-90" y="-26" width="180" height="52" rx="26" fill="#C1121F" stroke="#283618" stroke-width="8"/><path d="M-90 0 L-110 -10 M-90 0 L-110 10" stroke="#283618" stroke-width="6"/></g>
      ${NO(330, 150, 54)}
      <path d="M430 330 L480 330" stroke="#283618" stroke-width="10" stroke-linecap="round"/><path d="M470 310 L495 330 L470 350" fill="none" stroke="#283618" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <g transform="translate(630,330)">
        <circle r="150" fill="#fff" stroke="#283618" stroke-width="10"/>
        <circle cx="-50" cy="-40" r="52" fill="#E63946"/><path d="M-50 -92 Q-40 -110 -25 -110" stroke="#606C38" stroke-width="8" fill="none"/>
        <ellipse cx="50" cy="-50" rx="40" ry="60" fill="#606C38" transform="rotate(30 50 -50)"/>
        <path d="M-90 40 Q-60 10 -30 40 Q0 10 30 40 Q60 10 90 40 Q60 100 0 110 Q-60 100 -90 40Z" fill="#90BE6D"/>
        <path d="M30 60 L80 -10" stroke="#F77F00" stroke-width="22" stroke-linecap="round"/>
        <path d="M70 -10 L90 -40 M80 -10 L100 -30" stroke="#606C38" stroke-width="6" stroke-linecap="round"/>
      </g>
      <g transform="translate(630,540)"><rect x="-90" y="-30" width="180" height="60" rx="30" fill="#606C38"/><text y="12" text-anchor="middle" font-size="32" font-weight="800" fill="#fff">✓ Đồ tươi</text></g>`,
  },
];

const card = (r, i) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;background:${r.bg};font-family:'Be Vietnam Pro','DejaVu Sans',sans-serif;overflow:hidden;position:relative;color:${r.light ? '#fff' : r.dark}}
.blob{position:absolute;border-radius:50%;background:${r.accent};opacity:.12}
.top{position:absolute;top:60px;left:70px;right:70px;display:flex;align-items:center;justify-content:space-between}
.tag{font-size:26px;font-weight:800;letter-spacing:4px;text-transform:uppercase;opacity:.75}
.num{width:150px;height:150px;border-radius:40px;background:${r.accent};color:#fff;display:flex;align-items:center;justify-content:center;font-size:92px;font-weight:900;box-shadow:0 16px 0 ${r.dark}}
.art{position:absolute;top:210px;left:140px;width:800px;height:640px}
.panel{position:absolute;left:60px;right:60px;bottom:60px;background:${r.light ? 'rgba(255,255,255,.1)' : '#fff'};border-radius:44px;padding:48px 56px 52px;border:4px solid ${r.light ? 'rgba(255,255,255,.2)' : 'transparent'};box-shadow:${r.light ? 'none' : '0 20px 50px rgba(0,0,0,.08)'}}
h1{font-size:72px;line-height:1.12;font-weight:900;letter-spacing:-1px;color:${r.light ? '#fff' : r.dark}}
h1 .hl{color:${r.accent}}
.bar{width:110px;height:10px;border-radius:5px;background:${r.accent};margin:30px 0 26px}
p{font-size:34px;line-height:1.45;font-weight:500;opacity:.88;color:${r.light ? '#fff' : r.dark}}
.foot{position:absolute;bottom:18px;left:0;right:0;text-align:center;font-size:20px;font-weight:700;letter-spacing:3px;opacity:.5;text-transform:uppercase}
</style></head><body>
<div class="blob" style="width:520px;height:520px;right:-180px;top:-160px"></div>
<div class="blob" style="width:360px;height:360px;left:-140px;top:520px"></div>
<div class="top"><div class="tag">10 quy tắc sống khỏe<br>sống thọ hơn</div><div class="num">${i + 1}</div></div>
<svg class="art" viewBox="0 0 800 640" font-family="Be Vietnam Pro, DejaVu Sans, sans-serif">${r.art}</svg>
<div class="panel"><h1 style="${r.small ? 'font-size:62px' : ''}">${r.title.replace(/^Không/, '<span class="hl">Không</span>')}</h1><div class="bar"></div><p>${r.tip}</p></div>
<div class="foot">Sống khỏe mỗi ngày</div>
</body></html>`;

(async () => {
  const out = path.join(__dirname, 'images');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  for (let i = 0; i < rules.length; i++) {
    await page.setContent(card(rules[i], i), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const f = path.join(out, `quy-tac-${String(i + 1).padStart(2, '0')}.png`);
    await page.screenshot({ path: f });
    console.log('saved', f);
  }
  await browser.close();
})();
