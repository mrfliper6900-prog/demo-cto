export interface Lead {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  status: 'hot' | 'warm' | 'cold';
  job_type?: string;
  urgency?: string;
  location?: string;
  budget?: string;
  summary?: string;
  last_follow_up_step?: number;
  last_follow_up_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  lead_id: string;
  sender: 'user' | 'bot' | 'agent';
  content: string;
  created_at: string;
}

export interface ContentIdea {
  platform: string;
  hook: string;
  caption: string;
  cta: string;
}

export interface CalendarSlot {
  start: string;
  end: string;
}

export interface Appointment {
  id: number;
  lead_id: string;
  start_time: string;
  end_time?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  lead_name?: string;
  lead_phone?: string;
}

export interface Settings {
  key: string;
  value: string;
}
