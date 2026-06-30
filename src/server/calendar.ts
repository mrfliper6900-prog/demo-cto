export interface CalendarSlot {
  start: string;
  end: string;
}

export class GoogleCalendarService {
  // Mock availability: 9 AM to 5 PM for the next 3 days
  async getAvailableSlots(): Promise<CalendarSlot[]> {
    const slots: CalendarSlot[] = [];
    const now = new Date();
    
    for (let i = 1; i <= 3; i++) {
      const day = new Date(now);
      day.setDate(now.getDate() + i);
      day.setHours(9, 0, 0, 0);
      
      const dayStr = day.toISOString().split('T')[0];
      
      slots.push({
        start: `${dayStr} 09:00:00`,
        end: `${dayStr} 10:00:00`
      });
      slots.push({
        start: `${dayStr} 14:00:00`,
        end: `${dayStr} 15:00:00`
      });
    }
    
    return slots;
  }

  async bookSlot(leadId: string, slot: CalendarSlot): Promise<boolean> {
    console.log(`[Google Calendar] Booking slot for lead ${leadId}: ${slot.start} to ${slot.end}`);
    // In a real app, this would call the Google Calendar API
    return true;
  }
}

export const calendarService = new GoogleCalendarService();
