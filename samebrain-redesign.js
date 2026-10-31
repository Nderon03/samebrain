/* Same Brain – redesign + online rooms layer. Load AFTER the main inline script:  <script src="samebrain-redesign.js"></script>
   Online play uses Supabase Realtime only (Presence + Broadcast): no tables, SQL or Edge Functions. Pass & Play never uses it.

   Room model
   - The HOST device is the authority for its room. It keeps the room state (settings, admitted roster, removed players,
     game status) in its Presence metadata, so every device, including late joiners and reconnecting ones, reads one source.
   - Joining is a handshake: a player appears in Presence, the host checks capacity / name / removal / game status, then
     either admits them (adds them to the roster) or sends a refusal with the reason.
   - Identity is a player id (pid) kept per browser tab, plus the last room in localStorage so a closed tab can rejoin.
   Honest limitation: this is client-side authority. It stops normal app interactions from breaking the rules, but Realtime
   messages are not authenticated, so someone with developer tools could forge them. Real enforcement needs a server. */
(()=>{
const CFG={
  url:'https://jonvocvgcwsufafvmfyh.supabase.co',
  key:'sb_publishable_x4ioZwcwevVfsg8lJ6pZ0Q_ZDYMC9CD'
};
const ok=()=>!!(CFG.url&&CFG.key);
/* online player limits per mode [min, max]. Pass & Play keeps its own 3–12. */
const LIM={classic:[3,12],likely:[3,12],know:[3,10],split:[3,11]},lim=m=>LIM[m]||LIM.classic;
const GRACE_HOST=15000,   /* how long players wait for a missing host before hosting passes on */
      GRACE_LOBBY=30000;  /* how long a disconnected player keeps their lobby seat */
const fine=()=>matchMedia('(pointer:fine)').matches;
document.head.insertAdjacentHTML('beforeend',`<style>
.c{max-width:560px}
button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.b{min-height:52px}.b:disabled{opacity:.45;cursor:not-allowed;box-shadow:none}.b:disabled:active{transform:none}
.b small{display:block;font-size:13px;font-weight:700;opacity:.75;margin-top:2px}
.b.ghost{background:transparent;border:1px solid #ffffff22}
:focus-visible{outline:3px solid #38bdf8aa;outline-offset:2px}
.seg button{min-height:46px}
.hero{text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
.hero .brand-icon{margin:0 auto;width:84px;height:84px}.hero h1{font-size:clamp(44px,13vw,64px)}
.tag2{opacity:.75;font-weight:600}
.big-b{display:flex;align-items:center;gap:14px;text-align:left;padding:18px 20px;border:0;border-radius:22px;width:100%;min-height:76px}
.big-b .ic{font-size:32px}.big-b b{display:block;font-size:19px;font-weight:900;letter-spacing:.02em}.big-b span.d{display:block;font-size:14px;font-weight:600;opacity:.8}
.big-b.host{background:linear-gradient(135deg,var(--y),#f97316);color:#1a1033;box-shadow:0 8px 28px #fbbf2433}
.big-b.join{background:linear-gradient(135deg,var(--p),#6366f1);box-shadow:0 8px 28px #8b5cf644}
.big-b.pp{background:#ffffff12;border:1px solid #ffffff22}
.big-b.rj{background:#22c55e1f;border:1px solid #22c55e66;min-height:64px}
.mg{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mc2{padding:14px 12px;border-radius:18px;border:2px solid #ffffff1c;background:#ffffff0d;text-align:left;transition:transform .15s,border-color .15s,background .15s;min-height:104px;min-width:0}
.mc2 .ic{font-size:26px;display:block}.mc2 b{display:block;margin-top:4px;font-size:16px}.mc2 span.d{display:block;font-size:13px;opacity:.7;font-weight:600;line-height:1.3;margin-top:2px}
.mc2.on{border-color:var(--ac);background:color-mix(in srgb,var(--ac) 18%,transparent);transform:translateY(-2px)}
.rng{display:inline-block;margin-top:8px;font-size:12px;font-weight:800;letter-spacing:.04em;padding:3px 9px;border-radius:99px;background:#ffffff14;opacity:.9}
.rng.bad{background:#f43f5e33;color:#fecdd3}
.ft{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;opacity:.6;padding-top:8px}
.ft button{background:none;border:0;opacity:.9;font-size:14px;padding:10px 6px;min-height:44px}
.cin{text-align:center;font-size:40px;font-weight:900;letter-spacing:.3em;text-transform:uppercase;padding-left:.3em}
.er{color:#fca5a5;text-align:center;min-height:22px;font-size:15px;line-height:1.4}.er.busy{color:#c4b5fd}
.er .lnk{display:block;margin:8px auto 0;background:#ffffff14;border:0;border-radius:12px;padding:10px 16px;font-size:15px;font-weight:800;min-height:44px}
.warn{background:#fbbf2418;border:1px solid #fbbf2455;border-radius:16px;padding:12px;font-size:14px}
.note{background:#38bdf814;border:1px solid #38bdf844;border-radius:16px;padding:12px;font-size:14px;text-align:center}
.dots:after{content:'';animation:dt 1.4s steps(4) infinite}@keyframes dt{0%{content:''}25%{content:'.'}50%{content:'..'}75%{content:'...'}}
.spin{display:inline-block;width:14px;height:14px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:sp .7s linear infinite;vertical-align:-2px;margin-right:6px}@keyframes sp{to{transform:rotate(1turn)}}
/* lobby */
.rc{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
.codeb{background:#ffffff0a;border:2px dashed #fbbf2455;border-radius:22px;padding:8px 18px 10px;display:flex;flex-direction:column;align-items:center;width:100%;transition:border-color .2s,background .2s}
.codeb:active{transform:scale(.98)}.codeb.ok{border-style:solid;border-color:#22c55e;background:#22c55e14}
.code{font-size:clamp(54px,18vw,84px);font-weight:900;letter-spacing:.14em;color:var(--y);text-shadow:0 0 30px #fbbf2455;padding-left:.14em;line-height:1.05}
.cph{font-size:12px;font-weight:900;letter-spacing:.16em;opacity:.7}.codeb.ok .cph{color:#86efac;opacity:1}
.rc .row{width:100%}.rc .row .b{flex:1;padding:12px;font-size:15px;min-height:48px}
.qr{background:#fff;border-radius:14px;padding:8px;width:156px;height:156px;margin:0 auto;animation:pop .25s both}.qr svg{width:100%;height:100%;display:block}
.cfgc{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:18px;background:color-mix(in srgb,var(--ac) 14%,#ffffff08);border:1px solid color-mix(in srgb,var(--ac) 45%,transparent)}
.cfgc .ic{font-size:30px;flex:none}.cfgc>div{flex:1;min-width:0}.cfgc .rng{margin:0;flex:none}
.occ{font-size:12px;font-weight:900;letter-spacing:.1em;padding:4px 10px;border-radius:99px;background:#ffffff14}.occ.full{background:#fbbf2433;color:#fde68a}.occ.bad{background:#f43f5e33;color:#fecdd3}
.capb{height:6px;border-radius:9px;background:#ffffff12;overflow:hidden;margin-top:-4px}.capb i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,var(--p),var(--b));transition:width .3s}
.capb.bad i{background:#f43f5e}
.pg{display:grid;grid-template-columns:1fr;gap:8px}@media(min-width:500px){.pg{grid-template-columns:1fr 1fr}}
.pc{display:flex;align-items:center;gap:10px;padding:10px;border-radius:16px;background:#ffffff0f;border:1px solid #ffffff1c;animation:pop .35s both;min-width:0;transition:opacity .25s}
.pc.me{border-color:#8b5cf688}.pc.off{opacity:.55}
.pc .n{flex:1;min-width:0;display:flex;flex-direction:column}.pc .nn{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pc .ps{font-size:12px;font-weight:800;opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pc .ps.h{color:var(--y);opacity:1}
.pc .x{width:40px;height:40px;border:0;border-radius:12px;background:#ffffff14;flex:none;font-size:15px}.pc .x:hover{background:#f43f5e44}
.dot{width:9px;height:9px;border-radius:50%;flex:none;background:#fbbf24;box-shadow:0 0 0 3px #fbbf2422}.dot.on{background:#22c55e;box-shadow:0 0 0 3px #22c55e22}
/* connection status pill (header) */
.cs{display:flex;align-items:center;gap:6px;font-size:11px!important;font-weight:900;letter-spacing:.1em;padding:7px 12px!important}
.cs[hidden]{display:none}.cs i{width:8px;height:8px;border-radius:50%;background:#22c55e;flex:none}
.cs.connecting i,.cs.reconnecting i{background:#fbbf24;animation:pl 1s ease-in-out infinite}.cs.offline i{background:#f43f5e}
.cs.offline{background:#f43f5e2e!important}.cs.min b{display:none}
@keyframes pl{50%{opacity:.3}}
/* kicked screen */
.kx{width:96px;height:96px;border-radius:50%;display:grid;place-items:center;font-size:44px;margin:0 auto 6px;background:radial-gradient(circle,#f43f5e33,#f43f5e0d);box-shadow:0 0 0 1px #f43f5e55,0 0 50px -10px #f43f5e88;animation:pop .45s both}
</style>`);
const IC=($('.brand-icon')||{}).src||'';
const MD={classic:['🎯','Classic','Divisive multiple choice. Match the majority to score.','#8b5cf6'],likely:['👀','Most Likely','Vote for who is most likely to… Match the majority.','#38bdf8'],split:['⚖️','Split','Write a prompt, split the room evenly to win big.','#fbbf24'],know:['🧑‍🤝‍🧑','Know Me','Guess what your friend secretly picked.','#f97316']};
const cards=(js,sel,extra)=>Object.keys(MD).map(k=>`<button type=button class="mc2 ${sel==k?'on':''}" style="--ac:${MD[k][3]}" aria-pressed="${sel==k}" onclick="${js(k)}"><i class=ic style="font-style:normal">${MD[k][0]}</i><b>${MD[k][1]}</b><span class=d>${MD[k][2]}</span>${extra?extra(k):''}</button>`).join('');
const uid=()=>Math.random().toString(36).slice(2,8);
const csec=()=>ok()?'':'<div class=warn>⚙️ Online play isn\'t configured yet. Add your Supabase URL and key at the top of <b>samebrain-redesign.js</b>. Pass &amp; Play works without it.</div>';
const store=t=>({g(k){try{return JSON.parse(t.getItem(k)||'null')}catch(e){return null}},s(k,v){try{v==null?t.removeItem(k):t.setItem(k,JSON.stringify(v))}catch(e){}}});
let SS,LS;try{SS=store(sessionStorage);LS=store(localStorage)}catch(e){SS=LS={g(){return null},s(){}}}
/* last room this browser was in (any tab), offered as "Rejoin" on the home screen for 3 hours */
const lastSess=()=>{const l=LS.g('sblast');return l&&l.code&&l.pid&&Date.now()-l.t<108e5&&!(O&&O.code==l.code)?l:null};

/* ---------- home ---------- */
window.home=function(){cl();closeModal(1);SER=null;st.on=0;st.id=0;st.rid=0;clearTimeout(st.tm);leaveRoom();atHome=1;const rj=lastSess();
R(`<div class=c data-scr=home style="justify-content:flex-start"><div class=hero>${IC?`<img class=brand-icon src="${IC}" alt="">`:''}<h1>SAME<br>BRAIN</h1><p class=tag2>Think like your friends. Or don't.</p></div>
${rj?`<button type=button class="big-b rj b" onclick=rejoin()><i class=ic style="font-style:normal">↩️</i><span><b>REJOIN ROOM ${E(rj.code)}</b><span class=d>Continue as ${E(rj.name)}</span></span></button>`:''}
<button type=button class="big-b host b" onclick=hostSetup()><i class=ic style="font-style:normal">🎉</i><span><b>HOST A GAME</b><span class=d>Create a room and invite your friends</span></span></button>
<button type=button class="big-b join b" onclick="joinScr()"><i class=ic style="font-style:normal">🔑</i><span><b>JOIN A GAME</b><span class=d>Enter a room code to join in</span></span></button>
<button type=button class="big-b pp b" onclick=setup()><i class=ic style="font-style:normal">📱</i><span><b>PASS &amp; PLAY</b><span class=d>One phone, passed around the group</span></span></button>
<h3>Game modes</h3><div class=mg>${Object.keys(MD).map(k=>`<div class=mc2 style="--ac:${MD[k][3]};min-height:0"><i class=ic style="font-style:normal">${MD[k][0]}</i><b>${MD[k][1]}</b><span class=d>${MD[k][2]}</span></div>`).join('')}</div>
<div class=ft><span>Same Brain · Mature prompts optional</span><span><button type=button onclick=sets()>⚙️ Settings</button><button type=button onclick="rules()">How to play</button></span></div></div>`)};
let BIP=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();BIP=e});addEventListener('appinstalled',()=>{BIP=null;T('Same Brain installed')});
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true,ios=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform=='MacIntel'&&navigator.maxTouchPoints>1);
window.inst=()=>{if(!BIP)return;BIP.prompt();BIP.userChoice.finally(()=>{BIP=null;sets()})};
const instUI=()=>standalone()?'':BIP?'<button type=button class="b g" onclick=inst()>📲 Install Same Brain</button>':ios()?'<p class="m sm">📲 To install: tap <b>Share</b>, then <b>Add to Home Screen</b>.</p>':'';
window.sets=function(){ov(`<div class=c data-scr=sets style="text-align:center"><h2>⚙️ Settings</h2><button type=button class="b g" onclick="tog();sets()">Sound: ${S.sound?'On 🔊':'Off 🔇'}</button>${instUI()}<button type=button class="b g" onclick="cl();rules()">How to play</button><button type=button class="b g" onclick=clrAsk()>Clear saved data</button><button type=button class="b y" onclick=cl()>Done</button></div>`)};
window.clrAsk=()=>modal({icon:'🧹',title:'Clear saved data?',body:'This removes saved player names, your display name and your settings on this device.',tone:'danger',btns:[['Cancel','g'],['Clear data','r',()=>{try{localStorage.removeItem('samebrain');localStorage.removeItem('sblast')}catch(e){}location.reload()}]]});
window.rejoin=()=>{const l=lastSess();if(!l)return home();joinScr(l.code);$('#jn').value=l.name;joinGo(1)};

