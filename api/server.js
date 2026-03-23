const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001';

webpush.setVapidDetails(
  'mailto:admin@edumatrix.pk',
  process.env.VAPID_PUBLIC_KEY || 'BKNbHEw95d4wgaP4m0njpXbPcGRrFC7Wy5aEV4s_XrwGA0gQOr0rJUcoHNLA_NwD0y-i9vUNspPWoPv6etOcj6c',
  process.env.VAPID_PRIVATE_KEY || 'rENa_MqBxGDBBI3C2affiw1fDgBZFX-bCT_OxYICB8U'
);

// ── AUTH ───────────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const { data, error } = await supabase
    .from('users')
    .select('id, name, role, username, contact')
    .eq('school_id', SCHOOL_ID)
    .eq('username', username)
    .eq('password', password)
    .single();
  if (error || !data) return res.json({ ok: false });

  let linked_student = null;
  if (data.role === 'student') {
    const { data: stu } = await supabase.from('students').select('*')
      .eq('school_id', SCHOOL_ID).eq('student_user_id', data.id).single();
    linked_student = stu || null;
  }
  if (data.role === 'parent') {
    const { data: stu } = await supabase.from('students').select('*')
      .eq('school_id', SCHOOL_ID).eq('parent_user_id', data.id).single();
    linked_student = stu || null;
  }
  res.json({ ok: true, user: { ...data, linked_student } });
});

// ── STUDENTS ───────────────────────────────────────────────────────────────
app.get('/api/students', async (req, res) => {
  const { search, cls, section } = req.query;
  let q = supabase.from('students').select('*').eq('school_id', SCHOOL_ID)
    .order('class').order('section').order('roll_no');
  if (search) q = q.or(`name.ilike.%${search}%,roll_no.ilike.%${search}%`);
  if (cls) q = q.eq('class', cls);
  if (section) q = q.eq('section', section);
  const { data, error } = await q;
  res.json(error ? [] : data);
});

app.post('/api/students', async (req, res) => {
  const { data, error } = await supabase.from('students')
    .insert({ ...req.body, school_id: SCHOOL_ID }).select().single();
  res.json(error ? { ok: false, error: error.message } : { ok: true, data });
});

app.put('/api/students/:id', async (req, res) => {
  const { error } = await supabase.from('students').update(req.body)
    .eq('id', req.params.id).eq('school_id', SCHOOL_ID);
  res.json(error ? { ok: false, error: error.message } : { ok: true });
});

app.delete('/api/students/:id', async (req, res) => {
  const { error } = await supabase.from('students').delete()
    .eq('id', req.params.id).eq('school_id', SCHOOL_ID);
  res.json(error ? { ok: false } : { ok: true });
});

app.get('/api/students/:id', async (req, res) => {
  const { data } = await supabase.from('students').select('*')
    .eq('id', req.params.id).single();
  res.json(data || null);
});

// ── ATTENDANCE ─────────────────────────────────────────────────────────────
app.get('/api/attendance/student', async (req, res) => {
  const { student_id, month } = req.query;
  const { data } = await supabase.from('attendance').select('*')
    .eq('school_id', SCHOOL_ID).eq('student_id', student_id)
    .gte('date', month + '-01').lte('date', month + '-31')
    .order('date', { ascending: false });
  res.json(data || []);
});

app.get('/api/attendance', async (req, res) => {
  const { cls, section, date } = req.query;
  const { data: students } = await supabase.from('students')
    .select('id, roll_no, name').eq('school_id', SCHOOL_ID)
    .eq('class', cls).eq('section', section).order('roll_no');
  const { data: att } = await supabase.from('attendance').select('*')
    .eq('school_id', SCHOOL_ID).eq('date', date);
  const attMap = {};
  (att || []).forEach(a => attMap[a.student_id] = a);
  const result = (students || []).map(s => ({
    ...s,
    status: attMap[s.id]?.status || null,
    note: attMap[s.id]?.note || ''
  }));
  res.json(result);
});

