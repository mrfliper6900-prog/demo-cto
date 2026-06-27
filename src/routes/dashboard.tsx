import { createFileRoute } from "@tanstack/react-router";
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
  BarChart3
} from 'lucide-react';
import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [view, setView] = useState('pipeline');
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const leads = [
    { id: 1, name: 'John Smith', phone: '(555) 123-4567', status: 'hot', job_type: 'Roof Leak Repair', summary: 'Emergency repair needed for a residential property.', created_at: '2026-06-27T10:00:00Z' },
    { id: 2, name: 'Sarah Johnson', phone: '(555) 987-6543', status: 'warm', job_type: 'Gutter Cleaning', summary: 'Wants a quote for seasonal maintenance.', created_at: '2026-06-27T09:30:00Z' },
    { id: 3, name: 'Mike Brown', phone: '(555) 456-7890', status: 'cold', job_type: 'New Roof Installation', summary: 'Looking for financing options.', created_at: '2026-06-26T15:00:00Z' },
  ];

  const messages = [
    { id: 1, sender: 'bot', content: 'Hi! This is United States Roofing. We missed your call. How can we help you?', created_at: '2026-06-27T10:00:05Z' },
    { id: 2, sender: 'user', content: 'Hey, I have a major leak in my kitchen ceiling after the storm. Can someone come today?', created_at: '2026-06-27T10:01:20Z' },
    { id: 3, sender: 'bot', content: 'I am so sorry to hear that. We can definitely help. Is this an emergency repair or are you looking for a full inspection?', created_at: '2026-06-27T10:01:45Z' },
    { id: 4, sender: 'user', content: 'Emergency! Water is dripping onto my floor.', created_at: '2026-06-27T10:02:10Z' },
  ];

  const contentIdeas = [
    { platform: 'Facebook', hook: 'Storm season is here! Is your roof ready?', caption: 'Dont wait for the drip. United States Roofing offers free storm readiness inspections to keep your home dry and safe.', cta: 'Book Free Inspection' },
    { platform: 'Instagram', hook: 'Before & After: Complete Roof Overhaul', caption: 'Swipe to see how we transformed this 20-year-old roof into a modern masterpiece. Style meets durability.', cta: 'Get a Quote' },
  ];

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
                  <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                    <Plus size={20} />
                  </button>
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
                      <h3 className="font-bold text-slate-900">{lead.name}</h3>
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
                      <h2 className="text-lg font-bold text-slate-900">{selectedLead.name || selectedLead.phone}</h2>
                      <p className="text-sm text-slate-500">{selectedLead.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Book Appointment</button>
                    </div>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-md p-4 rounded-2xl shadow-sm ${msg.sender === 'bot' ? 'bg-white text-slate-800 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-2 opacity-60 text-right ${msg.sender === 'bot' ? 'text-slate-400' : 'text-blue-100'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t bg-white">
                    <div className="flex gap-2 p-2 bg-gray-100 rounded-xl">
                      <input type="text" placeholder="Send a manual SMS..." className="flex-1 bg-transparent px-4 py-2 outline-none text-sm" />
                      <button className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"><MessageSquare size={18} /></button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-gray-50">
                  <div className="bg-white p-8 rounded-full shadow-inner mb-4">
                    <MessageSquare size={64} className="opacity-20" />
                  </div>
                  <p className="text-lg font-medium">Select a lead to start growing</p>
                  <p className="text-sm opacity-60">AI is currently handling 3 active conversations</p>
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
          <div className="flex-1 flex items-center justify-center text-slate-400 bg-gray-50">
            <div className="text-center">
              <Calendar size={64} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No appointments booked yet</p>
              <p className="text-sm">Once AI qualifies a lead, they will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
