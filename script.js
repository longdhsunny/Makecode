// Utilities
const MAX_BYTES = 5*1024*1024;
const MAX_LINES = 200000;
function byteLen(s){ return new TextEncoder().encode(s).length; }
function sanitizeFilename(name, ext){ if(!name) return 'module.'+ext; name = name.trim().replace(/[^a-zA-Z0-9_\.\-]/g,'_'); return name; }
function downloadBlob(content, filename){ try{ const blob = new Blob([content], {type:'text/plain;charset=utf-8'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },1200); }catch(e){ alert('Download failed: '+(e.message||e)); } }
function parseKV(text){ const out={}; if(!text) return out; text.split('\n').forEach(line=>{ const s=line.trim(); if(!s) return; const i=s.indexOf('='); if(i>0) out[s.slice(0,i).trim()] = s.slice(i+1).trim(); }); return out; }
function randLine(kind){ const map = window.RANDOM || {}; const arr = map[kind] || ['// filler']; return arr[Math.floor(Math.random()*arr.length)]; }

// Random library
window.RANDOM = {
  xml:['<setting key="sensitivity">0.78</setting>','<profile id="default"/>'],
  ini:['sensitivity=0.78','fov=90','dpi=480'],
  json:['"sensitivity": 0.78','"fov": 90'],
  yaml:['sensitivity: 0.78','fov: 90'],
  cpp:['int sensitivity = 78;','double fov = 90.0;'],
  js:["const sensitivity = 0.78;","console.log('Ready');"],
  py:["print('Ready')"],
  lua:["print('Ready')"],
  html:["<div>Example</div>"],
  php:['<?php echo "Hi"; ?>'], sh:['echo "hi"'], bat:['echo hi']
};

// Template builder simplified and safe
function getDefaultExt(type){
  const map = { xml:'xml', ini:'ini', json:'json', yaml:'yaml', cpp:'cpp', cs:'cs', js:'js', py:'py', lua:'lua', html:'html', php:'php', sh:'sh', bat:'bat', ff_ini:'ini', ff_xml:'xml', ff_plist:'plist', ff_lua:'lua', ff_json:'json', ff_mobileconfig:'mobileconfig' };
  return map[type] || 'txt';
}