app.post('/api/attendance', async (req, res) => {
  const { records, date } = req.body;
  const upserts = records.map(r => ({
    school_id: SCHOOL_ID, student_id: r.student_id,
    date, status: r.status, note: r.note || ''
  }));
  const { error } = await supabase.from('attendance')
    .upsert(upserts, { onConflict: 'school_id,student_id,date' });

  const absent = records.filter(r => r.status === 'Absent');
  for (const a of absent) {
    const { data: stu } = await supabase.from('students')
      .select('name, parent_contact, parent_user_id, callmebot_key')
      .eq('id', a.student_id).single();
    if (stu) {
      // Send SMS
      if (stu.parent_contact) {
        await sendSMS(stu.parent_contact,
          `Dear Parent, your child ${stu.name} was ABSENT on ${date}. - EduMatrix School`);
      }
      // Send Push Notification
      if (stu.parent_user_id) {
        await sendPushToUser(
          stu.parent_user_id,
          `🔴 Absence Alert — ${stu.name}`,
          `Your child ${stu.name} was marked ABSENT today (${date}). Please contact school if needed.`
        );
      }
      // Send WhatsApp via CallMeBot
      if (stu.parent_contact && stu.callmebot_key) {
        await sendWhatsApp(
          stu.parent_contact,
          stu.callmebot_key,
          `🔴 Absence Alert!\n\nDear Parent, your child *${stu.name}* was marked *ABSENT* today (${date}).\n\nPlease contact school if needed.\n\n— EduMatrix School\nPowered by Zyveron Technologies`
        );
      }
    }
  }
  res.json(error ? { ok: false } : { ok: true });
});

app.get('/api/attendance/summary', async (req, res) => {
  const { cls, section, month } = req.query;
  const { data: students } = await supabase.from('students')
    .select('id, roll_no, name').eq('school_id', SCHOOL_ID)
    .eq('class', cls).eq('section', section).order('roll_no');
  const { data: att } = await supabase.from('attendance')
    .select('student_id, status').eq('school_id', SCHOOL_ID)
    .gte('date', month + '-01').lte('date', month + '-31');
  const summary = (students || []).map(s => {
    const rows = (att || []).filter(a => a.student_id === s.id);
    return {
      ...s,
      present: rows.filter(r => r.status === 'Present').length,
      absent: rows.filter(r => r.status === 'Absent').length,
      late: rows.filter(r => r.status === 'Late').length,
      total_days: rows.length
    };
  });
  res.json(summary);
});

// ── FEES ───────────────────────────────────────────────────────────────────
app.get('/api/fees/student', async (req, res) => {
  const { student_id } = req.query;
  const { data } = await supabase.from('fees').select('*')
    .eq('school_id', SCHOOL_ID).eq('student_id', student_id)
    .order('month', { ascending: false });
  res.json(data || []);
});

app.get('/api/fees', async (req, res) => {
  const { cls, month } = req.query;
  let q = supabase.from('fees').select('*, students(name, roll_no, class, section)')
    .eq('school_id', SCHOOL_ID);
  if (month) q = q.eq('month', month);
  const { data, error } = await q;
  if (error) return res.json([]);
  let result = data.map(f => ({
    ...f, name: f.students?.name, roll_no: f.students?.roll_no,
    class: f.students?.class, section: f.students?.section
  }));
  if (cls) result = result.filter(f => f.class === cls);
  res.json(result);
});

app.post('/api/fees/upsert', async (req, res) => {
  const { error } = await supabase.from('fees')
    .upsert({ ...req.body, school_id: SCHOOL_ID }, { onConflict: 'school_id,student_id,month' });
  res.json(error ? { ok: false, error: error.message } : { ok: true });
});

app.post('/api/fees/generate', async (req, res) => {
  const { month, amount_due, cls } = req.body;
  let q = supabase.from('students').select('id').eq('school_id', SCHOOL_ID).eq('status', 'Active');
  if (cls) q = q.eq('class', cls);
  const { data: students } = await q;
  const rows = (students || []).map(s => ({
    school_id: SCHOOL_ID, student_id: s.id, month, amount_due, amount_paid: 0
  }));
  const { error } = await supabase.from('fees')
    .upsert(rows, { onConflict: 'school_id,student_id,month', ignoreDuplicates: true });
  res.json(error ? { ok: false } : { ok: true, count: rows.length });
});