/* ---------- pass & play setup: mode cards (the engine asks for them through SBmodes) ---------- */
window.SBmodes=()=>`<div class=mg>${cards(k=>`setMode('${k}');setup()`,S.mode)}</div>`;

/* ---------- host setup (new room) and in-room game settings ---------- */
let HSR=0;
window.hsR=()=>hostSetup(HSR);
window.hsChg=()=>{sv();hsR();if(HSR)pushCfg()};
window.hostSetup=function(inRoom){const o=O;inRoom=!!(inRoom&&o&&o.in&&o.host);if(!inRoom&&O&&O.in)leaveRoom();HSR=inRoom?1:0;ok()&&lib().catch(()=>{});
if(S.mode=='split')S.sx=0;
const n=inRoom?o.all.length:0,L=lim(S.mode);
const sp=(l,on,js)=>`<button type=button class="${on?'on':''}" onclick="${js};hsChg()">${l}</button>`;
R(`<div class=c data-scr=host style="justify-content:flex-start"><h2>${inRoom?'Game settings':'Host a game'}</h2>
${inRoom?`<p class="m sm">Room <b>${o.code}</b> · ${n} player${n==1?'':'s'}. Changes are shared with everyone in the room straight away.</p>`:csec()}
${inRoom?'':`<h3>Your name</h3><input id=hn maxlength=14 autocomplete=nickname placeholder="Display name" value="${E(S.hn||'')}" oninput="S.hn=this.value;sv()" onkeydown="event.key=='Enter'&&this.blur()"${!S.hn&&fine()?' data-af':''}>`}
<h3>Mode</h3><div class=mg>${cards(k=>`setMode('${k}');hsChg()`,S.mode,k=>{const l=lim(k),bad=inRoom&&n>l[1];return`<span class="rng${bad?' bad':''}">${l[0]}–${l[1]} players${bad?' · too many':''}</span>`})}</div>
<p class="m sm">${MD[S.mode][1]} supports <b>${L[0]}–${L[1]} players</b> online.${S.mode=='split'?' Each round the writer sits out the vote.':''}${S.mode=='know'?' Each player takes turns being the subject.':''}${inRoom&&n>L[1]?` <b style="color:#fca5a5">You have ${n}: remove ${n-L[1]} or pick another mode.</b>`:''}</p>
<h3>Rounds</h3><div class=seg>${[5,10,15].map(x=>sp(x,S.rounds==x,`S.rounds=${x}`)).join('')}</div>
${spUI('hsChg()')}
${S.mode=='split'?'':matUI('hsChg()')}
<p class=er id=er role=status aria-live=polite></p>
${inRoom?'<button type=button class="b y" onclick=hsDone()>Done</button>':'<button type=button class="b y" id=mkb onclick=mkRoom()>Create game</button><button type=button class="b g" onclick=home()>Back</button>'}</div>`)};
window.hsOpen=()=>{const o=O;if(!o||!o.host)return;setRoom({ed:1});hostSetup(1)};
window.hsDone=()=>{const o=O;if(!o)return home();if(o.host)setRoom({ed:0,cfg:cfgOf()});lob(1)};
const cfgOf=()=>({mode:S.mode,rounds:S.rounds,sp:S.sp?1:0,sx:S.mode=='split'?0:(S.sx?1:0),lv:S.lv||0});
function pushCfg(){if(O&&O.host)setRoom({cfg:cfgOf()})}

