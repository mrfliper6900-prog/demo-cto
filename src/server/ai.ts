import { Lead, Message, ContentIdea } from '../types/index.js';
import OpenAI from 'openai';

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
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback to basic keyword matching logic
    const msg = lastMessage.toLowerCase();
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
  
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant for United States Roofing Corporation. Your goal is to qualify leads from SMS conversations.
Extract the following information if available: name, job type, urgency, and location.
Determine the lead status: 'hot' (urgent/ready to book), 'warm' (interested/needs info), 'cold' (not interested).
Respond to the user in a friendly, professional manner. Keep it short for SMS.

Current Lead Data: ${JSON.stringify(lead)}
Conversation History: ${history.map(m => `${m.sender}: ${m.content}`).join('\n')}

Return a JSON object with: status, job_type, urgency, location, name, and response.`
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