// ── ANNOUNCEMENTS ──────────────────────────────────────────────────────────
app.get('/api/announcements', async (req, res) => {
  const { data } = await supabase.from('announcements').select('*')
    .eq('school_id', SCHOOL_ID).order('created_at', { ascending: false });
  res.json(data || []);
});

app.post('/api/announcements', async (req, res) => {
  const { data, error } = await supabase.from('announcements')
    .insert({ ...req.body, school_id: SCHOOL_ID }).select().single();
  if (!error && data) {
    await sendPushToRole('student', '📢 School Notice — ' + data.title, data.body || 'Tap to view in EduMatrix app.');
    await sendPushToRole('parent',  '📢 School Notice — ' + data.title, data.body || 'Tap to view in EduMatrix app.');
    await sendPushToRole('teacher', '📢 New Announcement — ' + data.title, data.body || 'Tap to view in EduMatrix app.');
  }
  res.json(error ? { ok: false } : { ok: true, data });
});

app.delete('/api/announcements/:id', async (req, res) => {
  await supabase.from('announcements').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

// ── PAPERS ─────────────────────────────────────────────────────────────────
app.get('/api/papers', async (req, res) => {
  const { cls } = req.query;
  let q = supabase.from('papers').select('*').eq('school_id', SCHOOL_ID).order('exam_date');
  if (cls) q = q.eq('class', cls);
  const { data } = await q;
  res.json(data || []);
});

app.post('/api/papers', async (req, res) => {
  const { data, error } = await supabase.from('papers')
    .insert({ ...req.body, school_id: SCHOOL_ID }).select().single();
  res.json(error ? { ok: false } : { ok: true, data });
});

app.delete('/api/papers/:id', async (req, res) => {
  await supabase.from('papers').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

// ── RESULTS ────────────────────────────────────────────────────────────────
app.get('/api/results/student', async (req, res) => {
  const { student_id } = req.query;
  const { data } = await supabase.from('results')
    .select('*, papers(subject, total_marks, exam_date, class)')
    .eq('school_id', SCHOOL_ID).eq('student_id', student_id);
  res.json(data || []);
});

app.get('/api/results', async (req, res) => {
  const { cls, section, paper_id } = req.query;
  const { data: students } = await supabase.from('students')
    .select('id, roll_no, name').eq('school_id', SCHOOL_ID)
    .eq('class', cls).eq('section', section).order('roll_no');
  const { data: paper } = await supabase.from('papers')
    .select('total_marks').eq('id', paper_id).single();
  const { data: results } = await supabase.from('results')
    .select('student_id, marks_obtained').eq('paper_id', paper_id).eq('school_id', SCHOOL_ID);
  const resMap = {};
  (results || []).forEach(r => resMap[r.student_id] = r.marks_obtained);
  const out = (students || []).map(s => ({
    ...s, marks_obtained: resMap[s.id] || 0, total_marks: paper?.total_marks || 100
  }));
  res.json(out);
});

app.post('/api/results', async (req, res) => {
  const { records, paper_id } = req.body;
  const rows = records.map(r => ({
    school_id: SCHOOL_ID, student_id: r.student_id,
    paper_id, marks_obtained: r.marks_obtained
  }));
  const { error } = await supabase.from('results')
    .upsert(rows, { onConflict: 'school_id,student_id,paper_id' });
  res.json(error ? { ok: false } : { ok: true });
});

app.get('/api/results/report', async (req, res) => {
  const { cls, section } = req.query;
  const { data: students } = await supabase.from('students').select('*')
    .eq('school_id', SCHOOL_ID).eq('class', cls).eq('section', section).order('roll_no');
  const { data: papers } = await supabase.from('papers').select('*')
    .eq('school_id', SCHOOL_ID).eq('class', cls).order('exam_date');
  const { data: results } = await supabase.from('results')
    .select('student_id, paper_id, marks_obtained').eq('school_id', SCHOOL_ID);
  const out = (students || []).map(s => {
    const scores = (papers || []).map(p => {
      const r = (results || []).find(x => x.student_id === s.id && x.paper_id === p.id);
      return p.subject + ':' + (r ? r.marks_obtained : 0) + '/' + p.total_marks;
    }).join(',');
    return { ...s, scores };
  });
  res.json(out);
});

// ── CLASSES ────────────────────────────────────────────────────────────────
app.get('/api/classes', async (req, res) => {
  const { data } = await supabase.from('classes').select('*')
    .eq('school_id', SCHOOL_ID).order('name');
  res.json(data || []);
});

app.post('/api/classes', async (req, res) => {
  const { data, error } = await supabase.from('classes')
    .insert({ ...req.body, school_id: SCHOOL_ID }).select().single();
  res.json(error ? { ok: false, error: error.message } : { ok: true, data });
});

app.put('/api/classes/:id', async (req, res) => {
  const { error } = await supabase.from('classes').update(req.body).eq('id', req.params.id);
  res.json(error ? { ok: false } : { ok: true });
});

app.delete('/api/classes/:id', async (req, res) => {
  await supabase.from('classes').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

// ── USERS ──────────────────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  const { data } = await supabase.from('users')
    .select('id, name, username, role, contact')
    .eq('school_id', SCHOOL_ID).order('role');
  res.json(data || []);
});

app.post('/api/users', async (req, res) => {
  const { data, error } = await supabase.from('users')
    .insert({ ...req.body, school_id: SCHOOL_ID }).select().single();
  res.json(error ? { ok: false, error: error.message } : { ok: true, data });
});

app.put('/api/users/:id', async (req, res) => {
  const { error } = await supabase.from('users').update(req.body).eq('id', req.params.id);
  res.json(error ? { ok: false } : { ok: true });
});

app.delete('/api/users/:id', async (req, res) => {
  await supabase.from('users').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

// ── DASHBOARD STATS ────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const month = new Date().toISOString().slice(0, 7);
  const [{ count: total_students }, { count: att_today }, fees_data] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true })
      .eq('school_id', SCHOOL_ID).eq('status', 'Active'),
    supabase.from('attendance').select('*', { count: 'exact', head: true })
      .eq('school_id', SCHOOL_ID).eq('date', today).eq('status', 'Present'),
    supabase.from('fees').select('amount_due, amount_paid')
      .eq('school_id', SCHOOL_ID).eq('month', month),
  ]);
  const fees = fees_data.data || [];
  const fees_collected = fees.reduce((a, f) => a + Number(f.amount_paid), 0);
  const fees_pending   = fees.reduce((a, f) => a + Math.max(0, Number(f.amount_due) - Number(f.amount_paid)), 0);
  const defaulters     = fees.filter(f => Number(f.amount_paid) === 0).length;
  res.json({ total_students: total_students || 0, att_today: att_today || 0, fees_collected, fees_pending, defaulters });
});

