'use strict';

// ── STATE ──────────────────────────────────────────────────────────────────
let CU = null;
let CLS = [];
let NOTIFS = [];

// ── VAPID PUBLIC KEY ───────────────────────────────────────────────────────
const VAPID_PUBLIC_KEY = 'BKNbHEw95d4wgaP4m0njpXbPcGRrFC7Wy5aEV4s_XrwGA0gQOr0rJUcoHNLA_NwD0y-i9vUNspPWoPv6etOcj6c';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function subscribeToPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const reg = await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    await POST('/push/subscribe', { subscription: sub, user_id: CU.id });
    console.log('Push subscription saved');
  } catch(e) { console.error('Push subscribe error:', e); }
}

async function unsubscribeFromPush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    await fetch(API + '/push/unsubscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: CU.id })
    });
  } catch(e) { console.error('Unsubscribe error:', e); }
}

const API = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : '/api';

// ── API CALLS ──────────────────────────────────────────────────────────────
async function api(method, path, body) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API + path, opts);
    return await res.json();
  } catch(e) {
    console.error('API error:', e);
    return null;
  }
}
const GET  = path       => api('GET',    path);
const POST = (path, b)  => api('POST',   path, b);
const PUT  = (path, b)  => api('PUT',    path, b);
const DEL  = path       => api('DELETE', path);

// ── ICONS ──────────────────────────────────────────────────────────────────
const IC = {
  grid: `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="7" y="1" width="5" height="5" rx="1"/><rect x="1" y="7" width="5" height="5" rx="1"/><rect x="7" y="7" width="5" height="5" rx="1"/></svg>`,
  users:`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="5" cy="4" r="2.5"/><path d="M1 12c0-2.2 1.8-4 4-4s4 1.8 4 4"/><circle cx="10.5" cy="4" r="1.8"/><path d="M13 12c0-1.6-1.1-2.9-2.5-2.9"/></svg>`,
  chk:  `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h9M2 7h6M2 10h4"/></svg>`,
  card: `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="11" height="7" rx="1.2"/><path d="M1 6h11"/></svg>`,
  bell: `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6.5 1a3.5 3.5 0 013.5 3.5V8l1.5 2H2L3.5 8V4.5A3.5 3.5 0 016.5 1z"/><path d="M5 10a1.5 1.5 0 003 0"/></svg>`,
  doc:  `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 1h7a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z"/><path d="M4.5 5h4M4.5 7.5h4M4.5 10h2"/></svg>`,
  chart:`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 11V7M5 11V4M8 11V2M11 11V5M12 11H1"/></svg>`,
  cog:  `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6.5" cy="6.5" r="2.2"/><path d="M6.5 1v1.2M6.5 10.8V12M1 6.5h1.2M10.8 6.5H12M2.8 2.8l.9.9M9.3 9.3l.9.9M2.8 10.2l.9-.9M9.3 3.7l.9-.9"/></svg>`,
  sms:  `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 1h11a1 1 0 011 1v7a1 1 0 01-1 1H4l-3 2V2a1 1 0 011-1z"/></svg>`,
  book: `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 1h9a1 1 0 011 1v9a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/><path d="M4 4h5M4 6.5h5M4 9h3"/></svg>`,
  diary:`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 1h9a1 1 0 011 1v9a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/><path d="M4 4h5M4 6.5h5M4 9h3"/><path d="M1 4h2M1 6.5h2M1 9h2"/></svg>`,
  book: `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 1h9a1 1 0 011 1v9a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/><path d="M4 4h5M4 6.5h5M4 9h3"/><path d="M1 4h12"/></svg>`,
};

const NAVS = {
  admin:[
    {lbl:'Main',     items:[{id:'dash',ic:'grid',t:'Dashboard'}]},
    {lbl:'Manage',   items:[{id:'students',ic:'users',t:'Students'},{id:'att',ic:'chk',t:'Attendance'},{id:'fees',ic:'card',t:'Fees'},{id:'ann',ic:'bell',t:'Announcements'},{id:'papers',ic:'doc',t:'Paper Info'},{id:'results',ic:'chart',t:'Results'}]},
    {lbl:'Academics',items:[{id:'diary',ic:'diary',t:'Class Diary'}]},
    {lbl:'Settings', items:[{id:'classes',ic:'cog',t:'Classes'},{id:'usermgmt',ic:'users',t:'Users'},{id:'sms',ic:'sms',t:'SMS Logs'}]},
  ],
  teacher:[
    {lbl:'Portal',items:[{id:'t-dash',ic:'grid',t:'Dashboard'},{id:'att',ic:'chk',t:'Attendance'},{id:'diary',ic:'diary',t:'Diary'},{id:'results',ic:'chart',t:'Results'},{id:'papers',ic:'doc',t:'Papers'},{id:'ann',ic:'bell',t:'Notices'}]},
  ],
  student:[
    {lbl:'My Portal',items:[{id:'s-dash',ic:'grid',t:'Dashboard'},{id:'s-att',ic:'chk',t:'My Attendance'},{id:'s-fees',ic:'card',t:'My Fees'},{id:'diary',ic:'diary',t:'Diary'},{id:'s-papers',ic:'doc',t:'Exam Schedule'},{id:'s-results',ic:'chart',t:'My Results'},{id:'ann',ic:'bell',t:'Notices'},{id:'p-notif',ic:'bell',t:'Notifications'}]},
  ],
  parent:[
    {lbl:"Child's Info",items:[{id:'p-dash',ic:'grid',t:'Overview'},{id:'s-att',ic:'chk',t:'Attendance'},{id:'s-fees',ic:'card',t:'Fees'},{id:'diary',ic:'diary',t:'Diary'},{id:'s-results',ic:'chart',t:'Results'},{id:'ann',ic:'bell',t:'Notices'},{id:'p-notif',ic:'bell',t:'Notifications'}]},
  ],
};

const TITLES={
  dash:'Dashboard',students:'Students',att:'Attendance',fees:'Fees',ann:'Announcements',papers:'Paper Info',results:'Results',classes:'Classes',usermgmt:'Users',sms:'SMS Logs',
  diary:'Class Diary',
  't-dash':'Dashboard','s-dash':'My Dashboard','p-dash':'Child Overview','p-notif':'Notifications',
  's-att':'My Attendance','s-fees':'My Fees','s-papers':'Exam Schedule','s-results':'My Results',
};

