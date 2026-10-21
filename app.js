'use strict';
/* ============================================================
   원빈의 iPhone — UI / 모션 / 게임 진행
   (대사·기록 데이터는 data.js)
   ============================================================ */
const $=s=>document.querySelector(s);
const SCREEN=$('#screen'),APP=$('#appL'),HOME=$('#homeL'),LOCK=$('#lockL'),OV=$('#ov'),PLAYER=$('#player');
const base=Date.now();let timeOffset=0;
const elapsed=()=>(Date.now()-base)/1000+timeOffset;

/* ---------- 상태 ---------- */
let view='lock',curDark=true,SC=1,lastRect=null,animTok=0,firstOpen=true,pendingOpen=null;
let pincode='',noteId=0,selectedDay=17,calMonth=10,chatId='이소희',videoIndex=0,mailId=0,missOnly=false,safSearch=false;
let unread={서연:3,지우:3,유리:3,지원:3,'체육학부 공지':3};
let soheeUnread=0,todayChat=[],incoming=0,replyStage=0,lineIdx=0,typing=false,pendingText='',replyBusy=false;
let alarmStates=Array(7).fill(true),readMail=new Set(),nowSong=-1,flashOn=false;
let callState='',phoneDone=false,declined=0,callStart=0,callPrev='',nextCallAt=0,ringIv=null,ringTo=null,capIdx=-1,extraCalls=[];
let askedCall=false,callName='이소희',callTimers=[],busySent=false,declineSent=false,rbIv=null;
let lockNotes=[{title:t('bdayTitle'),body:fmtMD(11,21)+' · '+t('inDays',35),app:'rem',time:t('now')}];

/* ---------- 유틸 ---------- */
const pad=n=>String(n).padStart(2,'0');
const esc=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const clock12=()=>{const d=new Date();return((d.getHours()%12)||12)+':'+pad(d.getMinutes())};
function ampm(min){return fmtTime(min)}
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const nowAmpm=()=>ampm(nowMin());
function relRect(el){const s=SCREEN.getBoundingClientRect(),r=el.getBoundingClientRect();return{x:(r.left-s.left)/SC,y:(r.top-s.top)/SC,w:r.width/SC,h:r.height/SC}}
const vib=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};
const t_=t;const T={duration:460,easing:'cubic-bezier(.32,.72,0,1)'};
function devRadius(){return document.getElementById('phone').classList.contains('mob')?0:56}

/* ---------- 아이콘 (자체 제작, 실제 앱 로고 아님) ---------- */
const g=(p,o='')=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${o}>${p}</svg>`;
const G={
 chevL:`<svg viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2 2 10l8 8"/></svg>`,
 chevR:`<svg class="chev" viewBox="0 0 8 13"><path d="m1.5 1.5 5 5-5 5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
 chevRb:g('<path d="m9 5 7 7-7 7"/>'),chevLb:g('<path d="m15 5-7 7 7 7"/>'),
 search:g('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
 plus:g('<path d="M12 5v14M5 12h14"/>'),
 dots:g('<circle cx="12" cy="12" r="9.2"/><circle cx="8" cy="12" r=".8" fill="currentColor"/><circle cx="12" cy="12" r=".8" fill="currentColor"/><circle cx="16" cy="12" r=".8" fill="currentColor"/>'),
 dotsH:g('<circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/>'),
 menu:g('<path d="M4 7h16M4 12h16M4 17h16"/>'),
 gear:g('<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/><circle cx="12" cy="12" r="6.4"/>'),
 person:g('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'),
 chat:g('<path d="M12 4C7 4 3 7.1 3 11c0 2.4 1.5 4.5 3.9 5.8L6 20.5l4-2.4c.6.1 1.3.1 2 .1 5 0 9-3.1 9-7.1S17 4 12 4Z"/>'),
 chatPlus:g('<path d="M12 4C7 4 3 7.1 3 11c0 2.4 1.5 4.5 3.9 5.8L6 20.5l4-2.4c.6.1 1.3.1 2 .1 5 0 9-3.1 9-7.1S17 4 12 4Z"/><path d="M12 8.5v5M9.5 11h5"/>'),
 openchat:g('<circle cx="12" cy="12" r="8.5"/><path d="M8 12.5c1 1.6 2.4 2.4 4 2.4s3-.8 4-2.4"/>'),
 bag:g('<path d="M5 8h14l-1 12H6Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'),
 clock:g('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
 star:g('<path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z"/>'),
 contacts:g('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="9.5" r="3"/><path d="M6.8 18c.9-2.4 2.9-3.6 5.2-3.6s4.3 1.2 5.2 3.6"/>'),
 keypad:g('<g fill="currentColor" stroke="none"><circle cx="6" cy="5" r="1.7"/><circle cx="12" cy="5" r="1.7"/><circle cx="18" cy="5" r="1.7"/><circle cx="6" cy="11" r="1.7"/><circle cx="12" cy="11" r="1.7"/><circle cx="18" cy="11" r="1.7"/><circle cx="6" cy="17" r="1.7"/><circle cx="12" cy="17" r="1.7"/><circle cx="18" cy="17" r="1.7"/><circle cx="12" cy="22" r="1.5"/></g>'),
 voicemail:g('<circle cx="6.5" cy="12" r="3.5"/><circle cx="17.5" cy="12" r="3.5"/><path d="M6.5 15.5h11"/>'),
 info:g('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".7" fill="currentColor"/>'),
 compose:g('<path d="M20 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6"/><path d="M17.5 3.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/>'),
 filter:g('<circle cx="12" cy="12" r="9"/><path d="M8 10h8M9.5 13h5M11 16h2"/>'),
 share:g('<path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11v9h12v-9"/>'),
 heart:g('<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/>'),
 trash:g('<path d="M5 7h14M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>'),
 book:g('<path d="M4 5.5C6 4.5 9 4.5 12 6c3-1.5 6-1.5 8-.5V19c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5Z"/><path d="M12 6v13.5"/>'),
 tabs:g('<rect x="4" y="4" width="11" height="11" rx="2"/><path d="M9 20h9a2 2 0 0 0 2-2V9"/>'),
 mic:g('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>'),
 globe:g('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.8 3.5 5.8 3.5 9s-1 6.2-3.5 9c-2.5-2.8-3.5-5.8-3.5-9s1-6.2 3.5-9Z"/>'),
 smile:g('<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1.8 2 5.2 2 7 0"/><circle cx="9" cy="10" r=".9" fill="currentColor"/><circle cx="15" cy="10" r=".9" fill="currentColor"/>'),
 plusSq:g('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M12 8v8M8 12h8"/>'),
 arrowUp:g('<path d="M12 19V5M6 11l6-6 6 6"/>'),
 home:g('<path d="M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4Z"/>'),
 reels:g('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M3.5 8.5h17M9 3.5l2.5 5M14.5 3.5 17 8.5"/><path d="m10 12 5 2.8-5 2.8Z"/>'),
 bell:g('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
 send:g('<path d="M21 3 10 14"/><path d="M21 3 14.5 21l-4.5-7-7-4.5Z"/>'),
 comment:g('<path d="M12 3.5a8.5 8.5 0 1 0 4.3 15.8l4.2 1.2-1.2-4.2A8.5 8.5 0 0 0 12 3.5Z"/>'),
 grid:g('<rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17"/>'),
 tag:g('<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><circle cx="12" cy="10" r="3"/><path d="M7.5 18c.9-2 2.5-3 4.5-3s3.6 1 4.5 3"/>'),
 bookmark:g('<path d="M6 3.5h12v17l-6-4-6 4Z"/>'),
 camera:g('<path d="M4 8h3.5L9 5.5h6L16.5 8H20v11H4Z"/><circle cx="12" cy="13" r="3.5"/>'),
 flash:g('<path d="M8.5 3h7l-1 5h-5Z"/><path d="M9.5 8h5v11a2.5 2.5 0 0 1-5 0Z"/><path d="M12 11.5v2.5"/>'),
 photo:g('<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5"/>'),
 video:g('<rect x="3" y="6.5" width="13" height="11" rx="2"/><path d="m16 10.5 5-3v9l-5-3"/>'),
 list:g('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r=".9" fill="currentColor"/><circle cx="4.5" cy="12" r=".9" fill="currentColor"/><circle cx="4.5" cy="18" r=".9" fill="currentColor"/>'),
 inbox:g('<path d="M3.5 13.5 6 5h12l2.5 8.5V19h-17Z"/><path d="M3.5 13.5H9a3 3 0 0 0 6 0h5.5"/>'),
 check:g('<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.7L16 9.5"/>'),
 pen:g('<path d="m14.5 5.5 4 4L8 20H4v-4Z"/>'),
 alarm:g('<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 1.5M4.5 5 7 3M19.5 5 17 3"/>'),
 stopwatch:g('<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M10 2.5h4M12 2.5V6"/>'),
 timer:g('<circle cx="12" cy="12" r="8.5"/><path d="M12 12 8 8"/>'),
 musicNote:'<svg viewBox="0 0 24 24"><path d="M17 3v11.5a3 3 0 1 1-2-2.8V7.3l-6 1.4v8a3 3 0 1 1-2-2.8V5.5Z"/></svg>',
 playF:'<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5Z"/></svg>',
 pauseF:'<svg viewBox="0 0 24 24"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>',
 fwdF:'<svg viewBox="0 0 32 24"><path d="M2 4.5v15l12-7.5Z"/><path d="M15 4.5v15l12-7.5Z"/></svg>',
 bwdF:'<svg viewBox="0 0 32 24"><path d="M30 4.5v15l-12-7.5Z"/><path d="M17 4.5v15L5 12Z"/></svg>',
 handset:'<svg viewBox="0 0 24 24"><path d="M6.6 3.2c.6-.3 1.4-.1 1.8.5l1.9 3c.4.6.3 1.4-.2 1.9l-1.4 1.3a12.4 12.4 0 0 0 5.4 5.4l1.3-1.4c.5-.5 1.3-.6 1.9-.2l3 1.9c.6.4.8 1.2.5 1.8l-.9 1.9c-.5 1-1.6 1.6-2.7 1.4C10 19.6 4.4 14 3.3 6.8c-.2-1.1.4-2.2 1.4-2.7Z"/></svg>',
 speaker:'<svg viewBox="0 0 24 24"><path d="M3.5 9h4l5-4.5v15l-5-4.5h-4Z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>',
 muteF:'<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M4 4l16 16" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>',
 videoF:'<svg viewBox="0 0 24 24"><rect x="2.5" y="6.5" width="13" height="11" rx="2.5"/><path d="m16.5 10.5 5-3v9l-5-3Z"/></svg>',
 plusF:'<svg viewBox="0 0 24 24"><path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7Z"/></svg>',
 keypadF:'<svg viewBox="0 0 24 24"><g><circle cx="6" cy="5" r="1.8"/><circle cx="12" cy="5" r="1.8"/><circle cx="18" cy="5" r="1.8"/><circle cx="6" cy="11" r="1.8"/><circle cx="12" cy="11" r="1.8"/><circle cx="18" cy="11" r="1.8"/><circle cx="6" cy="17" r="1.8"/><circle cx="12" cy="17" r="1.8"/><circle cx="18" cy="17" r="1.8"/></g></svg>',
 bellF:'<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z"/><circle cx="12" cy="20.5" r="2"/></svg>',
 msgF:'<svg viewBox="0 0 24 24"><path d="M12 4C7 4 3 7.1 3 11c0 2.4 1.5 4.5 3.9 5.8L6 20.5l4-2.4c.6.1 1.3.1 2 .1 5 0 9-3.1 9-7.1S17 4 12 4Z"/></svg>',
 shift:'<svg viewBox="0 0 24 24" width="22" fill="none" stroke="#000" stroke-width="1.7" stroke-linejoin="round"><path d="M12 4 4 12.5h4.5V20h7v-7.5H20Z"/></svg>',
 bksp:'<svg viewBox="0 0 26 20" width="26" fill="none" stroke="#000" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"><path d="M8 3h15v14H8l-6-7Z"/><path d="m12 7 6 6M18 7l-6 6"/></svg>',
 sil:'<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="4.3" fill="#fff"/><path d="M3.8 22c.6-4.4 4-7 8.2-7s7.6 2.6 8.2 7Z" fill="#fff"/></svg>',
 calSm:g('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
 sun:'<svg viewBox="0 0 24 24" width="24"><circle cx="12" cy="12" r="5" fill="#ffd60a"/><g stroke="#ffd60a" stroke-width="2" stroke-linecap="round"><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></g></svg>',
 moon:'<svg viewBox="0 0 24 24" width="24"><path d="M15.5 3.5A8.5 8.5 0 1 0 20.5 15 7 7 0 0 1 15.5 3.5Z" fill="#fff"/></svg>',
 pcloud:'<svg viewBox="0 0 24 24" width="24"><circle cx="9" cy="9" r="4.2" fill="#ffd60a"/><path d="M8 19.5h9.5a3.5 3.5 0 0 0 .3-7A5 5 0 0 0 8.4 11 4.3 4.3 0 0 0 8 19.5Z" fill="#fff"/></svg>',
 cloud:'<svg viewBox="0 0 24 24" width="24"><path d="M7 19h10.5a4 4 0 0 0 .4-8A5.6 5.6 0 0 0 7.2 9.2 5 5 0 0 0 7 19Z" fill="#fff"/></svg>',
};
const APPS={maps:'지도',instagram:'Instagram',photos:'사진',mail:'Mail',calendar:'캘린더',clock:'시계',notes:'메모',weather:'날씨',settings:'설정',phone:'전화',safari:'Safari',kakao:'카카오톡',music:'음악'};
function appIcon(id){
 const L=(a,b,c,d)=>`<linearGradient id="${a}" x1="0" y1="${d?1:0}" x2="${d?1:0}" y2="${d?0:1}"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
 const W=(defs,body)=>`<svg viewBox="0 0 60 60"><defs>${defs}</defs>${body}</svg>`;
 switch(id){
 case'instagram':return W(`<linearGradient id="gi" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ffc35c"/><stop offset=".5" stop-color="#ff3d6e"/><stop offset="1" stop-color="#7c3bf0"/></linearGradient>`,`<rect width="60" height="60" fill="url(#gi)"/><rect x="17" y="12.5" width="26" height="34" rx="4.5" fill="none" stroke="#fff" stroke-width="3.2"/><rect x="21.6" y="17" width="16.8" height="17" rx="2" fill="#fff"/>`);
 case'photos':{let p='';for(let i=0;i<10;i++)p+=`<ellipse cx="30" cy="18.2" rx="4.4" ry="10.5" fill="#fff" transform="rotate(${i*36} 30 30)"/>`;return W(L('gp','#9bdcff','#d8f1ff'),`<rect width="60" height="60" fill="url(#gp)"/>${p}<circle cx="30" cy="30" r="7.2" fill="#ffc83d"/><circle cx="30" cy="30" r="7.2" fill="none" stroke="#f0a500" stroke-width="1"/>`)}
 case'mail':return W(L('gm','#3fb0ff','#0a6cf5'),`<rect width="60" height="60" fill="url(#gm)"/><rect x="11.5" y="18" width="37" height="25" rx="3.5" fill="#fff"/><path d="M12.5 20 30 32.5 47.5 20" fill="none" stroke="#1676f3" stroke-width="2.4" stroke-linejoin="round"/>`);
 case'calendar':return W('',`<rect width="60" height="60" fill="#fff"/><text x="30" y="17.5" text-anchor="middle" font-size="${wdLong(2026,10,17).length>5?8:9.5}" font-weight="600" fill="#ff3b30" font-family="-apple-system,Pretendard,sans-serif">${wdLong(2026,10,17)}</text><text x="30" y="47" text-anchor="middle" font-size="31" font-weight="300" fill="#111" font-family="-apple-system,Pretendard,sans-serif">17</text>`);
 case'clock':{const d=new Date(),h=d.getHours()%12,m=d.getMinutes();let t='';for(let i=0;i<12;i++)t+=`<path d="M30 8.5v${i%3?2.6:3.8}" stroke="#111" stroke-width="${i%3?1:1.6}" transform="rotate(${i*30} 30 30)"/>`;
  return W('',`<rect width="60" height="60" fill="#000"/><circle cx="30" cy="30" r="24" fill="#fff"/>${t}<path d="M30 30V17" stroke="#111" stroke-width="2.6" stroke-linecap="round" transform="rotate(${h*30+m/2} 30 30)"/><path d="M30 30V11.5" stroke="#111" stroke-width="1.8" stroke-linecap="round" transform="rotate(${m*6} 30 30)"/><path d="M30 34V11" stroke="#ff9500" stroke-width="1" transform="rotate(${(m*6+90)%360} 30 30)"/><circle cx="30" cy="30" r="1.8" fill="#ff9500"/>`)}
 case'notes':return W(L('gn','#ffe27a','#ffc933'),`<rect width="60" height="60" fill="#fff"/><rect width="60" height="17" fill="url(#gn)"/><g stroke="#d9d9de" stroke-width="1.2"><path d="M8 27h44M8 35h44M8 43h44M8 51h44"/></g><g fill="#cfcfd4"><circle cx="10" cy="17" r=".9"/><circle cx="14" cy="17" r=".9"/><circle cx="18" cy="17" r=".9"/><circle cx="22" cy="17" r=".9"/><circle cx="26" cy="17" r=".9"/><circle cx="30" cy="17" r=".9"/><circle cx="34" cy="17" r=".9"/><circle cx="38" cy="17" r=".9"/><circle cx="42" cy="17" r=".9"/><circle cx="46" cy="17" r=".9"/><circle cx="50" cy="17" r=".9"/></g>`);
 case'weather':return W(L('gw','#53b5ff','#1f6fe0'),`<rect width="60" height="60" fill="url(#gw)"/><circle cx="23" cy="23" r="9.5" fill="#ffd84a"/><path d="M19 45h21.5a7.5 7.5 0 0 0 .6-15 10 10 0 0 0-19.2 3.2A6 6 0 0 0 19 45Z" fill="#fff"/>`);
 case'settings':return W(L('gs','#a7adb6','#6d727b'),`<rect width="60" height="60" fill="url(#gs)"/><circle cx="30" cy="30" r="17" fill="none" stroke="#e9eaee" stroke-width="7" stroke-dasharray="4.4 4.5"/><circle cx="30" cy="30" r="14" fill="#878c95" stroke="#e9eaee" stroke-width="3.2"/><circle cx="30" cy="30" r="5.5" fill="none" stroke="#e9eaee" stroke-width="3"/><g stroke="#e9eaee" stroke-width="2.4"><path d="M30 17.5v7M30 35.5v7M17.5 30h7M35.5 30h7"/></g>`);
 case'phone':return W(L('gph','#65f38f','#28c253'),`<rect width="60" height="60" fill="url(#gph)"/><g transform="translate(12 12) scale(1.5)" fill="#fff">${G.handset.replace(/<\/?svg[^>]*>/g,'')}</g>`);
 case'safari':return W(L('gsa','#3aa8ff','#0f5fe0'),`<rect width="60" height="60" fill="#fff"/><circle cx="30" cy="30" r="21" fill="url(#gsa)"/><g fill="none" stroke="#fff" stroke-width="1.6" opacity=".95"><ellipse cx="30" cy="30" rx="8.5" ry="21"/><path d="M9 30h42M12 19.5h36M12 40.5h36M30 9v42"/></g>`);
 case'kakao':return W('',`<rect width="60" height="60" fill="#fee500"/><path d="M30 14.5c-11.9 0-21.5 7.4-21.5 16.5 0 5.9 4 11.1 10 14l-2.2 7.8c-.2.7.6 1.3 1.2.8l9.2-6.1c1.1.1 2.2.2 3.3.2 11.9 0 21.5-7.4 21.5-16.6S41.9 14.5 30 14.5Z" fill="#3a1d1d"/><g fill="#fee500"><circle cx="21.5" cy="31" r="2.7"/><circle cx="30" cy="31" r="2.7"/><circle cx="38.5" cy="31" r="2.7"/></g>`);
 case'music':return W(L('gmu','#ff6f86','#fa2b47'),`<rect width="60" height="60" fill="url(#gmu)"/><g transform="translate(11 10) scale(1.55)" fill="#fff">${G.musicNote.replace(/<\/?svg[^>]*>/g,'')}</g>`);
 case'maps':return W('',`<rect width="60" height="60" fill="#e9f2df"/><path d="M0 38 60 22v12L0 50Z" fill="#fff"/><path d="M24 0h9L27 60h-9Z" fill="#ffd966"/><path d="M0 12c14 6 30-4 60 6V0H0Z" fill="#bfe3a5"/><path d="M42 60c0-8 10-10 18-12v12Z" fill="#9fd0f5"/><path d="M40 14a8 8 0 0 0-8 8c0 6 8 14 8 14s8-8 8-14a8 8 0 0 0-8-8Z" fill="#ff3b30"/><circle cx="40" cy="22" r="3" fill="#fff"/>`);
 case'rem':return W('',`<rect width="60" height="60" fill="#fff"/><circle cx="16" cy="19" r="4.5" fill="#007aff"/><circle cx="16" cy="31" r="4.5" fill="#ff3b30"/><circle cx="16" cy="43" r="4.5" fill="#ff9500"/><g stroke="#d6d6db" stroke-width="2"><path d="M25 19h24M25 31h24M25 43h24"/></g>`);
 }return''}