/* ---------- realtime plumbing ---------- */
/* Open the browser console (F12) to follow every step: all lines are prefixed [SameBrain]. */
let O=null,busy=0,CLEAN=Promise.resolve(),libP=null;
const LOG=(...a)=>console.log('%c[SameBrain]','color:#8b5cf6;font-weight:bold',...a),WARN=(...a)=>console.warn('[SameBrain]',...a),ERR=(...a)=>console.error('[SameBrain]',...a);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
/* resolve f() as soon as it is truthy (checked on every presence/broadcast event and on a slow timer), or 0 after ms */
const until=(f,ms,step=150)=>new Promise(r=>{const t0=Date.now();(function p(){let v;try{v=f()}catch(e){v=0}if(v)return r(v);if(Date.now()-t0>=ms)return r(0);setTimeout(p,step)})()});
function SBE(code,msg,cause){const e=new Error(msg);e.code=code;e.cause=cause;return e}
const NETMSG='You seem to be offline. Check your internet connection and try again.';

/* library: tries a local copy, then CDNs, each with its own timeout */
const SRC=['supabase.min.js','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js','https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'];
const loadScript=(src,ms=8000)=>new Promise((res,rej)=>{const s=document.createElement('script'),t=setTimeout(()=>{s.remove();rej(new Error('timed out'))},ms);s.src=src;s.onload=()=>{clearTimeout(t);res()};s.onerror=()=>{clearTimeout(t);s.remove();rej(new Error('failed to load'))};document.head.appendChild(s)});
function lib(){if(window.supabase&&window.supabase.createClient)return Promise.resolve();if(libP)return libP;
return libP=(async()=>{for(const s of SRC){try{await loadScript(s,s.startsWith('http')?8000:3000);if(window.supabase&&window.supabase.createClient){LOG('Supabase library loaded from',s);return}}catch(e){LOG('library source unavailable',s,e.message)}}
libP=null;if(!navigator.onLine)throw SBE('NET',NETMSG);
/* every source failed while the browser reports a connection: something is genuinely blocking the download */
throw SBE('LIB','Couldn\'t load the online play library from any source. This network or a browser extension may be blocking it. Pass & Play still works.')})()}
function client(){if(window._sb)return window._sb;if(!ok())throw SBE('CFG','Online play isn\'t configured yet');
try{window._sb=window.supabase.createClient(CFG.url,CFG.key,{realtime:{params:{eventsPerSecond:20}}})}catch(e){throw SBE('CLIENT','Could not start the online connection: '+e.message,e)}return window._sb}

