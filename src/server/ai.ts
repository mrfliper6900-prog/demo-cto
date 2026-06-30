import { Lead, Message, ContentIdea } from '../types/index.js';
import OpenAI from 'openai';
import { calendarService } from './calendar.js';

// This will be replaced with real OpenAI calls once the API key is available
export async function generateContentIdeas(): Promise<ContentIdea[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not found, using mock data');
    return [
      { 
        platform: 'Facebook', 
        hook: 'Is your roof ready for the next storm?', 
        caption: 'Don\'t wait for a leak to find out. United States Roofing offers free storm readiness inspections to keep your home dry and safe.', 
        cta: 'Book Free Inspection' 
      },
      { 
        platform: 'Instagram', 
        hook: 'Before & After: Complete Roof Overhaul', 
        caption: 'Swipe to see how we transformed this 20-year-old roof into a modern masterpiece. Style meets durability.', 
        cta: 'Get a Quote' 
      },
      {
        platform: 'Google Business',
        hook: 'Local Roofing Specialists in [Area]',
        caption: 'We just finished another roof replacement in the neighborhood. Quality you can trust.',
        cta: 'Call now'
      }
    ];
  }

  const openai = new OpenAI({ apiKey });
  
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a marketing expert for local service businesses. Generate 3 social media content ideas for a roofing company. Return a JSON array of objects with 'platform', 'hook', 'caption', and 'cta' fields."
      },
      {
        role: "user",
        content: "Generate content ideas for United States Roofing Corporation."
      }
    ],
    response_format: { type: "json_object" }
  });

  const content = completion.choices[0].message.content;
  if (!content) return [];
  
  try {
    const parsed = JSON.parse(content);
    return parsed.ideas || parsed; // Handle different JSON structures
  } catch (e) {
    console.error('Failed to parse AI response', e);
    return [];
  }
}

export async function qualifyLeadWithAI(lead: Lead, lastMessage: string, history: Message[]): Promise<{
  status?: 'hot' | 'warm' | 'cold';
  job_type?: string;
  urgency?: string;
  location?: string;
  name?: string;
  response: string;
  book_slot?: { start: string, end: string };
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback to basic keyword matching logic
    const msg = lastMessage.toLowerCase();
    
    // Check for slot selection (mock implementation)
    if (msg.includes('book') || msg.includes('slot') || msg.includes('9am') || msg.includes('2pm')) {
      const slots = await calendarService.getAvailableSlots();
      // Simple logic: if they mention '9am', pick the first 9am slot
      if (msg.includes('9am')) {
        return {
          response: `Great! I've booked you for ${slots[0].start}. You'll receive a confirmation SMS shortly.`,
          book_slot: slots[0]
        };
      }
      
      const slotList = slots.slice(0, 3).map(s => `${s.start}`).join('\n- ');
      return {
        response: `We have the following slots available:\n- ${slotList}\nWhich one works for you?`
      };
    }

    if (msg.includes('roof') || msg.includes('leak') || msg.includes('repair')) {
      return {
        job_type: 'roofing',
        status: 'hot',
        response: "I see you're looking for roofing help. Is this an emergency or a standard repair?"
      };
    }
    return {
      response: "Thanks for the info. One of our specialists will reach out shortly."
    };
  }

  const openai = new OpenAI({ apiKey });
  
  const slots = await calendarService.getAvailableSlots();
  const slotList = slots.map(s => `${s.start} to ${s.end}`).join('\n');

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant for United States Roofing Corporation. Your goal is to qualify leads and book appointments.
Extract: name, job type, urgency, location.
Status: 'hot', 'warm', 'cold'.
Available Slots:\n${slotList}

If the lead is ready to book, offer them available slots.
If they pick a slot, include it in the 'book_slot' field of the JSON.

Current Lead Data: ${JSON.stringify(lead)}
Conversation History: ${history.map(m => `${m.sender}: ${m.content}`).join('\n')}

Return a JSON object with: status, job_type, urgency, location, name, response, and optionally book_slot {start, end}.`
      },
      {
        role: "user",
        content: lastMessage
      }
    ],
    response_format: { type: "json_object" }
  });

  const content = completion.choices[0].message.content;
  if (!content) return { response: "I'm sorry, I'm having trouble processing your request." };

  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse AI qualification response', e);
    return { response: "Thanks for the info. We'll be in touch!" };
  }
}

export async function generateFollowUpWithAI(lead: Lead, history: Message[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return "Hi, just checking in to see if you still need help with your roofing project?";
  }

  const openai = new OpenAI({ apiKey });
  
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant for United States Roofing Corporation. You are following up with a lead who hasn't replied to our last message.
Keep it friendly, professional, and very brief. Refer to the previous conversation context if possible.

Current Lead Data: ${JSON.stringify(lead)}
Conversation History: ${history.map(m => `${m.sender}: ${m.content}`).join('\n')}`
      },
      {
        role: "user",
        content: "Generate a short follow-up SMS message."
      }
    ]
  });

  return completion.choices[0].message.content || "Just checking in—any updates on your roofing needs?";
}