/* ---------- 사운드 (WebAudio로 직접 합성) ---------- */
let AC=null;
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function tone(f,t0,dur,vol=.12,type='sine'){const a=ac();if(!a)return;const t=a.currentTime+t0,o=a.createOscillator(),gn=a.createGain();o.type=type;o.frequency.value=f;gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(vol,t+.008);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn).connect(a.destination);o.start(t);o.stop(t+dur+.05)}
function sfx(k){if(k==='key')tone(2400,0,.025,.035,'triangle');else if(k==='msg'){tone(1046,0,.22,.09);tone(1397,.1,.32,.09)}else if(k==='send'){tone(620,0,.07,.05);tone(930,.05,.09,.05)}else if(k==='unlock'){tone(1300,0,.05,.04,'triangle');tone(1700,.04,.05,.03,'triangle')}else if(k==='lock')tone(500,0,.06,.05,'triangle')}
function ringOnce(){[[784,0],[988,.2],[1175,.4],[988,.6],[784,1.0],[988,1.2],[1175,1.4],[1319,1.6]].forEach(([f,t])=>{tone(f,t,.35,.11);tone(f*2,t,.18,.03)})}
document.addEventListener('pointerdown',()=>ac(),{once:true});

/* ---------- 상태바 / 아일랜드 ---------- */
function setStatus(dark){curDark=!!dark;$('#sb').classList.toggle('light',curDark);$('#hb').classList.toggle('light',curDark)}
const ART=['media/sohee_01.jpg','media/sohee_02.jpg','media/sohee_03.jpg','','media/sohee_04.jpg'];
const ARTIST=['sohee','sohee','sohee',t('voiceMemo'),'sohee'];
function updateIsland(){typeof updateCrumb==='function'&&updateCrumb();const on=nowSong>=0&&!PLAYER.paused&&!['music','lock','pin'].includes(view)&&!OV.querySelector('.np,.call,.viewer');const il=$('#island');il.classList.toggle('act',on);if(on){const a=ART[nowSong];il.querySelector('.ia').style.backgroundImage=a?`url(${a})`:'linear-gradient(135deg,#ff9a9e,#fa2d48)'}}

/* ============================================================
   잠금화면 / 암호
   ============================================================ */
function ncardHTML(n){const ic=n.app==='kakao'?`<div class="ni" style="position:relative;overflow:visible"><img src="media/sohee_kakao_profile.jpg" style="width:38px;height:38px;border-radius:50%;object-fit:cover;display:block"><span style="position:absolute;right:-4px;bottom:-4px;width:18px;height:18px;border-radius:5px;overflow:hidden;border:1.5px solid rgba(255,255,255,.9)">${appIcon('kakao')}</span></div>`:`<div class="ni">${appIcon(n.app)}</div>`;
 return `${ic}<div class="nt"><div class="nh"><span>${esc(n.title)}</span><small>${n.time}</small></div><div class="nb">${esc(n.body)}</div></div>`}
function renderLock(){
 $('#lkc').innerHTML=`<div class="lk-date">${fmtLockDate()}</div><div class="lk-time" id="lkt">${clock12()}</div>
 <div class="lk-langw"><button class="lk-lang" onclick="event.stopPropagation();openLangSheet()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.8 3.5 5.8 3.5 9s-1 6.2-3.5 9c-2.5-2.8-3.5-5.8-3.5-9s1-6.2 3.5-9Z"/></svg>${(window.LANGS||[]).find(l=>l[0]===LANG)?.[1]||''}</button></div>
 <div class="lk-notes">${lockNotes.map((n,i)=>`<button class="ncard" data-i="${i}" onclick="lockNoteTap(${i},event)">${ncardHTML(n)}</button>`).join('')}</div>
 <button class="lk-btn" style="left:46px;${flashOn?'background:#fff;color:#000':''}" onclick="event.stopPropagation();flashOn=!flashOn;vib(15);renderLock()">${G.flash.replace('<svg','<svg width="24" height="24" style="color:'+(flashOn?'#000':'#fff')+'"')}</button>
 <button class="lk-btn" style="right:46px" onclick="event.stopPropagation();vib(15);this.animate([{transform:'scale(1.2)'},{transform:'none'}],250)">${G.camera.replace('<svg','<svg width="24" height="24" style="color:#fff"')}</button>
 <div class="lk-hint">${t('swipeUp')}</div>`}
function openLangSheet(){vib(10);const d=document.createElement('div');d.id='langSheet';
 d.innerHTML=`<div class="ls-g"><div class="ls-h">Language · 언어</div>${(window.LANGS||[]).map(l=>`<button class="${l[0]===LANG?'on':''}" data-l="${l[0]}">${l[1]}${l[0]===LANG?' ✓':''}</button>`).join('')}</div><button class="ls-c">${t('cancel')}</button>`;
 const close=()=>{d.animate([{opacity:1},{opacity:0}],{duration:200}).onfinish=()=>d.remove()};
 d.onclick=e=>{e.stopPropagation();const b=e.target.closest('[data-l]');if(b){if(b.dataset.l===LANG)return close();setLang(b.dataset.l);return}if(e.target===d||e.target.closest('.ls-c'))close()};
 d.addEventListener('pointerdown',e=>e.stopPropagation());
 $('#phone').appendChild(d);d.animate([{opacity:0},{opacity:1}],{duration:200});d.querySelector('.ls-g').animate([{transform:'translateY(60px)'},{transform:'none'}],{duration:320,easing:'cubic-bezier(.2,.9,.25,1)'})}
function lockNoteTap(i,e){e.stopPropagation();if(lockNotes[i].app==='kakao')pendingOpen='chat';goPin()}
(function lockDrag(){const el=$('#lkc');let y0=null,dy=0,moved=false;
 el.addEventListener('pointerdown',e=>{if(view!=='lock'||e.target.closest('button'))return;y0=e.clientY;dy=0;moved=false;el.setPointerCapture(e.pointerId)});
 el.addEventListener('pointermove',e=>{if(y0===null)return;dy=Math.min(0,(e.clientY-y0)/SC);if(Math.abs(dy)>6)moved=true;el.style.transform=`translateY(${dy}px)`;el.style.opacity=1+dy/500;$('#wall').style.filter=`blur(${Math.min(24,-dy/8)}px) brightness(${1-Math.min(.38,-dy/700)})`});
 el.addEventListener('pointerup',e=>{if(y0===null)return;const d=dy;y0=null;$('#wall').style.filter='';
  if(d<-70||!moved&&!e.target.closest('button')){goPin(d)}else{el.animate([{transform:`translateY(${d}px)`,opacity:1+d/500},{transform:'none',opacity:1}],{duration:350,easing:'cubic-bezier(.2,1.3,.4,1)'});el.style.transform='';el.style.opacity=''}});
})();
function goPin(fromDy=0){view='pin';pincode='';const lk=$('#lkc');lk.animate([{transform:`translateY(${fromDy}px)`,opacity:Math.max(0,1+fromDy/500)},{transform:'translateY(-120px)',opacity:0}],{duration:380,easing:'cubic-bezier(.3,.7,.2,1)',fill:'forwards'});
 lk.style.transform='';lk.style.opacity='';lk.style.pointerEvents='none';$('#wall').classList.add('dim');renderPin();const p=$('#pinL');p.style.display='flex';p.animate([{opacity:0,transform:'translateY(40px)'},{opacity:1,transform:'none'}],{duration:420,easing:'cubic-bezier(.2,.9,.25,1)'})}
