'use client';

import { useState } from 'react';

interface Submission {
  id: string;
  name: string;
  date: string;
  narrative: string;
  valueTriad: { x: number; y: number };
  identityTriad: { x: number; y: number };
  universityStartupSlider: number;
  timestamp: string;
  analysis?: {
    values: {
      container: number;
      network: number;
      launchpad: number;
    };
    identity: {
      sanctuary: number;
      laboratory: number;
      guild: number;
    };
    academicVentureBalance: number;
  };
}

const ADMIN_PASSWORD = 'residency2024'; // Simple password protection

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      loadSubmissions();
    } else {
      setError('Invalid password');
    }
  };

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        throw new Error('Failed to load submissions');
      }
    } catch (err) {
      setError('Failed to load submissions');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (submissions.length === 0) return;

    const headers = [
      'ID',
      'Name',
      'Date/Time',
      'Timestamp',
      'Narrative',
      'Container %',
      'Network %',
      'Launchpad %',
      'Sanctuary %',
      'Laboratory %',
      'Guild %',
      'Academic-Venture Balance %'
    ];

    const csvContent = [
      headers.join(','),
      ...submissions.map(sub => [
        sub.id,
        sub.name,
        sub.date,
        sub.timestamp,
        `"${sub.narrative.replace(/"/g, '""')}"`, // Escape quotes in narrative
        sub.analysis?.values.container || 0,
        sub.analysis?.values.network || 0,
        sub.analysis?.values.launchpad || 0,
        sub.analysis?.identity.sanctuary || 0,
        sub.analysis?.identity.laboratory || 0,
        sub.analysis?.identity.guild || 0,
        sub.universityStartupSlider
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `residency-pulse-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-900 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-gray-100 mb-6 text-center">
            Admin Access
          </h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="Enter admin password"
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100">
            Residency Pulse Admin
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={loadSubmissions}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Refresh Data'}
            </button>
            <button
              onClick={exportToCSV}
              disabled={submissions.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-gray-100">
              Submissions ({submissions.length})
            </h2>
          </div>

          {submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No submissions yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Date/Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Narrative
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Value Engine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Identity Map
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Academic-Venture
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-medium">
                        {submission.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(submission.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 max-w-md">
                        <div className="truncate" title={submission.narrative}>
                          {submission.narrative}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {submission.analysis && (
                          <div className="space-y-1">
                            <div>C: {submission.analysis.values.container}%</div>
                            <div>N: {submission.analysis.values.network}%</div>
                            <div>L: {submission.analysis.values.launchpad}%</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {submission.analysis && (
                          <div className="space-y-1">
                            <div>Sanc: {submission.analysis.identity.sanctuary}%</div>
                            <div>Lab: {submission.analysis.identity.laboratory}%</div>
                            <div>Guild: {submission.analysis.identity.guild}%</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {submission.universityStartupSlider}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}