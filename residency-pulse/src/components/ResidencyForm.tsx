'use client';

import { useState } from 'react';
import { Triad } from './Triad';
import { Slider } from './Slider';

interface FormData {
  name: string;
  date: string;
  narrative: string;
  valueTriad: { x: number; y: number };
  identityTriad: { x: number; y: number };
  universityStartupSlider: number;
}

export function ResidencyForm() {
  // Get current date and time in local timezone for datetime-local input
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState<FormData>({
    name: '',
    date: getCurrentDateTime(),
    narrative: '',
    valueTriad: { x: 250, y: 250 },
    identityTriad: { x: 250, y: 250 },
    universityStartupSlider: 50,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSubmitMessage('✨ Thank you! Your micro-narrative has been captured.');
        setFormData({
          name: '',
          date: getCurrentDateTime(),
          narrative: '',
          valueTriad: { x: 250, y: 250 },
          identityTriad: { x: 250, y: 250 },
          universityStartupSlider: 50,
        });
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      setSubmitMessage('❌ Something went wrong. Please try again.');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Residency Pulse
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Capture the micro-narratives of your research journey. Balance your values, identity, and academic-venture orientation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Name and Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Dropdown */}
          <div className="space-y-2">
            <label className="block text-lg font-semibold text-gray-200">
              Your Name
            </label>
            <select
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              required
            >
              <option value="" disabled>Select your name</option>
              <option value="Anna">Anna</option>
              <option value="Andrej">Andrej</option>
              <option value="Justina">Justina</option>
              <option value="Matt">Matt</option>
              <option value="Anastasia">Anastasia</option>
              <option value="Kirill">Kirill</option>
              <option value="Jordi">Jordi</option>
              <option value="Stacey">Stacey</option>
              <option value="Jane">Jane</option>
            </select>
          </div>

          {/* Date and Time Selector */}
          <div className="space-y-2">
            <label className="block text-lg font-semibold text-gray-200">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
        </div>

        {/* Micro-narrative */}
        <div className="space-y-4">
          <label className="block text-xl font-semibold text-gray-200">
            Share a specific moment or observation from today that defined your experience.
          </label>
          <textarea
            value={formData.narrative}
            onChange={(e) => setFormData({ ...formData, narrative: e.target.value })}
            className="w-full h-32 p-4 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
            placeholder="Share a moment, observation, or insight from your research journey..."
            required
          />
        </div>

        {/* Value Engine Triad */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-200 text-center">
            The Value Engine
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto">
            Looking back at your most productive or meaningful moment today, what made it possible?
          </p>
          
          {/* Explanations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="font-medium text-gray-300 mb-1">The Container</div>
              <div>The accountability, the structure, the dedicated time/space to focus</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-300 mb-1">The Network</div>
              <div>Access to expert peers, serendipitous feedback, learning from others</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-300 mb-1">The Launchpad</div>
              <div>The visibility of the publication, potential job offers, the &lsquo;prestige&rsquo; of the output</div>
            </div>
          </div>
          
          <p className="text-gray-400 text-center text-sm">
            Drag the point to reflect how these elements contributed to your experience
          </p>
          <div className="flex justify-center">
            <Triad
              labels={['The Container', 'The Network', 'The Launchpad']}
              value={formData.valueTriad}
              onChange={(position) => setFormData({ ...formData, valueTriad: position })}
            />
          </div>
        </div>

        {/* Identity Map Triad */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-200 text-center">
            The Identity Map
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto">
            If you were describing the &lsquo;vibe&rsquo; of this week to a close friend, which of these sounds most like your experience?
          </p>
          
          {/* Explanations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="font-medium text-gray-300 mb-1">The Sanctuary</div>
              <div>Focus on health, lifestyle, co-living, and personal rejuvenation</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-300 mb-1">The Laboratory</div>
              <div>Focus on rigorous research, academic-style inquiry, and hard data</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-300 mb-1">The Guild</div>
              <div>Focus on professional mastery, individual projects, and peer-to-peer expert work</div>
            </div>
          </div>
          
          <p className="text-gray-400 text-center text-sm">
            Drag the point to reflect how these elements shaped your weekly experience
          </p>
          <div className="flex justify-center">
            <Triad
              labels={['The Sanctuary', 'The Laboratory', 'The Guild']}
              value={formData.identityTriad}
              onChange={(position) => setFormData({ ...formData, identityTriad: position })}
            />
          </div>
        </div>

        {/* University/Startup Slider */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-200 text-center">
            Academic-Venture Spectrum
          </h2>
          <p className="text-gray-400 text-center">
            Where did your focus lean today?
          </p>
          <div className="flex justify-center">
            <Slider
              leftLabel="University / Academic"
              rightLabel="Startup / Venture"
              value={formData.universityStartupSlider}
              onChange={(value) => setFormData({ ...formData, universityStartupSlider: value })}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center space-y-4">
          <button
            type="submit"
            disabled={isSubmitting || !formData.narrative.trim() || !formData.name}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg 
                     hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 transform hover:scale-105 focus:ring-4 focus:ring-blue-500/25"
          >
            {isSubmitting ? 'Capturing...' : 'Capture Pulse'}
          </button>
          
          {submitMessage && (
            <p className={`text-sm ${submitMessage.includes('✨') ? 'text-green-400' : 'text-red-400'}`}>
              {submitMessage}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}