const PL=['','ABC','DEF','GHI','JKL','MNO','PQRS','TUV','WXYZ'];
function renderPin(){$('#pinL').innerHTML=`<div class="pt">${t('enterPass')}</div><div class="pdots" id="pdots">${[0,1,2,3].map(i=>`<i class="${i<pincode.length?'on':''}"></i>`).join('')}</div>
 <div class="pkeys">${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="pk" onpointerdown="pinPress('${n}',this)"><b>${n}</b><small>${PL[n-1]}</small></button>`).join('')}<span></span><button class="pk" onpointerdown="pinPress('0',this)"><b>0</b><small></small></button><span></span></div>
 <div class="pbot"><button onclick="vib(10)">${t('emergency')}</button><button id="pcancel" onclick="pinCancelOrDel()">${pincode?t('delete'):t('cancel')}</button></div>`}
function pinDots(){$('#pdots').innerHTML=[0,1,2,3].map(i=>`<i class="${i<pincode.length?'on':''}"></i>`).join('');$('#pcancel').textContent=pincode?t('delete'):t('cancel')}
function pinPress(n,el){if(pincode.length>=4)return;el.classList.add('dn');setTimeout(()=>el.classList.remove('dn'),90);sfx('key');vib(8);pincode+=n;pinDots();
 if(pincode.length===4){if(pincode==='1121'){setTimeout(unlock,140)}else{setTimeout(()=>{const d=$('#pdots');d.classList.remove('shake');void d.offsetWidth;d.classList.add('shake');vib([60,40,60]);setTimeout(()=>{pincode='';pinDots()},420)},120)}}}
function pinCancelOrDel(){if(pincode){pincode=pincode.slice(0,-1);pinDots();return}pinCancel()}
function pinCancel(){view='lock';const p=$('#pinL');p.animate([{opacity:1},{opacity:0,transform:'translateY(30px)'}],{duration:300}).onfinish=()=>p.style.display='none';
 const lk=$('#lkc');lk.getAnimations().forEach(a=>a.cancel());lk.style.pointerEvents='';lk.animate([{transform:'translateY(-120px)',opacity:0},{transform:'none',opacity:1}],{duration:450,easing:'cubic-bezier(.2,.9,.25,1)'});$('#wall').classList.remove('dim')}
function unlock(){sfx('unlock');view='home';$('#wall').classList.remove('dim');
 LOCK.animate([{opacity:1},{opacity:0}],{duration:300,fill:'forwards'}).onfinish=()=>{LOCK.style.visibility='hidden';$('#pinL').style.display='none';$('#lkc').getAnimations().forEach(a=>a.cancel());$('#lkc').style.pointerEvents=''};
 renderHome();HOME.style.visibility='visible';HOME.animate([{transform:'scale(1.18)',opacity:0},{transform:'none',opacity:1}],{duration:560,easing:'cubic-bezier(.2,.9,.22,1)'});
 [...HOME.querySelectorAll('.app,.widget')].forEach((el,i)=>el.animate([{transform:'scale(.7)',opacity:0},{transform:'none',opacity:1}],{duration:520,delay:30+i*14,easing:'cubic-bezier(.2,1.1,.3,1)',fill:'backwards'}));
 setStatus(true);if(pendingOpen){pendingOpen=null;setTimeout(()=>{chatId='이소희';openApp('chat',HOME.querySelector('.app[data-app="kakao"] .icon'))},520)}}

/* ============================================================
   홈 화면
   ============================================================ */
function badgeOf(id){if(id==='phone')return 3+declined;if(id==='mail')return[0,1].filter(i=>!readMail.has(i)).length;if(id==='kakao')return Object.values(unread).reduce((a,b)=>a+b,0)+soheeUnread;return 0}
function appBtn(id){const b=badgeOf(id);return `<button class="app" data-app="${id}" onclick="openApp('${id}',this.firstElementChild)"><div class="icon"><div class="ic">${appIcon(id)}</div>${b?`<span class="bdg">${b}</span>`:''}</div><span class="lbl">${t('app_'+id)}</span></button>`}
function renderHome(){
 HOME.innerHTML=`<div class="hgrid">
  <button class="widget wcal" data-app="calendar" onclick="openApp('calendar',this)"><div class="wd">${wdLong(2026,10,17)}</div><div class="wn">17</div>${(events[17]||[]).map(x=>`<div class="we">${esc(x)}<small>${t('allDay')}</small></div>`).join('')}</button>
  <button class="widget wwx" data-app="weather" onclick="openApp('weather',this)"><div class="c">${t('seoul')} ➚</div><div class="tp">18°</div><span style="position:absolute;top:14px;right:14px">${G.sun}</span><div class="ds">${t('mostlySunny')}<small>${t('hiLo')}</small></div></button>
  ${['instagram','photos','mail','calendar','clock','notes','weather','settings','maps'].map(appBtn).join('')}
 </div><button class="spot" onclick="this.animate([{transform:'translateX(-50%) scale(1)'},{transform:'translateX(-50%) scale(1.08)'},{transform:'translateX(-50%) scale(1)'}],300)">${G.search.replace('<svg','<svg width="13" height="13"')}${t('search')}</button>
 <div class="dock">${['phone','safari','kakao','music'].map(appBtn).join('')}</div>`}

/* ============================================================
   화면 전환 엔진
   ============================================================ */
const PARENT={note:'notes',chat:'kakao',maild:'mail',reel:'instagram',screentime:'settings'};
const rootOf=v=>PARENT[v]||v;
function viewDark(){if(['lock','pin','home'].includes(view))return true;const p=APP.lastElementChild;return!!(p&&p.dataset.dark)}
function wireScroll(pg){const sc=pg.querySelector('.scroll');if(sc)sc.addEventListener('scroll',()=>pg.classList.toggle('scrolled',sc.scrollTop>38),{passive:true})}
function show(id,anim='swap'){
 const old=[...APP.children];old.forEach(o=>{o.querySelectorAll('video').forEach(v=>v.pause())});
 if(PLAYER.dataset.voice&&!(id==='chat')){PLAYER.pause()}
 view=id;const v=VIEWS[id]();const pg=document.createElement('div');pg.className='pg '+(v.cls||'');pg.innerHTML=v.html;pg.dataset.view=id;pg.dataset.dark=v.dark?'1':'';
 if(anim==='pop')APP.insertBefore(pg,APP.firstChild);else APP.appendChild(pg);
 setStatus(v.dark);wireScroll(pg);
 const done=()=>old.forEach(o=>o.remove());
 if(anim==='push'){pg.classList.add('pushed');pg.animate([{transform:'translateX(100%)'},{transform:'none'}],T);old.forEach(o=>o.animate([{transform:'none',filter:'brightness(1)'},{transform:'translateX(-28%)',filter:'brightness(.92)'}],T));setTimeout(done,T.duration)}
 else if(anim==='pop'){pg.animate([{transform:'translateX(-28%)',filter:'brightness(.92)'},{transform:'none',filter:'brightness(1)'}],T);old.forEach(o=>{o.classList.add('pushed');o.animate([{transform:'none'},{transform:'translateX(100%)'}],{...T,fill:'forwards'})});setTimeout(done,T.duration)}
 else done();
 v.init&&v.init(pg);updateIsland();return pg}
function zoomFrames(r){const W=SCREEN.clientWidth,H=SCREEN.clientHeight,s=r.w/W,iy=Math.max(0,(H-r.h/s)/2),dx=r.x+r.w/2-W/2,dy=r.y+r.h/2-H/2;
 return[{transform:`translate(${dx}px,${dy}px) scale(${s})`,clipPath:`inset(${iy}px 0px round ${15/s}px)`,opacity:.25},{transform:'translate(0px,0px) scale(1)',clipPath:`inset(0px 0px round ${devRadius()}px)`,opacity:1}]}
function openApp(id,el){if(callState)return;if(view!=='home'){return}
 lastRect=el?relRect(el):null;APP.innerHTML='';show(id,'none');const tok=++animTok;
 APP.style.visibility='visible';APP.getAnimations().forEach(a=>a.cancel());
 APP.animate(zoomFrames(lastRect||{x:166,y:396,w:60,h:60}),{duration:540,easing:'cubic-bezier(.2,.9,.22,1)'});
 HOME.animate([{transform:'none',opacity:1},{transform:'scale(1.1)',opacity:0}],{duration:400,easing:'ease-in'}).onfinish=()=>{if(tok===animTok&&view!=='home')HOME.style.visibility='hidden'};
 if(firstOpen){firstOpen=false;setTimeout(()=>{$('#hb').classList.add('pulse');setTimeout(()=>$('#hb').classList.remove('pulse'),3400)},900)}}
function closeApp(){if(callState||['home','lock','pin'].includes(view))return;
 const root=rootOf(view);if(PLAYER.dataset.voice)PLAYER.pause();
 view='home';renderHome();HOME.style.visibility='visible';setStatus(true);
 const icon=HOME.querySelector(`.app[data-app="${root}"] .icon`);const r=icon?relRect(icon):{x:166,y:396,w:60,h:60};
 const tok=++animTok;APP.getAnimations().forEach(a=>a.cancel());
 const a=APP.animate(zoomFrames(r).reverse(),{duration:460,easing:'cubic-bezier(.3,.75,.2,1)',fill:'forwards'});
 a.onfinish=()=>{if(tok!==animTok)return;APP.style.visibility='hidden';APP.querySelectorAll('video').forEach(v=>v.pause());APP.innerHTML='';a.cancel()};
 HOME.animate([{transform:'scale(1.1)',opacity:0},{transform:'none',opacity:1}],{duration:460,easing:'cubic-bezier(.2,.9,.22,1)'});updateIsland()}
function push(id){show(id,'push')}
function back(){if(PARENT[view])show(PARENT[view],'pop');else closeApp()}
function hbAction(){if(callState)return;const vw=OV.querySelector('.viewer');if(vw)return closeViewer();if(OV.querySelector('.np'))return closeNP();
 if(view==='lock')return goPin();if(view==='pin')return;if(view==='home')return HOME.animate([{transform:'none'},{transform:'scale(.97)'},{transform:'none'}],250);closeApp()}
(function hbGesture(){const hb=$('#hb');let y0=null;hb.addEventListener('pointerdown',e=>{y0=e.clientY;hb.setPointerCapture(e.pointerId)});hb.addEventListener('pointerup',e=>{if(y0===null)return;y0=null;hbAction()})})();
(function edgeBack(){let x0=null,y0=0,pg=null;SCREEN.addEventListener('pointerdown',e=>{const r=SCREEN.getBoundingClientRect();if(!PARENT[view]||(e.clientX-r.left)/SC>22)return;x0=e.clientX;y0=e.clientY;pg=APP.lastElementChild});
 SCREEN.addEventListener('pointermove',e=>{if(x0===null)return;const dx=Math.max(0,(e.clientX-x0)/SC);if(pg)pg.style.transform=`translateX(${dx}px)`});
 SCREEN.addEventListener('pointerup',e=>{if(x0===null)return;const dx=(e.clientX-x0)/SC;x0=null;if(pg)pg.style.transform='';if(dx>90)back()})})();
/* 뒤로가기: 상태바 '◀ 홈' + 브라우저/안드로이드 뒤로 버튼 + Backspace + 마우스 뒤로 버튼 */
function goBack(){if(callState)return;const ls=document.getElementById('langSheet');if(ls){ls.remove();return}
 if(OV.querySelector('.viewer'))return closeViewer();if(OV.querySelector('.np'))return closeNP();
 if(['lock','pin','home'].includes(view)){if(view==='pin')pinCancel();return}back()}
function updateCrumb(){const on=!['lock','pin','home'].includes(view)&&!callState;$('#sb').classList.toggle('crumb',on)}
$('#sbk').innerHTML=`<svg viewBox="0 0 7 12"><path d="M6 1 1 6l5 5"/></svg>${t('home')}`;
$('#sbk').addEventListener('click',e=>{e.stopPropagation();if(callState)return;if(OV.querySelector('.viewer'))closeViewer();if(OV.querySelector('.np'))closeNP();closeApp()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hbAction();else if(e.key==='Backspace'&&!e.target.closest('input,textarea')){e.preventDefault();goBack()}});
document.addEventListener('mouseup',e=>{if(e.button===3){e.preventDefault();goBack()}});
try{history.pushState({wb:1},'');addEventListener('popstate',()=>{goBack();history.pushState({wb:1},'')})}catch(e){}

/* ---------- 공통 템플릿 ---------- */
function navHTML(o){return `<div class="nav ${o.solid?'solid':''}">${o.back!==undefined?`<button class="nb-back" onclick="${o.backFn||'back()'}">${G.chevL}${o.back}</button>`:(o.left||'<span></span>')}<div class="nb-title">${o.title||''}</div><div class="nb-right">${o.right||''}</div></div>`}
function tabbar(items,on,cls=''){return `<div class="tabbar ${cls}">${items.map(([ic,l],i)=>`<button class="${i===on?'on':''}">${G[ic]||ic}<span>${l}</span></button>`).join('')}</div>`}
const sw=(on,fn)=>`<button class="sw ${on?'on':''}" onclick="this.classList.toggle('on');vib(8);${fn||''}"></button>`;

/* ============================================================
   앱 화면들
   ============================================================ */
const VIEWS={};

/* --- 메모 --- */
function noteDate(d,full){const [y,m,dd]=d.split('-').map(Number);if(full)return fmtYMD(y,m,dd);if(d==='2026-10-17')return fmtTime(14*60+14);if(d==='2026-10-16')return t('yesterday');const diff=(new Date(2026,9,17)-new Date(y,m-1,dd))/864e5;if(diff<7)return wdLong(y,m,dd);return fmtNum(y,m,dd)}
const noteRow=(n,i)=>`<button class="row tap" onclick="noteId=${i};push('note')"><b>${esc(n[0])}</b><small><em>${noteDate(n[3])}</em>${esc(n[1])}</small></button>`;
VIEWS.notes=()=>({cls:'grouped notes-pg',html:navHTML({title:t('app_notes'),back:t('folders'),right:G.dots})+`<div class="scroll"><h1 class="lt">${t('app_notes')}</h1><div class="srch">${G.search}${t('search')}</div>
 <div class="gh" style="margin-top:8px">📌 ${t('pinned')}</div><div class="group note-l">${notes.slice(0,4).map((n,i)=>noteRow(n,i)).join('')}</div>
 <div class="gh">${t('notesSec')}</div><div class="group note-l">${notes.slice(4).map((n,i)=>noteRow(n,i+4)).join('')}</div></div>
 <div class="toolbar"><span style="width:24px"></span><span style="color:#000;align-self:center;font-size:11px">${t('nNotes',notes.length)}</span>${G.compose}</div>`});
VIEWS.note=()=>{const n=notes[noteId];return{cls:'notes-pg',html:navHTML({title:'',back:t('app_notes'),right:G.share+G.dots,solid:false})+`<div class="scroll"><div class="note-v"><div class="nd">${noteDate(n[3],true)}</div><h2>${esc(n[0])}</h2>${esc(n[2])}</div></div><div class="toolbar">${G.check}${G.camera}${G.pen}${G.compose}</div>`}};

/* --- 캘린더 --- */
function calEvents(){if(calMonth===11)return selectedDay===21?['🎂 '+t('bdayEvent')]:[];return events[selectedDay]||[]}
VIEWS.calendar=()=>{const nov=calMonth===11,first=nov?0:4,days=nov?30:31;let c='';for(let i=0;i<first;i++)c+='<div></div>';
 for(let d=1;d<=days;d++){const dow=(first+d-1)%7,has=nov?d===21:!!events[d],td=!nov&&d===17;c+=`<button class="cal-d ${td?'td':''} ${d===selectedDay?'sel':''} ${dow===0||dow===6?'we':''}" onclick="selectedDay=${d};show('calendar')"><span>${d}</span>${has?'<i></i>':''}</button>`}
 const ev=calEvents().map(x=>{const m=x.split(' · ');return `<div class="evt"><span class="bar" style="background:${x.startsWith('🎂')?'#ff9500':'#af52de'}"></span><b>${esc(m[0])}</b><small>${m[1]||t('allDay')}</small></div>`}).join('')||`<div class="evt muted">${t('noEvents')}</div>`;
 return{html:navHTML({title:'',back:fmtYear(2026),backFn:'closeApp()',right:G.list+G.search+G.plus})+`<div class="scroll" style="padding-bottom:120px"><div style="display:flex;justify-content:space-between;align-items:center;margin:0 16px 8px"><h1 class="lt" style="margin:0">${fmtMonth(calMonth)}</h1><span style="display:flex;gap:26px;color:var(--blue)"><button style="width:22px" onclick="calNav(-1)">${G.chevLb}</button><button style="width:22px" onclick="calNav(1)">${G.chevRb}</button></span></div>
 <div class="cal-g cal-w">${wdNarrow().map(w=>`<div>${w}</div>`).join('')}</div><div class="cal-g" id="calg">${c}</div><div style="border-top:.5px solid var(--sep);margin-top:4px;padding-top:4px">${ev}</div></div>
 <div class="tabbar" style="color:#ff3b30">${[t('today'),t('calendars'),t('inbox')].map(x=>`<button style="color:#ff3b30;font-size:16px;justify-content:center">${x}</button>`).join('')}</div>`}};
function calNav(d){const n=calMonth+d;if(n<10||n>11)return;calMonth=n;selectedDay=n===11?21:17;const pg=show('calendar');pg.querySelector('#calg').animate([{transform:`translateX(${d*40}%)`,opacity:0},{transform:'none',opacity:1}],{duration:350,easing:'cubic-bezier(.2,.9,.25,1)'})}

/* --- 시계 --- */
VIEWS.clock=()=>({cls:'dark',dark:true,html:`<div class="nav" style="color:#ff9f0a"><button style="color:#ff9f0a;font-size:17px;justify-self:start;padding-left:8px">${t('edit')}</button><div class="nb-title">${t('alarm')}</div><div class="nb-right" style="color:#ff9f0a">${G.plus}</div></div><div class="scroll"><h1 class="lt">${t('alarm')}</h1>
 <div style="margin:10px 16px 4px;font-size:15px;font-weight:600;display:flex;gap:6px;align-items:center">${t('sleepWake')}</div><div style="padding:8px 16px 14px;color:#8e8e93;font-size:15px;border-bottom:.5px solid rgba(255,255,255,.15)">${t('noAlarm')} <span style="float:right;color:#ff9f0a">${t('setUp')}</span></div>
 <div style="margin:18px 16px 4px;font-size:15px;font-weight:600">${t('other')}</div>
 ${Array.from({length:7},(_,i)=>`<div class="alarm ${alarmStates[i]?'':'off'}"><div><div class="at">${(p=>p.before?`<small>${p.dp}</small>${p.tm}`:`${p.tm}<small style="margin-left:4px">${p.dp}</small>`)(alarmParts(7,i))}</div><div class="al">${t('alarmLabel')}</div></div>${sw(alarmStates[i],`alarmStates[${i}]=!alarmStates[${i}];this.closest('.alarm').classList.toggle('off',!alarmStates[${i}])`)}</div>`).join('')}</div>
 ${tabbar([['globe',t('worldClock')],['alarm',t('alarm')],['stopwatch',t('stopwatch')],['timer',t('timer')]],1).replace('class="on"','class="on" style="color:#ff9f0a"')}`});

/* --- 전화 --- */
function callWhen(s){if(s.startsWith('오늘 ')){const [h,m]=s.slice(3).split(':').map(Number);return ampm(h*60+m)}const w=s.split(' ')[0];if(w==='어제')return t('yesterday');if(KO_WD[w]!=null){return wdLong(2026,10,11+KO_WD[w])}return w}
const callNameDisp=n=>n.replace(/^(.+?)( \(\d+\))?$/,(m,a,b)=>dn(a)+(b||''));
VIEWS.phone=()=>{const all=[...extraCalls,...calls].filter(c=>!missOnly||c[2]==='부재중');
 return{html:`<div class="nav"><button style="color:var(--blue);font-size:17px;justify-self:start;padding-left:8px">${t('edit')}</button><div class="seg"><button class="${missOnly?'':'on'}" onclick="missOnly=false;show('phone')">${t('all')}</button><button class="${missOnly?'on':''}" onclick="missOnly=true;show('phone')">${t('missed')}</button></div><span></span></div>
 <div class="scroll"><h1 class="lt">${t('recents')}</h1><div class="srch">${G.search}${t('search')}</div>
 ${all.map(c=>`<div class="prow ${c[2]==='부재중'?'miss':''}" style="cursor:pointer" onclick="dial('${esc(c[0].replace(/ \(\d+\)$/,''))}')"><span class="pi">${c[2]==='발신'?'<svg viewBox="0 0 24 24"><path d="M6.6 3.2c.6-.3 1.4-.1 1.8.5l1.9 3c.4.6.3 1.4-.2 1.9l-1.4 1.3a12.4 12.4 0 0 0 5.4 5.4l1.3-1.4c.5-.5 1.3-.6 1.9-.2l3 1.9c.6.4.8 1.2.5 1.8l-.9 1.9c-.5 1-1.6 1.6-2.7 1.4C10 19.6 4.4 14 3.3 6.8c-.2-1.1.4-2.2 1.4-2.7Z"/></svg>':''}</span><div class="pn"><b>${esc(callNameDisp(c[0]))}</b><small>${t('mobile')}</small></div><span class="pd">${callWhen(c[1])}</span><span class="inf">${G.info}</span></div>`).join('')}</div>
 ${tabbar([['star',t('favorites')],['clock',t('recents')],['contacts',t('contacts')],['keypad',t('keypad')],['voicemail',t('voicemail')]],1)}`}};

/* --- 카카오톡 --- */
const isGroup=n=>/4조|공지|과제방/.test(n);
const MEMBERS={'교양 발표 4조':4,'체육학부 공지':38,'전공 과제방':5};
function lastDate(n){const d=((chatData[n]||[]).filter(x=>x[1]==='date').slice(-1)[0]||[''])[0];return d==='10월 16일'?'어제':d}
function dateKey(n){if(n==='이소희')return 9999;const l=lastDate(n);if(l==='어제')return 1016;const m=l.match(/(\d+)월 (\d+)일/);return m?+m[1]*100+ +m[2]:0}
function previewText(s,grp){const m=mediaLabels[s];if(m)return m.kind==='image'?t('photo'):t('voiceMsg');const b=s.match(/^\[(.+)\]$/);if(b)return /기프티콘/.test(b[1])?t('giftSent'):/파일/.test(b[1])&&!/영상/.test(b[1])?t('fileColon')+fileInfo(b[1])[0]:/영상/.test(b[1])?t('video'):t('photo');return grp?s.replace(/^.+?: /,''):s}
function avatarFor(name,group){if(/소희/.test(name))return '<img src="media/sohee_kakao_profile.jpg" alt="">';if(group)return `<svg viewBox="0 0 24 24"><circle cx="8.5" cy="9" r="3" fill="#fff"/><circle cx="15.5" cy="9" r="3" fill="#fff"/><path d="M2.5 19c.4-3 2.9-5 6-5s5.6 2 6 5ZM9.5 19c.4-3 2.9-5 6-5s5.6 2 6 5Z" fill="#fff"/></svg>`;return G.sil}
function otherUnread(){return Object.entries(unread).filter(([k])=>k!==chatId).reduce((a,[,b])=>a+b,0)+(chatId==='이소희'?0:soheeUnread)}
VIEWS.kakao=()=>{const list=chatNames.slice().sort((a,b)=>dateKey(b)-dateKey(a));
 return{cls:'kk',html:`<div class="kk-h"><b>${t('chats')}</b><span>${G.search}${G.chatPlus}${G.gear}</span></div><div class="scroll">${list.map(n=>{const arr=chatData[n]||[];let last=arr.filter(x=>x[1]!=='date').slice(-1)[0],time=fmtLabel(lastDate(n)),cnt=unread[n]||0;
  if(n==='이소희'&&todayChat.length){last=todayChat[todayChat.length-1];time=last[2];cnt=soheeUnread}
  return `<button class="crow" onclick="chatId=${esc(JSON.stringify(n))};push('chat')"><div class="av">${avatarFor(n,isGroup(n))}</div><div style="flex:1;min-width:0"><div class="cn">${esc(dn(n))}${MEMBERS[n]?`<small>${MEMBERS[n]}</small>`:''}</div><div class="cp">${last?esc(previewText(last[0],isGroup(n))):''}</div></div><div class="cm"><span class="ct">${time}</span>${cnt?`<span class="kbdg">${cnt}</span>`:''}</div></button>`}).join('')}</div>
 ${tabbar([['person',t('friends')],['chat',t('chats')],['openchat',t('openChat')],['bag',t('shopping')],['dotsH',t('more')]],1)}`}};
/* 채팅방 */
const AUD_DUR={'media/wonbin_whistle.mp3':'0:15','media/sohee_across_the_universe.mp3':'0:13'};
function fileInfo(n){return({'과제 파일':[t('f_assign'),'1.2MB'],'수정한 과제 파일':[t('f_assign2'),'1.3MB'],'실기 체크 시트 파일':[t('f_check'),'48KB']})[n]||[n+'.pdf','820KB']}
function bubble(s){const m=mediaLabels[s];
 if(m&&m.kind==='image')return `<div class="bb img" onclick="event.stopPropagation();openViewerSrc('${m.src}',this.firstElementChild)"><img src="${m.src}" alt=""></div>`;
 if(m&&m.kind==='audio'){let w='';for(let i=0;i<20;i++)w+=`<i style="height:${5+Math.round(Math.abs(Math.sin(i*1.7+s.length))*15)}px;animation-delay:-${(i%5)*.13}s"></i>`;return `<div class="bb aud" data-src="${m.src}" onclick="event.stopPropagation();playChatAudio(this)"><span class="pl">${G.playF}</span><span class="wv">${w}</span><span class="du">${AUD_DUR[m.src]||'0:10'}</span></div>`}
 const b=s.match(/^\[(.+)\]$/);if(b){const n=b[1];
  if(/기프티콘/.test(n))return `<div class="bb gift"><div class="gt">🍵</div><div class="gb"><b>${t('giftArrived')}</b>${t('giftItem')}</div><div class="gbtn">${t('giftCheck')}</div></div>`;
  if(/파일/.test(n)&&!/영상/.test(n)){const f=fileInfo(n);return `<div class="bb file"><span class="fi">${f[0].split('.').pop().toUpperCase()}</span><div><div class="fn">${esc(f[0])}</div><div class="fs">${t('expired')} · ${f[1]}</div></div></div>`}
  const vid=/영상/.test(n);return `<div class="bb exp">${vid?G.video:G.photo}<span>${vid?t('expVideo'):t('expPhoto')}</span></div>`}
 return `<div class="bb">${esc(s)}</div>`}
function fullDate(l){return fmtLabel(l,true)}
function chatItems(id){const arr=id==='이소희'?[...chatData[id],...(todayChat.length?[['오늘','date'],...todayChat]:[])]:(chatData[id]||[]);const grp=isGroup(id);const items=[];let tm=0;
 const TT=CHAT_TIMES[id]||[];arr.forEach((m,i)=>{if(m[1]==='date'){items.push({date:m[0]});return}
  let text=m[0],sender=id==='이소희'?'이소희':id;if(grp&&m[1]==='them'){const mm=text.match(/^(.+?): ([\s\S]*)$/);if(mm){sender=mm[1];text=mm[2]}}
  if(TT[i]!=null)tm=TT[i];else tm+=1;items.push({who:m[1],text,sender,time:m[2]||ampm(tm),rd:m[3]==='rd'})});return items}
function chatMsgs(id){const it=chatItems(id),grp=isGroup(id);let o='';
 it.forEach((x,i)=>{if(x.date){o+=`<div class="dpill"><span>${G.calSm.replace('<svg','<svg width="12" height="12"')}${fullDate(x.date)}</span></div>`;return}
  const p=it[i-1],n=it[i+1];const first=!p||p.date||p.who!==x.who||p.sender!==x.sender;const last=!n||n.date||n.who!==x.who||n.sender!==x.sender||n.time!==x.time;const me=x.who==='me';
  const tm=last?`<div class="tm">${x.rd?'<span class="rd">1</span>':''}<span>${x.time}</span></div>`:(x.rd?'<div class="tm"><span class="rd">1</span></div>':'');
  o+=`<div class="ln ${me?'me':'th'} ${first?'first':''}">${!me&&first?`<div class="sav">${avatarFor(x.sender)}</div>`:''}<div class="col" style="${me?'align-items:flex-end':''}">${!me&&first?`<div class="who">${esc(dn(x.sender))}</div>`:''}<div class="wrap">${me?tm+bubble(x.text):bubble(x.text)+tm}</div></div></div>`});return o}
VIEWS.chat=()=>({cls:'chat',html:`<div class="chat-h"><button class="bk" onclick="back()">${G.chevL}<span>${otherUnread()||''}</span></button><div class="nm">${esc(dn(chatId))}${MEMBERS[chatId]?`<small>${MEMBERS[chatId]}</small>`:''}</div><div class="rt">${G.search}${G.menu}</div></div>
 <div class="msgs" id="msgs" onclick="closeKbd()">${chatMsgs(chatId)}</div>
 <div class="cin safe" id="cin">${G.plusSq}<div class="fld ph" id="fld" onclick="event.stopPropagation();tapInput()">${t('msgInput')}</div>${G.smile}<button class="snd" id="snd" onclick="sendLine()">${G.arrowUp}</button></div><div class="kbd" id="kbd">${kbdHTML()}</div>`,
 init:()=>{if(chatId==='이소희')soheeUnread=0;else unread[chatId]=0;typing=false;pendingText='';scrollChat()}});
function scrollChat(smooth){const b=$('#msgs');if(!b)return;if(smooth)b.scrollTo({top:b.scrollHeight,behavior:'smooth'});else b.scrollTop=b.scrollHeight}
function refreshChat(pop){const b=$('#msgs');if(!b||view!=='chat')return;b.innerHTML=chatMsgs(chatId);scrollChat();if(pop){const l=b.lastElementChild&&b.lastElementChild.querySelector('.bb');if(l)l.classList.add('pop')}}
function playChatAudio(el){const src=el.dataset.src;document.querySelectorAll('.bb.aud').forEach(x=>{x.classList.remove('playing');x.querySelector('.pl').innerHTML=G.playF});
 if(PLAYER.dataset.voice===src&&!PLAYER.paused){PLAYER.pause();return}nowSong=-1;PLAYER.src=src;PLAYER.dataset.voice=src;PLAYER.play().then(()=>{el.classList.add('playing');el.querySelector('.pl').innerHTML=G.pauseF}).catch(()=>{});
 PLAYER.onended=()=>{el.classList.remove('playing');el.querySelector('.pl').innerHTML=G.playF;delete PLAYER.dataset.voice}}
/* 키보드 + 자동 타이핑 */
const KR=[['ㅂ','ㅈ','ㄷ','ㄱ','ㅅ','ㅛ','ㅕ','ㅑ','ㅐ','ㅔ'],['ㅁ','ㄴ','ㅇ','ㄹ','ㅎ','ㅗ','ㅓ','ㅏ','ㅣ'],['ㅋ','ㅌ','ㅊ','ㅍ','ㅠ','ㅜ','ㅡ']];
const KB_LAT=['qwertyuiop'.split(''),'asdfghjkl'.split(''),'zxcvbnm'.split('')];
const KB_TH=[['ๆ','ไ','ำ','พ','ะ','ั','ี','ร','น','ย','บ','ล'],['ฟ','ห','ก','ด','เ','้','่','า','ส','ว','ง'],['ผ','ป','แ','อ','ิ','ื','ท','ม','ใ','ฝ']];
const KB_JA=[['あ','か','さ'],['た','な','は'],['ま','や','ら'],['小','わ','、']];
function kbdHTML(){const k=c=>`<div class="key" data-k="${c}" data-c="${c}">${c}</div>`;let rows;
 if(LANG==='ja'){const side=['⌫','空白','改行','🌐'];rows=KB_JA.map((r,i)=>`<div class="kr"><div class="key sp" style="max-width:none;flex:1" data-k="${i===0?'→':i===1?'abc':i===2?'あいう':'☺'}">${i===0?'→':i===1?'ABC':i===2?'あいう':'☺'}</div>${r.map(c=>`<div class="key" style="max-width:none;flex:1.3;font-size:20px" data-k="${c}" data-c="${c}">${c}</div>`).join('')}<div class="key sp" style="max-width:none;flex:1;font-size:14px" data-k="${['⌫','space','ret','emo'][i]}">${side[i]==='⌫'?G.bksp:side[i]}</div></div>`).join('');
  return `<div class="kin" onclick="event.stopPropagation();kbdTap(event)">${rows}<div class="kbot">${G.globe}${G.mic}</div></div>`}
 const R=LANG==='ko'?KR:LANG==='th'?KB_TH:KB_LAT;
 return `<div class="kin" onclick="event.stopPropagation();kbdTap(event)"><div class="kr">${R[0].map(k).join('')}</div><div class="kr" style="padding:0 ${R[1].length<10?20:3}px">${R[1].map(k).join('')}</div>
 <div class="kr"><div class="key sp" data-k="⇧">${G.shift}</div><span style="width:6px"></span>${R[2].map(k).join('')}<span style="width:6px"></span><div class="key sp" data-k="⌫">${G.bksp}</div></div>
 <div class="kr"><div class="key sp" data-k="123" style="font-size:16px">123</div><div class="key sp" data-k="emo" style="font-size:20px">🙂</div><div class="key wide" data-k="space">${t('space')}</div><div class="key ret" data-k="ret">${t('ret')}</div></div>
 <div class="kbot">${G.globe}${G.mic}</div></div>`}
function openKbd(){const k=$('#kbd');if(!k||k.classList.contains('open'))return;k.classList.add('open');$('#cin').classList.remove('safe');const t0=performance.now();(function f(){scrollChat();if(performance.now()-t0<420)requestAnimationFrame(f)})()}
function closeKbd(){const k=$('#kbd');if(!k||!k.classList.contains('open'))return;k.classList.remove('open');$('#cin').classList.add('safe')}
function pressKey(k){const el=document.querySelector(`#kbd [data-k="${k}"]`);if(!el)return;el.classList.add('dn');if(!el.classList.contains('sp')&&!el.classList.contains('wide')&&!el.classList.contains('ret'))el.classList.add('pv');sfx('key');setTimeout(()=>el.classList.remove('dn','pv'),95)}
function kbdTap(e){const k=e.target.closest('.key');if(!k)return;pressKey(k.dataset.k);vib(5);tapInput()}
const CHO=['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'],JUNG=['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'],JONG=['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const VS={'ㅘ':'ㅗㅏ','ㅙ':'ㅗㅐ','ㅚ':'ㅗㅣ','ㅝ':'ㅜㅓ','ㅞ':'ㅜㅔ','ㅟ':'ㅜㅣ','ㅢ':'ㅡㅣ'},FS={'ㄳ':'ㄱㅅ','ㄵ':'ㄴㅈ','ㄶ':'ㄴㅎ','ㄺ':'ㄹㄱ','ㄻ':'ㄹㅁ','ㄼ':'ㄹㅂ','ㄽ':'ㄹㅅ','ㄾ':'ㄹㅌ','ㄿ':'ㄹㅍ','ㅀ':'ㄹㅎ','ㅄ':'ㅂㅅ'},DBL={'ㄲ':'ㄱ','ㄸ':'ㄷ','ㅃ':'ㅂ','ㅆ':'ㅅ','ㅉ':'ㅈ','ㅒ':'ㅐ','ㅖ':'ㅔ'};
const KK=j=>DBL[j]?['⇧',DBL[j]]:[j];
function jamoSteps(str){const st=[];let done='';for(const ch of str){const c=ch.charCodeAt(0);
 if(c>=0xAC00&&c<=0xD7A3){const s=c-0xAC00,ci=Math.floor(s/588),vi=Math.floor(s%588/28),ti=s%28,cp=(v,t)=>String.fromCharCode(0xAC00+ci*588+v*28+t);
  st.push({k:KK(CHO[ci]),t:done+CHO[ci]});const v=VS[JUNG[vi]];if(v){st.push({k:[v[0]],t:done+cp(JUNG.indexOf(v[0]),0)});st.push({k:[v[1]],t:done+cp(vi,0)})}else st.push({k:KK(JUNG[vi]),t:done+cp(vi,0)});
  if(ti){const f=FS[JONG[ti]];if(f){st.push({k:[f[0]],t:done+cp(vi,JONG.indexOf(f[0]))});st.push({k:[f[1]],t:done+cp(vi,ti)})}else st.push({k:KK(JONG[ti]),t:done+cp(vi,ti)})}done+=ch}
 else{done+=ch;st.push({k:ch===' '?['space']:/[ㄱ-ㅣ]/.test(ch)?KK(ch):[],t:done})}}return st}
const JA_ROW={};[['あ','あいうえおぁぃぅぇぉ'],['か','かきくけこがぎぐげご'],['さ','さしすせそざじずぜぞ'],['た','たちつてとだぢづでどっ'],['な','なにぬねの'],['は','はひふへほばびぶべぼぱぴぷぺぽ'],['ま','まみむめも'],['や','やゆよゃゅょ'],['ら','らりるれろ'],['わ','わをんゎー'],['、','、。？！?!…〜']].forEach(([k,s])=>[...s].forEach(c=>JA_ROW[c]=k));
const rnd=a=>a[Math.floor(Math.random()*a.length)];
function keysFor(ch){if(ch===' ')return['space'];
 if(LANG==='ja'){let c=ch;const cc=c.charCodeAt(0);if(cc>=0x30A1&&cc<=0x30F6)c=String.fromCharCode(cc-0x60);if(JA_ROW[c])return[JA_ROW[c]];if(/[一-鿿]/.test(ch))return[rnd(['あ','か','さ','た','な','は','ま','や','ら']),'space'];return[]}
 if(LANG==='th'){return KB_TH.flat().includes(ch)?[ch]:[]}
 if(LANG==='zh'&&/[一-鿿]/.test(ch)){const l='qwertyuiopasdfghjklzxcvbnm';return[rnd(l),rnd(l),'space']}
 const base=ch.normalize('NFD')[0];const lo=base.toLowerCase();if(/[a-z]/.test(lo))return base!==lo?['⇧',lo]:[lo];return[]}
function genSteps(str){const st=[];let done='';for(const ch of str){done+=ch;st.push({k:keysFor(ch),t:done})}return st}
function setField(txt,cursor){const f=$('#fld');if(!f)return;if(!txt&&!cursor){f.className='fld ph';f.textContent=t('msgInput');return}f.className='fld';f.innerHTML=esc(txt)+(cursor?'<span class="cur"></span>':'')}
function canType(){return chatId==='이소희'&&todayChat.filter(x=>x[1]==='them').length>=2&&replyStage<liveReplies.length&&!typing&&!pendingText&&!replyBusy}
function tapInput(){openKbd();if(!canType()){setField(pendingText,true);return}typeLine(liveReplies[replyStage].mine[lineIdx])}
function typeLine(line){typing=true;const steps=LANG==='ko'?jamoSteps(line):genSteps(line);let i=0;setField('',true);
 (function step(){if(view!=='chat'){typing=false;return}if(i>=steps.length){typing=false;pendingText=line;const s=$('#snd');if(s)s.classList.add('on');return}
  const s=steps[i++];s.k.forEach((k,j)=>setTimeout(()=>pressKey(k),j*45));setField(s.t,true);setTimeout(step,(LANG==='ko'?60:85)+Math.random()*70+(s.k.length>1?s.k.length*45:0)+(s.k[0]==='space'?60:0))})()}
function sendLine(){if(!pendingText)return;const stage=liveReplies[replyStage];todayChat.push([pendingText,'me',nowAmpm(),'rd']);pendingText='';sfx('send');vib(10);setField('',false);$('#snd').classList.remove('on');refreshChat(true);lineIdx++;
 if(lineIdx<stage.mine.length){setTimeout(()=>{if(view==='chat'&&chatId==='이소희'&&$('#kbd.open'))typeLine(stage.mine[lineIdx])},500);return}
 replyStage++;lineIdx=0;replyBusy=true;const them=stage.them.slice();
 setTimeout(()=>{todayChat.forEach(x=>{if(x[3]==='rd')x[3]=''});refreshChat()},900);
 let t=1500;them.forEach((msg,k)=>{const typingDur=700+msg.length*55;setTimeout(()=>showTyping(),t);t+=typingDur;setTimeout(()=>{hideTyping();deliverSohee(msg)},t);t+=350});
 setTimeout(()=>{replyBusy=false},t+50)}
function showTyping(){if(!(view==='chat'&&chatId==='이소희'))return;const b=$('#msgs');if(!b||$('#typ'))return;b.insertAdjacentHTML('beforeend',`<div class="ln th first" id="typ"><div class="sav">${avatarFor('이소희')}</div><div class="col"><div class="who">이소희</div><div class="wrap"><div class="bb typing pop"><i></i><i></i><i></i></div></div></div></div>`);scrollChat(true)}
function hideTyping(){const t=$('#typ');if(t)t.remove()}
function deliverSohee(text){todayChat.push([text,'them',nowAmpm()]);
 if(view==='chat'&&chatId==='이소희'){refreshChat(true);tone(1318,0,.12,.05)}
 else{soheeUnread++;notify(text);if(view==='kakao')show('kakao');if(view==='home')renderHome()}}
function incomingMsg(text){if(view==='chat'&&chatId==='이소희'){showTyping();setTimeout(()=>{hideTyping();deliverSohee(text)},1500)}else deliverSohee(text)}

/* --- 알림 배너 --- */
function notify(body){sfx('msg');vib([30,60,30]);
 if(view==='lock'||view==='pin'){lockNotes.unshift({title:'이소희',body,app:'kakao',time:t('now')});renderLock();const c=document.querySelector('.lk-notes .ncard');if(c)c.animate([{transform:'translateY(-30px) scale(.9)',opacity:0},{transform:'none',opacity:1}],{duration:500,easing:'cubic-bezier(.2,1.2,.4,1)'});return}
 OV.querySelectorAll('.banner').forEach(b=>b.remove());const b=document.createElement('div');b.className='banner';b.innerHTML=`<div class="ncard">${ncardHTML({title:'이소희',body,app:'kakao',time:t('now')})}</div>`;OV.appendChild(b);
 b.animate([{transform:'translateY(-140%) scale(.96)'},{transform:'none'}],{duration:620,easing:'cubic-bezier(.2,1.25,.35,1)'});
 let y0=null,dy=0,mv=false;const hide=()=>{if(!b.isConnected)return;b.animate([{transform:`translateY(${Math.min(0,dy)}px)`},{transform:'translateY(-150%)'}],{duration:320,easing:'ease-in',fill:'forwards'}).onfinish=()=>b.remove()};
 const tm=setTimeout(hide,5600);
 b.addEventListener('pointerdown',e=>{y0=e.clientY;mv=false;b.setPointerCapture(e.pointerId)});
 b.addEventListener('pointermove',e=>{if(y0===null)return;dy=(e.clientY-y0)/SC;if(Math.abs(dy)>5)mv=true;b.style.transform=`translateY(${dy<0?dy:dy*.25}px)`});
 b.addEventListener('pointerup',()=>{if(y0===null)return;y0=null;clearTimeout(tm);if(dy<-30){hide();return}b.style.transform='';if(!mv){b.remove();openSohee(b)}})}
function openSohee(el){if(callState)return;chatId='이소희';if(view==='home'){openApp('chat',el.querySelector?el:null);return}if(view==='chat'&&chatId==='이소희')return;if(['lock','pin'].includes(view))return;push('chat')}

/* --- Safari --- */
VIEWS.safari=()=>{if(safSearch)return{cls:'saf',html:`<div style="position:absolute;top:54px;left:0;right:0;padding:6px 14px;display:flex;gap:12px;align-items:center;z-index:3"><div class="srch" style="margin:0;flex:1;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.08);height:40px">${G.search}<span style="color:#000">|</span><span>${t('searchWeb')}</span></div><button style="color:var(--blue);font-size:17px" onclick="safSearch=false;show('safari')">${t('cancel')}</button></div>
 <div class="scroll" style="padding-top:112px"><div style="display:flex;justify-content:space-between;margin:0 16px 8px"><b style="font-size:20px">${t('recentSearches')}</b><span style="color:var(--blue)">${t('clear')}</span></div><div class="group srec">${searches.map(s=>`<div class="row" style="--inset:44px">${G.clock.replace('<svg','<svg width="18" height="18" style="color:#8e8e93;flex:none"')}<span>${esc(s)}</span></div>`).join('')}</div></div>`,init:pg=>pg.querySelector('.srec').animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'none'}],{duration:300})};
 const fav=[['sf_portal','#2a5bd7'],['sf_acad','#1e8e5a'],['sf_lib','#8b5a2b'],['sf_elearn','#d9480f'],['sf_pe','#4b6cb7'],['sf_mail','#5e5ce6'],['sf_news','#34c759'],['app_maps','#ff9f0a']].map(([k,c])=>[[...t(k)][0].toUpperCase(),t(k),c]);
 return{cls:'saf',html:`<div class="scroll"><div class="sh" style="font-size:22px">${t('favoritesSf')}</div><div class="favs">${fav.map(f=>`<div class="fav"><i style="color:${f[2]}">${f[0]}</i>${f[1]}</div>`).join('')}</div>
 <div class="sh" style="font-size:22px;margin-top:28px">${t('privacyReport')}</div><div class="group" style="padding:14px 16px;display:flex;gap:12px;align-items:center;font-size:15px"><span style="font-size:26px">🛡️</span><span>${t('privacyText')}</span></div>
 <div class="sh" style="font-size:22px;margin-top:28px">${t('readingList')}</div><div class="group"><div class="row muted" style="font-size:15px">${t('readingEmpty')}</div></div></div>
 <div class="sbar"><button class="ad" style="width:100%" onclick="safSearch=true;show('safari')"><b>${t('aa')}</b><span style="flex:1;text-align:center">${t('searchWeb')}</span>${G.mic.replace('<svg','<svg width="18" height="18"')}</button><div class="tb">${G.chevLb.replace('<svg','<svg class="dis"')}${G.chevRb.replace('<svg','<svg class="dis"')}${G.share}${G.book}${G.tabs}</div></div>`}};

