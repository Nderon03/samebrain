/* Same Brain – online gameplay. Load AFTER samebrain-redesign.js.
   Design: the HOST device runs the original engine (scoring, modes, questions unchanged). Other phones answer privately;
   the host reveals results and broadcasts the rendered screens. Host state snapshots go to everyone for host hand-over. */
(()=>{
const X=window.SBX;if(!X)return;
document.head.insertAdjacentHTML('beforeend',`<style>.ol #app .c>.b.g:not(.ch):not(.keep){display:none}.ol #app .c{padding-bottom:92px}#hc{position:fixed;left:0;right:0;bottom:calc(env(safe-area-inset-bottom) + 10px);display:flex;gap:8px;justify-content:center;z-index:9;pointer-events:none}#hc button{pointer-events:auto;background:#1b1540;border:1px solid #ffffff33;border-radius:99px;padding:12px 16px;font-size:15px}</style>`);
let G=null,A={},SN=null,HT=0,seen=new Set(),PG='';
const _h=window.home;window.home=function(){document.body.classList.remove('ol');if(G){clearTimeout(G.tm);G.mo&&G.mo.disconnect()}G=null;A={};SN=null;seen=new Set();PG='';const e=document.querySelector('#hc');e&&e.remove();_h()};
const me=()=>X.O().pid,isH=()=>X.O().host,o_=()=>X.O();
const send=m=>{const o=o_();if(o){m.f=o.pid;o.ch.send({type:'broadcast',event:'g',payload:m})}};
const meta=s=>{const o=o_();return o.ch.track({name:o.name,host:1,pid:o.pid,started:s?1:0,ros:s?G.ros:[]})};
const TMR={freeze:10,instant:5};
/* ----- host: start / rounds ----- */
window.SBstart=async function(){const o=o_();if(!o||!o.host||o.pl.length<3)return;const L=o.pl.slice().sort((a,b)=>b.host-a.host);
G={on:1,ros:L.map(p=>p.pid),rid:0,ans:{}};o.started=1;await meta(1);document.body.classList.add('ol');send({k:'go'});watch();start(L.map(p=>p.name))};
const _r=window.round;window.round=function(){_r();G&&G.on&&isH()&&oround()};
const _n=window.nxt;window.nxt=function(){if(G&&G.on){if(G.nl)return;G.nl=1}_n()};
function push(m){m.f=me();G.cur=m;send(m);on(m);snap()}
function oround(){G.rid++;G.ans={};G.rev=0;G.nl=0;G.phase='q';G.lastH=null;clearTimeout(G.tm);PG='';
if(S.mode=='split'&&!st.qs[st.i]){const a=st.pa;G.auth=a;G.spd=0;G.exp=[];push({k:'auth',rid:G.rid,to:G.ros[a],n:st.P[a].n});return hc()}
G.auth=null;const r=st.r,q=r.q;G.exp=st.P.map((_,j)=>j).filter(j=>!(r.spl>=0&&j==r.spl));G.chs=q.pick?st.P.map(p=>p.n):q.ch;
push({k:'q',rid:G.rid,t:q.t,ch:q.ch,pick:q.pick?1:0,ty:r.ty,hot:r.hot||'',sub:r.sub>=0?r.sub:-1,spl:r.spl>=0?r.spl:-1,i:st.i,n:st.qs.length,names:st.P.map(p=>p.n),ros:G.ros});
if(TMR[r.ty])G.tm=setTimeout(reveal,(TMR[r.ty]+4)*1000);hc()}
function alive(){return new Set(o_().pl.map(p=>p.pid))}
function check(){if(!G||!G.on||G.phase!='q'||G.rev||G.auth!=null)return;const al=alive(),need=G.exp.filter(j=>al.has(G.ros[j])||G.ans[G.ros[j]]),d=need.filter(j=>G.ans[G.ros[j]]).length;
const p={k:'prog',rid:G.rid,d,t:need.length};send(p);on(p);if(need.length&&d==need.length)reveal()}
function reveal(){if(!G||!G.on||G.rev||G.phase!='q'||G.auth!=null||!st.r)return;G.rev=1;clearTimeout(G.tm);const r=st.r;
r.a=G.exp.map(j=>{const a=G.ans[G.ros[j]];return{p:j,a:a?a.a:'',pd:a?a.pd:''}});G.phase='pub';reveal2();hc()}
function hans(m){if(!G||!G.on||m.rid!=G.rid||G.rev||G.phase!='q'||G.auth!=null)return;const j=G.ros.indexOf(m.pid);if(j<0||!G.exp.includes(j)||G.ans[m.pid])return;
const ok=v=>v===''||G.chs.includes(v);if(!ok(m.a)||!ok(m.pd||''))return;G.ans[m.pid]={a:m.a,pd:m.pd||''};check()}
function hsp(m){if(!G||!G.on||G.auth==null||G.spd||m.rid!=G.rid||m.pid!=G.ros[G.auth])return;const t=String(m.t||'').trim().slice(0,90),a=String(m.a||'').trim().slice(0,30),b=String(m.b||'').trim().slice(0,30);
if(!t||!a||!b||nm(a)==nm(b))return;G.spd=1;st.qs[st.i]={t,ch:[a,b],pick:0};round()}
/* host publishes every engine screen after reveal (results, leaderboard, final) */
function watch(){if(G.mo)return;G.mo=new MutationObserver(()=>{if(!G||!G.on||G.phase!='pub')return;clearTimeout(G.ot);G.ot=setTimeout(pub,150)});G.mo.observe(app,{childList:true,subtree:true})}
function pub(){if(!G||!isH())return;const h=app.innerHTML;if(h===G.lastH)return;G.lastH=h;G.pub=h;send({k:'pub',html:h});snap()}
function snap(){try{send({k:'snap',s:JSON.stringify(st),S:{mode:S.mode,rounds:S.rounds,sx:S.sx,sp:S.sp,lv:S.lv},ros:G.ros,rid:G.rid,ph:G.phase,h:G.phase=='pub'?app.innerHTML:''})}catch(e){}}
function hc(){let e=$('#hc');if(!G||!G.on||!isH()){e&&e.remove();return}if(!e){document.body.insertAdjacentHTML('beforeend','<div id=hc></div>');e=$('#hc')}
e.innerHTML=(G.phase=='q'?(G.auth!=null?'<button onclick=SBskip()>⏭ Skip writer</button>':'<button onclick=SBrev()>⏩ Reveal now</button>'):'')+'<button onclick=SBend()>⏹ End game</button>'}
window.SBrev=()=>reveal();
window.SBskip=()=>{if(!G||G.auth==null)return;const q=SPLQ[Math.floor(Math.random()*SPLQ.length)];hsp({rid:G.rid,pid:G.ros[G.auth],t:q[0],a:q[1],b:q[2]})};
window.SBend=()=>{if(confirm('End the game for everyone and return to the lobby?')){send({k:'end'});endLocal()}};
function endLocal(){const o=o_();if(!o)return;document.body.classList.remove('ol');if(G){clearTimeout(G.tm);G.mo&&G.mo.disconnect()}G=null;A={};st.on=0;o.started=0;const h=$('#hc');h&&h.remove();if(o.host)meta(0);X.lob(1)}
/* ----- all devices ----- */
function on(m){const o=o_();if(!o)return;const H=o.pl.find(p=>p.host),fromH=m.f==o.pid||(H&&m.f==H.pid);
switch(m.k){
case'go':if(fromH){document.body.classList.add('ol');wait('🎮 Game starting…')}break;
case'auth':if(!fromH)break;document.body.classList.add('ol');m.to==me()?author(m):wait('✍️ '+E(m.n)+' is writing a split…');break;
case'q':if(fromH)ask(m);break;
case'pub':if(fromH&&!isH())showPub(m.html);break;
case'prog':if(fromH){PG=m.d+' / '+m.t+' answered';const e=$('#pg');e&&(e.textContent=PG)}break;
case'res':if(fromH&&m.to==me())resume(m);break;
case'snap':if(fromH&&!isH())SN=m;break;
case'end':if(fromH&&!isH())endLocal();break;
case'ans':if(isH()&&m.pid)hans(m);break;
case'sp':if(isH())hsp(m);break}}
function wait(h){R(`<div class=c style="text-align:center"><h2>${h}</h2><p class=m id=pg>${PG}</p><div class=bar style="width:60%;margin:8px auto"></div></div>`)}
function showPub(h){const d=document.createElement('div');d.innerHTML=h;d.querySelectorAll('script,iframe,object,style,button,input').forEach(x=>x.remove());d.querySelectorAll('*').forEach(x=>[...x.attributes].forEach(a=>/^on/i.test(a.name)&&x.removeAttribute(a.name)));
const c=d.firstElementChild;c&&c.insertAdjacentHTML('beforeend','<p class="m sm" style="text-align:center">Waiting for the host…</p>');document.body.classList.add('ol');R(d.innerHTML)}
function resume(m){document.body.classList.add('ol');if(m.ph=='pub'&&m.html)return showPub(m.html);if(m.q){if(m.answered){A={rid:m.q.rid,done:1};wait('🔒 Locked in. Waiting for everyone…')}else ask(m.q)}else wait('🎮 Game in progress…')}
function ask(m){if(A.rid==m.rid&&A.done)return;document.body.classList.add('ol');const idx=m.ros.indexOf(me());if(idx<0)return wait('👀 Spectating');
if(m.spl==idx){A={rid:m.rid,done:1};return wait('✍️ You wrote this one. Sit back while everyone votes')}
const hotMe=m.ty=='hot'&&m.names[idx]==m.hot;A={...m,ph:(m.ty=='predict'||hotMe)?'pred':'ans',sel:null,done:0,chs:m.pick?m.names:m.ch,idx};draw()}
function draw(){const m=A,pr=m.ph=='pred',t0=pr?0:TMR[m.ty]||0,rid=m.rid;
const lead=pr?(m.pick?'Guess who the group will pick most':'Guess the MOST POPULAR answer'):(m.sub>=0?(m.idx==m.sub?'Your honest answer':'Guess what '+E(m.names[m.sub])+' picked'):'Your secret answer');
R(`<div class=c><div class=lb><span class=m>Round ${m.i+1} / ${m.n}</span>${pr?'<span class=tag>🔮 PREDICT</span>':m.ty!='normal'?`<span class=tag>${INFO[m.ty][0]}</span>`:'<span></span>'}</div><div class="card q">${E(m.t)}${m.hot?`<div class="m sm">🪑 Hot seat: ${E(m.hot)}</div>`:''}</div><p class=m>${lead}</p>${t0?`<div class=bar id=tb style="width:100%;transition:width ${t0}s linear"></div>`:''}${m.chs.map((c,i)=>`<button class="b g ch" onclick="SBp(${i})">${E(c)}</button>`).join('')}${m.ty=='instant'&&!pr?'':'<button class="b y" onclick=SBlk()>🔒 Lock in</button>'}</div>`);
if(t0){setTimeout(()=>{const b=$('#tb');b&&(b.style.width='0')},50);clearTimeout(A.tm);A.tm=setTimeout(()=>{if(A.rid==rid&&!A.done&&A.ph=='ans')sub(A.sel||'')},t0*1000)}}
window.SBp=i=>{if(A.done)return;if(A.ty=='instant'&&A.ph=='ans')return sub(A.chs[i]);A.sel=A.chs[i];document.querySelectorAll('.ch').forEach((b,j)=>b.classList.toggle('sel',j==i));snd(380,.05)};
window.SBlk=()=>A.sel?sub(A.sel):T('Pick an answer first');
function sub(v){if(A.done)return;if(A.ph=='pred'){A.pd=v;A.ph='ans';A.sel=null;return draw()}A.done=1;clearTimeout(A.tm);snd(520);const p={k:'ans',rid:A.rid,pid:me(),a:v,pd:A.pd||''};isH()?(p.f=me(),hans(p)):send(p);wait('🔒 Locked in. Waiting for everyone…')}
function author(m){R(`<div class=c style="justify-content:flex-start"><h2>Write your split</h2><input id=sp1 maxlength=90 placeholder="Prompt, e.g. Pineapple on pizza?"><input id=sa maxlength=30 placeholder="Option A"><input id=sb maxlength=30 placeholder="Option B"><p class="m sm">The closer the vote is to an even split, the more points you earn. You sit out the voting.</p><button class="b g keep" onclick=ssg()>🎲 Suggest a prompt</button><button class="b y" onclick=SBsp(${m.rid})>🔒 Lock in prompt</button></div>`)}
window.SBsp=rid=>{const t=$('#sp1').value.trim(),a=$('#sa').value.trim(),b=$('#sb').value.trim();if(!t||!a||!b)return T('Fill in the prompt and both options');if(nm(a)==nm(b))return T('Options must be different');
const p={k:'sp',rid,pid:me(),t,a,b};isH()?hsp(p):send(p);wait('🔒 Prompt sent…')};
/* ----- presence hooks, reconnection, host hand-over ----- */
async function takeover(){const o=o_();o.host=1;
if(SN&&SN.s){try{st=JSON.parse(SN.s);Object.assign(S,SN.S);G={on:1,ros:SN.ros,rid:SN.rid,ans:{},phase:SN.ph,nl:0};o.started=1;await meta(1);T('You are now the host');document.body.classList.add('ol');watch();
if(SN.ph=='pub'&&SN.h){G.pub=SN.h;R(SN.h)}else round();hc();return}catch(e){}}
Object.assign(S,o.cfg||{});G=null;await meta(0);T('You are now the host');X.lob(1)}
window.SBG={on,
sync(){const o=o_(),cur=new Set(o.pl.map(p=>p.pid));
if(o.host&&G&&G.on){cur.forEach(pid=>{if(!seen.has(pid)&&pid!=o.pid&&G.ros.includes(pid))send({k:'res',to:pid,ph:G.phase,html:G.phase=='pub'?G.pub:'',q:G.phase=='q'?G.cur:null,answered:!!G.ans[pid]})});check()}
seen=cur},
hostGone(){if(HT)return;HT=setTimeout(()=>{HT=0;const o=o_();if(!o||!o.in||o.host||o.pl.some(p=>p.host))return;o.pl.map(p=>p.pid).sort()[0]==o.pid?takeover():SBG.hostGone()},7000)}};
})();
