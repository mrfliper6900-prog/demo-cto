import express from 'express';
import cors from 'cors';
import { getDb } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import { generateContentIdeas, qualifyLeadWithAI } from './ai.js';

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
  const messages = await db.all('SELECT * FROM messages WHERE lead_id = ? ORDER BY created_at ASC', lead.id);
  const aiResult = await qualifyLeadWithAI(lead, Body, messages);

  if (aiResult.status) await db.run('UPDATE leads SET status = ? WHERE id = ?', [aiResult.status, lead.id]);
  if (aiResult.job_type) await db.run('UPDATE leads SET job_type = ? WHERE id = ?', [aiResult.job_type, lead.id]);
  if (aiResult.urgency) await db.run('UPDATE leads SET urgency = ? WHERE id = ?', [aiResult.urgency, lead.id]);
  if (aiResult.location) await db.run('UPDATE leads SET location = ? WHERE id = ?', [aiResult.location, lead.id]);
  if (aiResult.name) await db.run('UPDATE leads SET name = ? WHERE id = ?', [aiResult.name, lead.id]);
  
  await db.run('UPDATE leads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [lead.id]);

  const response = aiResult.response;

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

app.post('/api/leads/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { content, sender } = req.body;
  const db = await getDb();

  await db.run('INSERT INTO messages (lead_id, sender, content) VALUES (?, ?, ?)', [id, sender || 'agent', content]);
  
  // If it's an agent message, we would normally trigger an actual SMS via Twilio here
  if (sender === 'agent') {
    const lead = await db.get('SELECT phone FROM leads WHERE id = ?', id);
    console.log(`[Manual SMS] Sending to ${lead?.phone}: ${content}`);
  }

  const newMessage = await db.get('SELECT * FROM messages WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1', id);
  res.json(newMessage);
});

app.get('/api/content-ideas', async (req, res) => {
  try {
    const ideas = await generateContentIdeas();
    res.json(ideas);
  } catch (error) {
    console.error('Error generating content ideas:', error);
    res.status(500).json({ error: 'Failed to generate ideas' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