/* --- Mail --- */
function mailDate(s){const m=s.match(/^(\d+)\/(\d+)$/);if(m)return fmtNum(2026,+m[1],+m[2]);if(s==='2025')return fmtNum(2025,12,2);if(s==='어제')return t('yesterday');return s}
VIEWS.mail=()=>({html:navHTML({title:t('inbox'),back:t('mailboxes'),backFn:'closeApp()',right:t('edit')})+`<div class="scroll"><h1 class="lt">${t('inbox')}</h1><div class="srch">${G.search}${t('search')}</div>
 ${emails.map((e,i)=>`<button class="mrw" onclick="mailId=${i};readMail.add(${i});push('maild')"><span class="dot ${i<2&&!readMail.has(i)?'':'r'}"></span><div class="bd"><div class="l1"><b>${esc(e[0])}</b><span>${mailDate(e[3])}${G.chevR}</span></div><div class="sj">${esc(e[1])}</div><div class="pv">${esc(e[2])}</div></div></button>`).join('')}</div>
 <div class="toolbar">${G.filter}<span style="color:#000;font-size:11px;text-align:center;align-self:center">${t('updatedNow')}</span>${G.compose}</div>`});
VIEWS.maild=()=>{const e=emails[mailId],school=![2,4].includes(mailId);const body=school?t('mailSchool',e[0],e[2]):t('mailShop',e[2]);
 return{html:navHTML({title:'',back:t('inbox'),right:'',solid:false})+`<div class="scroll"><div class="mail-d"><div class="hd"><span class="ini">${esc(e[0][0])}</span><div style="flex:1"><b>${esc(e[0])}</b><small>${t('toMe')}</small></div><small class="muted">${mailDate(e[3])}</small></div><h2>${esc(e[1])}</h2><div class="bd">${esc(body)}</div></div></div><div class="toolbar">${G.trash}${G.bookmark}${G.share.replace('M12 3v12M8 7l4-4 4 4','M9 15 4 10l5-5M4 10h10a6 6 0 0 1 6 6v3')}${G.compose}</div>`}};

