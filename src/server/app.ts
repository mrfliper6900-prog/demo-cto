import express from 'express';
import cors from 'cors';
import { getDb } from './db.js';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// /sms webhook (for incoming SMS qualification)
app.post('/sms', async (req, res) => {
  const { From, Body } = req.body;
  const db = await getDb();

  let lead = await db.get('SELECT * FROM leads WHERE phone = ?', From);
  if (!lead) {
    const leadId = uuidv4();
    await db.run('INSERT INTO leads (id, phone, status) VALUES (?, ?, ?)', [leadId, From, 'warm']);
    lead = await db.get('SELECT * FROM leads WHERE id = ?', leadId);
  }

  // Log inbound message
  await db.run('INSERT INTO messages (lead_id, sender, content) VALUES (?, ?, ?)', [lead.id, 'user', Body]);

  // AI Qualification Logic
  const response = await processAIQualification(db, lead, Body);

  // Log outbound message
  await db.run('INSERT INTO messages (lead_id, sender, content) VALUES (?, ?, ?)', [lead.id, 'bot', response]);

  // Placeholder for Twilio outbound SMS
  console.log(`Bot response to ${From}: ${response}`);

  res.type('text/xml').send('<Response></Response>');
});

// /missed-call webhook
app.post('/api/missed-call', async (req, res) => {
  const { From } = req.body;
  const db = await getDb();

  let lead = await db.get('SELECT * FROM leads WHERE phone = ?', From);
  if (!lead) {
    const leadId = uuidv4();
    await db.run('INSERT INTO leads (id, phone, status) VALUES (?, ?, ?)', [leadId, From, 'warm']);
    lead = await db.get('SELECT * FROM leads WHERE id = ?', leadId);
  }

  const response = "Hey, sorry we missed your call—what can we help you with?";
  await db.run('INSERT INTO messages (lead_id, sender, content) VALUES (?, ?, ?)', [lead.id, 'bot', response]);

  console.log(`Missed call automated response to ${From}: ${response}`);

  res.type('text/xml').send('<Response></Response>');
});

// API Routes
app.get('/api/leads', async (req, res) => {
  const db = await getDb();
  const leads = await db.all('SELECT * FROM leads ORDER BY updated_at DESC');
  res.json(leads);
});

app.get('/api/leads/:id/messages', async (req, res) => {
  const db = await getDb();
  const messages = await db.all('SELECT * FROM messages WHERE lead_id = ? ORDER BY created_at ASC', req.params.id);
  res.json(messages);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function processAIQualification(db: any, lead: any, message: string) {
  const msg = message.toLowerCase();
  if (msg.includes('roof') || msg.includes('leak') || msg.includes('repair')) {
    await db.run('UPDATE leads SET job_type = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['roofing', 'hot', lead.id]);
    return "I see you're looking for roofing help. Is this an emergency or a standard repair?";
  }
  if (msg.includes('emergency') || msg.includes('asap') || msg.includes('now')) {
    await db.run('UPDATE leads SET urgency = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['high', 'hot', lead.id]);
    return "Got it, we'll prioritize this. What's your address so we can check our schedule?";
  }
  if (!lead.name && msg.length < 50 && msg.split(' ').length < 4) {
    await db.run('UPDATE leads SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [message, lead.id]);
    return `Thanks ${message}. What kind of service are you looking for today?`;
  }
  return "Thanks for the info. One of our specialists will reach out shortly, or you can book a time here: [Link]";
}

export default app;