// ── UTILS ──────────────────────────────────────────────────────────────────
const v    = id => { const e=document.getElementById(id); return e?e.value:''; };
const chip = (t,c) => `<span class="chip chip-${c}">${t}</span>`;
const fmt  = n => Number(n||0).toLocaleString('en-PK');
const td   = () => new Date().toISOString().split('T')[0];
const mon  = () => new Date().toISOString().slice(0,7);
const toCSV= rows=>rows.map(r=>r.map(c=>`"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
const grade= p=>p>=90?'A+':p>=80?'A':p>=65?'B+':p>=50?'B':p>=33?'C':'F';
const gcol = p=>p>=80?'var(--green)':p>=50?'var(--blue)':'var(--red)';
const p2c  = p=>p>=75?'var(--green)':p>=50?'var(--amber)':'var(--red)';
const feeStatus=(due,paid)=>paid>=due?'Paid':paid>0?'Partial':'Unpaid';
const feeChip=(due,paid)=>{const s=feeStatus(due,paid);return chip(s,{Paid:'green',Partial:'amber',Unpaid:'red'}[s]);};
const pbar =(p,col)=>`<div style="font-size:11px;">${p}%</div><div class="pbar"><div class="pfill" style="width:${Math.min(p,100)}%;background:${col};"></div></div>`;
const clsOpts=(sel='',all=true)=>(all?'<option value="">All Classes</option>':'')+CLS.map(c=>`<option value="${c.name}" ${c.name===sel?'selected':''}>Class ${c.name}</option>`).join('');
const secOpts=(cls,sel='')=>{const f=CLS.find(c=>c.name===cls);const s=f?f.sections.split(',').map(s=>s.trim()):['A','B'];return s.map(x=>`<option value="${x}" ${x===sel?'selected':''}>${x}</option>`).join('');};
const secList=(cls)=>{const f=CLS.find(c=>c.name===cls);return f?f.sections.split(',').map(s=>s.trim()):['A','B'];};

function toast(msg,type=''){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className='toast'+(type?' '+type:'');t.classList.remove('hidden');
  setTimeout(()=>t.classList.add('hidden'),2800);
}
function openModal(title,html,foot=''){
  document.getElementById('modal-title').textContent=title;
  document.getElementById('modal-body').innerHTML=html;
  document.getElementById('modal-foot').innerHTML=foot;
  document.getElementById('modal-bg').classList.remove('hidden');
}
function closeModal(){document.getElementById('modal-bg').classList.add('hidden');}
function printModal(){
  const c=document.getElementById('print-area');if(!c)return;
  const w=window.open('','_blank','width=700,height=800');
  w.document.write(`<html><head><title>Print</title><style>body{font-family:sans-serif;padding:20px;font-size:12px;}table{width:100%;border-collapse:collapse;}th,td{padding:6px 10px;border:1px solid #ddd;text-align:left;}th{background:#f5f5f5;}h2{margin-bottom:8px;}</style></head><body>${c.innerHTML}<button onclick="window.print()" style="margin-top:14px;padding:8px 18px;background:#1a56db;color:#fff;border:none;border-radius:6px;cursor:pointer;">Print</button></body></html>`);
  w.document.close();
}
function exportCSV(data, filename){
  const blob=new Blob([data],{type:'text/csv'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();
}
function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}
function toggleNotif(){
  document.getElementById('notif-panel').classList.toggle('hidden');
}

// ── AUTH ───────────────────────────────────────────────────────────────────
async function doLogin(){
  const u=document.getElementById('l-user').value.trim();
  const p=document.getElementById('l-pass').value.trim();
  document.getElementById('l-load').classList.remove('hidden');
  document.getElementById('l-err').classList.add('hidden');
  const res=await POST('/login',{username:u,password:p});
  document.getElementById('l-load').classList.add('hidden');
  if(res?.ok){
    CU=res.user;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    await boot();
  } else {
    document.getElementById('l-err').classList.remove('hidden');
  }
}
document.getElementById('l-pass').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});

function doLogout(){
  unsubscribeFromPush();
  CU=null;CLS=[];
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

async function boot(){
  CLS=await GET('/classes')||[];
  const colors={admin:'#2563eb',teacher:'#166534',student:'#92400e',parent:'#991b1b'};
  const av=CU.name.split(' ').map(w=>w[0]).slice(0,2).join('');
  document.getElementById('sb-av').textContent=av;
  document.getElementById('sb-av').style.background=colors[CU.role]||'#374151';
  document.getElementById('sb-name').textContent=CU.name;
  document.getElementById('sb-role').textContent=CU.role.charAt(0).toUpperCase()+CU.role.slice(1);
  document.getElementById('sb-sub').textContent={admin:'Admin Portal',teacher:'Teacher Portal',student:'Student Portal',parent:'Parent Portal'}[CU.role]||'Portal';
  document.getElementById('date-txt').textContent=new Date().toLocaleDateString('en-PK',{weekday:'short',year:'numeric',month:'short',day:'numeric'});
  buildNav();
  buildMobileNav();
  loadNotifs();
  goSec(NAVS[CU.role][0].items[0].id);
  // Ask for push notification permission after login
  setTimeout(() => subscribeToPush(), 2000);
}


// ── Mobile Bottom Nav ─────────────────────────────────────────────────────
function buildMobileNav() {
  const mobileItems = {
    admin:   [{id:'dash',ic:'grid',t:'Home'},{id:'students',ic:'users',t:'Students'},{id:'att',ic:'chk',t:'Attend.'},{id:'fees',ic:'card',t:'Fees'},{id:'diary',ic:'diary',t:'Diary'}],
    teacher: [{id:'t-dash',ic:'grid',t:'Home'},{id:'att',ic:'chk',t:'Attend.'},{id:'results',ic:'chart',t:'Results'},{id:'diary',ic:'diary',t:'Diary'},{id:'ann',ic:'bell',t:'Notices'}],
    student: [{id:'s-dash',ic:'grid',t:'Home'},{id:'s-att',ic:'chk',t:'Attend.'},{id:'s-fees',ic:'card',t:'Fees'},{id:'diary',ic:'diary',t:'Diary'},{id:'ann',ic:'bell',t:'Notices'}],
    parent:  [{id:'p-dash',ic:'grid',t:'Home'},{id:'s-att',ic:'chk',t:'Attend.'},{id:'s-fees',ic:'card',t:'Fees'},{id:'diary',ic:'diary',t:'Diary'},{id:'ann',ic:'bell',t:'Notices'}],
  };
  const nav = document.getElementById('mobile-nav');
  const items = document.getElementById('mobile-nav-items');
  if (!nav || !items) return;
  const list = mobileItems[CU.role] || [];
  items.innerHTML = list.map(item => `
    <div class="mobile-nav-item" id="mnav-${item.id}" onclick="goSec('${item.id}')">
      ${IC[item.ic]||''}
      <span>${item.t}</span>
    </div>`).join('');
  nav.classList.remove('hidden');
}

function buildNav(){
  const nav=document.getElementById('sb-nav');nav.innerHTML='';
  (NAVS[CU.role]||[]).forEach(g=>{
    const l=document.createElement('div');l.className='nav-lbl';l.textContent=g.lbl;nav.appendChild(l);
    g.items.forEach(item=>{
      const el=document.createElement('div');el.className='nav-item';el.id='nav-'+item.id;
      el.innerHTML=`${IC[item.ic]||''}<span>${item.t}</span>`;
      el.onclick=()=>{goSec(item.id);if(window.innerWidth<768)toggleSidebar();};
      nav.appendChild(el);
    });
  });
}

async function loadNotifs(){
  const ann=await GET('/announcements')||[];
  NOTIFS=ann.slice(0,5).map(a=>({title:a.title,body:a.category+' — '+a.created_at.slice(0,10),unread:true}));
  const cnt=NOTIFS.filter(n=>n.unread).length;
  const badge=document.getElementById('notif-count');
  badge.textContent=cnt;badge.classList.toggle('hidden',cnt===0);
  document.getElementById('notif-panel').innerHTML=`
    <div class="notif-head">Notifications <button class="btn bs" onclick="markRead()">Mark all read</button></div>
    ${NOTIFS.map(n=>`<div class="notif-item ${n.unread?'unread':''}"><div class="notif-title">${n.title}</div><div class="notif-body">${n.body}</div></div>`).join('')||'<div style="padding:12px;font-size:12px;color:#9ca3af;">No notifications</div>'}`;
}
function markRead(){NOTIFS.forEach(n=>n.unread=false);document.getElementById('notif-count').classList.add('hidden');loadNotifs();}

function goSec(id){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.querySelectorAll('.mobile-nav-item').forEach(n=>n.classList.remove('active'));
  const ni=document.getElementById('nav-'+id);if(ni)ni.classList.add('active');
  const mni=document.getElementById('mnav-'+id);if(mni)mni.classList.add('active');
  document.getElementById('page-title').textContent=TITLES[id]||id;
  render(id);
}

async function render(id){
  const c=document.getElementById('content');
  c.innerHTML='<p style="padding:30px;color:#9ca3af;text-align:center;">Loading...</p>';
  try{
    if(id==='dash'||id==='t-dash') c.innerHTML=await secDash();
    else if(id==='s-dash') c.innerHTML=await secStudentDash();
    else if(id==='p-dash') c.innerHTML=await secParentDash();
    else if(id==='students')  await secStudents(c);
    else if(id==='att')       await secAtt(c);
    else if(id==='fees')      await secFees(c);
    else if(id==='ann')       await secAnn(c);
    else if(id==='papers')    await secPapers(c);
    else if(id==='results')   await secResults(c);
    else if(id==='diary')     await secDiary(c);
    else if(id==='classes')   await secClasses(c);
    else if(id==='usermgmt')  await secUsers(c);
    else if(id==='sms')       await secSMS(c);
    else if(id==='s-att')     await secMyAtt(c);
    else if(id==='s-fees')    await secMyFees(c);
    else if(id==='s-papers')  await secMyPapers(c);
    else if(id==='s-results') await secMyResults(c);
    else if(id==='p-notif')   await secNotifications(c);
    else c.innerHTML='<div class="card"><p style="color:#9ca3af;">Coming soon.</p></div>';
  }catch(e){ c.innerHTML=`<div class="card"><p style="color:var(--red);">Error: ${e.message}</p></div>`; console.error(e); }
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────
async function secDash(){
  const [s, ann, paps] = await Promise.all([GET('/stats'), GET('/announcements'), GET('/papers')]);
  const annH=(ann||[]).slice(0,3).map(a=>`<div class="ai"><div class="ai-meta">${chip(a.category,'blue')} ${(a.created_at||'').slice(0,10)}</div><div class="ai-title">${a.title}</div></div>`).join('')||'<p style="color:#9ca3af;font-size:12px;">No announcements.</p>';
  const papH=(paps||[]).slice(0,4).map(p=>`<div class="ai"><div class="ai-meta">${chip('Class '+p.class,'blue')} ${p.exam_date||'TBD'}</div><div class="ai-title">${p.subject}</div><div style="font-size:11px;color:#9ca3af;">${p.hall||''} · ${p.start_time||''}</div></div>`).join('')||'<p style="color:#9ca3af;font-size:12px;">No exams scheduled.</p>';
  return`<div class="stat-grid">
    <div class="stat-card"><div class="stat-lbl">Total Students</div><div class="stat-val">${s?.total_students||0}</div><div class="stat-sub">Active enrolled</div></div>
    <div class="stat-card"><div class="stat-lbl">Present Today</div><div class="stat-val" style="color:var(--green);">${s?.att_today||0}</div><div class="stat-sub">${td()}</div></div>
    <div class="stat-card"><div class="stat-lbl">Fees Collected</div><div class="stat-val">Rs ${fmt(s?.fees_collected)}</div><div class="stat-sub">${mon()}</div></div>
    <div class="stat-card"><div class="stat-lbl">Pending Fees</div><div class="stat-val" style="color:var(--red);">Rs ${fmt(s?.fees_pending)}</div><div class="stat-sub">${s?.defaulters||0} defaulters</div></div>
  </div>
  <div class="two-col">
    <div class="card"><div class="card-title">Recent Announcements</div>${annH}</div>
    <div class="card"><div class="card-title">Upcoming Exams</div>${papH}</div>
  </div>`;
}

// ── STUDENT DASHBOARD ──────────────────────────────────────────────────────
async function secStudentDash(){
  const stu = getLinkedStudent();
  const ann = await GET('/announcements')||[];
  const cls = stu ? stu.class : '';
  const paps = await GET('/papers'+(cls?'?cls='+cls:''))||[];

  // get quick stats if linked
  let attHtml = '', feeHtml = '';
  if (stu) {
    const month = mon();
    const attRows = await GET(`/attendance/student?student_id=${stu.id}&month=${month}`) || [];
    const present = attRows.filter(r=>r.status==='Present').length;
    const total   = attRows.length;
    const pct     = total>0 ? Math.round(present/total*100) : 0;
    const fees    = await GET(`/fees/student?student_id=${stu.id}`) || [];
    const pending = fees.filter(f=>Number(f.amount_paid)<Number(f.amount_due));

    attHtml = `<div class="stat-grid" style="grid-template-columns:1fr 1fr;margin-bottom:14px;">
      <div class="stat-card"><div class="stat-lbl">Attendance ${month}</div>
        <div class="stat-val" style="color:${p2c(pct)};">${pct}%</div>
        <div class="stat-sub">${present}/${total} days</div>
      </div>
      <div class="stat-card"><div class="stat-lbl">Fee Status</div>
        <div class="stat-val" style="color:${pending.length>0?'var(--red)':'var(--green)'};">
          ${pending.length>0?'Pending':'Paid'}
        </div>
        <div class="stat-sub">${pending.length>0?pending.length+' month(s) due':'All clear'}</div>
      </div>
    </div>`;
  }

  return`<div style="padding:12px 14px;background:var(--blue-l);border-radius:var(--r);margin-bottom:14px;font-size:13px;color:var(--blue-t);">
    Welcome back, <strong>${CU.name}</strong>!
    ${stu ? `Class ${stu.class}-${stu.section} · Roll No: <strong>${stu.roll_no}</strong>` : ''}
  </div>
  ${stu ? attHtml : noLinkMsg('Account not linked')}
  <div class="two-col">
    <div class="card"><div class="card-title">School Notices</div>${ann.slice(0,3).map(a=>`<div class="ai"><div class="ai-meta">${chip(a.category,'blue')} ${(a.created_at||'').slice(0,10)}</div><div class="ai-title">${a.title}</div></div>`).join('')||'<p style="color:#9ca3af;font-size:12px;">No notices.</p>'}</div>
    <div class="card"><div class="card-title">Upcoming Exams</div>${paps.slice(0,4).map(p=>`<div class="ai"><div class="ai-meta">${chip('Class '+p.class,'blue')} ${p.exam_date||'TBD'}</div><div class="ai-title">${p.subject}</div></div>`).join('')||'<p style="color:#9ca3af;font-size:12px;">No exams.</p>'}</div>
  </div>`;
}

// ── PARENT DASHBOARD ───────────────────────────────────────────────────────
async function secParentDash(){
  const stu = getLinkedStudent();
  const ann = await GET('/announcements')||[];
  const cls = stu ? stu.class : '';
  const paps = await GET('/papers'+(cls?'?cls='+cls:''))||[];

  let statsHtml = '';
  if (stu) {
    const month = mon();
    const attRows = await GET(`/attendance/student?student_id=${stu.id}&month=${month}`) || [];
    const present = attRows.filter(r=>r.status==='Present').length;
    const absent  = attRows.filter(r=>r.status==='Absent').length;
    const total   = attRows.length;
    const pct     = total>0 ? Math.round(present/total*100) : 0;
    const fees    = await GET(`/fees/student?student_id=${stu.id}`) || [];
    const pending = fees.filter(f=>Number(f.amount_paid)<Number(f.amount_due));
    const results = await GET(`/results/student?student_id=${stu.id}`) || [];
    const totalM  = results.reduce((a,r)=>a+Number(r.papers?.total_marks||100),0);
    const totalO  = results.reduce((a,r)=>a+Number(r.marks_obtained||0),0);
    const overPct = totalM>0?Math.round(totalO/totalM*100):0;

    statsHtml = `
    <div style="padding:12px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--rl);margin-bottom:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <div style="width:44px;height:44px;border-radius:50%;background:var(--blue-l);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:var(--blue-t);flex-shrink:0;">
        ${stu.name.charAt(0)}
      </div>
      <div>
        <div style="font-size:14px;font-weight:600;">${stu.name}</div>
        <div style="font-size:12px;color:var(--text2);">Class ${stu.class}-${stu.section} · Roll No: ${stu.roll_no} · Father: ${stu.father_name||'-'}</div>
      </div>
      <div style="margin-left:auto;">${chip('Active','green')}</div>
    </div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-lbl">Attendance ${month}</div>
        <div class="stat-val" style="color:${p2c(pct)};">${pct}%</div>
        <div class="stat-sub">${present} present · ${absent} absent</div>
      </div>
      <div class="stat-card">
        <div class="stat-lbl">Fee Status</div>
        <div class="stat-val" style="color:${pending.length>0?'var(--red)':'var(--green)'};">
          ${pending.length>0?'Pending':'Paid'}
        </div>
        <div class="stat-sub">${pending.length>0?pending.length+' month(s) due':'All fees clear'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-lbl">Overall Result</div>
        <div class="stat-val" style="color:${gcol(overPct)};">${overPct>0?overPct+'%':'N/A'}</div>
        <div class="stat-sub">${overPct>0?grade(overPct)+' Grade':'Not published'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-lbl">Exams Scheduled</div>
        <div class="stat-val">${paps.length}</div>
        <div class="stat-sub">Class ${cls} papers</div>
      </div>
    </div>`;
  }

  return`<div style="padding:12px 14px;background:var(--green-l);border-radius:var(--r);margin-bottom:14px;font-size:13px;color:var(--green);">
    Welcome, <strong>${CU.name}</strong>! Track your child's progress here.
  </div>
  ${stu ? statsHtml : noLinkMsg('Child Account Not Linked')}
  <div class="two-col">
    <div class="card"><div class="card-title">School Notices</div>${ann.slice(0,3).map(a=>`<div class="ai"><div class="ai-meta">${chip(a.category,'blue')} ${(a.created_at||'').slice(0,10)}</div><div class="ai-title">${a.title}</div></div>`).join('')||'<p style="color:#9ca3af;font-size:12px;">No notices.</p>'}</div>
    <div class="card"><div class="card-title">Upcoming Exams ${cls?'— Class '+cls:''}</div>${paps.slice(0,4).map(p=>`<div class="ai"><div class="ai-meta">${chip('Class '+p.class,'blue')} ${p.exam_date||'TBD'}</div><div class="ai-title">${p.subject}</div></div>`).join('')||'<p style="color:#9ca3af;font-size:12px;">No exams.</p>'}</div>
  </div>`;
}

// ── STUDENTS ───────────────────────────────────────────────────────────────
async function secStudents(c){
  const render=async(search='',cls='',sec='')=>{
    const params=new URLSearchParams();
    if(search)params.set('search',search);if(cls)params.set('cls',cls);if(sec)params.set('section',sec);
    const list=await GET('/students?'+params)||[];
    c.innerHTML=`<div class="card">
      <div class="card-title">Students <span style="font-size:11px;font-weight:400;color:#9ca3af;">${list.length} found</span>
        <div style="display:flex;gap:6px;">
          <button class="btn bp" onclick="addStu()">+ Add</button>
          <button class="btn" onclick="expStu()">Export CSV</button>
        </div>
      </div>
      <div class="frow" style="margin-bottom:12px;">
        <input id="ss" type="text" placeholder="Search..." value="${search}" oninput="rStu()">
        <select id="sc" onchange="rStu()">${clsOpts(cls)}</select>
        <select id="sx" onchange="rStu()"><option value="">All Sections</option>${cls?secOpts(cls,sec):''}</select>
      </div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Roll No</th><th>Name</th><th>Class</th><th>Father</th><th>Contact</th><th>Parent Contact</th><th>Status</th><th></th></tr></thead>
        <tbody>${list.map(s=>`<tr>
          <td>${s.roll_no}</td><td><strong>${s.name}</strong></td><td>Class ${s.class}-${s.section}</td>
          <td>${s.father_name||'-'}</td><td>${s.contact||'-'}</td><td>${s.parent_contact||'-'}</td>
          <td>${chip(s.status||'Active','green')}</td>
          <td><button class="btn bs" onclick="editStu('${s.id}')">Edit</button>
              <button class="btn bs bd" onclick="delStu('${s.id}','${s.name}')">Del</button></td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
  };
  window.rStu=async()=>{
    const cls=v('sc');
    const sx=document.getElementById('sx');
    if(sx&&cls)sx.innerHTML='<option value="">All Sections</option>'+secOpts(cls,'');
    await render(v('ss'),cls,v('sx'));
  };
  window.expStu=async()=>{
    const list=await GET('/students')||[];
    exportCSV(toCSV([['Roll','Name','Father','Class','Section','Contact','Parent Contact','Status'],...list.map(s=>[s.roll_no,s.name,s.father_name,s.class,s.section,s.contact,s.parent_contact,s.status])]),'students.csv');
  };
  // student form — accepts users list for linking dropdowns
  const sf=(s={},stuUsers=[],parUsers=[])=>`<div class="fg">
    <div class="field"><label>Roll No *</label><input id="sf-r" value="${s.roll_no||''}"></div>
    <div class="field"><label>Name *</label><input id="sf-n" value="${s.name||''}"></div>
    <div class="field"><label>Father's Name</label><input id="sf-f" value="${s.father_name||''}"></div>
    <div class="field"><label>Contact</label><input id="sf-c" value="${s.contact||''}"></div>
    <div class="field"><label>Parent Contact (for SMS)</label><input id="sf-pc" value="${s.parent_contact||''}"></div>
    <div class="field"><label>Parent WhatsApp Key (CallMeBot)</label><input id="sf-cbk" value="${s.callmebot_key||''}" placeholder="e.g. 1234567"></div>
    <div class="field"><label>Date of Birth</label><input type="date" id="sf-d" value="${s.dob||''}"></div>
    <div class="field"><label>Class *</label><select id="sf-cl" onchange="updSec()">${clsOpts(s.class||'',false)}</select></div>
    <div class="field"><label>Section *</label><select id="sf-s">${s.class?secOpts(s.class,s.section||''):'<option>Select class first</option>'}</select></div>
    <div class="field"><label>Link Student Account
      <span style="font-size:10px;color:var(--text3);font-weight:400;"> — student login</span></label>
      <select id="sf-stu-uid">
        <option value="">-- None --</option>
        ${stuUsers.map(u=>`<option value="${u.id}" ${s.student_user_id===u.id?'selected':''}>${u.name} (${u.username})</option>`).join('')}
      </select>
    </div>
    <div class="field"><label>Link Parent Account
      <span style="font-size:10px;color:var(--text3);font-weight:400;"> — parent login</span></label>
      <select id="sf-par-uid">
        <option value="">-- None --</option>
        ${parUsers.map(u=>`<option value="${u.id}" ${s.parent_user_id===u.id?'selected':''}>${u.name} (${u.username})</option>`).join('')}
      </select>
    </div>
    <div class="field"><label>Status</label><select id="sf-st"><option value="Active" ${(s.status||'Active')==='Active'?'selected':''}>Active</option><option value="Inactive" ${s.status==='Inactive'?'selected':''}>Inactive</option></select></div>
  </div>`;

  window.addStu=async()=>{
    const users=await GET('/users')||[];
    const stuUsers=users.filter(u=>u.role==='student');
    const parUsers=users.filter(u=>u.role==='parent');
    openModal('Add Student',sf({},stuUsers,parUsers),
      `<button class="btn" onclick="closeModal()">Cancel</button>
       <button class="btn bp" onclick="saveStu()">Save</button>`);
  };

  window.editStu=async(id)=>{
    const s=await GET('/students/'+id);
    const users=await GET('/users')||[];
    const stuUsers=users.filter(u=>u.role==='student');
    const parUsers=users.filter(u=>u.role==='parent');
    openModal('Edit Student',sf(s||{},stuUsers,parUsers),
      `<button class="btn" onclick="closeModal()">Cancel</button>
       <button class="btn bp" onclick="saveStu('${id}')">Update</button>`);
  };

  window.updSec=()=>{const el=document.getElementById('sf-s');if(el)el.innerHTML=secOpts(v('sf-cl'),'');};

  window.saveStu=async(id)=>{
    const d={
      roll_no:v('sf-r'),name:v('sf-n'),father_name:v('sf-f'),
      class:v('sf-cl'),section:v('sf-s'),contact:v('sf-c'),
     parent_contact:v('sf-pc'),callmebot_key:v('sf-cbk')||null,dob:v('sf-d'),status:v('sf-st')||'Active',
      student_user_id:v('sf-stu-uid')||null,
      parent_user_id:v('sf-par-uid')||null
    };
    if(!d.roll_no||!d.name||!d.class||!d.section){toast('Fill required fields','err');return;}
    const res=id?await PUT('/students/'+id,d):await POST('/students',d);
    if(res?.ok!==false){closeModal();toast(id?'Updated!':'Added!','ok');rStu();}
    else toast('Error: '+(res?.error||'Failed'),'err');
  };

  window.delStu=async(id,name)=>{if(!confirm(`Delete ${name}?`))return;await DEL('/students/'+id);toast('Deleted');rStu();};
  await render();
}

// ── ATTENDANCE ─────────────────────────────────────────────────────────────
async function secAtt(c){
  const fc=CLS[0]?.name||'9',fs=secList(fc)[0]||'A';
  const rAtt=async(cls=fc,sec=fs,date=td())=>{
    const rows=await GET(`/attendance?cls=${cls}&section=${sec}&date=${date}`)||[];
    const pr=rows.filter(r=>r.status==='Present').length,ab=rows.filter(r=>r.status==='Absent').length,la=rows.filter(r=>r.status==='Late').length;
    c.innerHTML=`<div class="card">
      <div class="card-title">Attendance
        <div style="display:flex;gap:5px;flex-wrap:wrap;">${chip(pr+' Present','green')}${chip(ab+' Absent','red')}${chip(la+' Late','amber')}<button class="btn bs" onclick="expAtt('${cls}','${sec}','${date}')">Export</button></div>
      </div>
      <div class="frow" style="margin-bottom:12px;">
        <select id="ac" onchange="rAtt2()">${CLS.map(cl=>`<option value="${cl.name}" ${cl.name===cls?'selected':''}>Class ${cl.name}</option>`).join('')}</select>
        <select id="as" onchange="rAtt2()">${secList(cls).map(s=>`<option value="${s}" ${s===sec?'selected':''}>${s}</option>`).join('')}</select>
        <input id="ad" type="date" value="${date}" onchange="rAtt2()">
        <button class="btn bp" onclick="saveAtt()">Save & Send SMS</button>
      </div>
      ${rows.length===0?`<p style="color:#9ca3af;font-size:12px;">No students in Class ${cls}-${sec}.</p>`:`
      <div class="tbl-wrap"><table>
        <thead><tr><th>#</th><th>Roll</th><th>Name</th><th style="text-align:center">Present</th><th style="text-align:center">Absent</th><th style="text-align:center">Late</th><th>Note</th></tr></thead>
        <tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r.roll_no}</td><td>${r.name}</td>
          <td style="text-align:center"><input type="radio" name="ar${r.id}" value="Present" ${(r.status||'Present')==='Present'?'checked':''}></td>
          <td style="text-align:center"><input type="radio" name="ar${r.id}" value="Absent"  ${r.status==='Absent'?'checked':''}></td>
          <td style="text-align:center"><input type="radio" name="ar${r.id}" value="Late"    ${r.status==='Late'?'checked':''}></td>
          <td><input type="text" class="anote" data-id="${r.id}" value="${r.note||''}" placeholder="Note..." style="width:100%;padding:3px 7px;border:1px solid #e5e7eb;border-radius:4px;font-size:11px;"></td>
        </tr>`).join('')}</tbody>
      </table></div>`}
    </div>
    <div class="card"><div class="card-title">Monthly Summary — ${date.slice(0,7)} <button class="btn bs" onclick="expAttSum('${cls}','${sec}','${date.slice(0,7)}')">Export</button></div>
      ${await attSum(cls,sec,date.slice(0,7))}
    </div>`;
  };
  window.rAtt2=async()=>{
    const cls=v('ac');const asel=document.getElementById('as');const sl=secList(cls);
    if(asel)asel.innerHTML=sl.map(s=>`<option value="${s}">${s}</option>`).join('');
    await rAtt(cls,sl[0],v('ad'));
  };
  window.saveAtt=async()=>{
    const cls=v('ac'),sec=v('as'),date=v('ad');
    const rows=await GET(`/attendance?cls=${cls}&section=${sec}&date=${date}`)||[];
    const records=rows.map(r=>{
      const sel=document.querySelector(`input[name="ar${r.id}"]:checked`);
      const note=document.querySelector(`.anote[data-id="${r.id}"]`);
      return{student_id:r.id,status:sel?sel.value:'Present',note:note?note.value:''};
    });
    await POST('/attendance',{records,date});
    const absentCount=records.filter(r=>r.status==='Absent').length;
    toast(`Saved! SMS sent to ${absentCount} absent student parents.`,'ok');
  };
  window.expAtt=async(cls,sec,date)=>{
    const rows=await GET(`/attendance?cls=${cls}&section=${sec}&date=${date}`)||[];
    exportCSV(toCSV([['Roll','Name','Status','Note'],...rows.map(r=>[r.roll_no,r.name,r.status||'',r.note||''])]),'att_'+date+'.csv');
  };
  window.expAttSum=async(cls,sec,month)=>{
    const rows=await GET(`/attendance/summary?cls=${cls}&section=${sec}&month=${month}`)||[];
    exportCSV(toCSV([['Roll','Name','Present','Absent','Late','%'],...rows.map(r=>[r.roll_no,r.name,r.present,r.absent,r.late,r.total_days>0?Math.round(r.present/r.total_days*100)+'%':'0%'])]),'att_sum_'+month+'.csv');
  };
  await rAtt();
}
async function attSum(cls,sec,month){
  const rows=await GET(`/attendance/summary?cls=${cls}&section=${sec}&month=${month}`)||[];
  if(!rows.length)return'<p style="color:#9ca3af;font-size:12px;">No data yet.</p>';
  return`<div class="tbl-wrap"><table><thead><tr><th>Roll</th><th>Name</th><th>Present</th><th>Absent</th><th>Late</th><th>%</th></tr></thead>
  <tbody>${rows.map(r=>{const p=r.total_days>0?Math.round(r.present/r.total_days*100):0;return`<tr><td>${r.roll_no}</td><td>${r.name}</td><td>${r.present}</td><td>${r.absent}</td><td>${r.late}</td><td style="min-width:90px;">${pbar(p,p2c(p))}</td></tr>`;}).join('')}</tbody></table></div>`;
}

// ── FEES ───────────────────────────────────────────────────────────────────
async function secFees(c){
  const rFees=async(cls='',month=mon())=>{
    const list=await GET(`/fees?cls=${cls}&month=${month}`)||[];
    const due=list.reduce((a,f)=>a+Number(f.amount_due),0),paid=list.reduce((a,f)=>a+Number(f.amount_paid),0);
    c.innerHTML=`<div class="stat-grid">
      <div class="stat-card"><div class="stat-lbl">Total Due</div><div class="stat-val">Rs ${fmt(due)}</div></div>
      <div class="stat-card"><div class="stat-lbl">Collected</div><div class="stat-val" style="color:var(--green);">Rs ${fmt(paid)}</div></div>
      <div class="stat-card"><div class="stat-lbl">Pending</div><div class="stat-val" style="color:var(--red);">Rs ${fmt(due-paid)}</div></div>
      <div class="stat-card"><div class="stat-lbl">Defaulters</div><div class="stat-val" style="color:var(--amber);">${list.filter(f=>Number(f.amount_paid)===0).length}</div></div>
    </div>
    <div class="card">
      <div class="card-title">Fee Records
        <div style="display:flex;gap:6px;">
          <button class="btn bp" onclick="genFees()">Generate Month</button>
          <button class="btn" onclick="expFees('${month}')">Export</button>
        </div>
      </div>
      <div class="frow" style="margin-bottom:12px;">
        <select id="fc" onchange="rFees2()">${clsOpts(cls)}</select>
        <input id="fm" type="month" value="${month}" onchange="rFees2()">
      </div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Roll</th><th>Student</th><th>Class</th><th>Due</th><th>Paid</th><th>Balance</th><th>Status</th><th></th></tr></thead>
        <tbody>${list.map(f=>`<tr>
          <td>${f.roll_no}</td><td>${f.name}</td><td>Class ${f.class}</td>
          <td>Rs ${fmt(f.amount_due)}</td><td>Rs ${fmt(f.amount_paid)}</td><td>Rs ${fmt(Number(f.amount_due)-Number(f.amount_paid))}</td>
          <td>${feeChip(Number(f.amount_due),Number(f.amount_paid))}</td>
          <td><button class="btn bs bp" onclick="collectFee('${f.student_id}','${f.name}',${f.amount_due},${f.amount_paid},'${month}')">
            ${Number(f.amount_paid)>=Number(f.amount_due)?'Receipt':'Collect'}
          </button></td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
  };
  window.rFees2=()=>rFees(v('fc'),v('fm'));
  window.genFees=()=>openModal('Generate Monthly Fees',
    `<div class="field"><label>Month</label><input type="month" id="gm" value="${mon()}"></div>
     <div class="field"><label>Amount (Rs)</label><input type="number" id="ga" value="1500"></div>
     <div class="field"><label>For Class</label><select id="gc">${clsOpts()}</select></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn bp" onclick="doGen()">Generate</button>`);
  window.doGen=async()=>{
    const res=await POST('/fees/generate',{month:v('gm'),amount_due:Number(v('ga')),cls:v('gc')});
    if(res?.ok!==false){closeModal();toast(`Generated for ${res?.count||0} students`,'ok');rFees2();}
  };
  window.collectFee=(sid,name,due,paid,month)=>{
    const bal=Number(due)-Number(paid);
    openModal(bal<=0?'Fee Receipt':'Collect Fee',
      bal<=0?receiptHtml(name,due,paid,month):
      `<div class="field"><label>Student</label><input value="${name}" disabled></div>
       <div class="field"><label>Balance Due</label><input value="Rs ${fmt(bal)}" disabled></div>
       <div class="field"><label>Amount (Rs)</label><input type="number" id="ca" value="${bal}"></div>
       <div class="field"><label>Method</label><select id="cm"><option>Cash</option><option>Bank Transfer</option><option>JazzCash</option><option>Easypaisa</option></select></div>`,
      bal<=0?`<button class="btn" onclick="closeModal()">Close</button><button class="btn bp" onclick="printModal()">Print</button>`:
      `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn bp" onclick="doColl('${sid}',${due},${paid},'${month}')">Save</button>`);
  };
  window.doColl=async(sid,due,prev,month)=>{
    const newPaid=Math.min(Number(prev)+Number(v('ca')),Number(due));
    await POST('/fees/upsert',{student_id:sid,month,amount_due:due,amount_paid:newPaid,paid_date:td(),payment_method:v('cm')||'Cash'});
    closeModal();toast('Payment saved!','ok');rFees2();
  };
  window.expFees=async(month)=>{
    const list=await GET(`/fees?month=${month}`)||[];
    exportCSV(toCSV([['Roll','Name','Class','Due','Paid','Balance','Status'],...list.map(f=>[f.roll_no,f.name,f.class,f.amount_due,f.amount_paid,Number(f.amount_due)-Number(f.amount_paid),feeStatus(Number(f.amount_due),Number(f.amount_paid))])]),'fees_'+month+'.csv');
  };
  await rFees();
}
const receiptHtml=(name,due,paid,month)=>`<div class="receipt" id="print-area">
  <div class="receipt-head"><h2>EduMatrix School</h2><p>Fee Receipt — ${month}</p></div>
  <div class="rr"><span class="rl">Student</span><span>${name}</span></div>
  <div class="rr"><span class="rl">Month</span><span>${month}</span></div>
  <div class="rr"><span class="rl">Fee Due</span><span>Rs ${fmt(due)}</span></div>
  <div class="rr"><span class="rl">Amount Paid</span><span>Rs ${fmt(paid)}</span></div>
  <div class="rr"><span class="rl">Balance</span><span>Rs ${fmt(Number(due)-Number(paid))}</span></div>
  <div class="rr"><span class="rl">Status</span><span>${feeStatus(Number(due),Number(paid))}</span></div>
  <div class="rr"><span class="rl">Date</span><span>${td()}</span></div>
</div>`;

// ── ANNOUNCEMENTS ──────────────────────────────────────────────────────────
async function secAnn(c){
  const render=async()=>{
    const list=await GET('/announcements')||[];
    const cc={General:'blue',Urgent:'red',Finance:'amber',Exam:'purple',Meeting:'green'};
    c.innerHTML=`<div class="two-col">
      <div class="card" style="max-height:580px;overflow-y:auto;">
        <div class="card-title">Announcements</div>
        ${list.map(a=>`<div class="ai">
          <div class="ai-meta">${chip(a.category,cc[a.category]||'blue')} ${(a.created_at||'').slice(0,10)}
            ${CU.role==='admin'?`<button class="btn bs bd" style="margin-left:auto;" onclick="delAnn('${a.id}')">Del</button>`:''}
          </div>
          <div class="ai-title">${a.title}</div>
          <div class="ai-body">${a.body||''}</div>
        </div>`).join('')||'<p style="color:#9ca3af;font-size:12px;">No announcements.</p>'}
      </div>
      ${CU.role==='admin'?`<div class="card">
        <div class="card-title">Post Announcement</div>
        <div class="field"><label>Title *</label><input id="an-t" placeholder="Title..."></div>
        <div class="field"><label>Category</label><select id="an-c"><option>General</option><option>Urgent</option><option>Finance</option><option>Exam</option><option>Meeting</option></select></div>
        <div class="field"><label>Audience</label><select id="an-a"><option>Everyone</option><option>Teachers</option>${CLS.map(cl=>`<option>Class ${cl.name}</option>`).join('')}</select></div>
        <div class="field"><label>Message</label><textarea id="an-b" rows="5" placeholder="Type here..."></textarea></div>
        <button class="btn bp" style="width:100%;" onclick="postAnn()">Publish</button>
      </div>`:'<div></div>'}
    </div>`;
  };
  window.postAnn=async()=>{
    if(!v('an-t')){toast('Title required','err');return;}
    await POST('/announcements',{title:v('an-t'),body:v('an-b'),category:v('an-c'),audience:v('an-a')});
    toast('Published!','ok');render();
  };
  window.delAnn=async(id)=>{if(!confirm('Delete?'))return;await DEL('/announcements/'+id);render();};
  await render();
}

// ── PAPERS ─────────────────────────────────────────────────────────────────
async function secPapers(c){
  const render=async(cls='')=>{
    const list=await GET('/papers'+(cls?'?cls='+cls:''))||[];
    c.innerHTML=`<div class="card">
      <div class="card-title">Exam Schedule
        <div style="display:flex;gap:6px;">
          ${CU.role==='admin'?`<button class="btn bp" onclick="addPaper()">+ Add</button>`:''}
          <button class="btn" onclick="expPapers()">Export</button>
        </div>
      </div>
      <div class="frow" style="margin-bottom:12px;">
        <select id="pc" onchange="rPapers()">${clsOpts(cls)}</select>
      </div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Class</th><th>Subject</th><th>Code</th><th>Date</th><th>Time</th><th>Duration</th><th>Hall</th><th>Marks</th>${CU.role==='admin'?'<th></th>':''}</tr></thead>
        <tbody>${list.map(p=>`<tr>
          <td>${chip('Class '+p.class,'blue')}</td><td><strong>${p.subject}</strong></td>
          <td style="font-family:monospace;font-size:11px;color:#9ca3af;">${p.paper_code||'-'}</td>
          <td>${p.exam_date||'-'}</td><td>${p.start_time||'-'}</td><td>${p.duration||'-'}</td><td>${p.hall||'-'}</td><td>${p.total_marks}</td>
          ${CU.role==='admin'?`<td><button class="btn bs bd" onclick="delPaper('${p.id}')">Del</button></td>`:''}
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
  };
  window.rPapers=()=>render(v('pc'));
  window.addPaper=()=>openModal('Add Paper',
    `<div class="fg">
      <div class="field"><label>Class *</label><select id="pf-c">${clsOpts('',false)}</select></div>
      <div class="field"><label>Subject *</label><input id="pf-s" placeholder="e.g. Mathematics"></div>
      <div class="field"><label>Paper Code</label><input id="pf-co"></div>
      <div class="field"><label>Exam Date</label><input type="date" id="pf-d"></div>
      <div class="field"><label>Start Time</label><input id="pf-t" value="09:00"></div>
      <div class="field"><label>Duration</label><input id="pf-du" value="3 hrs"></div>
      <div class="field"><label>Hall</label><input id="pf-h" placeholder="e.g. Hall A"></div>
      <div class="field"><label>Total Marks</label><input type="number" id="pf-m" value="100"></div>
    </div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn bp" onclick="savePaper()">Add</button>`);
  window.savePaper=async()=>{
    const d={class:v('pf-c'),subject:v('pf-s'),paper_code:v('pf-co'),exam_date:v('pf-d'),start_time:v('pf-t'),duration:v('pf-du'),hall:v('pf-h'),total_marks:Number(v('pf-m'))||100};
    if(!d.class||!d.subject){toast('Class and subject required','err');return;}
    await POST('/papers',d);closeModal();toast('Added!','ok');render();
  };
  window.delPaper=async(id)=>{if(!confirm('Delete?'))return;await DEL('/papers/'+id);render();};
  window.expPapers=async()=>{
    const list=await GET('/papers')||[];
    exportCSV(toCSV([['Class','Subject','Code','Date','Time','Duration','Hall','Marks'],...list.map(p=>[p.class,p.subject,p.paper_code,p.exam_date,p.start_time,p.duration,p.hall,p.total_marks])]),'papers.csv');
  };
  await render();
}

// ── RESULTS ────────────────────────────────────────────────────────────────
async function secResults(c){
  const papers=await GET('/papers')||[];
  const fc=CLS[0]?.name||'9',fs=secList(fc)[0]||'A';
  const rRes=async(cls=fc,sec=fs,pid=papers[0]?.id)=>{
    if(!pid){c.innerHTML='<div class="card"><p style="color:#9ca3af;">No papers found.</p></div>';return;}
    const rows=await GET(`/results?cls=${cls}&section=${sec}&paper_id=${pid}`)||[];
    const paper=papers.find(p=>p.id===pid);
    const sl=secList(cls);
    c.innerHTML=`<div class="card">
      <div class="card-title">Results
        <div style="display:flex;gap:6px;">
          <button class="btn bp" onclick="saveRes('${pid}')">Save</button>
          <button class="btn" onclick="expRes('${cls}','${sec}','${pid}')">Export</button>
          <button class="btn" onclick="printRep('${cls}','${sec}')">Print Report</button>
        </div>
      </div>
      <div class="frow" style="margin-bottom:12px;">
        <select id="rcl" onchange="rRes2()">${CLS.map(cl=>`<option value="${cl.name}" ${cl.name===cls?'selected':''}>Class ${cl.name}</option>`).join('')}</select>
        <select id="rse" onchange="rRes2()">${sl.map(s=>`<option value="${s}" ${s===sec?'selected':''}>${s}</option>`).join('')}</select>
        <select id="rpa" onchange="rRes2()">${papers.map(p=>`<option value="${p.id}" ${p.id===pid?'selected':''}>Class ${p.class} — ${p.subject}</option>`).join('')}</select>
      </div>
      ${rows.length===0?`<p style="color:#9ca3af;font-size:12px;">No students.</p>`:`
      <div class="tbl-wrap"><table>
        <thead><tr><th>Roll</th><th>Name</th><th>Max</th><th>Obtained</th><th>%</th><th>Grade</th><th>Result</th></tr></thead>
        <tbody>${rows.map(r=>{
          const ob=Number(r.marks_obtained)||0,p=Math.round(ob/(paper?.total_marks||100)*100);
          return`<tr><td>${r.roll_no}</td><td>${r.name}</td><td>${paper?.total_marks||100}</td>
            <td><input type="number" class="rm" data-id="${r.id}" value="${ob}" min="0" max="${paper?.total_marks||100}" style="width:65px;padding:4px 7px;border:1px solid #e5e7eb;border-radius:4px;font-size:12px;" oninput="updGr(this,${paper?.total_marks||100})"></td>
            <td class="rp-${r.id}">${p}%</td>
            <td class="rg-${r.id}" style="color:${gcol(p)};font-weight:600;">${grade(p)}</td>
            <td class="rf-${r.id}">${chip(ob>=(paper?.total_marks||100)*0.33?'Pass':'Fail',ob>=(paper?.total_marks||100)*0.33?'green':'red')}</td>
          </tr>`;}).join('')}
        </tbody>
      </table></div>`}
    </div>`;
  };
  window.updGr=(inp,total)=>{
    const sid=inp.dataset.id,ob=Number(inp.value)||0,p=Math.round(ob/total*100),pf=ob>=total*0.33;
    const pg=document.querySelector(`.rp-${sid}`),gg=document.querySelector(`.rg-${sid}`),fg=document.querySelector(`.rf-${sid}`);
    if(pg)pg.textContent=p+'%';if(gg){gg.textContent=grade(p);gg.style.color=gcol(p);}
    if(fg)fg.innerHTML=chip(pf?'Pass':'Fail',pf?'green':'red');
  };
  window.rRes2=async()=>{
    const cls=v('rcl');const sel=document.getElementById('rse');const sl=secList(cls);
    if(sel)sel.innerHTML=sl.map(s=>`<option value="${s}">${s}</option>`).join('');
    await rRes(cls,sl[0],v('rpa'));
  };
  window.saveRes=async(pid)=>{
    const recs=[...document.querySelectorAll('.rm')].map(i=>({student_id:i.dataset.id,marks_obtained:Number(i.value)||0}));
    await POST('/results',{records:recs,paper_id:pid});toast('Results saved!','ok');
  };
  window.expRes=async(cls,sec,pid)=>{
    const rows=await GET(`/results?cls=${cls}&section=${sec}&paper_id=${pid}`)||[];
    const paper=papers.find(p=>p.id===pid);
    exportCSV(toCSV([['Roll','Name','Max','Obtained','%','Grade'],...rows.map(r=>{const p=Math.round((Number(r.marks_obtained)||0)/(paper?.total_marks||100)*100);return[r.roll_no,r.name,paper?.total_marks||100,r.marks_obtained||0,p+'%',grade(p)];})]),`results_${cls}${sec}.csv`);
  };
  window.printRep=async(cls,sec)=>{
    const rows=await GET(`/results/report?cls=${cls}&section=${sec}`)||[];
    const pl=papers.filter(p=>p.class===cls);
    const html=`<div id="print-area">
      <h2 style="text-align:center;margin-bottom:8px;">EduMatrix School — Result Report</h2>
      <p style="text-align:center;font-size:12px;margin-bottom:14px;">Class ${cls}-${sec} | ${td()}</p>
      <table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead><tr style="background:#f3f4f6;"><th>Roll</th><th>Name</th>${pl.map(p=>`<th>${p.subject}</th>`).join('')}<th>Total</th><th>%</th><th>Grade</th></tr></thead>
        <tbody>${rows.map(r=>{
          const sc={};(r.scores||'').split(',').forEach(s=>{const[sub,rest]=s.split(':');if(sub&&rest){const[ob,mx]=rest.split('/');sc[sub]={ob:Number(ob),mx:Number(mx)};}});
          let tot=0,mx=0;const cells=pl.map(p=>{const s=sc[p.subject]||{ob:0,mx:p.total_marks};tot+=s.ob;mx+=s.mx;return`<td>${s.ob}/${s.mx}</td>`;}).join('');
          const p=mx>0?Math.round(tot/mx*100):0;
          return`<tr><td>${r.roll_no}</td><td>${r.name}</td>${cells}<td><b>${tot}/${mx}</b></td><td>${p}%</td><td>${grade(p)}</td></tr>`;
        }).join('')}</tbody>
      </table>
    </div>`;
    openModal('Result Report',html,`<button class="btn" onclick="closeModal()">Close</button><button class="btn bp" onclick="printModal()">Print</button>`);
  };
  await rRes();
}

// ── STUDENT/PARENT VIEWS ───────────────────────────────────────────────────
// ── get linked student helper ──────────────────────────────────────────────
function getLinkedStudent() {
  return CU.linked_student || null;
}

function noLinkMsg(what) {
  return `<div class="card">
    <div class="card-title">${what}</div>
    <div style="text-align:center;padding:30px;">
      <div style="font-size:32px;margin-bottom:10px;">🔗</div>
      <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px;">Account not linked yet</div>
      <div style="font-size:12px;color:var(--text2);">Please contact your school admin to link your account to your student record.</div>
    </div>
  </div>`;
}

// ── MY ATTENDANCE ──────────────────────────────────────────────────────────
async function secMyAtt(c) {
  const stu = getLinkedStudent();
  if (!stu) { c.innerHTML = noLinkMsg('My Attendance'); return; }

  const month = mon();
  const rows = await GET(`/attendance/student?student_id=${stu.id}&month=${month}`) || [];
  const present = rows.filter(r => r.status === 'Present').length;
  const absent  = rows.filter(r => r.status === 'Absent').length;
  const late    = rows.filter(r => r.status === 'Late').length;
  const total   = rows.length;
  const pct     = total > 0 ? Math.round(present / total * 100) : 0;

  c.innerHTML = `
    <div style="padding:12px 14px;background:var(--blue-l);border-radius:var(--r);margin-bottom:14px;font-size:13px;color:var(--blue-t);">
      <strong>${stu.name}</strong> — Class ${stu.class}-${stu.section} · Roll No: ${stu.roll_no}
    </div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-lbl">Present</div><div class="stat-val" style="color:var(--green);">${present}</div></div>
      <div class="stat-card"><div class="stat-lbl">Absent</div><div class="stat-val" style="color:var(--red);">${absent}</div></div>
      <div class="stat-card"><div class="stat-lbl">Late</div><div class="stat-val" style="color:var(--amber);">${late}</div></div>
      <div class="stat-card"><div class="stat-lbl">Attendance %</div><div class="stat-val" style="color:${p2c(pct)};">${pct}%</div></div>
    </div>
    <div class="card">
      <div class="card-title">Attendance Record — ${month}</div>
      <div style="margin-bottom:10px;">${pbar(pct, p2c(pct))}</div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Date</th><th>Status</th><th>Note</th></tr></thead>
        <tbody>${rows.map(r => `<tr>
          <td>${new Date(r.date).toLocaleDateString('en-PK',{weekday:'short',month:'short',day:'numeric'})}</td>
          <td>${chip(r.status, {Present:'green',Absent:'red',Late:'amber'}[r.status]||'gray')}</td>
          <td style="font-size:11px;color:var(--text2);">${r.note||'-'}</td>
        </tr>`).join('')}
        ${rows.length===0?`<tr><td colspan="3" style="text-align:center;color:#9ca3af;padding:20px;">No attendance records this month.</td></tr>`:''}
        </tbody>
      </table></div>
    </div>`;
}

// ── MY FEES ────────────────────────────────────────────────────────────────
async function secMyFees(c) {
  const stu = getLinkedStudent();
  if (!stu) { c.innerHTML = noLinkMsg('My Fees'); return; }

  const fees = await GET(`/fees/student?student_id=${stu.id}`) || [];
  const totalPaid    = fees.reduce((a,f) => a + Number(f.amount_paid), 0);
  const totalPending = fees.reduce((a,f) => a + Math.max(0, Number(f.amount_due) - Number(f.amount_paid)), 0);

  c.innerHTML = `
    <div style="padding:12px 14px;background:var(--blue-l);border-radius:var(--r);margin-bottom:14px;font-size:13px;color:var(--blue-t);">
      <strong>${stu.name}</strong> — Class ${stu.class}-${stu.section} · Roll No: ${stu.roll_no}
    </div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-lbl">Total Paid</div><div class="stat-val" style="color:var(--green);">Rs ${fmt(totalPaid)}</div></div>
      <div class="stat-card"><div class="stat-lbl">Pending</div><div class="stat-val" style="color:var(--red);">Rs ${fmt(totalPending)}</div></div>
    </div>
    <div class="card">
      <div class="card-title">Fee Statement</div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Month</th><th>Fee Due</th><th>Paid</th><th>Balance</th><th>Status</th><th></th></tr></thead>
        <tbody>${fees.map(f => {
          const bal = Number(f.amount_due) - Number(f.amount_paid);
          return `<tr>
            <td><strong>${f.month}</strong></td>
            <td>Rs ${fmt(f.amount_due)}</td>
            <td>Rs ${fmt(f.amount_paid)}</td>
            <td>Rs ${fmt(bal)}</td>
            <td>${feeChip(Number(f.amount_due), Number(f.amount_paid))}</td>
            <td>${Number(f.amount_paid) >= Number(f.amount_due)
              ? `<button class="btn bs" onclick="showFeeReceipt('${stu.name}',${f.amount_due},${f.amount_paid},'${f.month}')">Receipt</button>`
              : `<span style="font-size:11px;color:var(--red);">Please pay Rs ${fmt(bal)}</span>`}
            </td>
          </tr>`;
        }).join('')}
        ${fees.length===0?`<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:20px;">No fee records found.</td></tr>`:''}
        </tbody>
      </table></div>
    </div>`;

  window.showFeeReceipt = (name, due, paid, month) => {
    openModal('Fee Receipt', receiptHtml(name, due, paid, month),
      `<button class="btn" onclick="closeModal()">Close</button>
       <button class="btn bp" onclick="printModal()">Print</button>`);
  };
}

// ── MY PAPERS ──────────────────────────────────────────────────────────────
async function secMyPapers(c) {
  const stu = getLinkedStudent();
  const cls = stu ? stu.class : '';
  const list = await GET('/papers' + (cls ? '?cls=' + cls : '')) || [];

  c.innerHTML = `
    ${stu ? `<div style="padding:12px 14px;background:var(--blue-l);border-radius:var(--r);margin-bottom:14px;font-size:13px;color:var(--blue-t);">
      <strong>${stu.name}</strong> — Class ${stu.class}-${stu.section} · Roll No: ${stu.roll_no}
    </div>` : ''}
    <div class="card">
      <div class="card-title">Exam Schedule ${cls ? '— Class ' + cls : ''}</div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Subject</th><th>Date</th><th>Time</th><th>Duration</th><th>Hall</th><th>Marks</th></tr></thead>
        <tbody>${list.map(p => `<tr>
          <td><strong>${p.subject}</strong></td>
          <td>${p.exam_date ? new Date(p.exam_date).toLocaleDateString('en-PK',{weekday:'short',month:'short',day:'numeric'}) : '-'}</td>
          <td>${p.start_time||'-'}</td>
          <td>${p.duration||'-'}</td>
          <td>${p.hall ? chip(p.hall,'blue') : '-'}</td>
          <td>${p.total_marks}</td>
        </tr>`).join('')}
        ${list.length===0?`<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:20px;">No exams scheduled yet.</td></tr>`:''}
        </tbody>
      </table></div>
    </div>`;
}

// ── MY RESULTS ─────────────────────────────────────────────────────────────
async function secMyResults(c) {
  const stu = getLinkedStudent();
  if (!stu) { c.innerHTML = noLinkMsg('My Results'); return; }

  const results = await GET(`/results/student?student_id=${stu.id}`) || [];

  // calculate totals
  const totalMarks   = results.reduce((a,r) => a + Number(r.papers?.total_marks||100), 0);
  const totalObtained= results.reduce((a,r) => a + Number(r.marks_obtained||0), 0);
  const overallPct   = totalMarks > 0 ? Math.round(totalObtained / totalMarks * 100) : 0;

  c.innerHTML = `
    <div style="padding:12px 14px;background:var(--blue-l);border-radius:var(--r);margin-bottom:14px;font-size:13px;color:var(--blue-t);">
      <strong>${stu.name}</strong> — Class ${stu.class}-${stu.section} · Roll No: ${stu.roll_no}
    </div>
    ${results.length > 0 ? `
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-lbl">Total Obtained</div><div class="stat-val">${totalObtained}/${totalMarks}</div></div>
      <div class="stat-card"><div class="stat-lbl">Overall %</div><div class="stat-val" style="color:${gcol(overallPct)};">${overallPct}%</div></div>
      <div class="stat-card"><div class="stat-lbl">Overall Grade</div><div class="stat-val" style="color:${gcol(overallPct)};">${grade(overallPct)}</div></div>
      <div class="stat-card"><div class="stat-lbl">Subjects</div><div class="stat-val">${results.length}</div></div>
    </div>` : ''}
    <div class="card">
      <div class="card-title">My Results</div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Subject</th><th>Exam Date</th><th>Max Marks</th><th>Obtained</th><th>%</th><th>Grade</th><th>Result</th></tr></thead>
        <tbody>${results.map(r => {
          const ob  = Number(r.marks_obtained||0);
          const max = Number(r.papers?.total_marks||100);
          const p   = Math.round(ob/max*100);
          return `<tr>
            <td><strong>${r.papers?.subject||'-'}</strong></td>
            <td style="font-size:11px;color:var(--text2);">${r.papers?.exam_date||'-'}</td>
            <td>${max}</td>
            <td><strong>${ob}</strong></td>
            <td>${pbar(p, gcol(p))}</td>
            <td style="color:${gcol(p)};font-weight:600;">${grade(p)}</td>
            <td>${chip(ob>=max*0.33?'Pass':'Fail', ob>=max*0.33?'green':'red')}</td>
          </tr>`;
        }).join('')}
        ${results.length===0?`<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:20px;">No results published yet.</td></tr>`:''}
        </tbody>
      </table></div>
    </div>`;
}

// ── CLASSES ────────────────────────────────────────────────────────────────
async function secClasses(c){
  const render=async()=>{
    CLS=await GET('/classes')||[];
    const warn=CLS.length===0?`<div style="padding:14px;background:var(--amber-l);border-radius:var(--r);margin-bottom:14px;font-size:13px;color:var(--amber);"><strong>No classes yet!</strong> Add your classes below.</div>`:'';
    let rows='';
    for(const cl of CLS){
      const secs=cl.sections.split(',').map(s=>s.trim());
      rows+=`<tr><td><strong>Class ${cl.name}</strong></td><td>${secs.map(s=>chip(s,'blue')).join(' ')}</td>
        <td><button class="btn bs" onclick="doEditCls('${cl.id}')">Edit</button><button class="btn bs bd" onclick="doDelCls('${cl.id}','${cl.name}')">Delete</button></td></tr>`;
    }
    window._cls={};CLS.forEach(cl=>window._cls[cl.id]={...cl});
    c.innerHTML=warn+`
    <div class="card">
      <div class="card-title">Add New Class</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
        <div style="flex:1;min-width:150px;"><label style="display:block;font-size:12px;color:var(--text2);margin-bottom:4px;">Class Name *</label><input type="text" id="nc-name" placeholder="e.g. 6, 7, KG, Nursery" style="width:100%;padding:8px 10px;border:1px solid var(--border2);border-radius:var(--r);font-size:13px;"></div>
        <div style="flex:1;min-width:150px;"><label style="display:block;font-size:12px;color:var(--text2);margin-bottom:4px;">Sections *</label><input type="text" id="nc-sec" value="A,B" style="width:100%;padding:8px 10px;border:1px solid var(--border2);border-radius:var(--r);font-size:13px;"></div>
        <button class="btn bp" onclick="doAddCls()" style="height:36px;">+ Add Class</button>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Bulk Add</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
        <div style="flex:2;min-width:180px;"><label style="display:block;font-size:12px;color:var(--text2);margin-bottom:4px;">Class Names (comma separated)</label><input type="text" id="bk-names" placeholder="e.g. 6,7,8,9,10" style="width:100%;padding:8px 10px;border:1px solid var(--border2);border-radius:var(--r);font-size:13px;"></div>
        <div style="flex:1;min-width:100px;"><label style="display:block;font-size:12px;color:var(--text2);margin-bottom:4px;">Sections</label><input type="text" id="bk-secs" value="A,B" style="width:100%;padding:8px 10px;border:1px solid var(--border2);border-radius:var(--r);font-size:13px;"></div>
        <button class="btn bp" onclick="doBulkCls()" style="height:36px;">Add All</button>
      </div>
    </div>
    ${CLS.length>0?`<div class="card"><div class="card-title">All Classes</div>
    <div class="tbl-wrap"><table><thead><tr><th>Class</th><th>Sections</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`:''}`;

    window.doAddCls=async()=>{
      const name=document.getElementById('nc-name').value.trim();
      const sections=document.getElementById('nc-sec').value.trim();
      if(!name){toast('Enter class name!','err');document.getElementById('nc-name').focus();return;}
      const res=await POST('/classes',{name,sections:sections||'A,B'});
      if(res?.ok!==false){document.getElementById('nc-name').value='';toast('Class '+name+' added!','ok');CLS=await GET('/classes')||[];render();}
      else toast('Error — class may already exist','err');
    };
    window.doBulkCls=async()=>{
      const names=document.getElementById('bk-names').value.split(',').map(s=>s.trim()).filter(Boolean);
      const secs=document.getElementById('bk-secs').value.trim()||'A,B';
      if(!names.length){toast('Enter class names','err');return;}
      let added=0;for(const n of names){const r=await POST('/classes',{name:n,sections:secs});if(r?.ok!==false)added++;}
      CLS=await GET('/classes')||[];toast('Added '+added+' classes!','ok');render();
    };
    window.doEditCls=(id)=>{
      const cl=window._cls[id];if(!cl)return;
      openModal('Edit Class',
        `<div class="field"><label>Class Name *</label><input id="ec-n" value="${cl.name}" style="width:100%;"></div>
         <div class="field"><label>Sections *</label><input id="ec-s" value="${cl.sections}" style="width:100%;"></div>`,
        `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn bp" onclick="doSaveEditCls('${id}')">Update</button>`);
    };
    window.doSaveEditCls=async(id)=>{
      const res=await PUT('/classes/'+id,{name:v('ec-n').trim(),sections:v('ec-s').trim()});
      if(res?.ok!==false){closeModal();toast('Updated!','ok');CLS=await GET('/classes')||[];render();}
    };
    window.doDelCls=async(id,name)=>{
      if(!confirm('Delete Class '+name+'?'))return;
      await DEL('/classes/'+id);CLS=await GET('/classes')||[];toast('Deleted');render();
    };
  };
  await render();
}

// ── USERS ──────────────────────────────────────────────────────────────────
async function secUsers(c){
  const render=async()=>{
    const users=await GET('/users')||[];
    c.innerHTML=`<div class="card">
      <div class="card-title">User Accounts <button class="btn bp" onclick="addUser()">+ Add User</button></div>
      <div class="tbl-wrap"><table><thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Actions</th></tr></thead>
      <tbody>${users.map(u=>`<tr><td><strong>${u.name}</strong></td><td style="font-family:monospace;">${u.username}</td>
        <td>${chip(u.role.charAt(0).toUpperCase()+u.role.slice(1),{admin:'blue',teacher:'green',student:'amber',parent:'purple'}[u.role]||'gray')}</td>
        <td><button class="btn bs" onclick="editUser('${u.id}','${u.name}','${u.username}','${u.role}')">Edit</button>
        ${u.username!=='admin'?`<button class="btn bs bd" onclick="delUser('${u.id}','${u.name}')">Del</button>`:''}</td></tr>`).join('')}
      </tbody></table></div>
    </div>`;
    const uf=(u={})=>`<div class="field"><label>Full Name *</label><input id="uf-n" value="${u.name||''}"></div>
      <div class="field"><label>Username *</label><input id="uf-u" value="${u.username||''}"></div>
      <div class="field"><label>Password ${u.id?'(blank=keep)':'*'}</label><input type="password" id="uf-p"></div>
      <div class="field"><label>Role</label><select id="uf-r">
        <option value="admin" ${(u.role||'')==='admin'?'selected':''}>Admin</option>
        <option value="teacher" ${(u.role||'')==='teacher'?'selected':''}>Teacher</option>
        <option value="student" ${(u.role||'')==='student'?'selected':''}>Student</option>
        <option value="parent" ${(u.role||'')==='parent'?'selected':''}>Parent</option>
      </select></div>
      <div class="field"><label>Contact / Phone</label><input id="uf-c" value="${u.contact||''}"></div>`;
    window.addUser=()=>openModal('Add User',uf(),`<button class="btn" onclick="closeModal()">Cancel</button><button class="btn bp" onclick="saveUser()">Add</button>`);
    window.editUser=(id,name,username,role)=>openModal('Edit User',uf({id,name,username,role}),`<button class="btn" onclick="closeModal()">Cancel</button><button class="btn bp" onclick="saveUser('${id}')">Update</button>`);
    window.saveUser=async(id)=>{
      const d={name:v('uf-n'),username:v('uf-u'),password:v('uf-p'),role:v('uf-r'),contact:v('uf-c')};
      if(!d.name||!d.username){toast('Fill required fields','err');return;}
      if(!id&&!d.password){toast('Password required','err');return;}
      const res=id?await PUT('/users/'+id,d):await POST('/users',d);
      if(res?.ok!==false){closeModal();toast('Saved!','ok');render();}else toast('Error: '+(res?.error||'Failed'),'err');
    };
    window.delUser=async(id,name)=>{if(!confirm(`Delete ${name}?`))return;await DEL('/users/'+id);toast('Deleted');render();};
  };
  await render();
}


// ── DIARIES / HOMEWORK ─────────────────────────────────────────────────────
async function secDiary(c){
  const canEdit = CU.role === 'admin' || CU.role === 'teacher';
  const render = async(cls='', section='', date='') => {
    const params = new URLSearchParams();
    if(cls) params.set('cls', cls);
    if(section) params.set('section', section);
    if(date) params.set('date', date);
    const list = await GET('/diaries?' + params) || [];

    const subjectColors = {
      'English':'blue','Mathematics':'green','Physics':'purple',
      'Chemistry':'amber','Biology':'green','Urdu':'red',
      'Islamiat':'green','Pakistan Studies':'amber','Computer':'blue',
      'Default':'gray'
    };
    const getColor = (sub) => subjectColors[sub] || subjectColors['Default'];

    c.innerHTML = `
    ${canEdit ? `<div class="card">
      <div class="card-title">Add Homework / Diary Entry</div>
      <div class="fg" style="margin-bottom:12px;">
        <div class="field"><label>Class *</label><select id="dw-cls">${clsOpts('',false)}</select></div>
        <div class="field"><label>Section *</label><select id="dw-sec"><option value="A">A</option><option value="B">B</option></select></div>
        <div class="field"><label>Subject *</label>
          <select id="dw-sub">
            <option>English</option><option>Mathematics</option><option>Physics</option>
            <option>Chemistry</option><option>Biology</option><option>Urdu</option>
            <option>Islamiat</option><option>Pakistan Studies</option><option>Computer</option><option>Other</option>
          </select>
        </div>
        <div class="field"><label>Date *</label><input type="date" id="dw-date" value="${new Date().toISOString().split('T')[0]}"></div>
      </div>
      <div class="field"><label>Homework / Task *</label><textarea id="dw-hw" rows="3" placeholder="e.g. Complete exercise 5 from chapter 3, pages 45-47..."></textarea></div>
      <div class="fg">
        <div class="field"><label>Due Date</label><input type="date" id="dw-due"></div>
        <div class="field"><label>Note (optional)</label><input id="dw-note" placeholder="e.g. Will be checked tomorrow"></div>
      </div>
      <button class="btn bp" onclick="saveDiary()" style="width:100%;">+ Post Homework</button>
    </div>` : ''}

    <div class="card">
      <div class="card-title">Homework Diary
        <span style="font-size:11px;font-weight:400;color:#9ca3af;">${list.length} entries</span>
      </div>
      <div class="frow" style="margin-bottom:14px;">
        <select id="df-cls" onchange="rDiary()">
          <option value="">All Classes</option>
          ${CLS.map(cl=>`<option value="${cl.name}" ${cl.name===cls?'selected':''}>Class ${cl.name}</option>`).join('')}
        </select>
        <select id="df-sec" onchange="rDiary()">
          <option value="">All Sections</option>
          ${cls ? secList(cls).map(s=>`<option value="${s}" ${s===section?'selected':''}>${s}</option>`).join('') : '<option value="A">A</option><option value="B">B</option>'}
        </select>
        <input type="date" id="df-date" value="${date}" onchange="rDiary()">
        <button class="btn" onclick="document.getElementById('df-date').value='';rDiary()">Clear Date</button>
      </div>

      ${list.length === 0 ?
        `<div style="text-align:center;padding:30px;color:#9ca3af;">
          <div style="font-size:32px;margin-bottom:8px;">📚</div>
          <div style="font-size:13px;">No homework entries found.</div>
          ${canEdit ? '<div style="font-size:12px;margin-top:4px;">Add homework using the form above.</div>' : ''}
        </div>` :
        `<div style="display:flex;flex-direction:column;gap:10px;">
          ${list.map(d => `
          <div style="border:1px solid var(--border);border-radius:var(--rl);padding:14px 16px;background:var(--bg2);">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                ${chip(d.subject, getColor(d.subject))}
                ${chip('Class '+d.class+'-'+d.section,'blue')}
                <span style="font-size:11px;color:var(--text2);">${d.date}</span>
                ${d.due_date ? `<span style="font-size:11px;color:var(--red);">Due: ${d.due_date}</span>` : ''}
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:11px;color:var(--text3);">By ${d.created_by_name||'Teacher'}</span>
                ${canEdit ? `
                  <button class="btn bs" onclick="editDiary('${d.id}')">Edit</button>
                  <button class="btn bs bd" onclick="delDiary('${d.id}')">Delete</button>
                ` : ''}
              </div>
            </div>
            <div style="font-size:13px;color:var(--text);line-height:1.6;margin-bottom:${d.note?'6px':'0'};">${d.homework}</div>
            ${d.note ? `<div style="font-size:12px;color:var(--text2);background:var(--bg3);padding:6px 10px;border-radius:var(--r);margin-top:6px;">📌 ${d.note}</div>` : ''}
          </div>`).join('')}
        </div>`
      }
    </div>`;
  };

  window.rDiary = async() => {
    const cls = v('df-cls');
    const secEl = document.getElementById('df-sec');
    if(secEl && cls) secEl.innerHTML = '<option value="">All Sections</option>' + secList(cls).map(s=>`<option value="${s}">${s}</option>`).join('');
    await render(cls, v('df-sec'), v('df-date'));
  };

  window.saveDiary = async() => {
    const d = {
      class: v('dw-cls'), section: v('dw-sec'), subject: v('dw-sub'),
      date: v('dw-date'), homework: v('dw-hw'),
      due_date: v('dw-due') || null, note: v('dw-note') || null,
      created_by: CU.id
    };
    if(!d.class||!d.section||!d.subject||!d.date||!d.homework){
      toast('Fill all required fields!','err'); return;
    }
    const res = await POST('/diaries', d);
    if(res?.ok !== false){
      document.getElementById('dw-hw').value = '';
      document.getElementById('dw-note').value = '';
      toast('Homework posted!','ok');
      render(v('df-cls'), v('df-sec'), v('df-date'));
    } else toast('Error: '+(res?.error||'Failed'),'err');
  };

  window.editDiary = async(id) => {
    const list = await GET('/diaries') || [];
    const d = list.find(x => x.id === id);
    if(!d) return;
    openModal('Edit Diary Entry',
      `<div class="field"><label>Subject</label>
        <select id="ed-sub">
          <option ${d.subject==='English'?'selected':''}>English</option>
          <option ${d.subject==='Mathematics'?'selected':''}>Mathematics</option>
          <option ${d.subject==='Physics'?'selected':''}>Physics</option>
          <option ${d.subject==='Chemistry'?'selected':''}>Chemistry</option>
          <option ${d.subject==='Biology'?'selected':''}>Biology</option>
          <option ${d.subject==='Urdu'?'selected':''}>Urdu</option>
          <option ${d.subject==='Islamiat'?'selected':''}>Islamiat</option>
          <option ${d.subject==='Pakistan Studies'?'selected':''}>Pakistan Studies</option>
          <option ${d.subject==='Computer'?'selected':''}>Computer</option>
          <option ${d.subject==='Other'?'selected':''}>Other</option>
        </select>
      </div>
      <div class="field"><label>Date</label><input type="date" id="ed-date" value="${d.date}"></div>
      <div class="field"><label>Homework *</label><textarea id="ed-hw" rows="4">${d.homework}</textarea></div>
      <div class="field"><label>Due Date</label><input type="date" id="ed-due" value="${d.due_date||''}"></div>
      <div class="field"><label>Note</label><input id="ed-note" value="${d.note||''}"></div>`,
      `<button class="btn" onclick="closeModal()">Cancel</button>
       <button class="btn bp" onclick="doEditDiary('${id}')">Update</button>`
    );
  };

  window.doEditDiary = async(id) => {
    const res = await PUT('/diaries/'+id, {
      subject: v('ed-sub'), date: v('ed-date'),
      homework: v('ed-hw'), due_date: v('ed-due')||null, note: v('ed-note')||null
    });
    if(res?.ok !== false){ closeModal(); toast('Updated!','ok'); render(); }
    else toast('Error','err');
  };

  window.delDiary = async(id) => {
    if(!confirm('Delete this homework entry?')) return;
    await DEL('/diaries/'+id);
    toast('Deleted');
    render();
  };

  await render();
}

// ── SMS LOGS ───────────────────────────────────────────────────────────────
async function secSMS(c){
  // Only admin can see SMS logs
  if(CU.role !== 'admin') {
    await secNotifications(c);
    return;
  }
  const logs=await GET('/sms/logs')||[];

  // Check current push status
  let pushStatus = 'Not supported';
  let pushBtnText = 'Enable Notifications';
  let pushBtnAction = 'enablePush()';
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      pushStatus = '✅ Enabled';
      pushBtnText = 'Send Test Notification';
      pushBtnAction = 'testPushNotif()';
    } else if (Notification.permission === 'denied') {
      pushStatus = '❌ Blocked — allow in browser settings';
      pushBtnText = 'Blocked';
      pushBtnAction = '';
    } else {
      pushStatus = '⚠️ Not enabled yet';
    }
  }

  c.innerHTML=`
  <div class="card" style="margin-bottom:14px;">
    <div class="card-title">Push Notifications</div>
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:12px;background:var(--bg3);border-radius:var(--r);">
      <div>
        <div style="font-size:13px;font-weight:500;">Status: ${pushStatus}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:3px;">
          When enabled — parents get notified instantly when child is absent.
          Announcements also send notifications to everyone.
        </div>
      </div>
      ${pushBtnAction ? `<button class="btn bp" onclick="${pushBtnAction}">${pushBtnText}</button>` : ''}
    </div>
  </div>
  <div class="card">
    <div class="card-title">SMS Logs <span style="font-size:11px;font-weight:400;color:#9ca3af;">${logs.length} sent</span>
      <button class="btn bp" onclick="testSMS()">Send Test SMS</button>
    </div>
    ${logs.length===0
      ? '<p style="color:#9ca3af;font-size:12px;">No SMS sent yet. SMS sent automatically when student marked absent.</p>'
      : `<div class="tbl-wrap"><table><thead><tr><th>Recipient</th><th>Message</th><th>Status</th><th>Time</th></tr></thead>
        <tbody>${logs.map(l=>`<tr>
          <td>${l.recipient}</td>
          <td style="max-width:280px;font-size:11px;">${l.message}</td>
          <td>${chip(l.status,'green')}</td>
          <td style="font-size:11px;color:#9ca3af;">${(l.created_at||'').slice(0,16)}</td>
        </tr>`).join('')}</tbody>
        </table></div>`
    }
  </div>`;

  window.enablePush = async () => {
    await subscribeToPush();
    toast('Notifications enabled!', 'ok');
    secSMS(c);
  };

  window.testPushNotif = async () => {
    const res = await POST('/push/test', {
      user_id: CU.id,
      title: '✅ Test Notification',
      body: 'EduMatrix push notifications are working!'
    });
    if (res?.ok !== false) toast('Test notification sent! Check your phone.', 'ok');
    else toast('Error sending notification', 'err');
  };

  window.testSMS = () => openModal('Send Test SMS',
    `<div class="field"><label>Phone Number</label><input id="sms-to" placeholder="e.g. 0300-1234567"></div>
     <div class="field"><label>Message</label><textarea id="sms-msg" rows="3">Test message from EduMatrix School System.</textarea></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button>
     <button class="btn bp" onclick="doTestSMS()">Send</button>`);

  window.doTestSMS = async () => {
    await POST('/sms/test', {to: v('sms-to'), message: v('sms-msg')});
    closeModal(); toast('Test SMS sent!', 'ok'); secSMS(c);
  };
}