/* --- 사진 --- */
const allPhotos=[];photoSections.forEach(s=>s[1].forEach(n=>allPhotos.push({src:'photos/'+n,sec:s[0],sub:s[2]})));
const STORY_I=allPhotos.length;allPhotos.push({src:'photos/story_capture_final.png',thumb:'photos/story_last_thumbnail.jpg',sec:'2025년 11월 27일',sub:t('screenshot',fmtTime(21*60+41))});
VIEWS.photos=()=>{let k=0;return{html:`<div class="nav"><span></span><div class="nb-title">${t('library')}</div><div class="nb-right">${G.search}<span>${t('select')}</span></div></div><div class="scroll" style="padding-bottom:120px"><h1 class="lt">${t('library')}</h1><div class="muted" style="margin:-6px 16px 10px;font-size:15px">${t('nPhotos',allPhotos.length)}</div>
 ${photoSections.map(s=>`<div class="ph-sec">${fmtLabel(s[0])}</div><div class="ph-grid">${s[1].map(n=>`<button data-pi="${k}" onclick="openViewer(${k++},this.firstElementChild)"><img src="photos/${n}" loading="lazy" alt=""></button>`).join('')}</div>`).join('')}
 <div class="ph-sec" style="margin-top:12px">${fmtYM(2025,11)}</div><div class="ph-grid"><button data-pi="${STORY_I}" onclick="openViewer(${STORY_I},this.firstElementChild)"><img src="photos/story_last_thumbnail.jpg" alt=""></button></div></div>
 <div class="phtabs"><button>${t('years')}</button><button>${t('months')}</button><button class="on">${t('allPhotos')}</button></div>`,init:pg=>{const sc=pg.querySelector('.scroll');sc.scrollTop=0}}};
