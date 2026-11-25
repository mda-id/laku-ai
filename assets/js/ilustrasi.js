/* LakuArt: ilustrasi gerobak untuk sisi samping halaman Masuk/Daftar (desain, belum dipasang di aplikasi).
   Dibuat murni dari bentuk SVG sehingga tajam di semua ukuran dan warnanya bisa diganti lewat palet. */
(function (root) {
  'use strict';
  var PAL = {
    a: { name: 'Krem hangat', bg1: '#FFF7EC', bg2: '#FFE2C4', sun: '#FFC857', build: '#F6D9B8', build2: '#EFC79E', ground: '#EBC9A0', ground2: '#E3BC90', body: '#D32F2F', body2: '#B71C1C', plate: '#FFF6EA', plateInk: '#C6283B', glass: '#CFEAF7', stripeA: '#D32F2F', stripeB: '#FFF6EA', ink: '#263238', card: '#FFFFFF', accent: '#D32F2F', crate: '#C98E55', crate2: '#A9713D', leaf: '#4F9D69' },
    b: { name: 'Merah brand', bg1: '#E04545', bg2: '#C62828', sun: '#FFB74D', build: '#D13A3A', build2: '#BC2F2F', ground: '#A91F1F', ground2: '#951919', body: '#FFF6EA', body2: '#F1DFC6', plate: '#D32F2F', plateInk: '#FFFFFF', glass: '#D8EFFA', stripeA: '#FFF6EA', stripeB: '#263238', ink: '#263238', card: '#FFFFFF', accent: '#D32F2F', crate: '#E0A56B', crate2: '#BF8650', leaf: '#7BC68E' }
  };
  function bunting(p, w) {
    var out = '<path d="M-10 46 Q' + (w / 2) + ' 170 ' + (w + 10) + ' 46" fill="none" stroke="' + p.ink + '" stroke-width="2" opacity=".55"/>', cols = ['#D32F2F', '#FFC857', p.ink, '#FFF6EA'];
    for (var i = 1; i <= 11; i++) {
      var t = i / 12, x = -10 + (w + 20) * t, cy = 46 + 124 * 2 * t * (1 - t) * 0.5 * 1;   // titik pada kurva kuadratik
      out += '<polygon points="' + (x - 10) + ',' + (cy + 1) + ' ' + (x + 10) + ',' + (cy + 1) + ' ' + x + ',' + (cy + 26) + '" fill="' + cols[i % 4] + '" opacity=".95"/>';
    }
    return out;
  }
  function awning(p, w) {
    var n = 10, sw = w / n, s = '';
    for (var i = 0; i < n; i++) s += '<rect x="' + (i * sw) + '" y="0" width="' + sw + '" height="40" fill="' + (i % 2 ? p.stripeB : p.stripeA) + '"/><circle cx="' + (i * sw + sw / 2) + '" cy="40" r="' + (sw / 2) + '" fill="' + (i % 2 ? p.stripeB : p.stripeA) + '"/>';
    return '<g>' + s + '<rect x="-4" y="-8" width="' + (w + 8) + '" height="12" rx="6" fill="' + p.ink + '"/></g>';
  }
  function wheel(p, cx, cy, r) {
    var sp = ''; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; sp += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Math.cos(a) * (r - 6)).toFixed(1) + '" y2="' + (cy + Math.sin(a) * (r - 6)).toFixed(1) + '" stroke="' + p.ink + '" stroke-width="3" stroke-linecap="round"/>'; }
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + p.ink + '"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 9) + '" fill="#F3E3CB"/>' + sp + '<circle cx="' + cx + '" cy="' + cy + '" r="9" fill="' + p.ink + '"/><circle cx="' + cx + '" cy="' + cy + '" r="3.5" fill="#F3E3CB"/>';
  }
  function steamer(x, y, w) { return '<g><rect x="' + x + '" y="' + (y + 30) + '" width="' + w + '" height="14" rx="5" fill="#B9783C"/><rect x="' + (x + 3) + '" y="' + (y + 15) + '" width="' + (w - 6) + '" height="16" rx="5" fill="#D9A066"/><rect x="' + (x + 6) + '" y="' + y + '" width="' + (w - 12) + '" height="16" rx="5" fill="#E8B77C"/><circle cx="' + (x + w * 0.35) + '" cy="' + (y - 2) + '" r="7" fill="#FFF1D0"/><circle cx="' + (x + w * 0.65) + '" cy="' + (y - 2) + '" r="7" fill="#FFF1D0"/></g>'; }
  function steam(x, y) { return '<path d="M' + x + ' ' + y + ' q-6 -10 0 -20 t0 -20" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".85"/><path d="M' + (x + 22) + ' ' + (y + 6) + ' q-6 -10 0 -20 t0 -20" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>'; }
  function crate(p, x, y, w, h) { var s = ''; for (var i = 1; i < 3; i++) s += '<line x1="' + x + '" y1="' + (y + h * i / 3) + '" x2="' + (x + w) + '" y2="' + (y + h * i / 3) + '" stroke="' + p.crate2 + '" stroke-width="3"/>'; return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="' + p.crate + '" stroke="' + p.crate2 + '" stroke-width="3"/>' + s; }
  function build(p, x, w, h, win) { var s = '<rect x="' + x + '" y="' + (560 - h) + '" width="' + w + '" height="' + h + '" fill="' + p.build + '"/><rect x="' + (x - 4) + '" y="' + (560 - h - 10) + '" width="' + (w + 8) + '" height="12" rx="4" fill="' + p.build2 + '"/>'; for (var i = 0; i < win; i++) s += '<rect x="' + (x + 12 + i * ((w - 24) / win)) + '" y="' + (560 - h + 18) + '" width="' + ((w - 24) / win - 10) + '" height="24" rx="3" fill="' + p.build2 + '"/>'; return s; }

  /* opts.crop = tampilkan hanya area gerobak (untuk spanduk di HP) */
  function scene(variant, opts) {
    opts = opts || {}; var p = PAL[variant] || PAL.a, W = 640, H = 760, id = 'g' + variant + (opts.mode || (opts.crop ? 'crop' : 'full'));
    var mode = opts.mode || (opts.crop ? 'crop' : 'full'), vb = mode === 'crop' ? '0 288 640 380' : (mode === 'panel' ? '0 -170 640 930' : '0 0 ' + W + ' ' + H);
    var cart = '<g transform="translate(166 360)">' +
      '<ellipse cx="170" cy="262" rx="190" ry="13" fill="#000" opacity=".16"/>' +
      '<line x1="14" y1="150" x2="-30" y2="206" stroke="' + p.ink + '" stroke-width="9" stroke-linecap="round"/><line x1="-40" y1="198" x2="-18" y2="216" stroke="' + p.ink + '" stroke-width="9" stroke-linecap="round"/>' +
      '<rect x="318" y="200" width="10" height="62" rx="4" fill="' + p.ink + '"/>' +
      '<rect x="12" y="-18" width="6" height="122" fill="' + p.ink + '"/><rect x="322" y="-18" width="6" height="122" fill="' + p.ink + '"/>' +
      '<rect x="14" y="128" width="312" height="104" rx="14" fill="' + p.body + '"/><rect x="14" y="204" width="312" height="28" rx="10" fill="' + p.body2 + '"/>' +
      '<rect x="46" y="142" width="248" height="56" rx="9" fill="' + p.plate + '"/><text x="170" y="182" text-anchor="middle" font-family="Poppins,system-ui,sans-serif" font-size="34" font-weight="500" fill="' + p.plateInk + '" letter-spacing="-1">laku<tspan fill="' + (variant === 'b' ? '#FFD9D6' : '#55595E') + '">.ai</tspan></text>' +
      '<rect x="-2" y="104" width="344" height="26" rx="9" fill="' + (variant === 'b' ? '#F1DFC6' : '#F3E3CB') + '"/>' +
      '<path d="M26 104 L46 40 H294 L314 104 Z" fill="' + p.glass + '" fill-opacity=".5" stroke="' + p.ink + '" stroke-width="3" stroke-linejoin="round"/>' +
      steamer(62, 66, 64) + steamer(138, 58, 66) + steamer(218, 66, 64) + steam(94, 52) + steam(172, 44) + steam(246, 52) +
      '<g transform="translate(14 -34)">' + awning(p, 312) + '</g>' +
      wheel(p, 84, 258, 40) + wheel(p, 262, 258, 40) +
      '<g transform="translate(246 96) rotate(8)"><rect x="0" y="0" width="56" height="26" rx="6" fill="' + p.card + '" stroke="' + p.ink + '" stroke-width="2"/><text x="28" y="18" text-anchor="middle" font-family="Poppins,system-ui,sans-serif" font-size="13" font-weight="700" fill="' + p.accent + '">Rp10rb</text></g>' +
      '</g>';
    var board = '<g transform="translate(10 436)"><line x1="26" y1="116" x2="14" y2="190" stroke="' + p.ink + '" stroke-width="7" stroke-linecap="round"/><line x1="84" y1="116" x2="98" y2="190" stroke="' + p.ink + '" stroke-width="7" stroke-linecap="round"/>' +
      '<rect x="0" y="0" width="110" height="122" rx="9" fill="' + p.ink + '" stroke="' + p.crate2 + '" stroke-width="6"/>' +
      '<text x="55" y="24" text-anchor="middle" font-family="Poppins,system-ui,sans-serif" font-size="11" font-weight="700" fill="#FFC857" letter-spacing="2">MENU</text>' +
      '<g font-family="Poppins,system-ui,sans-serif" font-size="10.5" fill="#FFF6EA"><text x="12" y="46">Risol Mayo</text><text x="98" y="46" text-anchor="end">10rb</text><text x="12" y="68">Dimsum</text><text x="98" y="68" text-anchor="end">45rb</text><text x="12" y="90">Nugget</text><text x="98" y="90" text-anchor="end">28rb</text><text x="12" y="110">Siomay</text><text x="98" y="110" text-anchor="end">30rb</text></g></g>';
    var props = crate(p, 524, 500, 84, 60) + crate(p, 534, 446, 66, 54) + '<rect x="546" y="420" width="38" height="26" rx="6" fill="' + p.card + '" stroke="' + p.ink + '" stroke-width="2"/><text x="565" y="438" text-anchor="middle" font-family="Poppins,system-ui,sans-serif" font-size="8.5" font-weight="700" fill="' + p.accent + '">FROZEN</text>' +
      '<g transform="translate(612 520) scale(.8)"><path d="M0 40 l6 -36 h36 l6 36 z" fill="' + p.accent + '" opacity=".9"/><path d="M24 4 q-26 -24 -16 -48 q16 6 16 48 z" fill="' + p.leaf + '"/><path d="M24 4 q26 -26 16 -52 q-18 8 -16 52 z" fill="' + p.leaf + '" opacity=".85"/></g>';
    var coin = function (x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#FFC857" stroke="#E5A82E" stroke-width="3"/><text x="' + x + '" y="' + (y + r * 0.34) + '" text-anchor="middle" font-family="Poppins,system-ui,sans-serif" font-size="' + (r * 0.95) + '" font-weight="700" fill="#B07A10">Rp</text>'; };
    var cards = '<g transform="translate(372 196)"><rect width="196" height="82" rx="18" fill="' + p.card + '" opacity=".97"/><rect width="196" height="82" rx="18" fill="none" stroke="#000" stroke-opacity=".06"/><circle cx="46" cy="41" r="26" fill="none" stroke="#ECEFF1" stroke-width="9"/><circle cx="46" cy="41" r="26" fill="none" stroke="' + p.accent + '" stroke-width="9" stroke-linecap="round" stroke-dasharray="118 164" transform="rotate(-90 46 41)"/><text x="46" y="48" text-anchor="middle" font-family="Poppins,system-ui,sans-serif" font-size="20" font-weight="700" fill="' + p.ink + '">72</text><text x="86" y="34" font-family="Poppins,system-ui,sans-serif" font-size="10" font-weight="600" fill="#78909C" letter-spacing="1">SKOR USAHA</text><text x="86" y="58" font-family="Poppins,system-ui,sans-serif" font-size="16" font-weight="700" fill="' + p.ink + '">Cukup sehat</text></g>' +
      '<g transform="translate(36 236)"><rect width="168" height="62" rx="16" fill="' + p.card + '" opacity=".97"/><text x="18" y="25" font-family="Poppins,system-ui,sans-serif" font-size="10" font-weight="600" fill="#78909C" letter-spacing="1">OMZET 30 HARI</text><text x="18" y="48" font-family="Poppins,system-ui,sans-serif" font-size="18" font-weight="700" fill="' + p.ink + '">Rp12,4 jt <tspan fill="#2E7D32" font-size="13">▲ 14%</tspan></text></g>' +
      coin(330, 330, 17) + coin(214, 318, 12) + coin(578, 376, 14);
    var svg = '<svg class="scene" xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" role="img" aria-label="Ilustrasi gerobak makanan dengan skor kesehatan usaha" preserveAspectRatio="' + (mode === 'crop' ? 'xMidYMid slice' : 'xMidYMax meet') + '" style="overflow:visible">' +
      '<defs><linearGradient id="bg' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + p.bg1 + '"/><stop offset="1" stop-color="' + p.bg2 + '"/></linearGradient></defs>' +
      '<rect x="-700" y="-700" width="2040" height="2200" fill="url(#bg' + id + ')"/>' +
      '<circle cx="500" cy="150" r="96" fill="' + p.sun + '" opacity=".28"/><circle cx="500" cy="150" r="62" fill="' + p.sun + '" opacity=".55"/>' +
      (mode === 'panel' ? '' : '<g opacity=".8"><ellipse cx="120" cy="150" rx="46" ry="14" fill="#fff" opacity=".7"/><ellipse cx="152" cy="138" rx="30" ry="12" fill="#fff" opacity=".7"/><ellipse cx="410" cy="110" rx="34" ry="10" fill="#fff" opacity=".6"/></g>') +
      (mode === 'panel' ? '' : bunting(p, W)) +
      build(p, 0, 120, 150, 3) + build(p, 130, 96, 110, 2) + build(p, 440, 110, 128, 3) + build(p, 560, 90, 96, 2) +
      '<rect x="-700" y="560" width="2040" height="500" fill="' + p.ground + '"/><rect x="-700" y="560" width="2040" height="14" fill="' + p.ground2 + '"/><g stroke="' + p.ground2 + '" stroke-width="5" stroke-dasharray="46 40" opacity=".7"><line x1="-700" y1="700" x2="1340" y2="700"/></g>' +
      props + board + cart + cards + '</svg>';
    return svg;
  }
  root.LakuArt = { scene: scene, PAL: PAL };
})(typeof self !== 'undefined' ? self : this);