/* presence helpers (only well-formed entries are trusted) */
const PID=/^p[a-z0-9]{4,24}$/;
const readPl=o=>o&&o.ch?Object.values(o.ch.presenceState()).map(a=>a[a.length-1]).filter(p=>p&&PID.test(p.pid)&&typeof p.name=='string'&&p.name.trim()):[];
const outranks=(a,b)=>(a.hv||0)!==(b.hv||0)?(a.hv||0)>(b.hv||0):a.pid<b.pid;
const bestHost=ps=>ps.filter(p=>p.host&&Array.isArray(p.ros)&&p.cfg&&p.nm).reduce((b,p)=>!b||outranks(p,b)?p:b,null);

/* ---------- connection status (header pill) ---------- */
document.querySelector('#hm').insertAdjacentHTML('afterend','<button type=button id=cs class=cs hidden onclick=csTap()><i></i><b></b></button>');
const CSL={connecting:'CONNECTING',live:'CONNECTED',reconnecting:'RECONNECTING',offline:'DISCONNECTED · TAP TO RETRY'};
let csT=0;
function cs(s){if(O)O.cs=s;const e=$('#cs');if(!e)return;const show=!!(O&&O.in);e.hidden=!show;if(!show)return;
e.className='cs '+s;e.querySelector('b').textContent=CSL[s];e.setAttribute('aria-label','Connection: '+CSL[s].toLowerCase());clearTimeout(csT);if(s=='live')csT=setTimeout(()=>e.classList.add('min'),2500)}
window.csTap=()=>{const o=O;if(!o)return;if(o.live){const e=$('#cs');e.classList.remove('min');clearTimeout(csT);csT=setTimeout(()=>e.classList.add('min'),2500);return T('Connected to room '+o.code)}o.tries=0;rebuild(o)};

/* build one channel for room o and subscribe; resolves once SUBSCRIBED */
function mkCh(o){const ch=client().channel('sb-'+o.code,{config:{presence:{key:o.pid},broadcast:{self:false}}});o.ch=ch;
ch.on('presence',{event:'sync'},()=>{if(O===o&&o.ch===ch){o.synced=1;sync()}})
.on('broadcast',{event:'r'},({payload})=>{if(O===o&&o.ch===ch&&payload)roomMsg(payload)})
.on('broadcast',{event:'g'},({payload})=>{if(O===o&&o.ch===ch&&payload&&window.SBG)SBG.on(payload)});
return new Promise((res,rej)=>{let d=0;const fin=(f,v)=>{if(d)return;d=1;clearTimeout(tm);f(v)};
const tm=setTimeout(()=>fin(rej,SBE('TIMEOUT','Couldn\'t reach the game server in time. Check your connection and try again.')),10000);
ch.subscribe((s,err)=>{LOG('channel',o.code,s,err||'');if(o.dead||o.ch!==ch)return;
if(s==='SUBSCRIBED'){fin(res,o);up(o)}
else if(!d)fin(rej,s==='CHANNEL_ERROR'?SBE('CHANNEL','The game server refused the connection'+(err&&err.message?' ('+err.message+')':'')+'. Please try again in a moment.',err):s==='TIMED_OUT'?SBE('TIMEOUT','Couldn\'t reach the game server in time. Check your connection and try again.'):SBE('CLOSED','The connection closed before it was ready. Please try again.'));
else down(o,s)})})}
function up(o){const was=o.live===0&&o.everLive;o.live=1;o.everLive=1;o.tries=0;clearTimeout(o.rt);o.rt=0;if(o.in)cs('live');
if(o.meta)track(o);if(was&&o.in){T('Reconnected');window.SBG&&SBG.resub()}}
/* the library retries on its own after errors; we only step in if it hasn't recovered after a while, or the channel closed */
function down(o,s){if(o.dead)return;o.live=0;cs(navigator.onLine?'reconnecting':'offline');clearTimeout(o.rt);o.rt=setTimeout(()=>rebuild(o),s==='CLOSED'?1000:12000)}
async function rebuild(o){if(O!==o||o.dead||o.live||o.rb)return;clearTimeout(o.rt);o.rt=0;
if(!navigator.onLine){cs('offline');return}
if(o.tries>=6){cs('offline');return}
o.tries++;o.rb=1;cs('reconnecting');LOG('rebuilding channel, attempt',o.tries);
try{const old=o.ch;o.ch=null;try{await client().removeChannel(old)}catch(e){}if(O!==o||o.dead)return;await mkCh(o)}
catch(e){WARN('reconnect failed',e.message);if(O===o&&!o.dead&&!o.live)o.rt=setTimeout(()=>rebuild(o),Math.min(30000,1000*2**o.tries))}
finally{o.rb=0}}
addEventListener('online',()=>{const o=O;if(o&&o.in&&!o.live){o.tries=0;rebuild(o)}});
addEventListener('offline',()=>{const o=O;if(o&&o.in)cs('offline')});
document.addEventListener('visibilitychange',()=>{const o=O;if(document.visibilityState=='visible'&&o&&o.in&&!o.live&&!o.rb){o.tries=0;rebuild(o)}});
addEventListener('pagehide',()=>{try{O&&O.ch&&O.ch.untrack()}catch(e){}});
addEventListener('pageshow',e=>{const o=O;if(e.persisted&&o&&o.in){o.live=0;o.tries=0;rebuild(o)}});

const track=o=>{if(!o.live||!o.ch||!o.meta)return Promise.resolve();return o.ch.track(o.meta).then(r=>{r!=='ok'&&WARN('track',r);return r},e=>WARN('track failed',e))};
const rsend=m=>{const o=O;if(!o||!o.ch)return;m.f=o.pid;o.ch.send({type:'broadcast',event:'r',payload:m}).catch(e=>WARN('send failed',e))};

/* drop a room connection (no UI); later connects wait for the cleanup so channel topics never collide */
function drop(o){if(!o||o.dead)return;o.dead=1;if(O===o)O=null;[o.rt,o.hm,o.pt].forEach(clearTimeout);const ch=o.ch;cs('live');
CLEAN=CLEAN.then(async()=>{if(!ch)return;try{await ch.untrack()}catch(e){}try{await window._sb.removeChannel(ch)}catch(e){}})}
/* deliberately leave the current room: tell the others (bye) and forget the session */
function leaveRoom(bye){const o=O;if(!o)return;if(bye&&o.in&&o.live)rsend({k:'bye'});SS.s('sbsess',null);SS.s('sbsnap',null);const l=LS.g('sblast');l&&l.code==o.code&&LS.s('sblast',null);
window.SBG&&SBG.reset();drop(o)}
function saveSess(o){SS.s('sbsess',{code:o.code,name:o.name,pid:o.pid,host:o.host?1:0,room:o.host?o.meta:null});LS.s('sblast',{code:o.code,pid:o.pid,name:o.name,t:Date.now()})}
function tabPid(){let p=SS.g('sbpid');if(typeof p!='string'||!PID.test(p))SS.s('sbpid',p='p'+uid()+uid());return p}

