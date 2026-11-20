import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, getApiErrorMessage } from '../api/client';
import { Sparkles, Mail, User, MessageSquare, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const enquirySchema = z.object({
  propertyId: z.string().min(1, 'Please select a preferred property'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type EnquiryFormData = z.infer<typeof enquirySchema>;

export const EnquiriesPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      propertyId: 'prop-the-grand-colaba-mansion',
      name: '',
      email: '',
      message: '',
    },
  });

  const onSubmit = async (data: EnquiryFormData) => {
    setServerError(null);
    try {
      await api.post('/enquiries', data);
      setSubmitted(true);
      reset();
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-3">
        <span className="text-xs uppercase tracking-widest text-amber-700 font-semibold">
          Bespoke Events & Celebrations
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-950">
          Private Gatherings & Curated Stays
        </h1>
        <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto">
          From intimate heritage courtyard celebrations to executive board retreats, our
          curators craft seamless experiences across Mumbai.
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-12 shadow-sm">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-serif font-bold text-2xl text-stone-950">
              Enquiry Received with Pleasure
            </h3>
            <p className="text-stone-600 text-sm max-w-md mx-auto">
              Our concierge team will review your requirements and reach out within 24 hours.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 px-6 py-2.5 bg-stone-900 text-white text-xs uppercase tracking-wider font-semibold rounded-xl"
            >
              Submit Another Enquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="Natasha Poonawalla"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:bg-white focus:outline-none"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:bg-white focus:outline-none"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                Preferred Boutique Haven
              </label>
              <select
                {...register('propertyId')}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:bg-white"
              >
                <option value="prop-the-grand-colaba-mansion">The Grand Colaba Mansion (Colaba)</option>
                <option value="prop-marine-drive-bayview">The Marine Drive Promenade (Marine Drive)</option>
                <option value="prop-malabar-hill-manor">Malabar Hill Estate (Malabar Hill)</option>
                <option value="prop-bandra-bandstand-villa">Bandra Heritage Villa (Bandra)</option>
                <option value="prop-juhu-beach-sanctuary">Juhu Ocean Residence (Juhu)</option>
                <option value="prop-worli-sea-face-residence">Worli Sea Face Residence (Worli)</option>
                <option value="prop-powai-lakefront-haven">Powai Lakefront Haven (Powai)</option>
              </select>
              {errors.propertyId && (
                <p className="mt-1 text-xs text-red-600">{errors.propertyId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-1.5">
                Event Vision & Stay Requirements
              </label>
              <textarea
                rows={4}
                {...register('message')}
                placeholder="Tell us about the dates, guest count, dining requirements, or bespoke setups..."
                className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:bg-white focus:outline-none"
              />
              {errors.message && (
                <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching to Concierge...</span>
                </>
              ) : (
                <span>Submit Bespoke Enquiry</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