/* 사진 뷰어 */
let vList=allPhotos,vIdx=0;
function fitRect(nw,nh){const W=SCREEN.clientWidth,H=SCREEN.clientHeight,s=Math.min(W/nw,H/nh);const w=nw*s,h=nh*s;return{x:(W-w)/2,y:(H-h)/2,w,h}}
function placeImg(img){const f=fitRect(img.naturalWidth||1,img.naturalHeight||1);Object.assign(img.style,{left:f.x+'px',top:f.y+'px',width:f.w+'px',height:f.h+'px'});return f}
function flipFrom(img,r,f){const s=Math.max(r.w/f.w,r.h/f.h),ix=Math.max(0,(f.w*s-r.w)/2/s),iy=Math.max(0,(f.h*s-r.h)/2/s);return{transform:`translate(${r.x+r.w/2-(f.x+f.w/2)}px,${r.y+r.h/2-(f.y+f.h/2)}px) scale(${s})`,clipPath:`inset(${iy}px ${ix}px round ${8/s}px)`}}
function openViewerSrc(src,el){vList=[{src,sec:t('app_kakao'),sub:t('photo')}];openViewer(0,el,true)}
async function openViewer(i,el,custom){if(!custom)vList=allPhotos;vIdx=i;const p=vList[i];const r=el?relRect(el):null;
 const v=document.createElement('div');v.className='viewer';v.innerHTML=`<div class="vbg"></div><img class="vi" src="${p.src}" alt=""><div class="vt"><button class="nb-back" onclick="closeViewer()">${G.chevL}</button><div class="ttl" id="vttl"></div><div class="nb-right" style="color:#fff">${t('edit')}</div></div><div class="vb">${G.share}${G.heart}${G.info}${G.trash}</div>`;OV.appendChild(v);setVTitle();setStatus(true);
 const img=v.querySelector('.vi');try{await img.decode()}catch(e){}const f=placeImg(img);
 if(r){img.animate([flipFrom(img,r,f),{transform:'none',clipPath:`inset(0px 0px round 0px)`}],{duration:420,easing:'cubic-bezier(.2,.9,.25,1)'})}
 v.querySelector('.vbg').animate([{opacity:0},{opacity:1}],{duration:300});[...v.querySelectorAll('.vt,.vb')].forEach(x=>x.animate([{opacity:0},{opacity:1}],{duration:400}));
 viewerGestures(v)}
function setVTitle(){const p=vList[vIdx];const T_=$('#vttl');if(T_)T_.innerHTML=`${esc(fmtLabel(p.sec))}<small>${esc(p.sub||t('photo'))}</small>`}
function closeViewer(){const v=OV.querySelector('.viewer');if(!v)return;const img=v.querySelector('.vi');const th=vList===allPhotos?document.querySelector(`[data-pi="${vIdx}"] img`):null;
 const f={x:parseFloat(img.style.left),y:parseFloat(img.style.top),w:parseFloat(img.style.width),h:parseFloat(img.style.height)};
 const cur=getComputedStyle(img).transform;
 if(th&&view==='photos'){th.scrollIntoView({block:'nearest'});const r=relRect(th);img.animate([{transform:cur==='none'?'none':cur},flipFrom(img,r,f)],{duration:380,easing:'cubic-bezier(.3,.8,.25,1)',fill:'forwards'})}
 else img.animate([{transform:cur==='none'?'none':cur,opacity:1},{transform:'scale(.85)',opacity:0}],{duration:300,fill:'forwards'});
 v.querySelector('.vbg').animate([{opacity:getComputedStyle(v.querySelector('.vbg')).opacity},{opacity:0}],{duration:360,fill:'forwards'});[...v.querySelectorAll('.vt,.vb')].forEach(x=>x.style.opacity=0);
 setTimeout(()=>{v.remove();setStatus(viewDark());updateIsland()},390)}
function viewerGestures(v){const img=v.querySelector('.vi'),bg=v.querySelector('.vbg');let x0=null,y0=0,dx=0,dy=0,mode=null;
 v.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;x0=e.clientX;y0=e.clientY;dx=dy=0;mode=null;v.setPointerCapture(e.pointerId)});
 v.addEventListener('pointermove',e=>{if(x0===null)return;dx=(e.clientX-x0)/SC;dy=(e.clientY-y0)/SC;if(!mode&&Math.hypot(dx,dy)>8)mode=Math.abs(dx)>Math.abs(dy)?'h':'v';
  if(mode==='h')img.style.transform=`translateX(${dx}px)`;if(mode==='v'){const k=Math.max(.6,1-Math.max(0,dy)/900);img.style.transform=`translate(${dx}px,${dy}px) scale(${k})`;bg.style.opacity=Math.max(0,1-Math.max(0,dy)/400)}});
 v.addEventListener('pointerup',async()=>{if(x0===null)return;x0=null;
  if(!mode){v.classList.toggle('bare');return}
  if(mode==='v'&&dy>110){closeViewer();return}
  if(mode==='h'&&Math.abs(dx)>70&&vList[vIdx+(dx<0?1:-1)]){const dir=dx<0?1:-1;img.animate([{transform:`translateX(${dx}px)`},{transform:`translateX(${-dir*110}%)`}],{duration:220,fill:'forwards'});
   setTimeout(async()=>{vIdx+=dir;img.getAnimations().forEach(a=>a.cancel());img.style.transform='';img.src=vList[vIdx].src;try{await img.decode()}catch(e){}placeImg(img);setVTitle();img.animate([{transform:`translateX(${dir*110}%)`},{transform:'none'}],{duration:280,easing:'cubic-bezier(.2,.9,.25,1)'})},210);return}
  img.animate([{transform:img.style.transform||'none'},{transform:'none'}],{duration:300,easing:'cubic-bezier(.2,1.2,.4,1)'});img.style.transform='';bg.style.opacity=1})}

/* --- Instagram --- */
const REELS=[{t:'Off My Face',d:fmtYMD(2023,6,2),v:'3,921',n:214},{t:'What 2 Do',d:fmtYMD(2024,8,19),v:'2,107',n:168},{t:'Boyfriend',d:fmtYMD(2025,10,30),v:'5,866',n:402}];
VIEWS.instagram=()=>({cls:'ig',html:`<div class="ig-h"><button onclick="closeApp()" style="width:26px">${G.chevLb}</button><b>sohee</b>${G.bell}${G.dotsH}</div><div class="scroll">
 <div class="igp"><div class="pp"><img src="media/sohee_instagram_avatar.jpg" alt=""></div><div class="st"><span><b>3</b>${t('posts')}</span><span><b>1,284</b>${t('followers')}</span><span><b>312</b>${t('following')}</span></div></div>
 <div class="igbio"><b>소희</b><br>${t('bio')}</div>
 <div class="igbtn"><button>${t('followingBtn')}</button><button>${t('message')}</button><button class="sq">${G.person.replace('<svg','<svg width="18" height="18"')}</button></div>
 <div class="igtabs"><span class="on">${G.grid}</span><span>${G.reels}</span><span>${G.tag}</span></div>
 <div class="iggrid">${['off_my_face.jpg','what_2_do.jpg','boyfriend.jpg'].map((x,i)=>`<button onclick="videoIndex=${i};push('reel')"><img src="photos/${x}" alt=""><svg class="rc" viewBox="0 0 24 24"><path d="M3.5 7.5A4 4 0 0 1 7.5 3.5h9a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4Zm6.5 3v7l6-3.5Z"/></svg><span class="vc">${G.playF.replace('<svg','<svg fill="none" stroke="#fff"')}${REELS[i].v}</span></button>`).join('')}</div></div>
 ${tabbar([['home',''],['search',''],['plusSq',''],['reels',''],['<span style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#bbb,#888);display:block"></span>','']],-1)}`});
function reelInner(i){const r=REELS[i];return `<div class="vwrap"><video src="media/sohee_instagram_0${i+1}.mp4" autoplay loop playsinline></video>
 <div class="ract"><div class="liked">${G.heart}<span>${r.n+1}</span></div><div>${G.comment}<span>${12+i*7}</span></div><div>${G.send}<span>${3+i}</span></div><div>${G.dotsH}</div></div>
 <div class="rinfo"><div class="u"><img src="media/sohee_instagram_avatar.jpg" alt="">sohee<span>${t('followingTag')}</span></div>${esc(r.t)} ${t('cover')}<br><small>${r.d} · ${t('likedBy','w',r.n)}</small><br><small>${t('origAudio')}</small></div></div>`}
VIEWS.reel=()=>({cls:'reel dark',dark:true,html:`<div id="rhost">${reelInner(videoIndex)}</div><div class="rtop"><button class="rback" onclick="back()" aria-label="${t('back')}">${G.chevLb}</button><span>${t('reels')}</span>${G.camera}</div>${tabbar([['home',''],['search',''],['plusSq',''],['reels',''],['person','']],3).replace(/<button class="(on)?">/g,'<button class="$1" onclick="back()">')}`,
 init:pg=>{playReel(pg);let y0=null,dy=0;pg.addEventListener('pointerdown',e=>{if(e.target.closest('button,.tabbar'))return;y0=e.clientY;dy=0});pg.addEventListener('pointermove',e=>{if(y0===null)return;dy=(e.clientY-y0)/SC;const w=pg.querySelector('.vwrap');if(w)w.style.transform=`translateY(${dy*.6}px)`});
  pg.addEventListener('pointerup',()=>{if(y0===null)return;y0=null;const w=pg.querySelector('.vwrap');const n=videoIndex+(dy<0?1:-1);
   if(Math.abs(dy)>80&&REELS[n]){w.animate([{transform:w.style.transform},{transform:`translateY(${dy<0?-100:100}%)`}],{duration:250,fill:'forwards'});setTimeout(()=>{videoIndex=n;$('#rhost').innerHTML=reelInner(n);$('#rhost .vwrap').animate([{transform:`translateY(${dy<0?100:-100}%)`},{transform:'none'}],{duration:330,easing:'cubic-bezier(.2,.9,.25,1)'});playReel(pg)},240)}
   else{if(w){w.style.transform='';if(Math.abs(dy)<6){const vd=w.querySelector('video');vd.paused?vd.play():vd.pause()}}}})}});
function playReel(pg){const v=pg.querySelector('video');if(!v)return;if(nowSong>=0)PLAYER.pause();v.muted=false;v.play().catch(()=>{v.muted=true;v.play().catch(()=>{})})}

/* --- 음악 --- */
const artStyle=i=>ART[i]?`background-image:url(${ART[i]})`:'';
VIEWS.music=()=>({html:navHTML({title:t('songs'),back:t('libraryMu'),backFn:'closeApp()',right:''})+`<div class="scroll" style="padding-bottom:180px"><h1 class="lt">${t('songs')}</h1>
 <div style="display:flex;gap:12px;margin:4px 16px 14px"><button onclick="playSong(0)" style="flex:1;background:#eeeef0;border-radius:10px;padding:12px;color:#fa2d48;font-weight:600;display:flex;justify-content:center;gap:6px;align-items:center">${G.playF.replace('<svg','<svg width="14" fill="#fa2d48"')}${t('play')}</button><button onclick="playSong(Math.floor(Math.random()*${songs.length}))" style="flex:1;background:#eeeef0;border-radius:10px;padding:12px;color:#fa2d48;font-weight:600">${t('shuffle')}</button></div>
 ${songs.map((s,i)=>`<button class="mrow" onclick="playSong(${i})"><span class="art" style="${artStyle(i)}">${ART[i]?'':G.musicNote}</span><span class="mt ${i===nowSong?'pl':''}">${esc(s[0])}<small>${ARTIST[i]}</small></span><span style="color:#8e8e93">${G.dotsH.replace('<svg','<svg width="20"')}</span></button>`).join('')}</div>
 ${miniHTML()}${tabbar([['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="m10 8.5 5 3.5-5 3.5Z" fill="currentColor"/></svg>',t('listenNow')],['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',t('browse')],['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/></svg>',t('radio')],['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4v16M10 4v16M14.5 4.5l5 15"/></svg>',t('libraryMu')],['search',t('search')]],3).replace(/class="on"/,'class="on" style="color:#fa2d48"')}`});
function miniHTML(){if(nowSong<0)return '';return `<div class="mini" onclick="openNP()"><span class="art" style="${artStyle(nowSong)}">${ART[nowSong]?'':G.musicNote}</span><b>${esc(songs[nowSong][0])}</b><button onclick="event.stopPropagation();toggleSong()">${PLAYER.paused?G.playF:G.pauseF}</button><button onclick="event.stopPropagation();nextSong(1)">${G.fwdF.replace('<svg','<svg width="30"')}</button></div>`}
function playSong(i){nowSong=i;delete PLAYER.dataset.voice;PLAYER.src=songs[i][1];PLAYER.onended=()=>nextSong(1);PLAYER.play().catch(()=>{});if(view==='music'){const sc=APP.querySelector('.scroll').scrollTop;const pg=show('music');pg.querySelector('.scroll').scrollTop=sc}refreshNP()}
function toggleSong(){if(PLAYER.paused)PLAYER.play().catch(()=>{});else PLAYER.pause();setTimeout(()=>{if(view==='music'){const m=APP.querySelector('.mini');if(m)m.outerHTML=miniHTML()}refreshNP();updateIsland()},30)}
function nextSong(d){playSong((nowSong+d+songs.length)%songs.length)}
function openNP(){if(nowSong<0)return;const n=document.createElement('div');n.className='np';OV.appendChild(n);refreshNP();setStatus(true);n.animate([{transform:'translateY(100%)'},{transform:'none'}],{duration:480,easing:'cubic-bezier(.2,.9,.25,1)'});
 let y0=null,dy=0;n.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;y0=e.clientY;dy=0;n.setPointerCapture(e.pointerId)});n.addEventListener('pointermove',e=>{if(y0===null)return;dy=Math.max(0,(e.clientY-y0)/SC);n.style.transform=`translateY(${dy}px)`});n.addEventListener('pointerup',()=>{if(y0===null)return;y0=null;if(dy>120)closeNP();else{n.animate([{transform:n.style.transform},{transform:'none'}],{duration:280,easing:'cubic-bezier(.2,1.2,.4,1)'});n.style.transform=''}})}
function refreshNP(){const n=OV.querySelector('.np');if(!n||nowSong<0)return;const a=ART[nowSong]?`url(${ART[nowSong]})`:'linear-gradient(135deg,#ff9a9e,#fa2d48)';n.classList.toggle('paused',PLAYER.paused);
 n.innerHTML=`<div class="bgart" style="background-image:${a}"></div><button class="grab" onclick="closeNP()"></button><div class="bigart" style="background-image:${a}"></div><div class="ti">${esc(songs[nowSong][0])}<small>${ARTIST[nowSong]}</small></div><div class="bar"><i id="npbar"></i></div><div class="tt"><span id="npc">0:00</span><span id="npr">-0:00</span></div>
 <div class="ctl"><button onclick="nextSong(-1)">${G.bwdF.replace('<svg','<svg width="44"')}</button><button onclick="toggleSong()">${(PLAYER.paused?G.playF:G.pauseF).replace('<svg','<svg width="46"')}</button><button onclick="nextSong(1)">${G.fwdF.replace('<svg','<svg width="44"')}</button></div>`}
function closeNP(){const n=OV.querySelector('.np');if(!n)return;n.animate([{transform:n.style.transform||'none'},{transform:'translateY(100%)'}],{duration:340,easing:'cubic-bezier(.4,0,.6,1)',fill:'forwards'}).onfinish=()=>{n.remove();setStatus(viewDark());updateIsland()}}
const fmtT=s=>Math.floor(s/60)+':'+pad(Math.floor(s%60));
PLAYER.addEventListener('timeupdate',()=>{const b=$('#npbar');if(b&&PLAYER.duration){b.style.width=(PLAYER.currentTime/PLAYER.duration*100)+'%';$('#npc').textContent=fmtT(PLAYER.currentTime);$('#npr').textContent='-'+fmtT(PLAYER.duration-PLAYER.currentTime)}});
PLAYER.addEventListener('play',updateIsland);PLAYER.addEventListener('pause',updateIsland);


