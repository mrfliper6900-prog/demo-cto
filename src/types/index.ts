export interface Lead {
  id: string;
  name?: string;
  phone: string;
  status: 'HOT' | 'WARM' | 'COLD';
  summary?: string;
  created_at: string;
}

export interface Message {
  id: string;
  lead_id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  created_at: string;
}

export interface Settings {
  businessName: string;
  twilioPhoneNumber: string;
  openaiApiKey: string;
}