// ── DIARY ──────────────────────────────────────────────────────────────────
app.get('/api/diary', async (req, res) => {
  const { cls, section, date, month } = req.query;
  let q = supabase.from('diaries').select('*')
    .eq('school_id', SCHOOL_ID).order('date', { ascending: false });
  if (cls)     q = q.eq('class', cls);
  if (section) q = q.eq('section', section);
  if (date)    q = q.eq('date', date);
  if (month)   q = q.gte('date', month + '-01').lte('date', month + '-31');
  const { data, error } = await q;
  res.json(error ? [] : data);
});

app.post('/api/diary', async (req, res) => {
  const { data, error } = await supabase.from('diaries')
    .insert({ ...req.body, school_id: SCHOOL_ID }).select().single();
  res.json(error ? { ok: false, error: error.message } : { ok: true, data });
});

app.put('/api/diary/:id', async (req, res) => {
  const { error } = await supabase.from('diaries').update(req.body)
    .eq('id', req.params.id).eq('school_id', SCHOOL_ID);
  res.json(error ? { ok: false } : { ok: true });
});

app.delete('/api/diary/:id', async (req, res) => {
  await supabase.from('diaries').delete()
    .eq('id', req.params.id).eq('school_id', SCHOOL_ID);
  res.json({ ok: true });
});