// ── DIARY ──────────────────────────────────────────────────────────────────
async function secDiary(c) {
  const canEdit = CU.role === 'admin' || CU.role === 'teacher';
  const fc = CLS[0]?.name || '9';
  const fs = secList(fc)[0] || 'A';

  const render = async (cls=fc, sec=fs, date=td()) => {
    const entries = await GET(`/diary?cls=${cls}&section=${sec}&date=${date}`) || [];
    const subjects = ['English','Mathematics','Physics','Chemistry','Biology','Urdu','Islamiyat','Pakistan Studies','Computer','Other'];

    c.innerHTML = `
    <div class="card">
      <div class="card-title">Daily Diary — Homework & Notes
        ${canEdit ? `<button class="btn bp" onclick="addDiaryModal('${cls}','${sec}','${date}')">+ Add Entry</button>` : ''}
      </div>
      <div class="frow" style="margin-bottom:14px;">
        <select id="dc" onchange="rDiary()">${CLS.map(cl=>`<option value="${cl.name}" ${cl.name===cls?'selected':''}>Class ${cl.name}</option>`).join('')}</select>
        <select id="ds" onchange="rDiary()">${secList(cls).map(s=>`<option value="${s}" ${s===sec?'selected':''}>${s}</option>`).join('')}</select>
        <input id="dd" type="date" value="${date}" onchange="rDiary()">
      </div>
      ${entries.length === 0 ?
        `<div style="text-align:center;padding:30px;color:#9ca3af;">
          <div style="font-size:32px;margin-bottom:8px;">📚</div>
          <div style="font-size:14px;font-weight:500;">No diary entries for this date</div>
          <div style="font-size:12px;margin-top:4px;">${canEdit ? 'Click + Add Entry to add homework' : 'No homework assigned for today'}</div>
        </div>` :
        entries.map(e => `
        <div style="border:1px solid var(--border);border-radius:var(--rl);padding:14px 16px;margin-bottom:10px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
            <div style="display:flex;align-items:center;gap:8px;">
              ${chip(e.subject, 'blue')}
              ${e.is_important ? chip('Important','red') : ''}
              <span style="font-size:11px;color:var(--text2);">Class ${e.class}-${e.section} · ${e.date}</span>
            </div>
            ${canEdit ? `<div style="display:flex;gap:6px;">
              <button class="btn bs" onclick="editDiaryModal('${e.id}','${e.subject}','${e.class}','${e.section}','${e.date}')">Edit</button>
              <button class="btn bs bd" onclick="delDiary('${e.id}')">Delete</button>
            </div>` : ''}
          </div>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px;">${e.title}</div>
          <div style="font-size:13px;color:var(--text2);line-height:1.6;">${e.description || ''}</div>
          ${e.due_date ? `<div style="margin-top:8px;font-size:11px;color:var(--amber);font-weight:500;">📅 Due: ${e.due_date}</div>` : ''}
          <div style="margin-top:6px;font-size:11px;color:var(--text3);">Added by: ${e.users?.name || 'Teacher'}</div>
        </div>`).join('')
      }
    </div>`;

    window.rDiary = async () => {
      const cls2 = v('dc');
      const sel = document.getElementById('ds');
      const sl = secList(cls2);
      if (sel) sel.innerHTML = sl.map(s=>`<option value="${s}">${s}</option>`).join('');
      await render(cls2, sl[0], v('dd'));
    };

    const diaryForm = (d={}) => `
      <div class="fg">
        <div class="field"><label>Subject *</label>
          <select id="df-sub">
            ${subjects.map(s=>`<option value="${s}" ${s===(d.subject||'')?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Date *</label><input type="date" id="df-date" value="${d.date||td()}"></div>
        <div class="field"><label>Class *</label><select id="df-cls">${CLS.map(cl=>`<option value="${cl.name}" ${cl.name===(d.class||cls)?'selected':''}>Class ${cl.name}</option>`).join('')}</select></div>
        <div class="field"><label>Section *</label><select id="df-sec">${secList(d.class||cls).map(s=>`<option value="${s}" ${s===(d.section||sec)?'selected':''}>${s}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>Homework Title *</label><input id="df-title" value="${d.title||''}" placeholder="e.g. Complete Exercise 5 from Chapter 3"></div>
      <div class="field"><label>Description / Details</label><textarea id="df-desc" rows="4" placeholder="Detailed instructions for students...">${d.description||''}</textarea></div>
      <div class="fg">
        <div class="field"><label>Due Date</label><input type="date" id="df-due" value="${d.due_date||''}"></div>
        <div class="field"><label>Mark as Important?</label>
          <select id="df-imp">
            <option value="false" ${!d.is_important?'selected':''}>No</option>
            <option value="true" ${d.is_important?'selected':''}>Yes — Mark Important</option>
          </select>
        </div>
      </div>`;

    window.addDiaryModal = (cls3, sec3, date3) => openModal('Add Diary Entry', diaryForm({class:cls3,section:sec3,date:date3}),
      `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn bp" onclick="saveDiary()">Save</button>`);

    window.editDiaryModal = async (id, subject, dcls, dsec, ddate) => {
      const entry = await GET('/diary?cls='+dcls+'&section='+dsec+'&date='+ddate);
      const e = (entry||[]).find(x=>x.id===id) || {id,subject,class:dcls,section:dsec,date:ddate};
      openModal('Edit Diary Entry', diaryForm(e),
        `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn bp" onclick="saveDiary('${id}')">Update</button>`);
    };

    window.saveDiary = async (id) => {
      const d = {
        subject: v('df-sub'), date: v('df-date'), class: v('df-cls'),
        section: v('df-sec'), title: v('df-title'), description: v('df-desc'),
        due_date: v('df-due') || null, is_important: v('df-imp') === 'true',
        created_by: CU.id
      };
      if (!d.subject || !d.title || !d.class || !d.section) { toast('Fill required fields', 'err'); return; }
      const res = id ? await PUT('/diary/'+id, d) : await POST('/diary', d);
      if (res?.ok !== false) { closeModal(); toast(id ? 'Updated!' : 'Diary entry added!', 'ok'); await render(v('dc')||cls, v('ds')||sec, v('dd')||date); }
      else toast('Error: ' + (res?.error || 'Failed'), 'err');
    };

    window.delDiary = async (id) => {
      if (!confirm('Delete this diary entry?')) return;
      await DEL('/diary/' + id);
      toast('Deleted');
      await render(v('dc')||cls, v('ds')||sec, v('dd')||date);
    };
  };

  await render();
}

// ── DIARIES ────────────────────────────────────────────────────────────────
async function secDiary(c) {
  const canEdit = CU.role === 'admin' || CU.role === 'teacher';
  const render = async (cls = CLS[0]?.name || '', sec = '', date = '') => {
    const params = new URLSearchParams();
    if (cls) params.set('cls', cls);
    if (sec) params.set('section', sec);
    if (date) params.set('date', date);
    const entries = await GET('/diaries?' + params) || [];
    const subjects = ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'Computer'];
    c.innerHTML = `
      ${canEdit ? `<div class="card">
        <div class="card-title">Add Homework Entry</div>
        <div class="fg">
          <div class="field"><label>Date *</label><input type="date" id="di-date" value="${td()}"></div>
          <div class="field"><label>Class *</label><select id="di-cls" onchange="updDiarySec()">${clsOpts('', false)}</select></div>
          <div class="field"><label>Section *</label><select id="di-sec">${CLS[0] ? secOpts(CLS[0].name, '') : ''}</select></div>
          <div class="field"><label>Subject *</label>
            <select id="di-sub">
              ${subjects.map(s => `<option>${s}</option>`).join('')}
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div class="field"><label>Homework / Task *</label><textarea id="di-hw" rows="3" placeholder="e.g. Complete exercise 5 page 42, Read chapter 3..."></textarea></div>
        <div class="field"><label>Note (optional)</label><input id="di-note" placeholder="e.g. Will be checked tomorrow, bring textbook..."></div>
        <button class="btn bp" onclick="saveDiary()">Post Homework</button>
      </div>` : ''}
      <div class="card">
        <div class="card-title">Class Diary
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <select id="df-cls" onchange="rDiary()">${clsOpts(cls)}</select>
            <select id="df-sec" onchange="rDiary()"><option value="">All Sections</option>${cls ? secOpts(cls, sec) : ''}</select>
            <input type="date" id="df-date" value="${date}" onchange="rDiary()" style="padding:6px 10px;border:1px solid var(--border2);border-radius:var(--r);font-size:12px;">
            <button class="btn bs" onclick="document.getElementById('df-date').value='';rDiary()">Clear Date</button>
          </div>
        </div>
        ${entries.length === 0
          ? '<p style="color:#9ca3af;font-size:12px;padding:10px 0;">No homework entries found. Select a class to view diary.</p>'
          : entries.map(e => `
          <div style="border:1px solid var(--border);border-radius:var(--r);padding:12px 14px;margin-bottom:10px;background:var(--bg3);">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
              <div style="display:flex;align-items:center;gap:8px;">
                ${chip(e.subject, 'blue')}
                ${chip('Class ' + e.class + '-' + e.section, 'gray')}
                <span style="font-size:11px;color:var(--text2);">${e.date}</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:11px;color:var(--text2);">By: ${e.created_by_name}</span>
                ${canEdit ? `<button class="btn bs bd" onclick="delDiary('${e.id}')">Delete</button>` : ''}
              </div>
            </div>
            <div style="font-size:13px;font-weight:500;color:var(--text);margin-bottom:4px;">${e.homework}</div>
            ${e.note ? `<div style="font-size:12px;color:var(--text2);margin-top:4px;">📌 ${e.note}</div>` : ''}
          </div>`).join('')
        }
      </div>`;

    window.updDiarySec = () => {
      const el = document.getElementById('di-sec');
      if (el) el.innerHTML = secOpts(v('di-cls'), '');
    };
    window.rDiary = async () => {
      const cls = v('df-cls');
      const secEl = document.getElementById('df-sec');
      if (secEl && cls) secEl.innerHTML = '<option value="">All Sections</option>' + secOpts(cls, '');
      await render(cls, v('df-sec'), v('df-date'));
    };
    window.saveDiary = async () => {
      const d = {
        date: v('di-date'), class: v('di-cls'), section: v('di-sec'),
        subject: v('di-sub'), homework: v('di-hw'), note: v('di-note'),
        created_by: CU.id
      };
      if (!d.date || !d.class || !d.section || !d.homework) { toast('Fill required fields', 'err'); return; }
      const res = await POST('/diaries', d);
      if (res?.ok !== false) {
        document.getElementById('di-hw').value = '';
        document.getElementById('di-note').value = '';
        toast('Homework posted!', 'ok');
        render(v('df-cls'), v('df-sec'), v('df-date'));
      } else toast('Error: ' + (res?.error || 'Failed'), 'err');
    };
    window.delDiary = async (id) => {
      if (!confirm('Delete this homework entry?')) return;
      await DEL('/diaries/' + id);
      toast('Deleted');
      render(v('df-cls'), v('df-sec'), v('df-date'));
    };
  };
  await render();
}

// ── DIARY ──────────────────────────────────────────────────────────────────
async function secDiary(c) {
  const canEdit = CU.role === 'admin' || CU.role === 'teacher';
  const fc = CLS[0]?.name || '9';
  const fs = secList(fc)[0] || 'A';

  const render = async (cls=fc, sec=fs, date=td()) => {
    const params = new URLSearchParams({ cls, section: sec, date });
    const entries = await GET('/diary?' + params) || [];
    const secHTML = secList(cls).map(s => `<option value="${s}" ${s===sec?'selected':''}>${s}</option>`).join('');

    c.innerHTML = `
    <div class="card">
      <div class="card-title">
        Class Diary
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${canEdit ? `<button class="btn bp" onclick="addDiaryEntry('${cls}','${sec}','${date}')">+ Add Homework</button>` : ''}
        </div>
      </div>
      <div class="frow" style="margin-bottom:14px;">
        <select id="dc" onchange="rDiary()">
          ${CLS.map(cl=>`<option value="${cl.name}" ${cl.name===cls?'selected':''}>Class ${cl.name}</option>`).join('')}
        </select>
        <select id="ds" onchange="rDiary()">
          ${secHTML}
        </select>
        <input id="dd" type="date" value="${date}" onchange="rDiary()">
        <button class="btn" onclick="rDiary()">View</button>
      </div>

      ${entries.length === 0 ?
        `<div style="text-align:center;padding:40px 20px;color:#9ca3af;">
          <div style="font-size:32px;margin-bottom:10px;">📖</div>
          <div style="font-size:14px;font-weight:500;margin-bottom:4px;">No diary entries for this date</div>
          <div style="font-size:12px;">${canEdit ? 'Click "+ Add Homework" to add entries' : 'No homework assigned for today'}</div>
        </div>` :
        `<div style="display:flex;flex-direction:column;gap:12px;">
          ${entries.map(e => `
          <div style="border:1px solid var(--border);border-radius:var(--rl);overflow:hidden;">
            <div style="background:${subjectColor(e.subject)};padding:10px 14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;">${subjectEmoji(e.subject)}</span>
                <div>
                  <div style="font-size:13px;font-weight:600;color:var(--text);">${e.subject}</div>
                  <div style="font-size:11px;color:var(--text2);">Class ${e.class}-${e.section} · ${e.date} · By ${e.teacher_name||'Teacher'}</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                ${e.due_date ? `<span class="chip chip-amber">Due: ${e.due_date}</span>` : ''}
                ${chip(e.type||'Homework', e.type==='Test'?'red':e.type==='Project'?'purple':'blue')}
                ${canEdit ? `
                  <button class="btn bs" onclick="editDiaryEntry('${e.id}','${e.subject}','${e.class}','${e.section}','${e.date}')">Edit</button>
                  <button class="btn bs bd" onclick="delDiaryEntry('${e.id}')">Del</button>
                ` : ''}
              </div>
            </div>
            <div style="padding:12px 14px;background:var(--bg2);">
              <div style="font-size:13px;color:var(--text);line-height:1.6;white-space:pre-wrap;">${e.homework}</div>
              ${e.note ? `<div style="margin-top:8px;padding:8px 10px;background:var(--amber-l);border-radius:var(--r);font-size:12px;color:var(--amber);">📌 Note: ${e.note}</div>` : ''}
            </div>
          </div>`).join('')}
        </div>`
      }
    </div>

    <div class="card">
      <div class="card-title">Weekly Overview — ${date.slice(0,7)}</div>
      ${await diaryWeekly(cls, sec, date.slice(0,7))}
    </div>`;
  };

  window.rDiary = async () => {
    const cls = v('dc');
    const secEl = document.getElementById('ds');
    const sl = secList(cls);
    if (secEl) secEl.innerHTML = sl.map(s=>`<option value="${s}">${s}</option>`).join('');
    await render(cls, sl[0], v('dd'));
  };

  const diaryForm = (e={}) => `
    <div class="field"><label>Subject *</label>
      <select id="df-sub">
        ${['English','Mathematics','Physics','Chemistry','Biology','Urdu','Islamiat','Pakistan Studies','Computer','Geography','History','Other'].map(s=>`<option value="${s}" ${(e.subject||'')=== s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
    <div class="fg">
      <div class="field"><label>Class *</label>
        <select id="df-cls" onchange="updDiarySec()">${clsOpts(e.class||fc, false)}</select>
      </div>
      <div class="field"><label>Section *</label>
        <select id="df-sec">${secOpts(e.class||fc, e.section||fs)}</select>
      </div>
    </div>
    <div class="fg">
      <div class="field"><label>Date *</label>
        <input type="date" id="df-date" value="${e.date||td()}">
      </div>
      <div class="field"><label>Due Date (optional)</label>
        <input type="date" id="df-due" value="${e.due_date||''}">
      </div>
    </div>
    <div class="field"><label>Type</label>
      <select id="df-type">
        <option value="Homework" ${(e.type||'Homework')==='Homework'?'selected':''}>Homework</option>
        <option value="Test" ${e.type==='Test'?'selected':''}>Test / Quiz</option>
        <option value="Project" ${e.type==='Project'?'selected':''}>Project</option>
        <option value="Classwork" ${e.type==='Classwork'?'selected':''}>Classwork</option>
        <option value="Reading" ${e.type==='Reading'?'selected':''}>Reading</option>
      </select>
    </div>
    <div class="field"><label>Homework / Task *</label>
      <textarea id="df-hw" rows="4" placeholder="e.g. Complete Exercise 5.1, Questions 1 to 10 from the textbook...">${e.homework||''}</textarea>
    </div>
    <div class="field"><label>Teacher Note (optional)</label>
      <input id="df-note" placeholder="e.g. Bring geometry box tomorrow" value="${e.note||''}">
    </div>`;

  window.addDiaryEntry = (cls, sec, date) => {
    openModal('Add Diary Entry', diaryForm({class:cls, section:sec, date}),
      `<button class="btn" onclick="closeModal()">Cancel</button>
       <button class="btn bp" onclick="saveDiaryEntry()">Save Entry</button>`);
  };

  window.editDiaryEntry = async (id, subject, cls, sec, date) => {
    const entries = await GET(`/diary?cls=${cls}&section=${sec}&date=${date}`) || [];
    const e = entries.find(x => x.id === id) || { id, subject, class:cls, section:sec, date };
    openModal('Edit Diary Entry', diaryForm(e),
      `<button class="btn" onclick="closeModal()">Cancel</button>
       <button class="btn bp" onclick="saveDiaryEntry('${id}')">Update</button>`);
  };

  window.updDiarySec = () => {
    const el = document.getElementById('df-sec');
    if (el) el.innerHTML = secOpts(v('df-cls'), '');
  };

  window.saveDiaryEntry = async (id) => {
    const d = {
      subject:   v('df-sub'),
      class:     v('df-cls'),
      section:   v('df-sec'),
      date:      v('df-date'),
      due_date:  v('df-due') || null,
      type:      v('df-type'),
      homework:  v('df-hw'),
      note:      v('df-note'),
      created_by: CU.id,
    };
    if (!d.subject || !d.class || !d.section || !d.homework) {
      toast('Fill all required fields', 'err'); return;
    }
    const res = id ? await PUT('/diary/' + id, d) : await POST('/diary', d);
    if (res?.ok !== false) {
      closeModal();
      toast(id ? 'Updated!' : 'Diary entry added!', 'ok');
      await render(v('dc') || d.class, v('ds') || d.section, v('dd') || d.date);
    } else {
      toast('Error saving entry', 'err');
    }
  };

  window.delDiaryEntry = async (id) => {
    if (!confirm('Delete this diary entry?')) return;
    await DEL('/diary/' + id);
    toast('Deleted');
    rDiary();
  };

  await render();
}

// Diary weekly summary
async function diaryWeekly(cls, sec, month) {
  const entries = await GET(`/diary?cls=${cls}&section=${sec}&month=${month}`) || [];
  if (!entries.length) return '<p style="color:#9ca3af;font-size:12px;">No entries this month.</p>';

  // Group by date
  const byDate = {};
  entries.forEach(e => {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  const dates = Object.keys(byDate).sort().reverse();
  return `<div style="display:flex;flex-direction:column;gap:8px;">
    ${dates.slice(0,7).map(date => `
    <div style="border:1px solid var(--border);border-radius:var(--r);overflow:hidden;">
      <div style="padding:8px 12px;background:var(--bg3);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:12px;font-weight:600;">${formatDate(date)}</span>
        <span class="chip chip-blue">${byDate[date].length} subject${byDate[date].length>1?'s':''}</span>
      </div>
      <div style="padding:8px 12px;display:flex;flex-wrap:wrap;gap:6px;">
        ${byDate[date].map(e=>`
          <div style="display:flex;align-items:center;gap:6px;padding:4px 10px;background:var(--bg3);border-radius:20px;font-size:12px;">
            <span>${subjectEmoji(e.subject)}</span>
            <span>${e.subject}</span>
            ${chip(e.type||'Homework', e.type==='Test'?'red':e.type==='Project'?'purple':'blue')}
          </div>`).join('')}
      </div>
    </div>`).join('')}
  </div>`;
}

// Diary helper functions
function subjectEmoji(subject) {
  const map = {
    'English':'📝', 'Mathematics':'🔢', 'Physics':'⚡', 'Chemistry':'🧪',
    'Biology':'🌿', 'Urdu':'✒️', 'Islamiat':'☪️', 'Pakistan Studies':'🗺️',
    'Computer':'💻', 'Geography':'🌍', 'History':'📜', 'Other':'📚'
  };
  return map[subject] || '📚';
}

function subjectColor(subject) {
  const map = {
    'English':'#f0f9ff', 'Mathematics':'#f0fdf4', 'Physics':'#fefce8',
    'Chemistry':'#fdf4ff', 'Biology':'#f0fdf4', 'Urdu':'#fff7ed',
    'Islamiat':'#f0fdf4', 'Pakistan Studies':'#eff6ff', 'Computer':'#f8fafc',
    'Geography':'#ecfdf5', 'History':'#fef9c3', 'Other':'#f9fafb'
  };
  return map[subject] || '#f9fafb';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PK', { weekday:'long', day:'numeric', month:'long' });
}

// ── DIARY ──────────────────────────────────────────────────────────────────
async function secDiary(c) {
  const canEdit = CU.role === 'admin' || CU.role === 'teacher';
  const fc = CLS[0]?.name || '9';
  const fs = secList(fc)[0] || 'A';

  const render = async (cls=fc, sec=fs, month=mon()) => {
    const entries = await GET(`/diary?cls=${cls}&section=${sec}&month=${month}`) || [];

    // group by date
    const byDate = {};
    entries.forEach(e => {
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    });
    const dates = Object.keys(byDate).sort((a,b) => b.localeCompare(a));

    const subjectColors = {
      'English':'blue','Mathematics':'green','Physics':'amber',
      'Chemistry':'purple','Biology':'green','Urdu':'red',
      'Islamiat':'green','Pakistan Studies':'amber','Computer':'blue',
    };
    const getColor = sub => {
      for (const key of Object.keys(subjectColors)) {
        if (sub.toLowerCase().includes(key.toLowerCase())) return subjectColors[key];
      }
      return 'gray';
    };

    c.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
        <div class="frow" style="margin:0;flex:1;">
          <select id="dcl" onchange="rDiary()" style="max-width:140px;">
            ${CLS.map(cl=>`<option value="${cl.name}" ${cl.name===cls?'selected':''}>Class ${cl.name}</option>`).join('')}
          </select>
          <select id="dse" onchange="rDiary()" style="max-width:100px;">
            ${secList(cls).map(s=>`<option value="${s}" ${s===sec?'selected':''}>${s}</option>`).join('')}
          </select>
          <input id="dmo" type="month" value="${month}" onchange="rDiary()" style="max-width:160px;">
        </div>
        ${canEdit ? `<button class="btn bp" onclick="addDiaryModal('${cls}','${sec}')">+ Add Homework</button>` : ''}
      </div>

      ${dates.length === 0 ? `
        <div style="text-align:center;padding:40px;background:var(--bg2);border-radius:var(--rl);border:1px solid var(--border);">
          <div style="font-size:32px;margin-bottom:10px;">📖</div>
          <div style="font-size:14px;font-weight:600;color:var(--text);">No diary entries yet</div>
          <div style="font-size:12px;color:var(--text2);margin-top:4px;">
            ${canEdit ? 'Click "+ Add Homework" to post homework for students.' : 'No homework posted yet for this class.'}
          </div>
        </div>` :

        dates.map(date => {
          const dayEntries = byDate[date];
          const dayName = new Date(date).toLocaleDateString('en-PK', {weekday:'long',year:'numeric',month:'long',day:'numeric'});
          return `
          <div class="card" style="margin-bottom:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);">
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--text);">${dayName}</div>
                <div style="font-size:11px;color:var(--text2);">Class ${cls}-${sec} · ${dayEntries.length} subject${dayEntries.length>1?'s':''}</div>
              </div>
              ${canEdit ? `<button class="btn bp bs" onclick="addDiaryModal('${cls}','${sec}','${date}')">+ Add</button>` : ''}
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;">
              ${dayEntries.map(e => `
                <div style="border:1px solid var(--border);border-radius:var(--r);padding:12px;border-left:4px solid var(--${getSubjectBorderColor(e.subject)});">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                    <span class="chip chip-${getColor(e.subject)}" style="font-size:11px;">${e.subject}</span>
                    ${canEdit ? `
                      <div style="display:flex;gap:4px;">
                        <button class="btn bs" onclick="editDiaryModal('${e.id}','${e.subject}','${e.date}','${e.due_date||''}','${cls}','${sec}')" style="padding:2px 7px;font-size:10px;">Edit</button>
                        <button class="btn bs bd" onclick="delDiary('${e.id}')" style="padding:2px 7px;font-size:10px;">Del</button>
                      </div>` : ''}
                  </div>
                  <div style="font-size:13px;color:var(--text);line-height:1.5;margin-bottom:6px;">${e.homework}</div>
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;">
                    ${e.due_date ? `<span style="font-size:11px;color:var(--red);font-weight:500;">📅 Due: ${new Date(e.due_date).toLocaleDateString('en-PK',{month:'short',day:'numeric'})}</span>` : '<span></span>'}
                    <span style="font-size:10px;color:var(--text3);">By ${e.created_by_name||'Teacher'}</span>
                  </div>
                </div>`).join('')}
            </div>
          </div>`;
        }).join('')
      }`;
  };

  function getSubjectBorderColor(sub) {
    const s = (sub||'').toLowerCase();
    if (s.includes('math')) return '--green';
    if (s.includes('english')) return '--blue';
    if (s.includes('physics')) return '--amber';
    if (s.includes('chemistry')) return '--purple';
    if (s.includes('urdu')) return '--red';
    return '--border2';
  }

  window.rDiary = async () => {
    const cls = v('dcl');
    const sel = document.getElementById('dse');
    const sl = secList(cls);
    if (sel) sel.innerHTML = sl.map(s=>`<option value="${s}">${s}</option>`).join('');
    await render(cls, sl[0], v('dmo'));
  };

  window.addDiaryModal = (cls, sec, date='') => {
    openModal('Add Homework',
      `<div class="field"><label>Class</label><input value="Class ${cls}-${sec}" disabled></div>
       <div class="field"><label>Subject *</label>
         <select id="dw-sub">
           <option>English</option><option>Mathematics</option><option>Physics</option>
           <option>Chemistry</option><option>Biology</option><option>Urdu</option>
           <option>Islamiat</option><option>Pakistan Studies</option><option>Computer</option>
           <option>Other</option>
         </select>
       </div>
       <div class="field"><label>Date *</label><input type="date" id="dw-date" value="${date||td()}"></div>
       <div class="field"><label>Due Date (optional)</label><input type="date" id="dw-due"></div>
       <div class="field"><label>Homework / Task *</label>
         <textarea id="dw-hw" rows="4" placeholder="Write homework details here e.g. Read chapter 5 and answer questions 1-5 on page 42..."></textarea>
       </div>`,
      `<button class="btn" onclick="closeModal()">Cancel</button>
       <button class="btn bp" onclick="saveDiary('${cls}','${sec}')">Post Homework</button>`
    );
  };

  window.editDiaryModal = (id, subject, date, dueDate, cls, sec) => {
    openModal('Edit Homework',
      `<div class="field"><label>Subject *</label>
         <select id="dw-sub">
           ${['English','Mathematics','Physics','Chemistry','Biology','Urdu','Islamiat','Pakistan Studies','Computer','Other']
             .map(s=>`<option ${s===subject?'selected':''}>${s}</option>`).join('')}
         </select>
       </div>
       <div class="field"><label>Date *</label><input type="date" id="dw-date" value="${date}"></div>
       <div class="field"><label>Due Date</label><input type="date" id="dw-due" value="${dueDate||''}"></div>
       <div class="field"><label>Homework *</label><textarea id="dw-hw" rows="4"></textarea></div>`,
      `<button class="btn" onclick="closeModal()">Cancel</button>
       <button class="btn bp" onclick="updateDiary('${id}','${cls}','${sec}')">Update</button>`
    );
    // fill textarea after modal opens
    setTimeout(() => {
      const el = document.getElementById('dw-hw');
      if (el) {
        const entry = entries?.find ? entries.find(e=>e.id===id) : null;
        if (entry) el.value = entry.homework;
      }
    }, 100);
  };

  window.saveDiary = async (cls, sec) => {
    const subject = v('dw-sub');
    const date    = v('dw-date');
    const due     = v('dw-due');
    const hw      = document.getElementById('dw-hw')?.value?.trim();
    if (!subject || !date || !hw) { toast('Fill all required fields', 'err'); return; }
    const res = await POST('/diary', {
      class: cls, section: sec, subject, date,
      due_date: due || null,
      homework: hw,
      created_by_name: CU.name
    });
    if (res?.ok !== false) {
      closeModal();
      toast('Homework posted!', 'ok');
      await render(cls, sec, v('dmo') || mon());
    } else {
      toast('Error posting homework', 'err');
    }
  };

  window.updateDiary = async (id, cls, sec) => {
    const hw = document.getElementById('dw-hw')?.value?.trim();
    if (!hw) { toast('Enter homework', 'err'); return; }
    await PUT('/diary/' + id, {
      subject: v('dw-sub'), date: v('dw-date'),
      due_date: v('dw-due') || null, homework: hw
    });
    closeModal();
    toast('Updated!', 'ok');
    await render(cls, sec, v('dmo') || mon());
  };

  window.delDiary = async (id) => {
    if (!confirm('Delete this homework entry?')) return;
    await DEL('/diary/' + id);
    toast('Deleted');
    await render(v('dcl') || fc, v('dse') || fs, v('dmo') || mon());
  };

  // store entries for edit
  let entries = [];
  const origRender = render;
  await render();
}

// ── NOTIFICATIONS PAGE (Parent + Student) ──────────────────────────────────
async function secNotifications(c) {
  let pushStatus = 'Not supported';
  let pushBtnText = 'Enable Notifications';
  let pushEnabled = false;

  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      pushStatus = 'Enabled';
      pushBtnText = 'Send Test Notification';
      pushEnabled = true;
    } else if (Notification.permission === 'denied') {
      pushStatus = 'Blocked';
    } else {
      pushStatus = 'Not enabled yet';
    }
  }

  c.innerHTML = `
  <div class="card">
    <div class="card-title">Push Notifications</div>

    <div style="padding:16px;background:${pushEnabled?'var(--green-l)':'var(--blue-l)'};border-radius:var(--r);margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
      <div>
        <div style="font-size:14px;font-weight:600;color:${pushEnabled?'var(--green)':'var(--blue-t)'};">
          ${pushEnabled ? '✅ Notifications are ON' : '🔔 Enable Notifications'}
        </div>
        <div style="font-size:12px;color:var(--text2);margin-top:4px;">
          Status: <strong>${pushStatus}</strong>
        </div>
      </div>
      ${Notification.permission !== 'denied' ? `
        <button class="btn bp" onclick="togglePushNotif()" id="push-btn">
          ${pushEnabled ? 'Send Test' : 'Enable Now'}
        </button>` :
        `<div style="font-size:12px;color:var(--red);">
          Notifications blocked. Click 🔒 in browser address bar to allow.
        </div>`
      }
    </div>

    <div style="margin-bottom:14px;">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;">What notifications will you receive?</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg3);border-radius:var(--r);">
          <span style="font-size:20px;">🔴</span>
          <div>
            <div style="font-size:13px;font-weight:500;">Absence Alert</div>
            <div style="font-size:12px;color:var(--text2);">Instant notification when your child is marked absent</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg3);border-radius:var(--r);">
          <span style="font-size:20px;">📢</span>
          <div>
            <div style="font-size:13px;font-weight:500;">Announcements</div>
            <div style="font-size:12px;color:var(--text2);">School notices, exam schedules and important updates</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg3);border-radius:var(--r);">
          <span style="font-size:20px;">📚</span>
          <div>
            <div style="font-size:13px;font-weight:500;">Homework Diary</div>
            <div style="font-size:12px;color:var(--text2);">New homework posted by teachers</div>
          </div>
        </div>
      </div>
    </div>

    <div style="padding:12px;background:var(--bg3);border-radius:var(--r);font-size:12px;color:var(--text2);">
      <strong>How to install EduMatrix on your phone:</strong><br>
      Android: Open in Chrome → tap 3 dots menu → "Add to Home Screen"<br>
      iPhone: Open in Safari → tap Share → "Add to Home Screen"
    </div>
  </div>`;

  window.togglePushNotif = async () => {
    if (Notification.permission === 'granted') {
      const res = await POST('/push/test', {
        user_id: CU.id,
        title: '🔔 EduMatrix Alert',
        body: 'Notifications are working! You will be notified when your child is absent.'
      });
      if (res?.ok !== false) toast('Test notification sent to your phone!', 'ok');
      else toast('Error — please try again', 'err');
    } else {
      await subscribeToPush();
      toast('Notifications enabled!', 'ok');
      secNotifications(c);
    }
  };
}