/* connect with retries (backoff 1s, 2s) for transient failures; library/config errors fail straight away */
async function connect(code,name,host,pid){if(O)drop(O);await CLEAN;if(!navigator.onLine)throw SBE('NET',NETMSG);await lib();client();
let last;for(let i=0;i<3;i++){const o={code,pid,name,host:host?1:0,in:0,live:0,dead:0,synced:0,room:null,meta:null,pl:[],all:[],gone:{},den:{},cs:'connecting',tries:0};O=o;
try{await Promise.all(client().getChannels().filter(x=>x.topic==='realtime:sb-'+code).map(x=>client().removeChannel(x)));return await mkCh(o)}
catch(e){last=e;drop(o);await CLEAN;if(!['TIMEOUT','CHANNEL','CLOSED'].includes(e.code))break;if(!navigator.onLine)throw SBE('NET',NETMSG);if(i<2){WARN('connect attempt',i+1,'failed:',e.code);await sleep(1000*2**i)}}}
throw last}
/* track and prove the registration shows up in Presence */
async function reg(o){let r;try{r=await o.ch.track(o.meta,{timeout:8000})}catch(e){throw SBE('TRACK','Couldn\'t register in the room. Please try again.',e)}
if(r!=='ok')throw SBE('TRACK','Couldn\'t register in the room. Please try again.');
if(!await until(()=>o.dead||o.pid in o.ch.presenceState(),4000))throw SBE('TRACK','Couldn\'t register in the room. Please try again.')}

/* ---------- room state ---------- */
function roster(o,ps){const R0=o.room||{ros:[],nm:{}},pm={};ps.forEach(p=>pm[p.pid]=p);
o.all=(R0.ros||[]).map(pid=>({pid,name:String((pm[pid]&&pm[pid].name)||(R0.nm||{})[pid]||'?').slice(0,14),host:pid===R0.pid?1:0,on:!!pm[pid]}));o.pl=o.all.filter(p=>p.on)}
function setRoom(p){const o=O;if(!o||!o.host||!o.meta)return;Object.assign(o.meta,p);pushMeta()}
/* publish the host's room state (batched) */
function pushMeta(){const o=O;if(!o||!o.host||o.pm)return;o.pm=1;setTimeout(()=>{o.pm=0;if(O!==o||o.dead)return;o.room=o.meta;track(o);saveSess(o);roster(o,readPl(o));lob();window.SBG&&SBG.sync()},0)}

function sync(){const o=O;if(!o||!o.ch)return;const ps=readPl(o),H=bestHost(ps);
if(o.host&&o.in){if(H&&H.pid!==o.pid&&outranks(H,o.meta))return demote(H);o.room=o.meta;hostCheck(o,ps)}
else{const prev=o.room&&o.room.pid;if(H)o.room=H;if(o.in&&H&&prev&&H.pid!==prev&&window.SBG)setTimeout(()=>O===o&&SBG.resub(),300);
if(o.in){if(!H||!ps.some(p=>p.pid===H.pid&&p.host))hostMissing(o);else{clearTimeout(o.hm);o.hm=0;if((H.ban||[]).includes(o.pid))return kicked()}}}
roster(o,ps);if(o.in){saveSess(o);window.SBG&&SBG.sync();lob()}}

/* host: admit or refuse new arrivals, free seats of players who have been gone too long (lobby only) */
function hostCheck(o,ps){const m=o.meta,now=Date.now(),cap=lim(m.cfg.mode)[1];let ch=0;
for(const p of ps){if(p.pid===o.pid||p.host||m.ros.includes(p.pid))continue;
const nm=String(p.name).trim().slice(0,14),why=m.ban.includes(p.pid)?'kicked':m.ros.length>=cap?'full':m.ros.some(q=>String(m.nm[q]||'').toLowerCase()===nm.toLowerCase())?'name':'';
if(why){if(!o.den[p.pid]||now-o.den[p.pid]>3000){o.den[p.pid]=now;LOG('refusing',p.pid,why);rsend({k:'deny',pid:p.pid,why,cap,mode:m.cfg.mode,n:m.ros.length})}continue}
LOG('admitting',nm,p.pid);if(m.st&&!m.gros.includes(p.pid))T(nm+' joined and will play from the next game');m.ros.push(p.pid);m.nm[p.pid]=nm;delete o.gone[p.pid];ch=1}
const live=new Set(ps.map(p=>p.pid));clearTimeout(o.pt);
if(!m.st){for(const pid of m.ros){if(pid===o.pid)continue;if(live.has(pid))delete o.gone[pid];else o.gone[pid]=o.gone[pid]||now}
for(const pid in o.gone)if(now-o.gone[pid]>=GRACE_LOBBY||!m.ros.includes(pid)){if(m.ros.includes(pid)){LOG('freeing seat of',m.nm[pid]);m.ros=m.ros.filter(x=>x!==pid);delete m.nm[pid];ch=1}delete o.gone[pid]}
const t=Object.values(o.gone);if(t.length)o.pt=setTimeout(sync,Math.min(...t)+GRACE_LOBBY-now+100)}
if(ch)pushMeta()}

/* players: the host has vanished from Presence. Wait, then hand hosting to the first connected player in the roster. */
function hostMissing(o,now){if(o.hm&&!now)return;clearTimeout(o.hm);if(!now&&document.body.classList.contains('ol'))T('The host lost connection. Waiting for them to come back…');o.hm=setTimeout(()=>{o.hm=0;if(O!==o||o.dead||o.host)return;const ps=readPl(o),H=bestHost(ps);if(H&&(!now||H.pid!==now))return;handover(o,ps,now)},now?50:GRACE_HOST);lob()}
function handover(o,ps,gone){const R0=o.room;if(!R0){leaveRoom();home();return T('The host left, so the room was closed')}
const live=new Set(ps.map(p=>p.pid)),succ=R0.ros.find(pid=>pid!==R0.pid&&pid!==gone&&live.has(pid));
if(!succ)return hostMissing(o);if(succ!==o.pid)return hostMissing(o);
LOG('taking over as host');o.host=1;const m={...R0,pid:o.pid,name:o.name,host:1,hv:(R0.hv||1)+1,ros:[o.pid,...R0.ros.filter(p=>p!==R0.pid&&p!==o.pid)],nm:{...R0.nm},ban:[...(R0.ban||[])],gros:[...(R0.gros||[])],ed:0};delete m.nm[R0.pid];m.nm[o.pid]=o.name;
o.meta=o.room=m;track(o);saveSess(o);roster(o,readPl(o));T('👑 You are now the host');
if(m.st&&window.SBG)SBG.takeover();else lob(1)}
/* two hosts (e.g. after a hand-over the old host came back): the lower-ranked one becomes a player again */
function demote(H){const o=O;LOG('another host outranks us, becoming a player');o.host=0;o.room=H;o.meta={pid:o.pid,name:o.name,host:0};track(o);window.SBG&&SBG.reset();saveSess(o);roster(o,readPl(o));T(H.name+' is now the host');lob(1)}

