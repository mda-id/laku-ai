/* Gabungkan assets/js/core.js + backend/gas.js menjadi satu file backend/Code.gs (tempel ke Apps Script). */
const fs = require('fs'), path = require('path');
const core = fs.readFileSync(path.join(__dirname, '../assets/js/core.js'), 'utf8');
let gas = fs.readFileSync(path.join(__dirname, 'gas.js'), 'utf8');
const id = process.env.SPREADSHEET_ID || '';
if (id) { if (!/^[A-Za-z0-9_-]{20,}$/.test(id)) throw new Error('SPREADSHEET_ID tidak valid'); gas = gas.replace("var LAKU_SPREADSHEET_ID_ = '';", "var LAKU_SPREADSHEET_ID_ = '" + id + "';"); }
const out = '/* laku.ai backend — FILE HASIL BUILD, jangan diedit manual.\n   Sumber: assets/js/core.js + backend/gas.js. Bangun ulang: node backend/build.js */\n\n' + core + '\n\n' + gas;
fs.writeFileSync(path.join(__dirname, 'Code.gs'), out);
console.log('Code.gs ditulis:', out.length, 'byte');
