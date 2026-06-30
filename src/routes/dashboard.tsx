import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  Settings as SettingsIcon, 
  Phone, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  Send,
  Zap,
  BarChart3,
  RefreshCcw
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Lead, Message, ContentIdea, Appointment } from '../types/index.js';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Server Functions
const getLeads = createServerFn({ method: "GET" }).handler(async () => {
  const response = await fetch('http://localhost:3000/api/leads');
  return (await response.json()) as Lead[];
});

const getMessages = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const response = await fetch(`http://localhost:3000/api/leads/${id}/messages`);
    return (await response.json()) as Message[];
  });

const getContentIdeas = createServerFn({ method: "GET" }).handler(async () => {
  const response = await fetch('http://localhost:3000/api/content-ideas');
  return (await response.json()) as ContentIdea[];
});

const getAppointments = createServerFn({ method: "GET" }).handler(async () => {
  const response = await fetch('http://localhost:3000/api/appointments');
  return (await response.json()) as Appointment[];
});

const sendMessage = createServerFn({ method: "POST" })
  .validator((data: { leadId: string, content: string }) => data)
  .handler(async ({ data }) => {
    const response = await fetch(`http://localhost:3000/api/leads/${data.leadId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: data.content, sender: 'agent' })
    });
    return (await response.json()) as Message;
  });

export const Route = createFileRoute("/dashboard")({
  loader: async () => {
    const [leads, contentIdeas, appointments] = await Promise.all([
      getLeads(),
      getContentIdeas(),
      getAppointments()
    ]);
    return { leads, contentIdeas, appointments };
  },
  component: Dashboard,
});

function Dashboard() {
  const { leads: initialLeads, contentIdeas, appointments: initialAppointments } = Route.useLoaderData();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [view, setView] = useState('pipeline');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const refreshLeads = async () => {
    setIsRefreshing(true);
    try {
      const [updatedLeads, updatedApps] = await Promise.all([
        getLeads(),
        getAppointments()
      ]);
      setLeads(updatedLeads);
      setAppointments(updatedApps);
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchMessages = async (leadId: string) => {
    try {
      const msgs = await getMessages({ data: leadId });
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  useEffect(() => {
    if (selectedLead) {
      fetchMessages(selectedLead.id);
      // Poll for new messages every 5 seconds if lead is selected
      const interval = setInterval(() => fetchMessages(selectedLead.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedLead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newMessage.trim()) return;

    const text = newMessage;
    setNewMessage('');

    try {
      const sentMsg = await sendMessage({ data: { leadId: selectedLead.id, content: text } });
      setMessages(prev => [...prev, sentMsg]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Zap size={20} fill="currentColor" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-white">LeadFlow AI</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setView('pipeline')} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group", view === 'pipeline' ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "hover:bg-slate-800 hover:text-white")}>
            <Users size={18} className={cn(view === 'pipeline' ? "text-white" : "text-slate-500 group-hover:text-blue-400")} />
            <span className="font-medium">Lead Pipeline</span>
          </button>
          <button onClick={() => setView('content')} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group", view === 'content' ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "hover:bg-slate-800 hover:text-white")}>
            <BarChart3 size={18} className={cn(view === 'content' ? "text-white" : "text-slate-500 group-hover:text-blue-400")} />
            <span className="font-medium">Content Engine</span>
          </button>
          <button onClick={() => setView('bookings')} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group", view === 'bookings' ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "hover:bg-slate-800 hover:text-white")}>
            <Calendar size={18} className={cn(view === 'bookings' ? "text-white" : "text-slate-500 group-hover:text-blue-400")} />
            <span className="font-medium">Bookings</span>
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all duration-200 text-slate-500 group">
            <SettingsIcon size={18} className="group-hover:text-blue-400" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {view === 'pipeline' && (
          <>
            {/* Leads List */}
            <div className="w-96 border-r bg-white flex flex-col shadow-sm">
              <div className="p-4 border-b space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900">Active Leads</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={refreshLeads}
                      className={cn("p-2 text-slate-400 hover:text-blue-600 transition-colors", isRefreshing && "animate-spin text-blue-600")}
                    >
                      <RefreshCcw size={18} />
                    </button>
                    <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search leads..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {leads.map(lead => (
                  <div key={lead.id} onClick={() => setSelectedLead(lead)} className={cn("p-5 cursor-pointer hover:bg-blue-50/50 transition-all border-l-4", selectedLead?.id === lead.id ? "bg-blue-50 border-blue-600" : "border-transparent")}>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-slate-900">{lead.name || lead.phone}</h3>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", lead.status === 'hot' ? 'bg-red-100 text-red-600' : lead.status === 'warm' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600')}>
                        {lead.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{lead.job_type || 'New Lead'}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-slate-400">{new Date(lead.created_at).toLocaleDateString()}</span>
                        {lead.status === 'hot' && <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium"><CheckCircle size={10}/> Ready to book</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Conversation View */}
            <div className="flex-1 flex flex-col bg-white">
              {selectedLead ? (
                <>
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{selectedLead.name || selectedLead.phone}</h2>
                        {appointments.some(a => a.lead_id === selectedLead.id && a.status === 'confirmed') && (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                            <Calendar size={10} /> Scheduled
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{selectedLead.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const link = `${window.location.origin}/book/${selectedLead.id}`;
                          navigator.clipboard.writeText(link);
                          alert('Booking link copied to clipboard!');
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Copy Link
                      </button>
                      {appointments.some(a => a.lead_id === selectedLead.id && a.status === 'confirmed') ? (
                        <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Reschedule</button>
                      ) : (
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Book Appointment</button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={cn(
                          "max-w-md p-4 rounded-2xl shadow-sm",
                          msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'
                        )}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={cn(
                            "text-[10px] mt-2 opacity-60 text-right",
                            msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                          )}>
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-4 border-t bg-white">
                    <form onSubmit={handleSendMessage} className="flex gap-2 p-2 bg-gray-100 rounded-xl">
                      <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Send a manual SMS..." 
                        className="flex-1 bg-transparent px-4 py-2 outline-none text-sm" 
                      />
                      <button type="submit" className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
                        <MessageSquare size={18} />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-gray-50">
                  <div className="bg-white p-8 rounded-full shadow-inner mb-4">
                    <MessageSquare size={64} className="opacity-20" />
                  </div>
                  <p className="text-lg font-medium">Select a lead to start growing</p>
                  <p className="text-sm opacity-60">AI is currently handling {leads.length} active conversations</p>
                </div>
              )}
            </div>
          </>
        )}
        {view === 'content' && (
          <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <header className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Content Ideation Engine</h2>
                <p className="text-slate-500">AI-generated content tailored for roofing services in your local area.</p>
              </header>
              <div className="grid grid-cols-1 gap-6">
                {contentIdeas.map((idea, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border hover:border-blue-300 transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{idea.platform}</span>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold">Post Now <ChevronRight size={16} className="inline"/></button>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">\"{idea.hook}\"</h3>
                    <p className="text-slate-600 text-sm mb-4 bg-gray-50 p-4 rounded-xl border-l-4 border-gray-200 italic">{idea.caption}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400 font-medium">Call to Action:</span>
                      <span className="text-blue-600 font-bold">{idea.cta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {view === 'bookings' && (
          <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <header className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Upcoming Appointments</h2>
                <p className="text-slate-500">Confirmed bookings handled by LeadFlow AI.</p>
              </header>
              <div className="grid grid-cols-1 gap-4">
                {appointments.length > 0 ? appointments.map((app) => (
                  <div key={app.id} className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-lg">{app.lead_name || app.lead_phone}</h3>
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase">{app.status}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(app.start_time).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone size={14} />
                          {app.lead_phone}
                        </div>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
                    <Calendar size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-slate-400">No appointments scheduled yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