function buildTemplate(type, template, name, kv, desc, custom){
  const now = new Date().toISOString();
  if(type.startsWith('ff_')){
    // Free Fire specific templates (benign config only)
    if(type === 'ff_ini'){
      let s = `; Free Fire sensitivity profile\n[Profile]\nname=${name}\n`;
      for(const k in kv) s += `${k}=${kv[k]}\n`;
      s += `; generated=${now}\n`; return s;
    }
    if(type === 'ff_xml'){
      let s = `<?xml version="1.0"?>\n<ControlLayout generated="${now}">\n`;
      for(const k in kv) s += `  <control id="${k}">${kv[k]}</control>\n`;
      s += `</ControlLayout>\n`; return s;
    }
    if(type === 'ff_plist'){
      let s = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n`;
      for(const k in kv) s += `  <key>${k}</key>\n  <string>${kv[k]}</string>\n`;
      s += `</dict>\n</plist>\n`; return s;
    }
    if(type === 'ff_lua'){
      let s = `-- Free Fire macro (template, benign)\nlocal cfg = {}\n`;
      for(const k in kv) s += `cfg[${JSON.stringify(k)}] = ${JSON.stringify(kv[k])}\n`;
      s += `return cfg\n`; return s;
    }
    if(type === 'ff_json'){
      const obj = {game:'Free Fire', name:name, generated: now, settings: kv}; return JSON.stringify(obj, null, 2) + '\n';
    }
    if(type === 'ff_mobileconfig'){
      return `<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>Title</key><string>${name}</string></dict></plist>`;
    }
  }

  if(type === 'custom'){
    return custom || ('// Custom template — paste code or description and apply');
  }

  // Generic templates
  if(template === 'settings'){
    if(type === 'xml'){
      let s = `<?xml version="1.0"?>\n<!-- ${name} -->\n<settings generated="${now}">\n`;
      for(const k in kv) s += `  <setting key="${k}">${kv[k]}</setting>\n`;
      s += `</settings>\n`; return s;
    }
    if(type === 'ini'){
      let s = `; ${name} settings\n[settings]\n`; for(const k in kv) s += `${k}=${kv[k]}\n`; return s;
    }
    if(type === 'json'){ const obj={module:name, generated: now, settings: kv}; return JSON.stringify(obj,null,2)+'\n'; }
    if(type === 'yaml'){ let s = `# ${name}\nsettings:\n`; for(const k in kv) s += `  ${k}: ${kv[k]}\n`; return s; }
    if(type === 'cpp'){ let s = `// C++ settings writer\n#include <iostream>\n#include <fstream>\n#include <map>\nint main(){\n  std::map<std::string,std::string> settings;\n`; for(const k in kv) s += `  settings["${k}"] = "${kv[k]}";\n`; s += `  std::ofstream f("${name}.ini"); f << "[settings]\n"; for(auto &p:settings) f<<p.first<<"="<<p.second<<"\\n"; return 0;\n}\n`; return s; }
    if(type === 'js'){ let s = `// Node.js settings writer\nconst fs = require('fs');\nconst settings = {};\n`; for(const k in kv) s += `settings[${JSON.stringify(k)}] = ${JSON.stringify(kv[k])};\n`; s += `fs.writeFileSync('${name}.json', JSON.stringify(settings, null, 2));\nconsole.log('Wrote ${name}.json');\n`; return s; }
    if(type === 'py'){ let s = `# Python settings writer\nimport json\nsettings = {}\n`; for(const k in kv) s += `settings[${JSON.stringify(k)}] = ${JSON.stringify(kv[k])}\n`; s += `with open('${name}.json','w') as f:\n    f.write(json.dumps(settings, indent=2))\n`; return s; }
    if(type === 'html'){ let s = `<!-- ${name} -->\n<!doctype html>\n<html><body>\n`; for(const k in kv) s += `<div>${k}: ${kv[k]}</div>\n`; s += '</body></html>\n'; return s; }
  }

  if(template === 'controls'){
    if(type === 'xml') return `<?xml version="1.0"?><controls><move up="W" down="S" left="A" right="D"/><fire key="LEFT_MOUSE"/></controls>`;
    if(type === 'ini') return `[controls]\nmove_up=W\nmove_down=S\nfire=LEFT_MOUSE\n`;
    if(type === 'json') return JSON.stringify({controls:{move_up:'W', move_down:'S', fire:'LEFT_MOUSE'}}, null, 2)+'\n';
    if(type === 'js') return `module.exports = { moveUp: 'W', fire: 'LEFT_MOUSE' }\n`;
  }

  if(template === 'profiles'){
    if(type === 'json') return JSON.stringify({profiles:[{name:'default',sensitivity:'0.78'},{name:'sniper',sensitivity:'0.45'}]}, null,2)+'\n';
    if(type === 'xml') return `<?xml version="1.0"?><presets><preset name="default" sensitivity="0.78"/></presets>`;
  }

  if(template === 'logger'){
    if(type === 'js') return `// logger\nconst fs = require('fs');\nfunction log(m){ fs.appendFileSync('app.log', new Date().toISOString() + ' ' + m + '\\n'); }\nmodule.exports = { log }\n`;
    if(type === 'py') return `# logger\ndef log(m):\n    with open('app.log','a') as f:\n        f.write(str(m)+'\\n')\n`;
    if(type === 'cpp') return `// logger C++\n#include <fstream>\nvoid log(const char* m){ std::ofstream f("app.log", std::ios::app); f<<m<<"\\n"; }\n`;
  }

  if(template === 'utility'){
    if(type === 'js') return `// utility\nfunction clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }\nmodule.exports={clamp};\n`;
    if(type === 'py') return `# utility\ndef clamp(v,a,b):\n    return max(a, min(b, v))\n`;
  }

  return `// Không có template phù hợp cho ${type} + ${template}\n`;
}

// Fill function adds random lines or bytes
function fillContent(content, type, rlines, sizeKB){
  // add random lines
  for(let i=0;i<rlines;i++) content += '\n' + randLine(type);
  // add bytes filler
  const target = sizeKB > 0 ? Math.min(sizeKB*1024, MAX_BYTES) : 0;
  if(target > byteLen(content)){
    const chunk = '\n' + (type === 'xml' || type === 'json' || type === 'ini' || type === 'yaml' ? '<!-- filler -->' : '// filler');
    let cur = byteLen(content), safe=0;
    while(cur < target && safe < 200000){ content += chunk; cur = byteLen(content); safe++; if(cur > MAX_BYTES) break; }
  }
  return content;
}

// Local storage helpers
function saveLocal(filename, content, type){
  try{
    const key = 'darkpro_freefire_' + Date.now();
    const meta = { filename, content, type, date: new Date().toLocaleString(), size: byteLen(content) };
    localStorage.setItem(key, JSON.stringify(meta));
    renderSaved();
  }catch(e){ console.warn('saveLocal failed', e); }
}

function renderSaved(){
  const box = document.getElementById('savedList'); box.innerHTML = '';
  const keys = Object.keys(localStorage).filter(k=>k.startsWith('darkpro_freefire_')).sort().reverse();
  if(keys.length === 0){ box.innerHTML = '<div class="subtitle">(Chưa có file lưu)</div>'; return; }
  keys.forEach(k=>{ try{ const o = JSON.parse(localStorage.getItem(k)); const el = document.createElement('div'); el.className='saved-item'; el.innerHTML = `<div><strong>${o.filename}</strong><div class="subtitle" style="font-size:12px">${o.type} • ${Math.round(o.size/1024)} KB • ${o.date}</div></div>`; const right = document.createElement('div'); const d=document.createElement('button'); d.className='btn small'; d.textContent='Tải'; d.onclick=()=>downloadBlob(o.content,o.filename); const v=document.createElement('button'); v.className='btn ghost small'; v.textContent='Xem'; v.onclick=()=>{ updatePreview(o.content,o.filename); document.getElementById('editor').value = o.content; }; const del=document.createElement('button'); del.className='btn ghost small'; del.textContent='Xoá'; del.onclick=()=>{ if(confirm('Xoá file?')){ localStorage.removeItem(k); renderSaved(); } }; right.appendChild(d); right.appendChild(v); right.appendChild(del); el.appendChild(right); box.appendChild(el); }catch(e){} });
}

// Generate and handle multi-language files
function generateAndMaybeDownload(){
  const codeType = document.getElementById('codeType').value;
  const template = document.getElementById('template').value;
  const kv = parseKV(document.getElementById('kv').value);
  const desc = document.getElementById('description').value;
  const custom = document.getElementById('custom').value;
  const rlines = parseInt(document.getElementById('randomLines').value) || 0;
  const sizeKB = parseFloat(document.getElementById('sizeKB').value) || 0;
  const auto = document.getElementById('autoDownload').checked;
  const save = document.getElementById('saveLocal').checked;
  const nameRaw = document.getElementById('fileName').value.trim();
  const type = codeType;
  const ext = getDefaultExt(type);
  const filename = sanitizeFilename(nameRaw || ('module.'+ext), ext);

  // Build content
  let content = '';
  if(type === 'custom') content = custom || ('// custom — paste code or description then apply');
  else content = buildTemplate(type, template, filename.replace(/\.[^/.]+$/,''), kv, desc, custom);

  content = fillContent(content, type, rlines, sizeKB);

  if(byteLen(content) > MAX_BYTES){ alert('Kích thước file vượt quá giới hạn 5MB, giảm size.'); return; }
  if(content.split('\n').length > MAX_LINES){ alert('Số dòng quá lớn, giảm số dòng random.'); return; }

  // Show preview + editor
  updatePreview(content, filename);
  document.getElementById('editor').value = content;
  // Create direct download link
  try {
    const blobUrl = URL.createObjectURL(new Blob([content], {type:'text/plain;charset=utf-8'}));
    const dlLink = document.getElementById('directDownloadLink');
    dlLink.href = blobUrl;
    dlLink.download = filename;
    dlLink.style.display = 'inline-block';
  } catch(e) { console.error('Direct download link failed', e); }

  if(save) saveLocal(filename, content, type);

  if(auto) downloadBlob(content, filename);
}

// UI events
document.getElementById('generateBtn').addEventListener('click', generateAndMaybeDownload);
document.getElementById('applyBtn').addEventListener('click', ()=>{
  const edited = document.getElementById('editor').value;
  updatePreview(edited, document.getElementById('fileName').value || 'edited.txt');
});
document.getElementById('downloadBtn').addEventListener('click', ()=>{
  const content = document.getElementById('codeOut').textContent;
  if(!content){ alert('Chưa có nội dung'); return; }
  const type = document.getElementById('codeType').value;
  const filename = sanitizeFilename(document.getElementById('fileName').value || ('module.' + getDefaultExt(type)), getDefaultExt(type));
  downloadBlob(content, filename);
});
document.getElementById('multiDownloadBtn').addEventListener('click', ()=>{
  // For simplicity: support selecting multiple by repeatedly generating different types isn't implemented in UI here.
  // We trigger generation once (for selected type). If you want multi-select languages, we can add that later.
  generateAndMaybeDownload();
});
document.getElementById('copyBtn').addEventListener('click', ()=>{
  const t = document.getElementById('codeOut').textContent; if(!t){ alert('Chưa có nội dung'); return; }
  navigator.clipboard.writeText(t).then(()=>alert('Đã sao chép'), ()=>alert('Không thể sao chép'));
});
document.getElementById('updatePreviewBtn').addEventListener('click', ()=>{ const v=document.getElementById('editor').value; updatePreview(v, document.getElementById('fileName').value || 'edited.txt'); });

// Fullscreen actions
document.getElementById('fullscreenBtn').addEventListener('click', ()=>{
  if(!document.getElementById('fullscreenOpt').checked){ alert('Bật "Enable fullscreen editor" trước'); return; }
  document.getElementById('fs').style.display='block'; document.getElementById('fsEditor').value = document.getElementById('editor').value;
});
document.getElementById('fsClose').addEventListener('click', ()=>{ document.getElementById('fs').style.display='none'; });
document.getElementById('fsSave').addEventListener('click', ()=>{ document.getElementById('editor').value = document.getElementById('fsEditor').value; document.getElementById('fs').style.display='none'; updatePreview(document.getElementById('fsEditor').value, document.getElementById('fileName').value || 'edited.txt'); });

function updatePreview(content, filename){ document.getElementById('codeOut').textContent = content; document.getElementById('editor').value = content; document.getElementById('previewInfo').textContent = filename || 'Preview'; document.getElementById('metaInfo').textContent = Math.max(0, Math.round(byteLen(content)/1024)) + ' KB'; }

// init
renderSaved();

function convertLinesToSize() {
    const lines = parseInt(document.getElementById('lines').value) || 0;
    const avgLineLength = 50; // average characters per line
    const bytes = lines * avgLineLength;
    const kb = (bytes / 1024).toFixed(2);
    document.getElementById('filesize').value = kb;
    document.getElementById('conversionInfo').innerText = lines + " dòng ≈ " + kb + " KB";
}
function convertSizeToLines() {
    const kb = parseFloat(document.getElementById('filesize').value) || 0;
    const avgLineLength = 50;
    const bytes = kb * 1024;
    const lines = Math.round(bytes / avgLineLength);
    document.getElementById('lines').value = lines;
    document.getElementById('conversionInfo').innerText = kb + " KB ≈ " + lines + " dòng";
}