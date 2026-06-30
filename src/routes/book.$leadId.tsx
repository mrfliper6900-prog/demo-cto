import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2,
  ChevronLeft,
  CalendarDays
} from 'lucide-react';
import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Lead, CalendarSlot } from '../types/index.js';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Server Functions
const getLead = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const response = await fetch(`http://localhost:3000/api/leads/${id}`);
    if (!response.ok) throw new Error('Lead not found');
    return (await response.json()) as Lead;
  });

const getSlots = createServerFn({ method: "GET" }).handler(async () => {
  const response = await fetch('http://localhost:3000/api/calendar/slots');
  return (await response.json()) as CalendarSlot[];
});

const bookSlot = createServerFn({ method: "POST" })
  .validator((data: { leadId: string, slot: CalendarSlot }) => data)
  .handler(async ({ data }) => {
    const response = await fetch('http://localhost:3000/api/calendar/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return (await response.json()) as { success: true };
  });

export const Route = createFileRoute("/book/$leadId")({
  loader: async ({ params }) => {
    const [lead, slots] = await Promise.all([
      getLead({ data: params.leadId }),
      getSlots()
    ]);
    return { lead, slots };
  },
  component: BookingPage,
});

function BookingPage() {
  const { lead, slots } = Route.useLoaderData();
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleBook = async () => {
    if (!selectedSlot) return;
    setIsSubmitting(true);
    try {
      await bookSlot({ data: { leadId: lead.id, slot: selectedSlot } });
      setIsConfirmed(true);
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Failed to book. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Appointment Confirmed!</h1>
          <p className="text-slate-600 mb-8">
            Thanks {lead.name || 'there'}! We've scheduled your roofing inspection for:
            <br />
            <span className="font-bold text-slate-900">{new Date(selectedSlot!.start).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</span>
          </p>
          <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-500 text-left mb-8">
            <p>• A confirmation SMS has been sent.</p>
            <p>• We'll send you a reminder 24 hours before.</p>
          </div>
          <p className="text-xs text-slate-400">You can now close this window.</p>
        </div>
      </div>
    );
  }

  // Group slots by date
  const groupedSlots: Record<string, CalendarSlot[]> = {};
  slots.forEach(slot => {
    const date = new Date(slot.start).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    if (!groupedSlots[date]) groupedSlots[date] = [];
    groupedSlots[date].push(slot);
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
               <CalendarIcon size={20} />
            </div>
            LeadFlow AI
          </div>
          <div className="text-sm text-slate-500">United States Roofing</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Roofing Inspection</h2>
              <div className="space-y-4 text-slate-600">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-blue-500" />
                  <span>60 minutes</span>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays size={18} className="text-blue-500" />
                  <span>Free Consultation</span>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm">We'll check your roof for leaks, storm damage, and general wear to give you an accurate quote.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border p-6 md:p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                Select a Date & Time
              </h3>
              
              <div className="space-y-8">
                {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                  <div key={date}>
                    <h4 className="font-bold text-slate-400 text-sm uppercase tracking-wider mb-4">{date}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {dateSlots.map((slot) => (
                        <button
                          key={slot.start}
                          onClick={() => setSelectedSlot(slot)}
                          className={cn(
                            "px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                            selectedSlot?.start === slot.start
                              ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]"
                              : "bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50"
                          )}
                        >
                          {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-8 border-t flex items-center justify-between">
                <div>
                  {selectedSlot && (
                    <p className="text-sm text-slate-500">
                      Selected: <span className="font-bold text-slate-900">{new Date(selectedSlot.start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </p>
                  )}
                </div>
                <button
                  disabled={!selectedSlot || isSubmitting}
                  onClick={handleBook}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200"
                >
                  {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
