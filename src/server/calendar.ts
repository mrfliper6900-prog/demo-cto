import { getDb } from './db.js';

export interface CalendarSlot {
  start: string;
  end: string;
}

export class CalendlyService {
  private token: string | undefined;

  constructor() {
    this.token = process.env.CALENDLY_TOKEN;
  }

  // Mock availability: 9 AM to 5 PM for the next 7 days
  async getAvailableSlots(): Promise<CalendarSlot[]> {
    if (this.token) {
      // Logic for real Calendly API would go here
      // GET https://api.calendly.com/event_type_available_times
      console.log('Fetching real slots from Calendly...');
    }

    const slots: CalendarSlot[] = [];
    const now = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const day = new Date(now);
      day.setDate(now.getDate() + i);
      
      // Mock slots at 9am, 11am, 2pm, 4pm
      const hours = [9, 11, 14, 16];
      const dayStr = day.toISOString().split('T')[0];

      for (const h of hours) {
        slots.push({
          start: `${dayStr}T${h.toString().padStart(2, '0')}:00:00Z`,
          end: `${dayStr}T${(h + 1).toString().padStart(2, '0')}:00:00Z`
        });
      }
    }
    
    return slots;
  }

  async bookSlot(leadId: string, slot: CalendarSlot): Promise<boolean> {
    const db = await getDb();
    const lead = await db.get('SELECT * FROM leads WHERE id = ?', leadId);
    
    if (!lead) return false;

    console.log(`[Calendly] Booking slot for lead ${lead.phone} (${leadId}): ${slot.start}`);
    
    if (this.token) {
      // Logic for real Calendly booking would go here
      // POST https://api.calendly.com/scheduled_events
    }

    // Save to our DB
    await db.run(
      'INSERT INTO appointments (lead_id, start_time, end_time, status) VALUES (?, ?, ?, ?)',
      [leadId, slot.start, slot.end, 'confirmed']
    );

    // Add a bot message confirmation
    const formattedDate = new Date(slot.start).toLocaleString();
    const msg = `Confirmed! Your appointment is scheduled for ${formattedDate}. We'll see you then!`;
    await db.run('INSERT INTO messages (lead_id, sender, content) VALUES (?, ?, ?)', [leadId, 'bot', msg]);

    // Stop follow-ups
    await db.run('UPDATE leads SET last_follow_up_step = 3 WHERE id = ?', [leadId]);

    return true;
  }
}

export const calendarService = new CalendlyService();