// ── PUSH NOTIFICATIONS ─────────────────────────────────────────────────────
app.post('/api/push/subscribe', async (req, res) => {
  const { subscription, user_id } = req.body;
  await supabase.from('push_subscriptions').upsert({
    school_id: SCHOOL_ID, user_id,
    subscription: JSON.stringify(subscription),
    created_at: new Date().toISOString()
  }, { onConflict: 'user_id' });
  res.json({ ok: true });
});

app.delete('/api/push/unsubscribe', async (req, res) => {
  const { user_id } = req.body;
  await supabase.from('push_subscriptions').delete().eq('user_id', user_id);
  res.json({ ok: true });
});

app.post('/api/push/test', async (req, res) => {
  const { user_id, title, body } = req.body;
  await sendPushToUser(
    user_id,
    title || '✅ EduMatrix Notifications Active',
    body  || 'Notifications working! You will be alerted when your child is absent.'
  );
  res.json({ ok: true });
});

async function sendPushToUser(user_id, title, body, url='/') {
  try {
    const { data } = await supabase.from('push_subscriptions')
      .select('subscription').eq('user_id', user_id).single();
    if (!data) return;
    const sub = JSON.parse(data.subscription);
    await webpush.sendNotification(sub, JSON.stringify({ title, body, url }));
    console.log('Push sent to user:', user_id);
  } catch(e) { console.error('Push error:', e.message); }
}

async function sendPushToRole(role, title, body) {
  try {
    const { data: subs } = await supabase.from('push_subscriptions')
      .select('subscription, user_id').eq('school_id', SCHOOL_ID);
    if (!subs?.length) return;
    const { data: users } = await supabase.from('users')
      .select('id').eq('school_id', SCHOOL_ID).eq('role', role);
    const userIds = new Set((users||[]).map(u => u.id));
    for (const s of subs) {
      if (userIds.has(s.user_id)) {
        try {
          await webpush.sendNotification(
            JSON.parse(s.subscription),
            JSON.stringify({ title, body })
          );
        } catch(e) { console.error('Push failed:', e.message); }
      }
    }
  } catch(e) { console.error('Push broadcast error:', e.message); }
}

// ── WHATSAPP via CallMeBot ─────────────────────────────────────────────────
async function sendWhatsApp(phone, apikey, message) {
  try {
    if (!phone || !apikey) return;
    const intlPhone = '92' + phone.replace(/^0/, '').replace(/[-\s]/g, '');
    const encodedMsg = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${intlPhone}&text=${encodedMsg}&apikey=${apikey}`;
    const response = await fetch(url);
    const text = await response.text();
    console.log('WhatsApp sent to:', phone, '| Response:', text);
  } catch(e) {
    console.error('WhatsApp error:', e.message);
  }
}

// WhatsApp test route
app.post('/api/whatsapp/test', async (req, res) => {
  const { phone, apikey } = req.body;
  if (!phone || !apikey) return res.json({ ok: false, error: 'Phone and API key required' });
  await sendWhatsApp(
    phone,
    apikey,
    `✅ Test Message!\n\nWhatsApp alerts are working for EduMatrix School.\nPowered by Zyveron Technologies.`
  );
  res.json({ ok: true });
});

// ── SMS ────────────────────────────────────────────────────────────────────
async function sendSMS(to, message) {
  try {
    await supabase.from('sms_logs')
      .insert({ school_id: SCHOOL_ID, recipient: to, message, status: 'sent' });
    if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
      const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
      await twilio.messages.create({
        body: message, from: process.env.TWILIO_FROM,
        to: '+92' + to.replace(/^0/, '')
      });
    }
    console.log('SMS sent to:', to);
  } catch(e) { console.error('SMS error:', e.message); }
}

app.post('/api/sms/test', async (req, res) => {
  const { to, message } = req.body;
  await sendSMS(to, message);
  res.json({ ok: true });
});

app.get('/api/sms/logs', async (req, res) => {
  const { data } = await supabase.from('sms_logs').select('*')
    .eq('school_id', SCHOOL_ID)
    .order('created_at', { ascending: false }).limit(50);
  res.json(data || []);
});

// ── HEALTH ─────────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`EduMatrix API running on port ${PORT}`));
