/* Same Brain – redesign layer. Load AFTER the main inline script:  <script src="samebrain-redesign.js"></script>
   Online lobby needs a free Supabase project (Realtime enabled). Fill in CFG below. Pass & Play never uses it. */
(()=>{
const CFG={
  url:'https://jonvocvgcwsufafvmfyh.supabase.co',
  key:'sb_publishable_x4ioZwcwevVfsg8lJ6pZ0Q_ZDYMC9CD'
};
const MAX=12,ok=()=>!!(CFG.url&&CFG.key);
document.head.insertAdjacentHTML('beforeend',`<style>
.c{max-width:560px}.hero{text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
.hero .brand-icon{margin:0 auto;width:84px;height:84px}.hero h1{font-size:clamp(44px,13vw,64px)}
.tag2{opacity:.75;font-weight:600}
.big-b{display:flex;align-items:center;gap:14px;text-align:left;padding:18px 20px;border:0;border-radius:22px;width:100%;min-height:76px}
.big-b .ic{font-size:32px}.big-b b{display:block;font-size:19px;font-weight:900;letter-spacing:.02em}.big-b span.d{display:block;font-size:14px;font-weight:600;opacity:.8}
.big-b.host{background:linear-gradient(135deg,var(--y),#f97316);color:#1a1033;box-shadow:0 8px 28px #fbbf2433}
.big-b.join{background:linear-gradient(135deg,var(--p),#6366f1);box-shadow:0 8px 28px #8b5cf644}
.big-b.pp{background:#ffffff12;border:1px solid #ffffff22}
.mg{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mc2{padding:14px 12px;border-radius:18px;border:2px solid #ffffff1c;background:#ffffff0d;text-align:left;transition:transform .15s,border-color .15s,background .15s;min-height:104px}
.mc2 .ic{font-size:26px;display:block}.mc2 b{display:block;margin-top:4px;font-size:16px}.mc2 span.d{display:block;font-size:13px;opacity:.7;font-weight:600;line-height:1.3;margin-top:2px}
.mc2.on{border-color:var(--ac);background:color-mix(in srgb,var(--ac) 18%,transparent);transform:translateY(-2px)}
.ft{display:flex;justify-content:space-between;align-items:center;font-size:13px;opacity:.55;padding-top:8px}
.ft button{background:none;border:0;opacity:.9;font-size:14px;padding:10px 4px}
.code{font-size:clamp(54px,18vw,84px);font-weight:900;letter-spacing:.14em;text-align:center;color:var(--y);text-shadow:0 0 30px #fbbf2455;padding-left:.14em}
.cin{text-align:center;font-size:40px;font-weight:900;letter-spacing:.3em;text-transform:uppercase;padding-left:.3em}
.pg{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
.pc{display:flex;align-items:center;gap:10px;padding:10px;border-radius:16px;background:#ffffff0f;border:1px solid #ffffff1c;animation:pop .35s both;min-width:0}
.pc .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pc .x{width:36px;height:36px;border:0;border-radius:10px;background:#ffffff14;flex:none}
.av{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:#12081f;font-weight:900;flex:none}
.qr{background:#fff;border-radius:14px;padding:8px;width:136px;height:136px;margin:0 auto}.qr svg{width:100%;height:100%;display:block}
.er{color:#fca5a5;text-align:center;min-height:20px;font-size:15px}.warn{background:#fbbf2418;border:1px solid #fbbf2455;border-radius:16px;padding:12px;font-size:14px}
.dots:after{content:'';animation:dt 1.4s steps(4) infinite}@keyframes dt{0%{content:''}25%{content:'.'}50%{content:'..'}75%{content:'...'}}
</style>`);
const IC=($('.brand-icon')||{}).src||'',AV=['#8b5cf6','#38bdf8','#fbbf24','#f97316','#22c55e','#f43f5e'];
const av=n=>`<span class=av style="background:${AV[[...n].reduce((a,c)=>a+c.charCodeAt(0),0)%6]}">${E([...n][0]||'?').toUpperCase()}</span>`;
const MD={classic:['🎯','Classic','Divisive multiple choice. Match the majority to score.','#8b5cf6'],likely:['👀','Most Likely','Vote for who is most likely to… Match the majority.','#38bdf8'],split:['⚖️','Split','Write a prompt, split the room evenly to win big.','#fbbf24'],know:['🧑‍🤝‍🧑','Know Me','Guess what your friend secretly picked.','#f97316']};
const cards=(js,sel)=>Object.keys(MD).map(k=>`<button class="mc2 ${sel==k?'on':''}" style="--ac:${MD[k][3]}" onclick="${js(k)}"><i class=ic style="font-style:normal">${MD[k][0]}</i><b>${MD[k][1]}</b><span class=d>${MD[k][2]}</span></button>`).join('');
const uid=()=>Math.random().toString(36).slice(2,8);
const csec=()=>ok()?'':'<div class=warn>⚙️ Online play isn\'t configured yet. Add your Supabase URL and key at the top of <b>samebrain-redesign.js</b>. Pass &amp; Play works without it.</div>';

/* ---------- home ---------- */
window.home=function(){cl();st.on=0;st.id=0;st.rid=0;clearTimeout(st.tm);leave2();atHome=1;
R(`<div class=c style="justify-content:flex-start"><div class=hero>${IC?`<img class=brand-icon src="${IC}" alt="">`:''}<h1>SAME<br>BRAIN</h1><p class=tag2>Think like your friends. Or don't.</p></div>
<button class="big-b host b" onclick=hostSetup()><i class=ic style="font-style:normal">🎉</i><span><b>HOST A GAME</b><span class=d>Create a room and invite your friends</span></span></button>
<button class="big-b join b" onclick="joinScr()"><i class=ic style="font-style:normal">🔑</i><span><b>JOIN A GAME</b><span class=d>Enter a room code to join in</span></span></button>
<button class="big-b pp b" onclick=setup()><i class=ic style="font-style:normal">📱</i><span><b>PASS &amp; PLAY</b><span class=d>One phone, passed around the group</span></span></button>
<h3>Game modes</h3><div class=mg>${Object.keys(MD).map(k=>`<div class=mc2 style="--ac:${MD[k][3]};min-height:0"><i class=ic style="font-style:normal">${MD[k][0]}</i><b>${MD[k][1]}</b><span class=d>${MD[k][2]}</span></div>`).join('')}</div>
<div class=ft><span>Same Brain · 18+ Spicy option</span><span><button onclick=sets()>⚙️ Settings</button><button onclick="rules()">How to play</button></span></div></div>`)};
window.sets=function(){ov(`<div class=c style="text-align:center"><h2>⚙️ Settings</h2><button class="b g" onclick="tog();sets()">Sound: ${S.sound?'On 🔊':'Off 🔇'}</button><button class="b g" onclick="cl();rules()">How to play</button><button class="b g" onclick="if(confirm('Clear saved names and settings?')){localStorage.removeItem('samebrain');location.reload()}">Clear saved data</button><button class="b y" onclick=cl()>Done</button></div>`)};

/* ---------- pass & play setup: mode cards ---------- */
const _s=window.setup;window.setup=function(){_s();const h=[...document.querySelectorAll('h3')].find(x=>x.textContent=='Mode');if(h&&h.nextElementSibling)h.nextElementSibling.outerHTML=`<div class=mg>${cards(k=>`S.mode='${k}';sv();setup()`,S.mode)}</div>`};

/* ---------- host setup ---------- */
window.hostSetup=function(){const sp=(l,on,js)=>`<button class="${on?'on':''}" onclick="${js};sv();hostSetup()">${l}</button>`;
R(`<div class=c style="justify-content:flex-start"><h2>Host a game</h2>${csec()}<h3>Your name</h3><input id=in maxlength=14 placeholder="Display name" value="${E(S.hn||'')}" oninput="S.hn=this.value;sv()"><h3>Mode</h3><div class=mg>${cards(k=>`S.mode='${k}';sv();hostSetup()`,S.mode)}</div><h3>Rounds</h3><div class=seg>${[5,10,15].map(n=>sp(n,S.rounds==n,`S.rounds=${n}`)).join('')}</div><h3>Special rounds</h3><div class=seg>${sp('On',S.sp,'S.sp=1')}${sp('Off',!S.sp,'S.sp=0')}</div><h3>Spicy 🔞 (18+)</h3><div class=seg>${sp('Off',!S.sx,'S.sx=0')}<button class="${S.sx?'on':''}" onclick="${S.sx?'':`ov('<div class=c style=text-align:center><h2>Spicy mode</h2><p class=m>Everyone playing must be 18+.</p><button class=&quot;b y&quot; onclick=&quot;S.sx=1;sv();cl();hostSetup()&quot;>I\\'m 18+, turn it on</button><button class=&quot;b g&quot; onclick=cl()>Cancel</button></div>')`}">On</button></div><p class="er" id=er></p><button class="b y" onclick=mkRoom()>Create game</button><button class="b g" onclick=home()>Back</button></div>`)};

/* ---------- realtime ---------- */
/* Open the browser console (F12) to follow every step: all lines are prefixed [SameBrain]. */
let O=null,busy=0,CLEAN=Promise.resolve();
const LOG=(...a)=>console.log('%c[SameBrain]','color:#8b5cf6;font-weight:bold',...a),WARN=(...a)=>console.warn('[SameBrain]',...a),ERR=(...a)=>console.error('[SameBrain]',...a);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
/* poll f() until truthy or ms elapsed; resolves the truthy value, or 0 on timeout */
const until=(f,ms,step=150)=>new Promise(r=>{const t0=Date.now();(function p(){let v;try{v=f()}catch(e){v=0}if(v)return r(v);if(Date.now()-t0>=ms)return r(0);setTimeout(p,step)})()});
/* every failure carries a code so the UI can say exactly what went wrong */
function SBE(code,msg,cause){const e=new Error(msg);e.code=code;e.cause=cause;return e}

/* --- library loading: tries several CDNs, each with its own timeout --- */
const SRC=['supabase.min.js','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js','https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'];
let libP=null;
const loadScript=(src,ms=8000)=>new Promise((res,rej)=>{const s=document.createElement('script'),t=setTimeout(()=>{s.remove();rej(new Error('timed out'))},ms);s.src=src;s.onload=()=>{clearTimeout(t);res()};s.onerror=()=>{clearTimeout(t);s.remove();rej(new Error('failed to load'))};document.head.appendChild(s)});
function lib(){if(window.supabase&&window.supabase.createClient)return Promise.resolve();
if(libP)return libP;
return libP=(async()=>{for(const s of SRC){try{LOG('loading Supabase library',s);await loadScript(s);if(window.supabase&&window.supabase.createClient){LOG('Supabase library loaded');return}WARN('script loaded but window.supabase is missing',s)}catch(e){WARN('library load failed',s,e.message)}}
libP=null;throw SBE('LIB','Could not load the Supabase library. Check your connection, then reload the page. If it keeps happening, make sure supabase.min.js is uploaded next to index.html.')})()}

/* --- one shared client for the whole page --- */
function client(){if(window._sb)return window._sb;if(!ok())throw SBE('CFG','Online play isn\'t configured yet');
try{window._sb=window.supabase.createClient(CFG.url,CFG.key,{realtime:{params:{eventsPerSecond:20}}});LOG('Supabase client created for',CFG.url)}catch(e){throw SBE('CLIENT','Could not initialise Supabase: '+e.message,e)}
return window._sb}

/* --- presence helpers: always read the live presence state, never rely on a single sync event --- */
const readPl=o=>Object.values(o.ch.presenceState()).map(a=>a[a.length-1]).filter(p=>p&&p.name);
const hostOf=o=>readPl(o).find(p=>p.host);

/* --- cleanup: untrack + remove the channel; later connects wait for it so topics never collide --- */
function leave2(){try{sessionStorage.removeItem('sbsess')}catch(e){}if(!O)return;const o=O;O=null;o.dead=1;clearTimeout(o.hg);
CLEAN=CLEAN.then(async()=>{try{LOG('untrack',await o.ch.untrack())}catch(e){WARN('untrack failed',e)}
try{await window._sb.removeChannel(o.ch);LOG('channel removed','sb-'+o.code)}catch(e){WARN('removeChannel failed',e)}})}
const er=m=>{const e=$('#er');e?e.textContent=m:T(m)};
function fail(e){ERR(e.code||'ERROR',e.message,e.cause||e);leave2();er(e.code?e.message:'Unexpected error: '+(e.message||e))}

/* --- connect: resolves ONLY once the channel reports SUBSCRIBED --- */
async function conn(code,name,host){if(O)leave2();await CLEAN;await lib();const c=client();
await Promise.all(c.getChannels().filter(x=>x.topic==='realtime:sb-'+code).map(x=>{WARN('removing stale channel','sb-'+code);return c.removeChannel(x)}));
const pid=(()=>{try{return sessionStorage.sbpid||(sessionStorage.sbpid='p'+uid())}catch(e){return 'p'+uid()}})();
const ch=c.channel('sb-'+code,{config:{presence:{key:pid},broadcast:{self:false}}});
const o={code,pid,host,ch,name,pl:[],cfg:{},view:0,in:0,live:0,synced:0,dead:0,meta:null};O=o;LOG('connecting',{code,pid,host});
ch.on('presence',{event:'sync'},()=>{if(O!==o)return;o.synced=1;sync()})
.on('presence',{event:'join'},({key,newPresences})=>LOG('presence join',key,newPresences))
.on('presence',{event:'leave'},({key,leftPresences})=>LOG('presence leave',key,leftPresences))
.on('broadcast',{event:'kick'},({payload})=>{LOG('broadcast kick',payload);if(O===o&&payload.pid==o.pid){leave2();home();ov(`<div class=c style="text-align:center"><h2>🚫 You've been kicked</h2><p class=m>The host removed you from the room.</p><button class="b y" onclick=cl()>OK</button></div>`)}})
.on('broadcast',{event:'g'},({payload})=>{if(O===o&&window.SBG)SBG.on(payload)})
.on('broadcast',{event:'cfg'},({payload})=>{if(O!==o)return;LOG('broadcast cfg',payload);o.cfg=payload;lob()});
await new Promise((res,rej)=>{let d=0;const fin=(f,v)=>{if(d)return;d=1;clearTimeout(tm);f(v)};
const tm=setTimeout(()=>fin(rej,SBE('TIMEOUT','Timed out connecting to Supabase Realtime. Check your internet connection and Supabase URL.')),10000);
ch.subscribe((s,err)=>{LOG('channel status',s,err||'');if(o.dead)return;
if(s==='SUBSCRIBED'){o.live=1;
if(!d)fin(res);
else if(o.in&&o.meta){LOG('re-subscribed, re-registering presence');ch.track(o.meta,{timeout:8000}).then(r=>{LOG('re-track',r);r==='ok'&&T('Reconnected')},e=>ERR('re-track failed',e))}}
else if(s==='CHANNEL_ERROR')d?(o.live=0,T('Connection problem, reconnecting…')):fin(rej,SBE('CHANNEL_ERROR','Realtime subscription failed'+(err&&err.message?' ('+err.message+')':'')+'. Check that Realtime is enabled and the Supabase URL/key are correct.',err));
else if(s==='TIMED_OUT')d?(o.live=0,T('Connection timed out, reconnecting…')):fin(rej,SBE('TIMEOUT','Timed out subscribing to the room channel. Please try again.'));
else if(s==='CLOSED')d?(o.live=0,WARN('channel closed')):fin(rej,SBE('CLOSED','The Realtime connection closed before it was ready.'))})});
return o}
/* one automatic retry for transient subscription failures; library/config errors fail immediately */
async function connRetry(code,name,host){let last;for(let i=0;i<2;i++){try{return await conn(code,name,host)}catch(e){last=e;leave2();if(!['TIMEOUT','CHANNEL_ERROR','CLOSED'].includes(e.code))break;WARN('connection attempt',i+1,'failed ('+e.code+'), retrying');await sleep(1000)}}throw last}
/* track() and then prove the registration actually shows up in Presence */
async function reg(o,meta){o.meta=meta;let r;try{r=await o.ch.track(meta,{timeout:8000})}catch(e){throw SBE('TRACK','Could not register in the room: '+e.message,e)}
LOG('track result',r,meta);if(r!=='ok')throw SBE('TRACK','Could not register in the room (track '+r+'). Please try again.');
if(!await until(()=>!o.dead&&o.pid in o.ch.presenceState(),4000))throw SBE('TRACK','You were registered but never appeared in the room. Please try again.');o.pl=readPl(o)}

function sync(){const o=O;if(!o)return;o.pl=readPl(o);LOG('presence sync:',o.pl.length,'player(s)',o.pl.map(p=>p.name+(p.host?' (host)':'')),o.ch.presenceState());
if(!o.in)return;
if(o.host)o.ch.send({type:'broadcast',event:'cfg',payload:{mode:S.mode,rounds:S.rounds,sx:S.sx,sp:S.sp}}).then(r=>{r!=='ok'&&WARN('cfg broadcast result',r)},e=>WARN('cfg broadcast failed',e));
else if(!o.pl.some(p=>p.host)){WARN('host is missing from presence');
if(window.SBG)SBG.hostGone();else{clearTimeout(o.hg);o.hg=setTimeout(()=>{if(O===o&&!o.host&&!readPl(o).some(p=>p.host)){leave2();home();T('The host disconnected, so the room was closed')}},7000)}}
if(window.SBG)SBG.sync();lob()}

window.mkRoom=async function(){if(busy)return;const n=(S.hn||'').trim();if(!n)return er('Enter your name first');if(!ok())return er('Online play needs Supabase set up (see the note above)');
busy=1;const A='ABCDEFGHJKLMNPQRSTUVWXYZ';
try{for(let t=0;t<6;t++){const code=[0,0,0,0].map(()=>A[Math.floor(Math.random()*A.length)]).join('');er('Creating room…');LOG('creating room',code);
const o=await connRetry(code,n,true);
await until(()=>o.synced,3000);await sleep(800); /* let any existing occupant of this code show up */
const ex=readPl(o);if(ex.length){LOG('room code already in use, trying another',code,ex);leave2();continue}
o.in=1;await reg(o,{name:n,host:1,pid:o.pid});
if(!await until(()=>{const h=hostOf(o);return h&&h.pid==o.pid},3000))throw SBE('TRACK','Room created but the host never appeared in Presence. Please try again.');
LOG('room ready',code);return lob(1)}
throw SBE('NOROOM','Could not find a free room code, try again')}catch(e){fail(e)}finally{busy=0}};

window.joinScr=function(code){R(`<div class=c style="justify-content:flex-start"><h2>Join a game</h2>${csec()}<h3>Room code</h3><input id=jc class=cin maxlength=4 autocomplete=off autocapitalize=characters placeholder="ABCD" value="${E(code||'')}"><h3>Your name</h3><input id=jn maxlength=14 placeholder="Display name" value="${E(S.jn||'')}"><p class=er id=er></p><button class="b y" onclick=joinGo()>Join game</button><button class="b g" onclick=home()>Back</button></div>`);const e=$(code?'#jn':'#jc');e&&e.focus()};

window.joinGo=async function(){if(busy)return;const code=$('#jc').value.trim().toUpperCase(),n=$('#jn').value.trim();S.jn=n;sv();
if(!/^[A-Z]{4}$/.test(code))return er('Room codes are 4 letters');if(!n)return er('Enter your name');if(!ok())return er('Online play isn\'t configured yet');
busy=1;
try{er('Connecting…');const o=await connRetry(code,n,false);
er('Looking for room…');
/* the host may take a moment to appear in Presence: poll the live state for up to 6s instead of trusting the first sync */
const H=await until(()=>o.dead||hostOf(o),6000,200);
if(o.dead)return;
if(!H){throw SBE('NOROOM','Room "'+code+'" not found, or it has expired. Check the code and try again.')}
LOG('host found',H);
if(H.started&&!(H.ros||[]).includes(o.pid))throw SBE('STARTED','This game has already started');
const others=readPl(o).filter(p=>p.pid!=o.pid);
if(others.some(p=>p.name.toLowerCase()==n.toLowerCase()))throw SBE('NAME','That name is already taken in this room');
if(others.length>=MAX)throw SBE('FULL','This room is full ('+MAX+' players)');
o.in=1;await reg(o,{name:n,host:0,pid:o.pid});
if(!hostOf(o))throw SBE('HOSTGONE','The host left while you were joining');
LOG('joined room',code);lob(1)}catch(e){fail(e)}finally{busy=0}};
window.kick=function(pid){if(!O||!O.host)return;const p=O.pl.find(x=>x.pid==pid);if(!confirm('Are you sure you want to kick '+(p?p.name:'this player')+'?'))return;LOG('kicking',pid);O.ch.send({type:'broadcast',event:'kick',payload:{pid}}).then(r=>{r!=='ok'&&WARN('kick broadcast result',r)},e=>WARN('kick broadcast failed',e))};
window.cp=function(t){(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>T('Copied!'),()=>T(t))};
window.shr=function(){const u=inv();navigator.share?navigator.share({title:'Same Brain',text:'Join my Same Brain game: '+O.code,url:u}).catch(()=>{}):cp(u)};
const inv=()=>location.origin+location.pathname+'?join='+O.code;
function lob(first){if(!O||!O.in||document.body.classList.contains('ol'))return;if(first)try{sessionStorage.sbsess=JSON.stringify({code:O.code,name:O.name})}catch(e){}
if(!first&&!$('#lb'))return;O.view=1;const c=O.cfg.mode?O.cfg:{mode:S.mode,rounds:S.rounds,sx:S.sx},P=O.pl.slice().sort((a,b)=>b.host-a.host),M=MD[c.mode]||MD.classic;
R(`<div class=c id=lb style="justify-content:flex-start"><div class=lb><span class=m>Room code</span><span class="tag">${O.host?'👑 You are the host':'You\'re in'}</span></div><div class=code>${O.code}</div>
<div class=row><button class="b g" style="flex:1;padding:14px" onclick="cp('${O.code}')">Copy code</button><button class="b g" style="flex:1;padding:14px" onclick=shr()>Share link</button></div><div class=qr id=qr style="display:none"></div>
<div class=card style="padding:12px"><b>${M[0]} ${M[1]}</b> · ${c.rounds} rounds${c.sx?' · 🔞 Spicy':''}</div>
<div class=lb><h3>Players</h3><span class=m>${P.length} / ${MAX}</span></div><div class=pg>${P.map(p=>`<div class=pc>${av(p.name)}<span class=n>${E(p.name)}${p.host?' 👑':''}</span>${O.host&&!p.host?`<button class=x onclick="kick('${p.pid}')" aria-label="Remove">✕</button>`:''}</div>`).join('')}</div>
<p class="m" style="text-align:center">Waiting for your friends<span class=dots></span></p>
${O.host?`<button class="b y" ${P.length<3?'disabled style="opacity:.5"':''} onclick=SBstart()>${P.length<3?'Need '+(3-P.length)+' more player'+(3-P.length>1?'s':''):'Start game'}</button>`:'<p class="m sm" style="text-align:center">The host will start the game when everyone is in.</p>'}
<button class="b g" onclick=home()>Leave room</button></div>`);
if(O.qr){const e=$('#qr');e.innerHTML=O.qr;e.style.display='block'}else if(first)lib2()}
function lib2(){const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';s.onload=()=>{try{const q=qrcode(0,'M');q.addData(inv());q.make();const e=$('#qr');O.qr=q.createSvgTag(4,0);e.innerHTML=O.qr;e.style.display='block'}catch(e){}};document.head.appendChild(s)}
window.addEventListener('pagehide',()=>{try{O&&O.ch.untrack()}catch(e){}});window.SBX={O:()=>O,MAX,lob};window.SBdebug=()=>({O,presence:O&&O.ch.presenceState()});
home();let ss=null;try{ss=JSON.parse(sessionStorage.sbsess||'null')}catch(e){}
if(ss&&ss.code){joinScr(ss.code);$('#jn').value=ss.name;joinGo()}else{const j=new URLSearchParams(location.search).get('join');if(j)joinScr(j.toUpperCase().slice(0,4))}
})();
