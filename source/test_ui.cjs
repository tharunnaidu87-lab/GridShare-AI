// DOM contract harness: exercises application handlers without browser layout.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=__dirname+'/';
const html=fs.readFileSync(dir+'layout.html','utf8');
let elements=[],ids=new Map();
class Element{constructor(tag,attrs){this.tagName=tag;this.attrs=attrs;this.dataset={};this.value=attrs.value||'';this.disabled=false;this.textContent='';this._html='';this.className=attrs.class||'';this.classList={toggle:(c,on)=>{let s=new Set(this.className.split(' '));if(on)s.add(c);else s.delete(c);this.className=[...s].join(' ');},add:c=>{this.className+=' '+c;},contains:c=>this.className.split(' ').includes(c)};Object.entries(attrs).forEach(([k,v])=>{if(k.startsWith('data-'))this.dataset[k.slice(5)]=v;});}
set innerHTML(h){this._html=h;parse(h);if(this.tagName==='select'){let m=h.match(/<option value="([^"]+)"/);if(m)this.value=m[1];}}
get innerHTML(){return this._html;}click(){if(this.onclick)this.onclick({target:this});}}
function parse(text){for(const m of text.matchAll(/<([a-zA-Z][\w-]*)([^>]*?)>/g)){let attrs={};for(const a of m[2].matchAll(/([\w-]+)="([^"]*)"/g))attrs[a[1]]=a[2];let e=new Element(m[1],attrs);elements.push(e);if(attrs.id)ids.set(attrs.id,e);}}
parse(html);
function match(e,s){if(s.startsWith('#'))return e.attrs.id===s.slice(1);if(s.startsWith('.'))return e.classList.contains(s.slice(1));let m=s.match(/^\[([^\]]+)\]$/);return m&&m[1] in e.attrs;}
const document={querySelector:s=>s.startsWith('#')?ids.get(s.slice(1)):elements.find(e=>match(e,s)),querySelectorAll:s=>elements.filter(e=>match(e,s)),createElement:tag=>new Element(tag,{})};
let store={},downloads=0;const context={document,console,localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},setInterval:()=>1,clearInterval:()=>{},setTimeout:f=>f(),Blob:class{},URL:{createObjectURL:()=>{downloads++;return 'blob:test';},revokeObjectURL:()=>{}},window:{addEventListener:()=>{},confirm:()=>true}};
vm.createContext(context);vm.runInContext(fs.readFileSync(dir+'engine.js','utf8'),context);vm.runInContext(fs.readFileSync(dir+'app.js','utf8'),context);
const click=id=>ids.get(id).click(),value=(id,v)=>{ids.get(id).value=v;ids.get(id).oninput?.({target:ids.get(id)});};
assert.ok(ids.get('stats').innerHTML.includes('Renewable generation'));
for(const e of elements.filter(e=>e.dataset.tab))e.click();
click('stepBtn');assert.ok(ids.get('clock').textContent.includes('1h run'));assert.ok(ids.get('ledgerRows').innerHTML.includes('GS-1'));
click('guardBtn');assert.ok(ids.get('guardResult').textContent.includes('Rejected'));
click('internetBtn');click('stepBtn');assert.ok(ids.get('ledgerRows').innerHTML.includes('Pending sync'));
click('syncBtn');assert.ok(!ids.get('ledgerRows').innerHTML.includes('Pending sync'));
value('cloud','90');value('demand','150');value('feeder','10');click('stepBtn');
click('exportLedger');click('exportResults');assert.equal(downloads,2);
click('retrainBtn');assert.ok(ids.get('modelMetrics').innerHTML.includes('4,320'));
click('resetBtn');assert.ok(ids.get('clock').textContent.includes('0h run'));assert.equal(ids.get('saveConfig').disabled,false);
ids.get('editSolar').value='9';ids.get('configForm').onsubmit({preventDefault(){}});assert.ok(store['gridshare-ai-research-v1'].includes('"solar":9'));
click('playBtn');assert.ok(ids.get('clock').textContent.includes('1h run'));click('playBtn');
assert.equal(ids.get('saveConfig').disabled,true);
console.log('PASS DOM contract: startup, all tabs, run, guard, offline/sync, controls, both CSV exports, model retrain, reset, configuration, auto/pause, local save. Browser visual layout was not tested.');
const restored={...context,window:{addEventListener:()=>{},confirm:()=>true}};vm.createContext(restored);vm.runInContext(fs.readFileSync(dir+'engine.js','utf8'),restored);vm.runInContext(fs.readFileSync(dir+'app.js','utf8'),restored);assert.ok(ids.get('clock').textContent.includes('1h run'));console.log('PASS Saved-session restoration in a new JavaScript context.');
const snapshot=store['gridshare-ai-research-v1'];
vm.runInContext("globalThis.originalStep=G.step; G.step=(s)=>{s.nodes[0].battery=999;throw Error('Injected failure');};",restored);
click('stepBtn');assert.equal(store['gridshare-ai-research-v1'],snapshot);assert.ok(ids.get('toast').textContent.includes('Injected failure'));
vm.runInContext("G.step=globalThis.originalStep;",restored);click('stepBtn');assert.ok(ids.get('clock').textContent.includes('2h run'));
console.log('PASS Failed-step atomicity: partial mutations never reach the live or saved experiment.');
