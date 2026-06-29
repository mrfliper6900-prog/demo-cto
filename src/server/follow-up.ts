import { getDb } from './db.js';
import { generateFollowUpWithAI } from './ai.js';
import { Lead, Message } from '../types/index.js';

const FOLLOW_UP_WINDOWS = [
  { step: 1, delayMs: 1000 * 60 * 60 },      // 1 hour
  { step: 2, delayMs: 1000 * 60 * 60 * 24 }, // 24 hours
  { step: 3, delayMs: 1000 * 60 * 60 * 24 * 3 } // 3 days
];

export async function processFollowUps() {
  const db = await getDb();
  
  // Find leads whose last message was from 'bot' or 'agent'
  // and who haven't completed all follow-up steps
  const leads = await db.all(`
    SELECT l.* 
    FROM leads l
    JOIN (
      SELECT lead_id, sender, created_at,
             ROW_NUMBER() OVER(PARTITION BY lead_id ORDER BY created_at DESC) as rn
      FROM messages
    ) m ON l.id = m.lead_id
    WHERE m.rn = 1 
      AND m.sender IN ('bot', 'agent')
      AND (l.last_follow_up_step < 3)
  `);

  const now = Date.now();

  for (const lead of leads) {
    const lastMessage = await db.get('SELECT * FROM messages WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1', lead.id);
    if (!lastMessage) continue;

    const lastMessageAt = new Date(lastMessage.created_at).getTime();
    const elapsedMs = now - lastMessageAt;

    // Determine the next step
    const currentStep = lead.last_follow_up_step || 0;
    const nextStepConfig = FOLLOW_UP_WINDOWS[currentStep];

    if (nextStepConfig && elapsedMs >= nextStepConfig.delayMs) {
      console.log(`Sending follow-up step ${nextStepConfig.step} to lead ${lead.phone}`);
      
      const history = await db.all('SELECT * FROM messages WHERE lead_id = ? ORDER BY created_at ASC', lead.id);
      const followUpMessage = await generateFollowUpWithAI(lead, history);

      await db.run('INSERT INTO messages (lead_id, sender, content) VALUES (?, ?, ?)', [lead.id, 'bot', followUpMessage]);
      await db.run('UPDATE leads SET last_follow_up_step = ?, last_follow_up_at = CURRENT_TIMESTAMP WHERE id = ?', [nextStepConfig.step, lead.id]);
      
      console.log(`[Follow-up] Sent to ${lead.phone}: ${followUpMessage}`);
    }
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
