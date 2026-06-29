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
  next_followup_at?: string;
  followup_count?: number;
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

export interface Settings {
  key: string;
  value: string;
}