function roomMsg(m){const o=O;if(!o||typeof m!='object')return;const H=o.room,fromHost=!!(H&&m.f===H.pid&&!o.host);
if(m.k==='kick'&&fromHost&&m.pid===o.pid)return kicked();
if(m.k==='deny'&&fromHost&&m.pid===o.pid){o.deny=m;if(o.in){const c=o.code;leaveRoom();joinScr(c);er(denyMsg(m,c),1)}return}
if(m.k==='bye'){if(o.host&&o.meta&&m.f!==o.pid&&o.meta.ros.includes(m.f)){LOG('player left',o.meta.nm[m.f]);T((o.meta.nm[m.f]||'A player')+' left the room');o.meta.ros=o.meta.ros.filter(x=>x!==m.f);delete o.meta.nm[m.f];pushMeta()}
else if(fromHost&&o.in)hostMissing(o,m.f)}}
const denyMsg=(m,code)=>({kicked:'You were removed from room '+code+' by the host.',started:'A game is already in progress in room '+code+'. Ask the host to return to the lobby, then try again.',full:'Room '+code+' is full ('+m.n+' / '+m.cap+' players for '+((MD[m.mode]||MD.classic)[1])+').',name:'That name is already taken in room '+code+'. Pick a different name (if it\'s you reconnecting, wait a few seconds and try again).'})[m.why]||'The host couldn\'t let you in.';

/* ---------- kicking ---------- */
window.kickAsk=pid=>{const o=O;if(!o||!o.host)return;const p=o.all.find(x=>x.pid===pid);if(!p||p.host)return;
modal({tone:'danger',icon:av(p.name),title:'REMOVE PLAYER?',body:`Are you sure you want to remove <b>${E(p.name)}</b> from this room?<p class="m sm">They will be disconnected from the current room.${o.meta.st?' Their points so far stay on this game\'s scoreboard.':''}</p>`,btns:[['CANCEL','g'],['REMOVE PLAYER','r',()=>kickDo(pid,p.name)]]})};
function kickDo(pid,name){const o=O;if(!o||!o.host||!o.meta)return;const m=o.meta;
if(!m.ros.includes(pid)){lob();return T(name+' already left the room')}
m.ban.push(pid);m.ros=m.ros.filter(x=>x!==pid);delete m.nm[pid];delete o.gone[pid];rsend({k:'kick',pid});pushMeta();T(name+' was removed')}
function kicked(){const o=O;if(!o||o.dead)return;const code=o.code;LOG('removed from room by the host');leaveRoom();closeModal(1);cl();
R(`<div class=c data-scr=kicked style="text-align:center;align-items:center"><div class=kx>🚪</div><span class=kick>Room ${E(code)}</span><h2>YOU'VE BEEN REMOVED</h2><p class=m>You've been removed from this game by the host.</p><button type=button class="b y" style="width:100%" onclick=home()>Back to home</button></div>`)}

/* ---------- create a room ---------- */
const er=(m,retry,busyNow)=>{const e=$('#er');if(!e)return T(m);e.className='er'+(busyNow?' busy':'');e.innerHTML=(busyNow?'<span class=spin></span>':'')+E(m)+(retry?`<button type=button class=lnk onclick="${HSR||!$('#jc')?'mkRoom()':'joinGo()'}">Try again</button>`:'')};
const RETRY=['NET','TIMEOUT','CHANNEL','CLOSED','TRACK','NORESP','NOHOST','LIB','CLIENT','NOCODE'];
function fail(e){ERR(e.code||'ERROR',e.message,e.cause||'');if(O&&!O.in)drop(O);er(e.code?e.message:'Something went wrong: '+(e.message||e),RETRY.includes(e.code))}
const btn=(id,t)=>{const b=$(id);if(b){b.disabled=!!t;b.innerHTML=t||b.dataset.l||b.innerHTML;if(!t)delete b.dataset.l}};
const btnBusy=(id,t)=>{const b=$(id);if(b){b.dataset.l=b.dataset.l||b.innerHTML;b.disabled=true;b.innerHTML='<span class=spin></span>'+t}};
window.mkRoom=async function(){if(busy)return;const n=(S.hn||'').trim();if(!n)return er('Enter your name first');if(!ok())return er('Online play needs Supabase set up (see the note above)');
busy=1;btnBusy('#mkb','Creating…');const A='ABCDEFGHJKLMNPQRSTUVWXYZ';
try{for(let t=0;t<6;t++){const code=[0,0,0,0].map(()=>A[Math.floor(Math.random()*A.length)]).join('');er('Creating your room…',0,1);LOG('creating room',code);
const o=await connect(code,n,1,tabPid());
await until(()=>o.dead||o.synced,3000);await sleep(700);if(o.dead)return;
if(readPl(o).length){LOG('room code in use, trying another',code);drop(o);await CLEAN;continue}
o.meta={pid:o.pid,name:n,host:1,hv:1,cfg:cfgOf(),ros:[o.pid],nm:{[o.pid]:n},ban:[],st:0,gros:[],ed:0};o.room=o.meta;
await reg(o);o.in=1;saveSess(o);roster(o,readPl(o));cs('live');LOG('room ready',code);return lob(1)}
throw SBE('NOCODE','Couldn\'t find a free room code. Please try again.')}catch(e){fail(e)}finally{busy=0;btn('#mkb')}};

/* ---------- join a room ---------- */
window.joinScr=function(code){if(O&&!O.in)drop(O);ok()&&lib().catch(()=>{});HSR=0;
R(`<div class=c data-scr=join style="justify-content:flex-start"><h2>Join a game</h2>${csec()}<h3>Room code</h3><input id=jc class=cin maxlength=4 autocomplete=off autocapitalize=characters spellcheck=false placeholder="ABCD" value="${E(code||'')}" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z]/g,'')"${!code&&fine()?' data-af':''}><h3>Your name</h3><input id=jn maxlength=14 autocomplete=nickname placeholder="Display name" value="${E(S.jn||'')}" onkeydown="event.key=='Enter'&&joinGo()"${code&&fine()?' data-af':''}><p class=er id=er role=status aria-live=polite></p><button type=button class="b y" id=jb onclick=joinGo()>Join game</button><button type=button class="b g" onclick=home()>Back</button></div>`)};

