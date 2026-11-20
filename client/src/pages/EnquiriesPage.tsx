import React, { useState } from 'react';
import { apiRequest } from '../api/client';
import { EventType } from '../types';
import { Mail, Phone, User, Calendar, Users, MessageSquare, CheckCircle2, Sparkles } from 'lucide-react';

export const EnquiriesPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [eventType, setEventType] = useState<EventType>('WEDDING');
  const [tentativeDate, setTentativeDate] = useState('');
  const [estimatedGuests, setEstimatedGuests] = useState(50);
  const [message, setMessage] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await apiRequest('/enquiries', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          phone,
          eventType,
          tentativeDate: tentativeDate || undefined,
          estimatedGuests,
          message,
        }),
      });

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit enquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-reserve-100 border border-reserve-200 text-reserve-800 text-[10px] uppercase tracking-widest font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-reserve-700" />
          <span>Curated Gatherings</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-charcoal-950">
          Bespoke Events &amp; Celebrations
        </h1>
        <p className="text-sm text-charcoal-600 font-light mt-3 leading-relaxed">
          From intimate pre-wedding soirees in Colaba courtyards to private film productions and executive leadership retreats across our 14 properties.
        </p>
      </div>

      {submitted ? (
        <div className="bg-white rounded-3xl p-10 border border-reserve-200 shadow-xl text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-300">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="text-xs uppercase tracking-widest text-reserve-700 font-bold">
            Enquiry Received
          </span>
          <h2 className="text-2xl font-serif font-bold text-charcoal-950 mt-1 mb-3">
            Our Concierge Will Connect Shortly
          </h2>
          <p className="text-xs text-charcoal-600 leading-relaxed mb-6">
            Thank you, {fullName}. Our events curator will review your requirements and reach out at {phone} within 24 hours with venue availability and bespoke lookbooks.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setMessage('');
            }}
            className="px-6 py-2.5 bg-reserve-900 text-white rounded-lg text-xs uppercase tracking-wider font-semibold"
          >
            Submit Another Enquiry
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-reserve-200 shadow-xl">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-reserve-600" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Natasha Poonawalla"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-reserve-600" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-reserve-600" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98200 88776"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Event Category *
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="w-full px-3 py-2.5 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500 font-medium"
                >
                  <option value="WEDDING">Intimate Wedding / Sangeet</option>
                  <option value="CORPORATE">Corporate Retreat / Board Summit</option>
                  <option value="PRIVATE_DINING">Private Dining &amp; Chef Table</option>
                  <option value="SHOOT">Film / Photography Production</option>
                  <option value="OTHER">Other Private Celebration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Tentative Event Date (Optional)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-reserve-600" />
                  <input
                    type="date"
                    value={tentativeDate}
                    onChange={(e) => setTentativeDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Estimated Guest Count
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3 top-3 text-reserve-600" />
                  <input
                    type="number"
                    min={5}
                    max={200}
                    value={estimatedGuests}
                    onChange={(e) => setEstimatedGuests(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Event Description &amp; Vision *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Share your preferred property, timing, catering wishes, and guest stay needs..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 text-xs rounded-lg border border-reserve-300 focus:outline-none focus:ring-2 focus:ring-reserve-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-reserve-900 hover:bg-charcoal-950 text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'Transmitting Request...' : 'Submit Bespoke Enquiry'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
