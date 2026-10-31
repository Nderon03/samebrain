/* Same Brain – online gameplay. Load AFTER samebrain-redesign.js.
   Design: the HOST device runs the original engine (scoring, modes, questions unchanged). Other phones answer privately;
   the host reveals results and broadcasts the rendered screens. Every game has its own id (gid) and every question its own
   round id (rid), so late, duplicated or replayed messages from an earlier game or round are ignored.
   The host also broadcasts engine snapshots (for host hand-over) and keeps the latest one in its own tab, so a host page
   reload can pick the game up again. */
(()=>{
const X=window.SBX;if(!X)return;
document.head.insertAdjacentHTML('beforeend',`<style>.ol #app .c>.b.g:not(.ch):not(.keep){display:none}.ol #app .c{padding-bottom:96px}
#hc{position:fixed;left:0;right:0;bottom:calc(env(safe-area-inset-bottom) + 12px);display:flex;gap:8px;justify-content:center;z-index:9;pointer-events:none;padding:0 12px}
#hc button{pointer-events:auto;background:#1b1540ee;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid #ffffff33;border-radius:99px;padding:12px 16px;font-size:15px;font-weight:800;min-height:46px;box-shadow:0 8px 24px #0008}
.olw{text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px}.olw .bar{width:60%;animation:pl2 1.4s ease-in-out infinite}@keyframes pl2{50%{opacity:.35}}
.hcl{display:flex;flex-direction:column;gap:8px;text-align:left;margin-top:4px}.hcl .pc{animation:none}
@media(max-width:360px){#hc button{padding:11px 12px;font-size:14px}}
.wq{display:flex;flex-wrap:wrap;justify-content:center;gap:12px 10px;margin-top:6px;max-width:420px}.wqi{display:flex;flex-direction:column;align-items:center;gap:4px;width:64px;position:relative;opacity:.45;transition:opacity .3s}
.wqi .av{width:46px;height:46px;font-size:19px;transition:box-shadow .3s}.wqi small{font-size:12px;max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wqi i{position:absolute;top:28px;left:38px;width:22px;height:22px;border-radius:50%;background:#22c55e;color:#06210f;font-style:normal;font-size:13px;font-weight:900;display:grid;place-items:center;transform:scale(0);transition:transform .3s cubic-bezier(.2,.9,.3,1.4)}
.wqi.ok{opacity:1}.wqi.ok .av{box-shadow:0 0 0 3px #22c55e}.wqi.ok i{transform:scale(1)}.wqc{font-size:14px;opacity:.7;margin-top:4px}
.pubf{text-align:center;display:flex;flex-direction:column;gap:10px;margin-top:6px}</style>`);
let G=null,A={},SN=null,seen=new Set(),PG='',GID='',starting=0;
const o_=X.O,me=()=>o_().pid,isH=()=>{const o=o_();return!!(o&&o.in&&o.host)};
const send=m=>{const o=o_();if(o&&o.ch){m.f=o.pid;o.ch.send({type:'broadcast',event:'g',payload:m}).catch(()=>{})}};
const TMR={freeze:10,instant:5};
const cfgS=c=>({mode:c.mode,rounds:c.rounds,sp:c.sp,sx:c.mode=='split'?0:c.sx,lv:c.lv});
function stopG(){if(!G)return;clearTimeout(G.tm);clearTimeout(G.ot);clearTimeout(G.wt);G.mo&&G.mo.disconnect();G.on=0}

/* ----- host: start a game (also used for Play Again) ----- */
/* keep=1 (Play Again) carries the series totals on; a start from the lobby begins a new series */
window.SBstart=function(keep){const o=o_();if(!o||!o.host||!o.in||starting||(G&&G.on&&!G.done))return;
const L=o.pl.slice().sort((a,b)=>b.host-a.host),c=o.meta.cfg,[mn,mx]=X.lim(c.mode);
if(L.length<mn)return T(`Need at least ${mn} connected players`);if(L.length>mx)return T(`${({classic:'Classic',likely:'Most Likely',know:'Know Me',split:'Split'})[c.mode]} supports up to ${mx} players`);
starting=1;try{stopG();if(!keep)SER=null;Object.assign(S,cfgS(c));A={};PG='';clearTimeout(st.tm);
GID='g'+Math.random().toString(36).slice(2,9);G={on:1,gid:GID,ros:L.map(p=>p.pid),rid:0,ans:{}};seen=new Set(o.pl.map(p=>p.pid));
X.setRoom({st:GID,gros:G.ros,ed:0});closeModal(1);cl();document.body.classList.add('ol');send({k:'go',gid:GID,ros:G.ros});watch();start(L.map(p=>p.name))}finally{starting=0}};
const _r=window.round;window.round=function(){_r();G&&G.on&&isH()&&oround()};
const _n=window.nxt;window.nxt=function(){if(G&&G.on){if(G.nl)return;G.nl=1}_n()};
const _f=window.finish;window.finish=function(){_f();if(G&&G.on&&isH()){G.done=1;hc();snap()}};
function push(m){m.f=me();m.gid=G.gid;m.ros=G.ros;G.cur=m;send(m);on(m);snap()}
function oround(){G.rid++;G.ans={};G.rev=0;G.nl=0;G.phase='q';G.lastH=null;clearTimeout(G.tm);clearTimeout(G.ot);PG='';
if(S.mode=='split'&&!st.qs[st.i]){const a=st.pa;G.auth=a;G.spd=0;G.exp=[];push({k:'auth',rid:G.rid,to:G.ros[a],n:st.P[a].n});wcheck();return hc()}
G.auth=null;const r=st.r,q=r.q;G.exp=st.P.map((_,j)=>j).filter(j=>!(r.spl>=0&&j==r.spl));G.chs=q.pick?st.P.map(p=>p.n):q.ch;
push({k:'q',rid:G.rid,t:q.t,ch:q.ch,pick:q.pick?1:0,ty:r.ty,hot:r.hot||'',sub:r.sub>=0?r.sub:-1,spl:r.spl>=0?r.spl:-1,i:st.i,n:st.qs.length,names:st.P.map(p=>p.n),ros:G.ros,sx:S.sx?1:0,sd:st.sd?1:0});
if(TMR[r.ty])G.tm=setTimeout(reveal,(TMR[r.ty]+4)*1000);hc()}
function alive(){return new Set(o_().pl.map(p=>p.pid))}
/* Split: if this round's writer is disconnected for 8s, use a suggested prompt (same as the host's Skip writer button) */
function wcheck(){if(!G||!G.on||G.auth==null||G.spd)return;if(alive().has(G.ros[G.auth])){clearTimeout(G.wt);G.wt=0;return}
if(!G.wt)G.wt=setTimeout(()=>{G.wt=0;if(G&&G.on&&G.auth!=null&&!G.spd&&!alive().has(G.ros[G.auth])){T(st.P[G.auth].n+' is away, so a suggested prompt was used');SBskip()}},8000)}
function check(){if(!G||!G.on||G.phase!='q'||G.rev||G.auth!=null)return;const al=alive(),need=G.exp.filter(j=>al.has(G.ros[j])||G.ans[G.ros[j]]),d=need.filter(j=>G.ans[G.ros[j]]).length;
const p={k:'prog',rid:G.rid,gid:G.gid,d,t:need.length,ps:need.map(j=>[st.P[j].n,G.ans[G.ros[j]]?1:0])};send(p);on(p);if(need.length&&d==need.length)reveal()}
function reveal(){if(!G||!G.on||G.rev||G.phase!='q'||G.auth!=null||!st.r)return;G.rev=1;clearTimeout(G.tm);const r=st.r;
r.a=G.exp.map(j=>{const a=G.ans[G.ros[j]];return{p:j,a:a?a.a:'',pd:a?a.pd:''}});G.phase='pub';reveal2();hc()}
const banned=pid=>((o_().meta||{}).ban||[]).includes(pid);
function hans(m){if(!G||!G.on||banned(m.pid)||m.gid!==G.gid||m.rid!=G.rid||G.rev||G.phase!='q'||G.auth!=null)return;const j=G.ros.indexOf(m.pid);if(j<0||!G.exp.includes(j)||G.ans[m.pid])return;
const ok=v=>v===''||G.chs.includes(v);if(!ok(m.a)||!ok(m.pd||''))return;G.ans[m.pid]={a:m.a,pd:m.pd||''};check()}
function hsp(m){if(!G||!G.on||banned(m.pid)||G.auth==null||G.spd||m.gid!==G.gid||m.rid!=G.rid||m.pid!=G.ros[G.auth])return;const t=String(m.t||'').trim().slice(0,90),a=String(m.a||'').trim().slice(0,30),b=String(m.b||'').trim().slice(0,30);
if(!t||!a||!b||nm(a)==nm(b))return;G.spd=1;st.qs[st.i]={t,ch:[a,b],pick:0};round()}
/* host publishes every engine screen after reveal (results, leaderboard, final) */
function watch(){if(G.mo)return;G.mo=new MutationObserver(()=>{if(!G||!G.on||G.phase!='pub')return;clearTimeout(G.ot);G.ot=setTimeout(pub,150)});G.mo.observe(app,{childList:true,subtree:true,characterData:true})}
/* only results-phase screens are published; a send queued just before the next round started is dropped */
function pub(){if(!G||!G.on||!isH()||G.phase!='pub')return;const c=app.cloneNode(true);c.querySelectorAll('[data-cu]').forEach(e=>e.textContent=e.dataset.cu.split(',')[1]);const h=c.innerHTML;if(h===G.lastH)return;G.lastH=h;G.pub=h;send({k:'pub',gid:G.gid,ros:G.ros,html:h})}
function snap(){if(!G||!isH())return;try{const m={k:'snap',gid:G.gid,s:JSON.stringify(st),S:cfgS(S),ros:G.ros,rid:G.rid,ph:G.phase,done:G.done?1:0,ser:SER};send(m);X.save('sbsnap',m)}catch(e){}}
function hc(){let e=$('#hc');if(!G||!G.on||!isH()||G.done){e&&e.remove();return}if(!e){document.body.insertAdjacentHTML('beforeend','<div id=hc></div>');e=$('#hc')}
e.innerHTML=(G.phase=='q'?(G.auth!=null?'<button type=button onclick=SBskip()>⏭ Skip writer</button>':'<button type=button onclick=SBrev()>⏩ Reveal now</button>'):'')+'<button type=button onclick=SBpl() aria-label="Players">👥 Players</button><button type=button onclick=SBend()>⏹ End game</button>'}
window.SBpl=()=>{const o=o_();if(!isH())return;const P=o.all.filter(p=>p.pid!==o.pid);
modal({icon:'👥',title:'Players',body:P.length?`<div class=hcl>${P.map(p=>`<div class="pc${p.on?'':' off'}">${av(p.name)}<span class=n><span class=nn>${E(p.name)}</span><span class=ps>${!p.on?'Reconnecting…':G&&G.ros.includes(p.pid)?'In this game':'Joins next game'}</span></span><button type=button class=x onclick="kickAsk('${p.pid}')" aria-label="Remove ${E(p.name)}">✕</button></div>`).join('')}</div>`:'<p>No other players in the room.</p>',btns:[['Close','g']]})};
window.SBrev=()=>reveal();
window.SBskip=()=>{if(!G||G.auth==null)return;const q=SPLQ[Math.floor(Math.random()*SPLQ.length)];hsp({gid:G.gid,rid:G.rid,pid:G.ros[G.auth],t:q[0],a:q[1],b:q[2]})};
window.SBend=()=>{if(!isH())return;modal({icon:'⏹',title:'End game?',body:'Everyone returns to the lobby. Scores from this game won\'t be kept.',tone:'danger',btns:[['Keep playing','g'],['End game','r',()=>SBendTo('lobby')]]})};
/* end-of-game controls (host only; other players never see buttons they can't use) */
window.endNav=()=>G&&G.on&&isH()?`<button type=button class="b y keep" onclick=SBagain()>🔁 PLAY AGAIN<small>Same room and settings, fresh questions. Scores add to the series.</small></button><button type=button class="b g keep" onclick="SBendTo('set')">⚙️ CHANGE SETTINGS</button><button type=button class="b g keep" onclick="SBendTo('lobby')">🏠 RETURN TO LOBBY</button>`:'';
window.SBagain=()=>{if(!isH()||!G||!G.done||starting)return;const o=o_(),[mn,mx]=X.lim(o.meta.cfg.mode),n=o.pl.length;
if(n<mn||n>mx){T(n<mn?`Need at least ${mn} connected players for a rematch`:`Too many players for this mode`);return SBendTo('lobby')}
document.querySelectorAll('.fnav button').forEach(b=>b.disabled=true);SBstart(1)};
window.SBendTo=to=>{if(!isH())return;send({k:'end',to,gid:G&&G.gid});endLocal(to)};
function endLocal(to){const o=o_();if(!o)return;stopG();G=null;A={};SN=null;PG='';st.on=0;st.id=0;clearTimeout(st.tm);document.body.classList.remove('ol');const h=$('#hc');h&&h.remove();closeModal(1);cl();X.save('sbsnap',null);
if(o.host){X.setRoom({st:0,gros:[],ed:to=='set'?1:0});if(to=='set')return hostSetup(1)}else if(o.room)o.room={...o.room,st:0};X.lob()}

/* ----- all devices ----- */
function on(m){const o=o_();if(!o||!o.in&&m.k!=='res')return;const fromH=m.f===o.pid||X.isHostPid(m.f);
if(Array.isArray(m.ros)&&/^(go|q|auth|pub)$/.test(m.k)&&!m.ros.includes(o.pid))return;
switch(m.k){
case'go':if(fromH&&!isH()&&m.gid&&m.gid!==GID){GID=m.gid;A={};PG='';SN=null;closeModal(1);cl();document.body.classList.add('ol');wait('🎮 Game starting…')}break;
case'auth':if(!fromH)break;adopt(m.gid);if(A.rid!=m.rid)PG='';document.body.classList.add('ol');m.to==me()?author(m):wait('✍️ '+E(m.n)+' is writing a split…');break;
case'q':if(fromH){adopt(m.gid);ask(m)}break;
case'pub':if(fromH&&!isH()&&m.gid===GID)showPub(m.html);break;
case'prog':if(fromH&&m.gid===GID){PG=progH(m);const e=$('#pg');e&&(e.innerHTML=PG)}break;
case'res':if(fromH&&m.to===me()){adopt(m.gid);resume(m)}break;
case'snap':if(fromH&&!isH())SN=m;break;
case'end':if(fromH&&!isH()&&(!m.gid||m.gid===GID||!GID))endLocal(m.to);break;
case'need':if(isH()&&G&&G.on)resFor(m.f);break;
case'ans':if(isH()&&m.pid===m.f)hans(m);break;
case'sp':if(isH()&&m.pid===m.f)hsp(m);break}}
/* a question from a newer game than we know about (we missed 'go' while reconnecting): switch to it */
function adopt(gid){if(gid&&gid!==GID){GID=gid;A={};PG=''}}
function resFor(pid){if(!G||!G.on||!G.ros.includes(pid)||banned(pid))return;send({k:'res',to:pid,gid:G.gid,ph:G.phase,html:G.phase=='pub'?G.pub||app.innerHTML:'',q:G.phase=='q'?G.cur:null,answered:!!G.ans[pid]})}
const progH=m=>(Array.isArray(m.ps)?`<div class=wq>${m.ps.slice(0,12).map(([n,k])=>`<span class="wqi${k?' ok':''}" title="${E(n)}${k?' has answered':' is still answering'}">${av(String(n))}<i>✓</i><small>${E(n)}</small></span>`).join('')}</div>`:'')+`<div class=wqc>${+m.d||0} / ${+m.t||0} answered</div>`;
function wait(h){R(`<div class="c olw" data-scr=wait><h2>${h}</h2><div id=pg>${PG}</div><div class=bar></div></div>`)}
function showPub(h){const d=document.createElement('div');d.innerHTML=h;d.querySelectorAll('script,iframe,object,embed,style,link,meta,button,input,form').forEach(x=>x.remove());d.querySelectorAll('*').forEach(x=>[...x.attributes].forEach(a=>(/^on/i.test(a.name)||/^\s*javascript:/i.test(a.value))&&x.removeAttribute(a.name)));
const c=d.firstElementChild;if(!c)return;const fin=c.getAttribute('data-scr')=='fin';
c.insertAdjacentHTML('beforeend',fin?'<div class=pubf><p class=m>The host will start a rematch, change the settings or return everyone to the lobby.</p><p class="m sm">Waiting for the host<span class=dots></span></p><button type=button class="b g keep" onclick=leaveAsk()>Leave room</button></div>':'<p class="m sm" style="text-align:center">Waiting for the host…</p>');
document.body.classList.add('ol');R(d.innerHTML)}
function resume(m){document.body.classList.add('ol');if(m.ph=='pub'&&m.html)return showPub(m.html);const q=m.q;
if(q&&q.k=='auth')return q.to==me()?author(q):wait('✍️ '+E(q.n)+' is writing a split…');
if(q){if(m.answered){A={gid:q.gid,rid:q.rid,done:1};wait('🔒 Locked in. Waiting for everyone…')}else ask(q)}else wait('🎮 Game in progress…')}
function ask(m){if(A.gid===m.gid&&A.rid==m.rid&&A.done)return;if(A.gid===m.gid&&A.rid==m.rid&&!A.done&&$('.ch'))return;document.body.classList.add('ol');const idx=m.ros.indexOf(me());if(idx<0)return wait('👀 Spectating this game');
if(m.spl==idx){if(A.rid!=m.rid)PG='';A={gid:m.gid,rid:m.rid,done:1};return wait('✍️ You wrote this one. Sit back while everyone votes')}
if(A.rid!=m.rid)PG='';const hotMe=m.ty=='hot'&&m.names[idx]==m.hot;clearTimeout(A.tm);A={...m,ph:(m.ty=='predict'||hotMe)?'pred':'ans',sel:null,done:0,chs:m.pick?m.names:m.ch,idx};draw()}
function draw(){const m=A,pr=m.ph=='pred',t0=pr?0:TMR[m.ty]||0,rid=m.rid,gid=m.gid;
const lead=pr?(m.pick?'Guess who the group will pick most':'Guess the MOST POPULAR answer'):(m.sub>=0?(m.idx==m.sub?'Your honest answer':'Guess what '+E(m.names[m.sub])+' picked'):'Your secret answer');
R(`<div class=c><div class=lb><span class=m>Round ${m.i+1} / ${m.n}${m.sx?' · Mature':''}${m.sd?' · ⚔️ SUDDEN DEATH':''}</span>${pr?'<span class=tag>🔮 PREDICT</span>':m.ty!='normal'?`<span class=tag>${INFO[m.ty][0]}</span>`:'<span></span>'}</div>${spb(m.ty)}<div class="card q">${E(m.t)}${m.hot?`<div class="m sm">🪑 Hot seat: ${E(m.hot)}</div>`:''}</div><p class=m>${lead}</p>${t0?`<div class=bar id=tb style="width:100%;transition:width ${t0}s linear"></div>`:''}${m.chs.map((c,i)=>`<button type=button class="b g ch" onclick="SBp(${i})">${E(c)}</button>`).join('')}${m.ty=='instant'&&!pr?'':'<button type=button class="b y" onclick=SBlk()>🔒 Lock in</button>'}</div>`);
if(t0){setTimeout(()=>{const b=$('#tb');b&&(b.style.width='0')},50);clearTimeout(A.tm);A.tm=setTimeout(()=>{if(A.gid===gid&&A.rid==rid&&!A.done&&A.ph=='ans')sub(A.sel||'')},t0*1000);hurry(t0,()=>A.gid===gid&&A.rid==rid&&!A.done&&A.ph=='ans')}}
window.SBp=i=>{if(A.done||!A.chs)return;if(A.ty=='instant'&&A.ph=='ans')return sub(A.chs[i]);A.sel=A.chs[i];document.querySelectorAll('.ch').forEach((b,j)=>b.classList.toggle('sel',j==i));snd(380,.05)};
window.SBlk=()=>A.sel?sub(A.sel):T('Pick an answer first');
function sub(v){if(A.done)return;if(A.ph=='pred'){A.pd=v;A.ph='ans';A.sel=null;return draw()}A.done=1;clearTimeout(A.tm);snd(520);const p={k:'ans',gid:A.gid,rid:A.rid,pid:me(),a:v,pd:A.pd||''};
/* show the waiting screen first: on the host, the last answer reveals the results synchronously */
wait('🔒 Locked in. Waiting for everyone…');isH()?(p.f=me(),hans(p)):send(p)}
function author(m){A={gid:m.gid,rid:m.rid,auth:1};R(`<div class=c style="justify-content:flex-start"><h2>Write your split</h2><input id=sp1 data-af maxlength=90 placeholder="Prompt, e.g. Pineapple on pizza?"><input id=sa maxlength=30 placeholder="Option A"><input id=sb maxlength=30 placeholder="Option B"><p class="m sm">The closer the vote is to an even split, the more points you earn. You sit out the voting.</p><button type=button class="b g keep" onclick=ssg()>🎲 Suggest a prompt</button><button type=button class="b y" onclick="SBsp(${m.rid})">🔒 Lock in prompt</button></div>`)}
window.SBsp=rid=>{if(A.sent===rid)return;const t=$('#sp1').value.trim(),a=$('#sa').value.trim(),b=$('#sb').value.trim();if(!t||!a||!b)return T('Fill in the prompt and both options');if(nm(a)==nm(b))return T('Options must be different');
A.sent=rid;const p={k:'sp',gid:A.gid,rid,pid:me(),t,a,b};wait('🔒 Prompt sent…');isH()?hsp(p):send(p)};

/* ----- hand-over, reconnection, leaving ----- */
/* become the game's host from a snapshot: the previous host's last broadcast, or this tab's own copy after a reload */
function takeover(sn){const o=o_();sn=sn||SN;
if(sn&&sn.s&&sn.gid===o.meta.st){try{st=JSON.parse(sn.s);Object.assign(S,sn.S);SER=sn.ser||null;stopG();GID=sn.gid;G={on:1,gid:sn.gid,ros:sn.ros,rid:sn.rid,ans:{},phase:sn.ph,nl:0,done:sn.done};seen=new Set(o.pl.map(p=>p.pid));A={};
document.body.classList.add('ol');watch();X.setRoom({st:G.gid,gros:G.ros});
/* rebuild the current screen from the engine state rather than re-using another device's HTML */
if(G.done)finish();else if(sn.ph=='pub')board();else{if(st.r&&st.r.ty=='predict')st.pr--;if(st.r&&st.r.hot)(st.hl=st.hl||[]).push(st.r.hot);round()}
hc();snap();return}catch(e){console.warn('[SameBrain] takeover failed',e)}}
/* no usable game state: bring everyone back to the lobby rather than leaving them stuck */
T('The game couldn\'t be recovered, back to the lobby');send({k:'end',to:'lobby',gid:o.meta.st});endLocal('lobby')}
window.SBG={on,
sync(){const o=o_();if(!o)return;const cur=new Set(o.pl.map(p=>p.pid));if(isH()&&G&&G.on){cur.forEach(pid=>{if(!seen.has(pid)&&pid!==o.pid)resFor(pid)});check();wcheck()}seen=cur},
/* after our channel came back: ask the host for the current state, in case we missed messages */
resub(){const o=o_();if(o&&!o.host&&o.room&&o.room.st&&(o.room.gros||[]).includes(o.pid))send({k:'need'})},
takeover,
reset(){stopG();G=null;A={};SN=null;GID='';PG='';seen=new Set();document.body.classList.remove('ol');const h=$('#hc');h&&h.remove()}};
})();