window.joinGo=async function(resume){if(busy)return;const code=$('#jc').value.trim().toUpperCase(),n=$('#jn').value.trim();S.jn=n;sv();
if(!/^[A-Z]{4}$/.test(code))return er('Room codes are 4 letters, like KQBT.');if(!n)return er('Enter your name');if(!ok())return er('Online play isn\'t configured yet');
busy=1;btnBusy('#jb','Joining…');
try{const sess=SS.g('sbsess'),mine=sess&&sess.code===code?sess:null,l=LS.g('sblast');
/* identity: this tab's id; when rejoining from a fresh tab, reuse the id this browser had in that room */
let pid=mine&&PID.test(mine.pid)?mine.pid:tabPid(),fromLS=0;if(!mine&&resume&&l&&l.code===code&&PID.test(l.pid)&&l.pid!==pid){pid=l.pid;fromLS=1}
er(resume?'Reconnecting to room '+code+'…':'Connecting…',0,1);
let o=await connect(code,n,0,pid);await until(()=>o.dead||o.synced,4000);if(o.dead)return;
/* that id is already live in another tab: join as a separate player instead of fighting over one identity */
if(fromLS&&o.pid in o.ch.presenceState()){LOG('id in use by another tab, using a fresh one');drop(o);pid=tabPid();o=await connect(code,n,0,pid);await until(()=>o.dead||o.synced,4000);if(o.dead)return}
SS.s('sbpid',pid);
er('Looking for room '+code+'…',0,1);
const H=await until(()=>o.dead||bestHost(readPl(o)),mine&&mine.host?1500:5000,150);if(o.dead)return;
/* our own tab was hosting this room (page reload): take the room back */
if(mine&&mine.host&&mine.room&&(!H||H.pid===pid||!outranks(H,mine.room)))return reclaim(o,mine);
if(!H)throw readPl(o).length?SBE('NOHOST','Room '+code+' exists but its host is reconnecting. Try again in a few seconds.'):SBE('NOROOM','Room '+code+' wasn\'t found. It may have ended or expired, or the code may be wrong.');
o.room=H;const cap=lim(H.cfg.mode)[1],inR=H.ros.includes(pid);
if((H.ban||[]).includes(pid))throw SBE('KICKED',denyMsg({why:'kicked'},code));
if(!inR&&H.ros.length>=cap)throw SBE('FULL',denyMsg({why:'full',n:H.ros.length,cap,mode:H.cfg.mode},code));
if(!inR&&H.ros.some(q=>String(H.nm[q]||'').toLowerCase()===n.toLowerCase()))throw SBE('NAME',denyMsg({why:'name'},code));
o.meta={pid,name:n,host:0};o.deny=null;await reg(o);
er('Waiting for the host to let you in…',0,1);
const okd=await until(()=>o.dead||o.deny||(o.room&&o.room.ros.includes(pid)),8000,120);if(o.dead)return;
if(o.deny)throw SBE('DENY',denyMsg(o.deny,code));if(!okd)throw SBE('NORESP','The host didn\'t respond. Please try again.');
o.in=1;saveSess(o);roster(o,readPl(o));cs(o.live?'live':'reconnecting');LOG('joined room',code);lob(1);if(o.room.st&&(o.room.gros||[]).includes(pid)&&window.SBG)SBG.resub()}
catch(e){fail(e)}finally{busy=0;btn('#jb')}};
/* host tab reloaded: restore the room (and the game, from this tab's snapshot) */
function reclaim(o,mine){LOG('reclaiming host role for',o.code);o.host=1;o.meta={...mine.room,pid:o.pid,name:o.name,host:1};o.room=o.meta;o.in=1;
return reg(o).then(()=>{saveSess(o);roster(o,readPl(o));cs('live');T('Reconnected as host');if(o.meta.st&&window.SBG)SBG.takeover(SS.g('sbsnap'));else lob(1)})}

