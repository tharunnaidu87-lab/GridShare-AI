/* GridShare AI — deterministic research simulator. No physical power control. */
(function(root){
'use strict';
const EPS=1e-8, ETA=.95, PRICE=2;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const clone=x=>JSON.parse(JSON.stringify(x));
const sum=(a,f=x=>x)=>a.reduce((s,x)=>s+f(x),0);
function noise(seed){let x=Math.sin(seed*127.1+311.7)*43758.5453;return x-Math.floor(x);}
const specs=[
 ['H1','Solar home A','home',8,10,7,2,1.5,24,16],['H2','Solar home B','home',6,8,6,2,1.3,48,12],
 ['H3','Home C','home',3,6,3,1.5,1.8,74,18],['H4','Home D','home',0,4,2,1,1.6,18,48],
 ['H5','Home E','home',0,0,0,0,1.3,45,47],['H6','Home F','home',2,5,3,1.5,1.7,78,48],
 ['CL','Village clinic','clinic',1,8,4,2,3,12,80],['WP','Drinking-water pump','water',2,4,2,1,2.5,37,80],
 ['TU','Tailoring unit','enterprise',3,4,2,1,2.2,62,80],['DC','Dairy chiller','enterprise',4,6,3,1.5,2.8,88,80]
];
function makeNodes(){return specs.map((s,i)=>({id:s[0],name:s[1],kind:s[2],solar:s[3],capacity:s[4],battery:s[5],reserve:s[6],base:s[7],x:s[8],y:s[9],credits:i===4?3:30,line:8,debt:0}));}
function create(){return {version:1,hour:10,step:0,online:true,scenario:'normal',cloud:15,demandMultiplier:1,feeder:20,nodes:makeNodes(),baseline:makeNodes(),ledger:[],history:[],last:null};}
const scenarios={normal:{cloud:15,demandMultiplier:1},cloudy:{cloud:88,demandMultiplier:1},peak:{cloud:25,demandMultiplier:1.8},emergency:{cloud:70,demandMultiplier:1.2},surplus:{cloud:0,demandMultiplier:.65}};
function setScenario(s,key){if(!scenarios[key])throw Error('Unknown scenario');Object.assign(s,scenarios[key]);s.scenario=key;return s;}
function profile(node,hour,cloud,mult,emergency,seed){const sun=Math.max(0,Math.sin(Math.PI*(hour-6)/12));const generation=node.solar*sun*(1-.0085*cloud)*(1+.05*(noise(seed+node.solar*7)-.5));let f=node.kind==='home'?.68+.32*Math.pow(Math.cos((hour-20)*Math.PI/12),2):(hour>=7&&hour<=19?1:.4);let demand=node.base*f*mult;if(emergency&&(node.kind==='clinic'||node.kind==='water'))demand*=1.8;return {generation:Math.max(0,generation),demand};}
function validate(s){if(!Number.isFinite(s.cloud)||s.cloud<0||s.cloud>100||!Number.isFinite(s.demandMultiplier)||s.demandMultiplier<0||s.demandMultiplier>4||!Number.isFinite(s.feeder)||s.feeder<0||s.feeder>100)throw Error('Invalid simulation controls');for(const n of s.nodes){for(const key of ['solar','capacity','battery','reserve','base','credits','line'])if(!Number.isFinite(n[key])||n[key]<0)throw Error('Invalid '+key);if(n.reserve>n.capacity||n.battery<n.reserve-EPS||n.battery>n.capacity+EPS)throw Error('Battery must remain between reserve and capacity');}}
function compute(nodes,s,trading){let rows=nodes.map(n=>{let p=profile(n,s.hour,s.cloud,s.demandMultiplier,s.scenario==='emergency',s.step+17);let solarUsed=Math.min(p.generation,p.demand),short=p.demand-solarUsed,discharge=Math.min(Math.max(0,n.battery-n.reserve),short/ETA);n.battery-=discharge;let served=solarUsed+discharge*ETA;let essential=n.kind==='home'?p.demand*.6:p.demand;let tier=n.kind==='home'?2:(n.kind==='enterprise'?3:1);return {id:n.id,n,generation:p.generation,demand:p.demand,essential,tier,served,solarLeft:p.generation-solarUsed,discharge,charge:0,loss:discharge*(1-ETA),bought:0,sold:0,creditChange:0,curtailed:0,startBattery:n.battery+discharge,links:0};});
const trades=[],log=[];let remaining=s.feeder;
if(trading){for(let tier=1;tier<=4;tier++){
 let iterations=0;
 while(remaining>EPS&&iterations++<10000){let buyers=rows.filter(r=>{const target=tier===4&&r.n.kind==='home'?r.demand:(r.tier===tier?r.essential:0);return target-r.served>EPS&&r.n.credits>EPS&&r.links<r.n.line-EPS;}).sort((a,b)=>{let fa=a.served/Math.max(EPS,a.essential)-a.n.debt*.015,fb=b.served/Math.max(EPS,b.essential)-b.n.debt*.015;return fa-fb||a.id.localeCompare(b.id);});
 let did=false;
 for(const b of buyers){const sellers=rows.filter(a=>a.id!==b.id&&a.served>=a.demand-EPS&&a.solarLeft+Math.max(0,a.n.battery-a.n.reserve)*ETA>EPS&&a.links<a.n.line-EPS).sort((a,c)=>{let da=Math.hypot(a.n.x-b.n.x,a.n.y-b.n.y),dc=Math.hypot(c.n.x-b.n.x,c.n.y-b.n.y);return da-dc||a.id.localeCompare(c.id);});
 if(!sellers.length)continue;
 const a=sellers[0],target=tier===4?b.demand:b.essential,avail=a.solarLeft+Math.max(0,a.n.battery-a.n.reserve)*ETA;
 const q=Math.min(.1,target-b.served,avail,b.n.credits/PRICE,remaining,a.n.line-a.links,b.n.line-b.links);
 if(q<=EPS)continue;
 const solar=Math.min(q,a.solarLeft),battery=(q-solar)/ETA;a.solarLeft-=solar;a.n.battery-=battery;a.discharge+=battery;a.loss+=battery*(1-ETA);a.sold+=q;b.bought+=q;b.served+=q;a.links+=q;b.links+=q;remaining-=q;
 const credit=q*PRICE;a.n.credits+=credit;b.n.credits-=credit;a.creditChange+=credit;b.creditChange-=credit;
 let t=trades.find(t=>t.seller===a.id&&t.buyer===b.id&&t.tier===tier);if(t){t.energy+=q;t.credits+=credit;}else trades.push({seller:a.id,buyer:b.id,tier,energy:q,credits:credit});did=true;break;
 }
 if(!did)break;
 }
}}
for(const r of rows){let charge=Math.min(r.solarLeft,Math.max(0,r.n.capacity-r.n.battery)/ETA);r.n.battery+=charge*ETA;r.charge=charge;r.loss+=charge*(1-ETA);r.curtailed=Math.max(0,r.solarLeft-charge);r.unmet=Math.max(0,r.demand-r.served);r.essentialServed=Math.min(r.served,r.essential);r.n.debt=Math.max(0,r.n.debt+(r.essential-r.essentialServed)-r.bought*.1);r.action=r.sold>EPS?'Sell':r.bought>EPS?'Buy':r.charge>EPS?'Store':r.unmet>EPS?'Reserve':'Self-supply';r.reason=r.sold>EPS?'Own demand met; exports stay above the protected reserve.':r.bought>EPS?'Local energy is insufficient; purchased within the credit budget.':r.charge>EPS?'Remaining solar energy charges the battery after local trading.':r.unmet>EPS?'No valid trade available; battery reserve remains protected.':'Own solar and usable battery cover this hour.';
 const balance=r.generation+r.discharge*ETA+r.bought-r.served-r.charge-r.sold-r.curtailed;
 if(Math.abs(balance)>1e-6||r.n.battery<r.n.reserve-1e-6||r.n.credits< -1e-6)throw Error('Energy, reserve or credit invariant failed at '+r.id);
}
const demand=sum(rows,r=>r.demand),served=sum(rows,r=>r.served),critical=rows.filter(r=>r.tier===1),homes=rows.filter(r=>r.n.kind==='home'),ratios=homes.map(r=>r.essential?r.essentialServed/r.essential:1),jain=sum(ratios)**2/(ratios.length*sum(ratios,x=>x*x)||1);
const generation=sum(rows,r=>r.generation),curtailed=sum(rows,r=>r.curtailed);
const metrics={demand,served,unmet:demand-served,generation,curtailed,utilisation:generation>EPS?100*(1-curtailed/generation):null,critical:100*sum(critical,r=>r.served)/(sum(critical,r=>r.demand)||1),fairness:jain,shared:sum(trades,t=>t.energy),loss:sum(rows,r=>r.loss),battery:sum(rows,r=>r.n.battery),credits:sum(rows,r=>r.n.credits),essentialCoverage:100*sum(homes,r=>r.essentialServed)/(sum(homes,r=>r.essential)||1)};
return {rows:rows.map(({n,...r})=>({...r,battery:n.battery,reserve:n.reserve,capacity:n.capacity,credits:n.credits,name:n.name,kind:n.kind})),trades,metrics};}
function step(s){validate(s);const before=sum(s.nodes,n=>n.credits);let live=compute(s.nodes,s,true),base=compute(s.baseline,s,false);if(Math.abs(sum(s.nodes,n=>n.credits)-before)>1e-6)throw Error('Credits not conserved');s.step++;for(let i=0;i<live.trades.length;i++){let t=live.trades[i];s.ledger.push({...t,id:`GS-${s.step}-${i+1}`,hour:s.hour,status:s.online?'Settled (simulated)':'Pending sync',step:s.step});}s.last={hour:s.hour,live,base};s.history.push({step:s.step,hour:s.hour,live:clone(live.metrics),base:clone(base.metrics)});s.hour=(s.hour+1)%24;return s.last;}
function reconnect(s){s.online=true;let count=0;for(const t of s.ledger)if(t.status==='Pending sync'){t.status='Settled (simulated)';count++;}return count;}
function guard(n,amount,generation,demand){if(!Number.isFinite(amount)||amount<=0)return {ok:false,available:0,reason:'Enter a positive energy quantity.'};const available=Math.max(0,generation+Math.max(0,n.battery-n.reserve)*ETA-demand);const ok=amount<=available+EPS&&amount<=n.line+EPS;return {ok,available,reason:ok?'Request passes energy and connection limits. This check does not execute a trade.':`Rejected: safe export is ${Math.min(available,n.line).toFixed(2)} kWh. Own demand and battery reserve are protected.`};}
// Ordinary least squares with a tiny ridge penalty, trained on seeded synthetic data.
function solve(A,b){let M=A.map((r,i)=>[...r,b[i]]),n=b.length;for(let k=0;k<n;k++){let p=k;for(let i=k+1;i<n;i++)if(Math.abs(M[i][k])>Math.abs(M[p][k]))p=i;[M[k],M[p]]=[M[p],M[k]];let v=M[k][k]||1e-12;for(let j=k;j<=n;j++)M[k][j]/=v;for(let i=0;i<n;i++)if(i!==k){v=M[i][k];for(let j=k;j<=n;j++)M[i][j]-=v*M[k][j];}}return M.map(r=>r[n]);}
function features(h,c){let sun=Math.max(0,Math.sin(Math.PI*(h-6)/12));return [1,sun,sun*c/100,sun*(c/100)**2];}
function trainForecast(){let train=[],test=[];for(let day=0;day<240;day++)for(let h=0;h<24;h++){let c=noise(day+99)*100,sun=Math.max(0,Math.sin(Math.PI*(h-6)/12));let y=Math.max(0,sun*(1-.85*c/100)*(1+.12*(noise(day*24+h+57)-.5)));(day<180?train:test).push({x:features(h,c),y,h,c});}let A=Array.from({length:4},(_,i)=>Array.from({length:4},(_,j)=>sum(train,r=>r.x[i]*r.x[j])+(i===j?.00001:0))),b=Array.from({length:4},(_,i)=>sum(train,r=>r.x[i]*r.y)),weights=solve(A,b);const pred=(h,c,capacity=1)=>Math.max(0,features(h,c).reduce((a,v,i)=>a+v*weights[i],0))*capacity;
const errors=test.map(r=>pred(r.h,r.c)-r.y);return {weights,trainingRows:train.length,testRows:test.length,mae:sum(errors,Math.abs)/errors.length,rmse:Math.sqrt(sum(errors,x=>x*x)/errors.length),predict:pred};}
const api={create,setScenario,step,reconnect,guard,profile,trainForecast,clone,validate,ETA,PRICE,scenarios};if(typeof module!=='undefined')module.exports=api;root.GridShare=api;
})(typeof window!=='undefined'?window:globalThis);
