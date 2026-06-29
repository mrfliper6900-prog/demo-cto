import { getDb } from './db.js';
import { generateFollowUpWithAI } from './ai.js';

const FOLLOW_UP_DELAYS = [
  1 * 60 * 60 * 1000,      // 1 hour after qualification (step 1)
  24 * 60 * 60 * 1000,     // 24 hours after qualification (step 2)
  3 * 24 * 60 * 60 * 1000  // 3 days after qualification (step 3)
];

export async function processFollowUps() {
  const db = await getDb();
  const now = new Date().toISOString().replace('T', ' ').replace('Z', '');

  // 1. Find 'hot' leads due for follow-up who haven't booked an appointment
  // and haven't responded since the last bot/agent message.
  const leads = await db.all(`
    SELECT l.* 
    FROM leads l
    LEFT JOIN appointments a ON l.id = a.lead_id AND a.status = 'confirmed'
    WHERE l.status = 'hot'
      AND l.next_followup_at IS NOT NULL
      AND l.next_followup_at <= ?
      AND l.followup_count < 3
      AND a.id IS NULL
  `, [now]);

  for (const lead of leads) {
    // Safety check: Ensure the last message was from bot/agent (user hasn't replied)
    const lastMessage = await db.get('SELECT sender FROM messages WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1', lead.id);
    
    if (lastMessage && lastMessage.sender === 'user') {
      // User replied, stop automated follow-ups for now
      await db.run('UPDATE leads SET next_followup_at = NULL WHERE id = ?', [lead.id]);
      continue;
    }

    console.log(`Processing follow-up ${lead.followup_count + 1} for lead ${lead.phone}`);
    
    const history = await db.all('SELECT * FROM messages WHERE lead_id = ? ORDER BY created_at ASC', lead.id);
    const followUpMessage = await generateFollowUpWithAI(lead, history);

    // Log the message
    await db.run('INSERT INTO messages (lead_id, sender, content) VALUES (?, ?, ?)', [lead.id, 'bot', followUpMessage]);
    
    // Update lead tracking
    const newCount = lead.followup_count + 1;
    let nextDate = null;
    
    if (newCount < 3) {
      // Schedule next follow-up relative to qualification (created_at or a specific qualified_at)
      // For simplicity, let's use created_at as the proxy for qualification time if not explicitly tracked
      const baseTime = new Date(lead.updated_at).getTime(); // updated_at was set when status became 'hot'
      nextDate = new Date(baseTime + FOLLOW_UP_DELAYS[newCount]).toISOString().replace('T', ' ').replace('Z', '');
    }

    await db.run('UPDATE leads SET followup_count = ?, next_followup_at = ? WHERE id = ?', [newCount, nextDate, lead.id]);
    
    console.log(`[Follow-up] Sent to ${lead.phone}: ${followUpMessage}`);
  }
}

export function startFollowUpScheduler(intervalMs = 1000 * 60 * 5) { // Default every 5 mins
  console.log('Starting follow-up scheduler...');
  setInterval(async () => {
    try {
      await processFollowUps();
    } catch (error) {
      console.error('Error processing follow-ups:', error);
    }
  }, intervalMs);
}