/* ---------- lobby ---------- */
window.cpCode=()=>{const o=O;if(!o)return;copy(o.code).then(k=>{o.cpd=Date.now();const b=$('#cpb');if(b){b.classList.add('ok');$('#cph').textContent=k?'COPIED ✓':'COPY: SELECT THE CODE'}T(k?'Room code copied':'Room code: '+o.code);setTimeout(()=>{const b=$('#cpb');if(b&&Date.now()-o.cpd>=1500){b.classList.remove('ok');$('#cph').textContent='TAP TO COPY'}},1600)})};
function copy(t){const fb=()=>{try{const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.appendChild(a);a.select();const r=document.execCommand('copy');a.remove();return r}catch(e){return false}};
return navigator.clipboard&&isSecureContext?navigator.clipboard.writeText(t).then(()=>true,fb):Promise.resolve(fb())}
const inv=()=>location.origin+location.pathname+'?join='+O.code;
window.shr=function(){const u=inv();navigator.share?navigator.share({title:'Same Brain',text:'Join my Same Brain game: '+O.code,url:u}).catch(()=>{}):copy(u).then(k=>T(k?'Invite link copied':u))};
window.qrT=()=>{const o=O;if(!o)return;o.qrOn=!o.qrOn;if(o.qrOn&&!o.qr){const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';s.onload=()=>{try{const q=qrcode(0,'M');q.addData(inv());q.make();o.qr=q.createSvgTag(4,0);lob()}catch(e){}};s.onerror=()=>T('QR code unavailable, share the link instead');document.head.appendChild(s)}lob()};
window.leaveAsk=()=>{const o=O;if(!o||!o.in)return home();const others=o.all.filter(p=>p.pid!==o.pid&&p.on),nx=others[0];
modal({icon:'🚪',title:'Leave room?',body:o.host?(nx?`You're the host. Hosting passes to <b>${E(nx.name)}</b> and the room stays open for everyone else.`:'You\'re the only one here, so the room will close.'):(o.room&&o.room.st?'You\'ll leave the game in progress. You can rejoin with the room code <b>'+o.code+'</b>.':'You can rejoin with the room code <b>'+o.code+'</b> while there\'s space.'),btns:[['Stay','g'],['Leave room','r',()=>{leaveRoom(1);home()}]]})};
const _lv=window.leave;window.leave=()=>O&&O.in?leaveAsk():_lv();

function lob(first){const o=O;if(!o||!o.in||document.body.classList.contains('ol'))return;if(!first&&!$('#lb'))return;const R0=o.room;if(!R0)return;
if(R0.st&&!o.host)return(R0.gros||[]).includes(o.pid)?R(`<div class=c id=lb data-scr=lw style="text-align:center"><h2>🎮 Game in progress</h2><p class=m>Syncing with the host<span class=dots></span></p><button type=button class="b g" onclick=leaveAsk()>Leave room</button></div>`)
:R(`<div class=c id=lb data-scr=late style="text-align:center;align-items:center"><div class=kx style="background:radial-gradient(circle,#22c55e33,#22c55e0d);box-shadow:0 0 0 1px #22c55e55,0 0 50px -10px #22c55e88">🎟️</div><span class=kick>Room ${o.code} · ${o.all.length} / ${lim((R0.cfg||{}).mode)[1]} players</span><h2>You're in!</h2><p class=m>A game is already in progress. You'll join automatically when the host starts the next one.</p><p class="m sm">Waiting for the next game<span class=dots></span></p><button type=button class="b g" style="width:100%" onclick=leaveAsk()>Leave room</button></div>`);
const c=R0.cfg||{},M=MD[c.mode]||MD.classic,L=lim(c.mode),P=o.all,n=P.length,H=o.host,hostOn=P.some(p=>p.host&&p.on),cpd=Date.now()-(o.cpd||0)<1500,live=P.filter(p=>p.on).length;
const occ=n>L[1]?'bad':n==L[1]?'full':'',can=live>=L[0]&&n<=L[1];
const hint=n>L[1]?`<div class=warn>⚠️ ${M[1]} supports up to ${L[1]} players online. ${H?`Remove ${n-L[1]} player${n-L[1]>1?'s':''} or choose another mode in Game settings.`:'The host needs to remove players or change the mode.'}</div>`
:c.mode=='know'&&n>=L[0]?`<p class="m sm" style="text-align:center">🧑‍🤝‍🧑 ${c.rounds>=n?`${c.rounds} rounds: everyone is the subject at least once.`:`${c.rounds} rounds: ${c.rounds} of ${n} players will be the subject. ${[5,10,15].find(x=>x>=n)} rounds or more gives everyone a turn.`}</p>`
:c.mode=='split'&&n>=L[0]?`<p class="m sm" style="text-align:center">⚖️ ${n-1} voters each round (the writer sits out). ${n%2?'Odd player count: perfect splits are possible.':'Perfect splits need an odd number of players.'}</p>`:'';
const card=p=>`<div class="pc${p.on?'':' off'}${p.pid===o.pid?' me':''}" data-k="${p.pid}">${av(p.name)}<span class=n><span class=nn>${E(p.name)}</span><span class="ps${p.host?' h':''}">${p.host?'👑 Host':''}${p.pid===o.pid?(p.host?' · You':'You'):''}${!p.on?(p.host||p.pid===o.pid?' · ':'')+'Reconnecting…':!p.host&&p.pid!==o.pid?'Connected':''}</span></span><i class="dot${p.on?' on':''}" title="${p.on?'Connected':'Reconnecting'}"></i>${H&&p.pid!==o.pid?`<button type=button class=x onclick="kickAsk('${p.pid}')" aria-label="Remove ${E(p.name)}" title="Remove ${E(p.name)}">✕</button>`:''}</div>`;
R(`<div class=c id=lb data-scr=lobby style="justify-content:flex-start"><div class=rc><span class=kick>Room code</span>
<button type=button id=cpb class="codeb${cpd?' ok':''}" onclick=cpCode() aria-label="Room code ${o.code}. Tap to copy"><span class=code>${o.code}</span><span class=cph id=cph>${cpd?'COPIED ✓':'TAP TO COPY'}</span></button>
<div class=row><button type=button class="b g" onclick=shr()>🔗 Share invite</button><button type=button class="b g" onclick=qrT() aria-expanded="${!!o.qrOn}">${o.qrOn?'Hide QR':'▦ QR code'}</button></div>${o.qrOn&&o.qr?`<div class=qr>${o.qr}</div>`:''}</div>
${!hostOn?'<div class=warn>⏳ The host is reconnecting… If they don\'t come back, hosting passes to the next player automatically.</div>':''}
${R0.ed&&!H?'<div class=note>⚙️ The host is adjusting the game settings…</div>':''}
<div class=cfgc style="--ac:${M[3]}"><span class=ic>${M[0]}</span><div><b>${M[1]}</b><div class="m sm">${c.rounds} rounds${c.mode=='classic'||c.mode=='likely'?' · Special rounds '+(c.sp?'on':'off'):''}${c.sx&&c.mode!='split'?' · Mature ('+(LV[c.lv]||'').replace(/^\S+ /,'')+')':''}</div></div><span class=rng>${L[0]}–${L[1]} players</span></div>
<div class=lb><h3>Players</h3><span class="occ ${occ}" aria-live=polite>${n} / ${L[1]} PLAYERS</span></div><div class="capb ${occ}"><i style="width:${Math.min(100,n/L[1]*100)}%"></i></div>
<div class=pg>${P.map(card).join('')}</div>${hint}
${H?`<button type=button class="b y" id=sgb ${can?'':'disabled'} onclick=SBstart()>${live<L[0]?`Need ${L[0]-live} more player${L[0]-live>1?'s':''}`:n>L[1]?'Too many players for '+M[1]:'Start game'}</button><button type=button class="b g" onclick=hsOpen()>⚙️ Game settings</button>`:`<p class="m sm" style="text-align:center">${live<L[0]?`Waiting for ${L[0]-live} more player${L[0]-live>1?'s':''}`:'Waiting for the host to start the game'}<span class=dots></span></p>`}
<button type=button class="b g ghost" onclick=leaveAsk()>Leave room</button></div>`)}

/* is this pid the room's host? (cached state, or live Presence, which can be ahead of the last sync during a hand-over) */
const isHostPid=pid=>!!(O&&pid&&(pid===(O.room&&O.room.pid)||(bestHost(readPl(O))||{}).pid===pid));
window.SBX={O:()=>O,lim,LIM,lob:()=>lob(1),hostPid:()=>O&&O.room&&O.room.pid,isHostPid,setRoom,leaveAsk:()=>leaveAsk(),save:(k,v)=>SS.s(k,v),load:k=>SS.g(k)};
window.SBdebug=()=>({O,presence:O&&O.ch&&O.ch.presenceState()});

/* ---------- boot: same-tab reload rejoins automatically; ?join=CODE opens the join screen ---------- */
home();const ss=SS.g('sbsess'),j=new URLSearchParams(location.search).get('join');
if(ss&&ss.code&&ss.name){joinScr(ss.code);$('#jn').value=ss.name;joinGo(1)}else if(j)joinScr(j.toUpperCase().replace(/[^A-Z]/g,'').slice(0,4))
})();