/* --- 지도 (가상의 중연대 동네) --- */
let mapSel=null,mapPos={x:-480,y:-640};
function mapSVG(){return `<svg width="900" height="1200" viewBox="0 0 900 1200" style="position:absolute;inset:0">
 <rect width="900" height="1200" fill="#f2efe9"/>
 <path d="M0 980C160 940 260 1010 380 1080S640 1150 900 1120V1200H0Z" fill="#b9dcf7"/>
 <path d="M60 700h260v230H60Z" fill="#cfe8c4" rx="20"/><path d="M820 0h80v380h-80Z" fill="#cfe8c4"/>
 <rect x="110" y="110" width="460" height="460" rx="18" fill="#ece3d6"/>
 <g fill="#ddd2c2"><rect x="160" y="180" width="110" height="90" rx="6"/><rect x="400" y="190" width="120" height="110" rx="6"/><rect x="270" y="380" width="130" height="80" rx="6"/><rect x="160" y="400" width="80" height="90" rx="6"/><rect x="440" y="400" width="80" height="110" rx="6"/></g>
 <g fill="#e6e1d8"><rect x="610" y="640" width="90" height="70" rx="4"/><rect x="720" y="640" width="120" height="60" rx="4"/><rect x="610" y="730" width="70" height="90" rx="4"/><rect x="790" y="730" width="80" height="70" rx="4"/><rect x="610" y="900" width="140" height="60" rx="4"/><rect x="770" y="860" width="100" height="90" rx="4"/><rect x="640" y="340" width="120" height="60" rx="4"/><rect x="640" y="470" width="100" height="70" rx="4"/></g>
 <g stroke="#d8d3ca" stroke-width="22" fill="none" stroke-linecap="round"><path d="M0 605H900"/><path d="M590 0V1200"/><path d="M590 760H900"/><path d="M590 450H820"/><path d="M340 570V1000"/><path d="M760 760V980"/></g>
 <g stroke="#fff" stroke-width="18" fill="none" stroke-linecap="round"><path d="M590 0V1200"/><path d="M590 760H900"/><path d="M590 450H820"/><path d="M340 570V1000"/><path d="M760 760V980"/></g>
 <path d="M0 605H900" stroke="#ffe08a" stroke-width="20"/>
 <g stroke="#fff" stroke-width="5" fill="none" stroke-dasharray="2 9"><path d="M120 340H560M340 120V560"/></g>
 <g font-family="-apple-system,Pretendard,sans-serif" fill="#8a8578" font-size="13" font-weight="600" text-anchor="middle">
  <text x="340" y="152" font-size="16" fill="#7d6b55">${t('m_univ')}</text><text x="190" y="760" fill="#5f8f4e">${t('m_park')}</text>
  <text x="450" y="598" fill="#9a7d2c">${t('m_road')}</text><text x="604" y="250" transform="rotate(90 604 250)">${t('m_back')}</text><text x="830" y="752">${t('m_alley')}</text><text x="700" y="442">${t('m_cafe')}</text>
  <text x="335" y="425" font-size="11">${t('m_union')}</text><text x="200" y="450" font-size="11">${t('m_lib')}</text><text x="340" y="582" font-size="11">${t('m_gate')}</text><text x="560" y="1110" fill="#5b8fbf">${t('m_stream')}</text>
 </g></svg>`}
