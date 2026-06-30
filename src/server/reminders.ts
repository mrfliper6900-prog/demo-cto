import { getDb } from './db.js';

export async function processReminders() {
  const db = await getDb();
  const now = Date.now();
  
  // 24h reminders
  const tomorrow = new Date(now + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace('Z', '');
  const appointments24h = await db.all(`
    SELECT a.*, l.phone 
    FROM appointments a
    JOIN leads l ON a.lead_id = l.id
    WHERE a.status = 'confirmed' 
      AND a.reminder_24h_sent = 0
      AND a.start_time <= ?
      AND a.start_time > ?
  `, [tomorrow, new Date(now).toISOString().replace('T', ' ').replace('Z', '')]);

  for (const appt of appointments24h) {
    const msg = `Reminder: You have a roofing appointment scheduled for tomorrow at ${appt.start_time}.`;
    await db.run('INSERT INTO messages (lead_id, sender, content) VALUES (?, ?, ?)', [appt.lead_id, 'bot', msg]);
    await db.run('UPDATE appointments SET reminder_24h_sent = 1 WHERE id = ?', [appt.id]);
    console.log(`[Reminder 24h] Sent to ${appt.phone}`);
  }

  // 2h reminders
  const in2h = new Date(now + 2 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace('Z', '');
  const appointments2h = await db.all(`
    SELECT a.*, l.phone 
    FROM appointments a
    JOIN leads l ON a.lead_id = l.id
    WHERE a.status = 'confirmed' 
      AND a.reminder_2h_sent = 0
      AND a.start_time <= ?
      AND a.start_time > ?
  `, [in2h, new Date(now).toISOString().replace('T', ' ').replace('Z', '')]);

  for (const appt of appointments2h) {
    const msg = `Hi, just a reminder that we'll be there in about 2 hours (${appt.start_time}). See you soon!`;
    await db.run('INSERT INTO messages (lead_id, sender, content) VALUES (?, ?, ?)', [appt.lead_id, 'bot', msg]);
    await db.run('UPDATE appointments SET reminder_2h_sent = 1 WHERE id = ?', [appt.id]);
    console.log(`[Reminder 2h] Sent to ${appt.phone}`);
  }
}

export function startReminderScheduler(intervalMs = 1000 * 60 * 10) { // Every 10 mins
  console.log('Starting reminder scheduler...');
  setInterval(async () => {
    try {
      await processReminders();
    } catch (error) {
      console.error('Error processing reminders:', error);
    }
  }, intervalMs);
}