const MG={home:'<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4Z"/>',cup:'<path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5Z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v2M11 3v2"/>',pin:'<circle cx="12" cy="10" r="3"/><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/>',bag:'<path d="M5 8h14l-1 12H6Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',game:'<rect x="3" y="8" width="18" height="10" rx="5"/><path d="M8 11v4M6 13h4"/><circle cx="15.5" cy="12" r=".6"/><circle cx="17" cy="14.5" r=".6"/>',mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',bowl:'<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0Z"/><path d="M9 7c0-2 2-2 2-4M13 7c0-2 2-2 2-4"/>',bus:'<rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 11h14M8 18v2.5M16 18v2.5"/><circle cx="8.5" cy="14.5" r=".7"/><circle cx="15.5" cy="14.5" r=".7"/>'};
const mg=k=>`<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">${MG[k]}</svg>`;
const placeById=id=>MAP_PLACES.find(p=>p.id===id)||MAP_PLACES.find(p=>p.name===id);
function mapSheet(){if(mapSel){const p=placeById(mapSel);return `<div class="grab"></div><div class="mdet"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div><h2>${esc(p.name)}</h2><div class="sb">${esc(p.sub)}</div></div><button onclick="selPlace(null)" style="width:30px;height:30px;border-radius:50%;background:#e3e3e8;color:#7c7c80;font-size:17px">✕</button></div>
  <div class="acts"><button class="pri">${G.send.replace('<svg','<svg style="color:#fff"')}${p.id==='home'?t('currentLoc'):t('walkMin',p.id==='s'?4:p.id==='corner'?9:12)}</button><button>${G.star}${p.fav?t('favorited'):t('favorite')}</button><button>${G.share}${t('share')}</button><button>${G.dotsH}${t('moreInfo')}</button></div>
  <div class="inf">${(p.info.length?p.info:[[t('info'),t('noInfo')]]).map(r=>`<div><small>${esc(r[0])}</small>${esc(r[1])}</div>`).join('')}</div></div>`}
 const favs=MAP_PLACES.filter(p=>p.fav);
 return `<div class="grab"></div><div class="srch" style="margin:0 0 14px;background:rgba(118,118,128,.14)">${G.search}${t('searchMaps')}</div>
 <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:600;color:var(--grey);margin-bottom:8px"><span>${t('favorites')}</span><span style="color:var(--blue);font-weight:500">${t('moreInfo')}</span></div>
 <div class="mfav">${favs.map(p=>`<button onclick="selPlace('${p.id}')"><span class="fc" style="background:${p.color}">${mg(p.glyph)}</span>${esc(p.name)}<small>${p.id==='home'?t('currentLoc'):t('minN',p.id==='s'?4:9)}</small></button>`).join('')}<button><span class="fc" style="background:#e3e3e8"><svg viewBox="0 0 24 24" style="stroke:var(--blue)"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg></span>${t('add')}<small>&nbsp;</small></button></div>
 <div style="font-size:15px;font-weight:600;color:var(--grey);margin:16px 0 8px">${t('recentsMap')}</div><div class="group" style="margin:0">${MAP_RECENTS.map(r=>`<button class="row tap" style="--inset:58px;min-height:56px" onclick="selPlace('${placeById(r[0]).id}')"><span class="st-ic" style="background:${placeById(r[0]).color};border-radius:50%">${mg(placeById(r[0]).glyph).replace('<svg','<svg style="stroke:#fff;fill:none;stroke-width:2"')}</span><span style="flex:1"><div style="font-size:16px">${esc(r[0])}</div><div class="muted" style="font-size:13px">${esc(r[1])}</div></span></button>`).join('')}</div>`}
function mapCanvas(){const pins=MAP_PLACES.map(p=>`<div class="mpin ${p.fav?'':'small'} ${mapSel===p.id?'sel':''}" style="left:${p.x}px;top:${p.y}px" onclick="event.stopPropagation();selPlace('${p.id}')"><span class="pc" style="background:${p.color}">${mg(p.glyph)}</span>${esc(p.name)}</div>`).join('');
 const h=placeById('home');return mapSVG()+`<div class="me-dot" style="left:${h.x-26}px;top:${h.y+30}px"></div>`+pins}
function setMapPos(x,y,anim){const cv=$('#mapcv');if(!cv)return;const W=SCREEN.clientWidth,H=SCREEN.clientHeight;mapPos={x:Math.min(0,Math.max(W-900,x)),y:Math.min(0,Math.max(H-1200,y))};const t=`translate(${mapPos.x}px,${mapPos.y}px)`;if(anim)cv.animate([{transform:cv.style.transform||'none'},{transform:t}],{duration:450,easing:'cubic-bezier(.2,.9,.25,1)'});cv.style.transform=t}
function centerOn(p,anim){const W=SCREEN.clientWidth,H=SCREEN.clientHeight;setMapPos(W/2-p.x,H*.27-p.y,anim)}
function selPlace(id){mapSel=id;const s=$('#msheet');if(s){s.innerHTML=mapSheet();s.animate([{transform:'translateY(16px)',opacity:.6},{transform:'none',opacity:1}],{duration:260})}
 document.querySelectorAll('.mpin').forEach(el=>el.classList.remove('sel'));if(id){const p=placeById(id);const i=MAP_PLACES.indexOf(p);const el=document.querySelectorAll('.mpin')[i];if(el)el.classList.add('sel');centerOn(p,true);vib(8)}}
VIEWS.maps=()=>({cls:'mapv',html:`<div class="mapwrap" id="mapwrap"><div class="mapcv" id="mapcv">${mapCanvas()}</div></div>
 <div class="mbtns"><button>${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7l9-4 9 4-9 4Z"/><path d="m3 12 9 4 9-4M3 17l9 4 9-4"/></svg>'}</button><button onclick="centerOn(placeById('home'),true)">${'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5 3.5 10.6l7.2 2.7 2.7 7.2Z"/></svg>'}</button></div>
 <div class="msheet" id="msheet">${mapSheet()}</div>`,
 init:pg=>{centerOn(placeById(mapSel||'home'));const w=pg.querySelector('#mapwrap');let x0=null,y0=0,sx=0,sy=0,mv=false;
  w.addEventListener('pointerdown',e=>{x0=e.clientX;y0=e.clientY;sx=mapPos.x;sy=mapPos.y;mv=false});
  w.addEventListener('pointermove',e=>{if(x0===null)return;const dx=(e.clientX-x0)/SC,dy=(e.clientY-y0)/SC;if(Math.hypot(dx,dy)>4)mv=true;if(mv){w.style.cursor='grabbing';setMapPos(sx+dx,sy+dy)}});
  w.addEventListener('pointerup',()=>{x0=null;w.style.cursor=''})}});

/* --- 날씨 --- */
VIEWS.weather=()=>{const h=new Date().getHours();const hrs=[];for(let i=0;i<12;i++){const hh=(h+i)%24,night=hh>=19||hh<6;const tp=Math.round(15+5*Math.sin((hh-9)/24*2*Math.PI));hrs.push(`<div><span>${i?fmtHour(hh):t('now')}</span>${night?G.moon:(hh%5===0?G.pcloud:G.sun)}<span>${i?tp:18}°</span></div>`)}
 const days=[[G.sun,12,21],[G.pcloud,11,20],[G.cloud,10,18],[G.sun,9,19],[G.sun,10,20],[G.pcloud,11,19],[G.cloud,8,15],[G.sun,7,16],[G.sun,8,17],[G.pcloud,9,18]].map((d,i)=>[i?wdShort(2026,10,17+i):t('today'),...d]);
 return{cls:'wx',dark:true,html:`<div class="scroll"><div class="top"><div class="lc">${t('myLoc')}</div><div class="ct">${t('seoul')}</div><div class="tp">18°</div><div class="ds">${t('mostlySunny')}</div><div style="font-size:18px;font-weight:500">${t('hiLo')}</div></div>
 <div class="wcard"><div class="wh" style="border:0;padding-bottom:6px;opacity:1;font-size:14px;font-weight:500">${t('wxSummary')}</div><div style="border-top:.5px solid rgba(255,255,255,.25);padding-top:12px" class="hrs">${hrs.join('')}</div></div>
 <div class="wcard"><div class="wh">${G.calSm.replace('<svg','<svg width="14" height="14"')}${t('tenDay')}</div>${days.map(d=>`<div class="d10"><span>${d[0]}</span>${d[1]}<span class="lo">${d[2]}°</span><span class="rng"><i style="left:${(d[2]-7)/15*100}%;right:${(22-d[3])/15*100}%"></i></span><span>${d[3]}°</span></div>`).join('')}</div>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 16px"><div class="wcard" style="margin:0"><div class="wh">${t('uv')}</div><b style="font-size:30px">3</b><div>${t('moderate')}</div></div><div class="wcard" style="margin:0"><div class="wh">${t('sunset')}</div><b style="font-size:26px">${fmtTime(17*60+56)}</b><div style="font-size:14px">${t('sunrise')}: ${fmtTime(6*60+39)}</div></div></div></div>
 <div class="tabbar" style="background:rgba(40,90,170,.5);box-shadow:none"><button style="color:#fff">🗺</button><button style="color:#fff;flex:2;flex-direction:row;justify-content:center;gap:6px"><i style="width:7px;height:7px;border-radius:50%;background:#fff;display:block"></i></button><button style="color:#fff">${G.list}</button></div>`}};

/* --- 설정 / 스크린 타임 --- */
const sIc=(c,i)=>`<span class="st-ic" style="background:${c}">${(G[i]||i).replace('<svg','<svg style="color:#fff" width="18" height="18"')}</span>`;
const sRow=(c,i,t,r='',fn)=>`<div class="row ${fn?'tap':''}" style="--inset:57px;cursor:${fn?'pointer':'default'}" ${fn?`onclick="${fn}"`:''}>${sIc(c,i)}<span style="flex:1">${t}</span>${r.startsWith('<button')?r:`<span class="muted" style="font-size:17px">${r}</span>${G.chevR}`}</div>`;
VIEWS.settings=()=>({cls:'grouped',html:navHTML({title:t('app_settings')})+`<div class="scroll"><h1 class="lt">${t('app_settings')}</h1><div class="srch">${G.search}${t('search')}</div>
 <div class="group" style="margin-bottom:22px"><div class="row" style="min-height:76px"><span style="width:58px;height:58px;border-radius:50%;background:linear-gradient(#a8aeb8,#7f858f);color:#fff;font-size:24px;font-weight:600;display:grid;place-items:center">원</span><div style="flex:1"><b style="font-size:20px;font-weight:500">박원빈</b><div class="muted" style="font-size:13px">${t('acct')}</div></div>${G.chevR}</div></div>
 <div class="group" style="margin-bottom:22px">${sRow('#ff9500','<svg viewBox="0 0 24 24"><path d="M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0v5l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5Z" fill="#fff"/></svg>',t('airplane'),sw(false))}${sRow('#007aff','<svg viewBox="0 0 16 12"><path fill="#fff" d="M8 2.3c2.3 0 4.4.9 6 2.4l1.2-1.2A10.3 10.3 0 0 0 8 .6 10.3 10.3 0 0 0 .8 3.5L2 4.7a8.6 8.6 0 0 1 6-2.4Zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.2-1.2A6.8 6.8 0 0 0 8 4a6.8 6.8 0 0 0-4.8 1.9l1.2 1.2c1-.9 2.2-1.4 3.6-1.4Zm0 3.4c-.6 0-1.2.2-1.6.6L8 11.3l1.6-1.6c-.4-.4-1-.6-1.6-.6Z"/></svg>','Wi-Fi','wb_home_5G')}${sRow('#007aff','<svg viewBox="0 0 24 24"><path d="m7 7 10 10-5 4V3l5 4L7 17" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>','Bluetooth',t('on'))}${sRow('#34c759','<svg viewBox="0 0 24 24"><path d="M12 4v16M7 9v11M17 7v13M2 13v7M22 11v9" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',t('cellular'))}${sRow('#34c759','<svg viewBox="0 0 24 24"><rect x="3" y="7" width="16" height="10" rx="2.5" fill="none" stroke="#fff" stroke-width="2"/><rect x="5.5" y="9.5" width="8" height="5" rx="1" fill="#fff"/></svg>',t('battery'),'64%')}</div>
 <div class="group" style="margin-bottom:22px">${sRow('#8e8e93','gear',t('general'))}${sRow('#007aff','person',t('access'))}${sRow('#8e8e93','camera',t('camera'))}${sRow('#32ade6','photo',t('wallpaper'))}${sRow('#8e8e93','search',t('search'))}</div>
 <div class="group" style="margin-bottom:22px">${sRow('#ff3b30','bellF',t('notif'))}${sRow('#ff2d55','speaker',t('sound'))}${sRow('#5856d6','<svg viewBox="0 0 24 24"><path d="M15.5 3.5A8.5 8.5 0 1 0 20.5 15 7 7 0 0 1 15.5 3.5Z" fill="#fff"/></svg>',t('focus'))}${sRow('#5856d6','<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9h-9Z" fill="#fff"/><path d="M14 3.2V10h6.8A9 9 0 0 0 14 3.2Z" fill="#fff" opacity=".7"/></svg>',t('screenTime'),'',"push('screentime')")}</div>
 <div class="group" style="margin-bottom:22px">${sRow('#34c759','<svg viewBox="0 0 24 24"><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M9 9.5v1M15 9.5v1M12 9.5v3.5h-1M9.5 16c1.5 1 3.5 1 5 0" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>',t('faceid'))}${sRow('#007aff','<svg viewBox="0 0 24 24"><path d="M7 11V8a5 5 0 0 1 10 0v3" fill="none" stroke="#fff" stroke-width="2"/><rect x="5" y="11" width="14" height="10" rx="2" fill="#fff"/></svg>',t('privacy'))}</div></div>`});
VIEWS.screentime=()=>{const apps=[['instagram',t('hm',2,41),100],['kakao',t('hm',1,52),70],['music',t('mOnly',58),36],['photos',t('mOnly',31),19],['safari',t('mOnly',22),14]].map(a=>[a[0],t('app_'+a[0]),a[1],a[2]]);
 return{cls:'grouped',html:navHTML({title:t('screenTime'),back:t('app_settings')})+`<div class="scroll"><h1 class="lt">${t('screenTime')}</h1>
 <div class="gh" style="margin-top:8px">${t('wonbinsIphone')}</div><div class="group" style="padding:14px 16px"><div class="muted" style="font-size:13px">${t('dailyAvg')}</div><div style="font-size:28px;font-weight:600">${t('hm',6,48)}</div><div class="muted" style="font-size:13px">${t('upPct',32)}</div>
 <div class="bars">${[55,62,48,70,83,77,92].map(v=>`<i style="height:${v}%"></i>`).join('')}</div><div style="display:flex;justify-content:space-between;padding:4px 16px 0;font-size:11px;color:#8e8e93">${wdNarrow().map(d=>`<span>${d}</span>`).join('')}</div></div>
 <div class="gh">${t('mostUsed')}</div><div class="group">${apps.map(a=>`<div class="row" style="--inset:58px;min-height:54px"><span style="width:30px;height:30px;border-radius:7px;overflow:hidden;flex:none">${appIcon(a[0])}</span><div style="flex:1"><div style="font-size:16px">${a[1]}</div><div style="height:5px;border-radius:3px;background:#007aff;width:${a[3]}%;margin-top:5px;opacity:.85"></div></div><span class="muted" style="font-size:15px">${a[2]}</span></div>`).join('')}</div>
 <div class="gh">${t('pickups')}</div><div class="group"><div class="row"><span style="flex:1">${t('firstPickup')}</span><span class="muted">${fmtTime(7*60+2)}</span></div><div class="row"><span style="flex:1">${t('avgPickups')}</span><span class="muted">${t('pickN',143)}</span></div><div class="row"><span style="flex:1">${t('firstUsed')}</span><span class="muted">Instagram</span></div></div>
 <div class="gh">${t('notifSec')}</div><div class="group"><div class="row"><span style="flex:1">${t('app_kakao')}</span><span class="muted">${t('perDay',41)}</span></div></div><div style="height:30px"></div></div>`}};

/* ============================================================
   전화 (엔딩)
   ============================================================ */
function startRing(){ringOnce();clearInterval(ringIv);ringIv=setInterval(()=>{ringOnce();vib([400,250,400])},2600);vib([400,250,400])}
function stopRing(){clearInterval(ringIv);ringIv=null;clearTimeout(ringTo);try{navigator.vibrate&&navigator.vibrate(0)}catch(e){}}
function incomingCall(){callName='이소희';callDir='in';callPrev=view;callState='ring';if(nowSong>=0||PLAYER.dataset.voice)PLAYER.pause();APP.querySelectorAll('video').forEach(v=>v.pause());OV.querySelectorAll('.banner').forEach(b=>b.remove());renderCall();startRing();ringTo=setTimeout(missCall,30000)}
function callTop(){const sh=callName==='이소희';return `<div class="cav">${sh?'<img src="media/sohee_kakao_profile.jpg" alt="">':/^[0-9*-]+$/.test(callName)?`<span style="width:100%;height:100%;display:grid;place-items:center;background:linear-gradient(#a5abb6,#7f858f)">${G.sil.replace('<svg','<svg width="64"')}</span>`:`<span style="width:100%;height:100%;display:grid;place-items:center;background:linear-gradient(#a5abb6,#7f858f);font-size:42px;font-weight:500">${esc(/^[가-힣]{3}$/.test(callName)?callName[1]:[...dn(callName)][0].toUpperCase())}</span>`}</div><div class="cnm">${esc(dn(callName))}</div>`}
function renderCall(){let c=OV.querySelector('.call');if(!c){c=document.createElement('div');c.className='call';OV.appendChild(c);c.animate([{opacity:0,transform:'scale(1.05)'},{opacity:1,transform:'none'}],{duration:380,easing:'cubic-bezier(.2,.9,.25,1)'})}
 setStatus(true);const locked=['lock','pin'].includes(callPrev);c.classList.toggle('act',callState!=='ring');
 if(callState==='ring'){c.innerHTML=callTop()+`<div class="csub">${t('mobile')}</div>`+(locked?`<div class="ring-top"><div class="cb"><span class="cc" style="width:50px;height:50px">${G.bellF}</span>${t('remind')}</div><div class="cb"><span class="cc" style="width:50px;height:50px">${G.msgF}</span>${t('message2')}</div></div><div class="slider" id="slider"><div class="kn">${G.handset}</div><span>${t('slideAnswer')}</span></div>`:
  `<div class="ring-top"><div class="cb"><span class="cc" style="width:50px;height:50px">${G.bellF}</span>${t('remind')}</div><div class="cb"><span class="cc" style="width:50px;height:50px">${G.msgF}</span>${t('message2')}</div></div><div class="ring"><button class="cb red" onclick="declineCall()"><span class="cc"><span style="display:block;transform:rotate(135deg)">${G.handset}</span></span>${t('decline')}</button><button class="cb grn" onclick="answerCall()"><span class="cc">${G.handset}</span>${t('accept')}</button></div>`);
  if(locked)wireSlider()}
 else{const B=[['speaker',t('speaker')],['videoF','FaceTime'],['muteF',t('mute')],['plusF',t('addCall')],['end',t('endCall')],['keypadF',t('keypad')]];
  const dl=callState==='dialing';c.innerHTML=callTop()+`<div class="csub" id="ctime">${dl?t('calling'):'00:00'}</div>${dl?'':`<div class="cap" id="cap"><small>${t('liveCap')}</small>…</div>`}<div class="cgrid">${B.map(([i,l])=>i==='end'?`<button class="cb red" onclick="endCall()"><span class="cc"><span style="display:block;transform:rotate(135deg)">${G.handset}</span></span>${l}</button>`:`<button class="cb" onclick="${i==='videoF'||i==='plusF'?'':"this.classList.toggle('on');vib(8)"}"><span class="cc">${G[i]}</span>${l}</button>`).join('')}</div>`;
  if(!dl)c.querySelector('.cav').animate([{transform:'scale(1)'},{transform:'scale(.82)'}],{duration:400,fill:'forwards',easing:'cubic-bezier(.2,.9,.25,1)'})}}
function wireSlider(){const s=$('#slider'),k=s.querySelector('.kn'),lab=s.querySelector('span');let x0=null,dx=0;const max=s.clientWidth-k.clientWidth-12;
 k.addEventListener('pointerdown',e=>{x0=e.clientX;k.setPointerCapture(e.pointerId)});k.addEventListener('pointermove',e=>{if(x0===null)return;dx=Math.max(0,Math.min(max,(e.clientX-x0)/SC));k.style.transform=`translateX(${dx}px)`;lab.style.opacity=1-dx/max});
 k.addEventListener('pointerup',()=>{if(x0===null)return;x0=null;if(dx>max*.75){answerCall()}else{k.animate([{transform:`translateX(${dx}px)`},{transform:'none'}],{duration:300,easing:'cubic-bezier(.2,1.3,.4,1)'});k.style.transform='';lab.style.opacity=1}})}
function answerCall(){if(callDir==='in'){curScript=speech;isEnding=true}stopRing();stopRingback();vib(20);callState='active';callStart=Date.now();capIdx=-1;renderCall()}
function declineCall(){stopRing();callState='';declined++;extraCalls.unshift(['이소희','오늘 '+new Date().getHours()+':'+pad(new Date().getMinutes()),'부재중']);afterDecline();closeCallUI()}
function missCall(){if(callState!=='ring')return;stopRing();callState='';declined++;extraCalls.unshift(['이소희','오늘 '+new Date().getHours()+':'+pad(new Date().getMinutes()),'부재중']);afterDecline();closeCallUI();if(['lock','pin'].includes(view)){lockNotes.unshift({title:t('missedCall'),body:'이소희',app:'phone',time:t('now')});renderLock()}}
function endCall(){if(callState==='dialing'){clearCallTimers();stopRingback();callState='';extraCalls.unshift([callName,'오늘 '+new Date().getHours()+':'+pad(new Date().getMinutes()),'발신']);closeCallUI();if(view==='phone')show('phone');return}
 if(callState!=='active')return;callState='ended';vib(15);const t=$('#ctime');if(t)t.textContent=t_('callEnded');const c=OV.querySelector('.call');c&&c.querySelectorAll('.cb').forEach(b=>b.style.opacity=.4);
 extraCalls.unshift([callName,'오늘 '+new Date().getHours()+':'+pad(new Date().getMinutes()),callDir==='out'?'발신':'수신']);if(isEnding)phoneDone=true;isEnding=false;setTimeout(()=>{callState='';closeCallUI();if(view==='phone')show('phone')},1100)}
/* 소희 전화를 거절/놓쳤을 때: 카톡으로 다시 걸어달라고 하고, 90초 뒤 다시 걸어옴 */
function afterDecline(){nextCallAt=elapsed()+90;if(declineSent)return;declineSent=true;CALL_DECLINED.forEach((m,k)=>setTimeout(()=>incomingMsg(m),3000+k*2600))}
/* 플레이어가 거는 전화 */
let callDir='in',curScript=null,isEnding=false;
function clearCallTimers(){callTimers.forEach(clearTimeout);callTimers=[]}
function startRingback(){const r=()=>{tone(440,0,1,.05);tone(480,0,1,.05)};r();clearInterval(rbIv);rbIv=setInterval(r,3000)}
function stopRingback(){clearInterval(rbIv);rbIv=null}
function dial(name){if(callState)return;callName=name;callDir='out';callPrev=view;callState='dialing';if(nowSong>=0||PLAYER.dataset.voice)PLAYER.pause();renderCall();startRingback();vib(10);
 const ready=askedCall||elapsed()>=CALL_ASK_AT;const pick=(sc,ms,end)=>{callTimers.push(setTimeout(()=>{if(callState!=='dialing')return;curScript=sc;isEnding=!!end;answerCall()},ms))};
 if(name==='이소희'&&!phoneDone&&ready)pick(speech,4200,true);
 else if(name==='이소희'&&phoneDone)pick(SOHEE_AFTER,6000);
 else if(name==='이소희'){callTimers.push(setTimeout(()=>{if(callState!=='dialing')return;rejectOut(t('callEnded'));if(!busySent){busySent=true;CALL_BUSY.forEach((m,k)=>setTimeout(()=>incomingMsg(m),2500+k*2600))}},3500))}
 else if(OTHER_CALLS[name])pick(OTHER_CALLS[name],/^0/.test(name)?1800:3000+Math.random()*3000);
 else{callTimers.push(setTimeout(()=>{if(callState==='dialing')rejectOut(t('noAnswer'))},9000))}}
function rejectOut(msg){stopRingback();clearCallTimers();const t=$('#ctime');if(t)t.textContent=msg;tone(480,0,.25,.05);tone(480,.35,.25,.05);tone(480,.7,.25,.05);extraCalls.unshift([callName,'오늘 '+new Date().getHours()+':'+pad(new Date().getMinutes()),'발신']);callState='ended';
 const c=OV.querySelector('.call');c&&c.querySelectorAll('.cb').forEach(b=>b.style.opacity=.4);setTimeout(()=>{callState='';closeCallUI();if(view==='phone')show('phone')},1300)}
function closeCallUI(){const c=OV.querySelector('.call');if(!c)return;c.animate([{opacity:1},{opacity:0,transform:'scale(1.04)'}],{duration:320,fill:'forwards'}).onfinish=()=>{c.remove();setStatus(viewDark());updateIsland();if(view==='home')renderHome()}}

/* ============================================================
   루프 / 시작
   ============================================================ */
let lastMin=-1;
function tick(){typeof updateCrumb==="function"&&updateCrumb();const now=new Date();$('#sbt').textContent=clock12();const lk=$('#lkt');if(lk)lk.textContent=clock12();
 if(now.getMinutes()!==lastMin){lastMin=now.getMinutes();if(view==='home'&&!HOME.getAnimations().length)renderHome()}
 const e=elapsed();
 if(e>=40&&incoming===0){incoming=1;incomingMsg(INCOMING[0])}
 if(e>=43.5&&incoming===1){incoming=2;incomingMsg(INCOMING[1])}
 if(e>=CALL_ASK_AT&&incoming>=2&&!askedCall&&!replyBusy&&!typing){askedCall=true;replyStage=liveReplies.length;lineIdx=0;pendingText='';setTimeout(()=>{liveReplies.push({mine:CALL_ASK_REPLY,them:[]});replyStage=liveReplies.length-1;lineIdx=0},CALL_ASK.length*2600+1700);nextCallAt=Math.max(nextCallAt,e+CALL_ASK.length*2.6+30);CALL_ASK.forEach((m,k)=>setTimeout(()=>incomingMsg(m),k*2600))}
 if(askedCall&&e>=Math.max(nextCallAt,CALL_AT)&&!phoneDone&&!callState)incomingCall();
 if(callState==='active'){const sec=Math.floor((Date.now()-callStart)/1000);const tm=$('#ctime');if(tm)tm.textContent=pad(Math.floor(sec/60))+':'+pad(sec%60);
  const S=curScript||speech;const idx=Math.min(S.length-1,Math.floor(sec/3));if(idx!==capIdx){capIdx=idx;const c=$('#cap');if(c){c.animate([{opacity:.2,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:280});c.innerHTML=`<small>${esc(dn(S[idx][0]))}</small>${esc(S[idx][1])}`}}
  if(sec>S.length*3+2)endCall()}}
function fit(){const ph=$('#phone');const mob=innerWidth<=540;ph.classList.toggle('mob',mob);ph.classList.toggle('short',mob&&innerHeight<740);if(mob){ph.style.width=innerWidth+'px';ph.style.height=innerHeight+'px';ph.style.transform='';SC=1}else{ph.style.width='393px';ph.style.height='852px';SC=Math.min((innerHeight-40)/852,(innerWidth-40)/393,1.1);ph.style.transform=`scale(${SC})`}}
addEventListener('resize',fit);fit();renderLock();renderHome();setStatus(true);setInterval(tick,250);tick();
