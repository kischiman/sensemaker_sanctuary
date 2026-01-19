'use client';

import { useState, useEffect } from 'react';

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

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setIsLoading(true);
    setError('');
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

  const deleteSubmission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) {
      return;
    }

    try {
      const response = await fetch('/api/submissions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setSubmissions(prev => prev.filter(sub => sub.id !== id));
      } else {
        throw new Error('Failed to delete submission');
      }
    } catch (err) {
      setError('Failed to delete submission');
      console.error(err);
    }
  };

  // Calculate barycentric coordinates
  const getBarycentricCoords = (x: number, y: number) => {
    const size = 500;
    const margin = 100;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - margin;

    const vertices = [
      { x: centerX, y: centerY - radius }, // Top
      { x: centerX - radius * Math.cos(Math.PI / 6), y: centerY + radius * Math.sin(Math.PI / 6) }, // Bottom left
      { x: centerX + radius * Math.cos(Math.PI / 6), y: centerY + radius * Math.sin(Math.PI / 6) }, // Bottom right
    ];

    const [v1, v2, v3] = vertices;
    const denom = (v2.y - v3.y) * (v1.x - v3.x) + (v3.x - v2.x) * (v1.y - v3.y);
    const a = ((v2.y - v3.y) * (x - v3.x) + (v3.x - v2.x) * (y - v3.y)) / denom;
    const b = ((v3.y - v1.y) * (x - v3.x) + (v1.x - v3.x) * (y - v3.y)) / denom;
    const c = 1 - a - b;
    
    return [Math.max(0, a), Math.max(0, b), Math.max(0, c)];
  };

  const exportEnhancedCSV = () => {
    if (submissions.length === 0) return;

    const headers = [
      'Timestamp',
      'Name',
      'Narrative Text',
      'Value Engine X',
      'Value Engine Y', 
      'Value Engine Container %',
      'Value Engine Network %',
      'Value Engine Launchpad %',
      'Identity Map X',
      'Identity Map Y',
      'Identity Map Sanctuary %',
      'Identity Map Laboratory %',
      'Identity Map Guild %',
      'University/Startup Slider'
    ];

    const csvContent = [
      headers.join(','),
      ...submissions.map(sub => {
        const valueCoords = getBarycentricCoords(sub.valueTriad.x, sub.valueTriad.y);
        const identityCoords = getBarycentricCoords(sub.identityTriad.x, sub.identityTriad.y);
        
        return [
          sub.timestamp,
          sub.name,
          `"${sub.narrative.replace(/"/g, '""')}"`, // Escape quotes in narrative
          sub.valueTriad.x,
          sub.valueTriad.y,
          Math.round(valueCoords[0] * 100),
          Math.round(valueCoords[1] * 100),
          Math.round(valueCoords[2] * 100),
          sub.identityTriad.x,
          sub.identityTriad.y,
          Math.round(identityCoords[0] * 100),
          Math.round(identityCoords[1] * 100),
          Math.round(identityCoords[2] * 100),
          sub.universityStartupSlider
        ].join(',');
      })
    ].join('\n');

    // Create UTF-8 encoded blob
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `residency-pulse-insights-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Heatmap Component
  const TriadHeatmap = ({ title, data, labels }: { 
    title: string; 
    data: { x: number; y: number }[]; 
    labels: [string, string, string] 
  }) => {
    const size = 400;
    const margin = 80;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - margin;

    const vertices = [
      { x: centerX, y: centerY - radius },
      { x: centerX - radius * Math.cos(Math.PI / 6), y: centerY + radius * Math.sin(Math.PI / 6) },
      { x: centerX + radius * Math.cos(Math.PI / 6), y: centerY + radius * Math.sin(Math.PI / 6) },
    ];

    // Scale coordinates from 500px space to 400px space
    const scaleCoord = (coord: number) => (coord / 500) * 400;

    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4 text-center">{title}</h3>
        <div className="flex justify-center">
          <svg width={size} height={size} className="border border-gray-700 rounded-lg">
            {/* Triangle outline */}
            <polygon
              points={vertices.map(v => `${v.x},${v.y}`).join(' ')}
              fill="none"
              stroke="#4a5568"
              strokeWidth="2"
              className="opacity-60"
            />
            
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((ratio, i) => (
              <g key={i}>
                {vertices.map((vertex, idx) => {
                  const opposite1 = vertices[(idx + 1) % 3];
                  const opposite2 = vertices[(idx + 2) % 3];
                  const midPoint = {
                    x: opposite1.x + (opposite2.x - opposite1.x) * ratio,
                    y: opposite1.y + (opposite2.y - opposite1.y) * ratio,
                  };
                  
                  return (
                    <line
                      key={idx}
                      x1={vertex.x}
                      y1={vertex.y}
                      x2={vertex.x + (midPoint.x - vertex.x) * ratio}
                      y2={vertex.y + (midPoint.y - vertex.y) * ratio}
                      stroke="#4a5568"
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  );
                })}
              </g>
            ))}

            {/* Data points */}
            {data.map((point, index) => (
              <circle
                key={index}
                cx={scaleCoord(point.x)}
                cy={scaleCoord(point.y)}
                r="4"
                fill="#60a5fa"
                opacity="0.6"
                className="hover:opacity-100"
              />
            ))}
            
            {/* Labels */}
            <text x={vertices[0].x} y={vertices[0].y - 20} textAnchor="middle" className="fill-gray-300 text-sm">
              {labels[0]}
            </text>
            <text x={vertices[1].x - 50} y={vertices[1].y + 25} textAnchor="middle" className="fill-gray-300 text-sm">
              {labels[1]}
            </text>
            <text x={vertices[2].x + 50} y={vertices[2].y + 25} textAnchor="middle" className="fill-gray-300 text-sm">
              {labels[2]}
            </text>
          </svg>
        </div>
        <p className="text-center text-gray-400 text-sm mt-2">
          {data.length} submissions visualized
        </p>
      </div>
    );
  };

  // Timeline Component
  const Timeline = () => {
    if (submissions.length === 0) return null;

    // Group submissions by day and calculate daily averages
    const groupedByDay = submissions.reduce((acc, submission) => {
      const date = new Date(submission.timestamp).toDateString();
      if (!acc[date]) {
        acc[date] = {
          date,
          values: [],
          contributors: []
        };
      }
      acc[date].values.push(submission.universityStartupSlider);
      acc[date].contributors.push(submission.name);
      return acc;
    }, {} as Record<string, { date: string; values: number[]; contributors: string[] }>);

    // Calculate daily averages and sort by date
    const dailyAverages = Object.values(groupedByDay)
      .map(day => ({
        date: new Date(day.date),
        average: Math.round(day.values.reduce((sum, val) => sum + val, 0) / day.values.length),
        count: day.values.length,
        contributors: [...new Set(day.contributors)]
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const width = 700;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 80, left: 60 };

    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4 text-center">
          University vs. Startup Trend Over Time
        </h3>
        <div className="flex justify-center">
          <svg width={width} height={height} className="border border-gray-700 rounded-lg">
            {/* Horizontal grid lines and Y-axis labels */}
            {[0, 25, 50, 75, 100].map(value => (
              <g key={value}>
                <line
                  x1={margin.left}
                  y1={margin.top + (height - margin.top - margin.bottom) * (1 - value / 100)}
                  x2={width - margin.right}
                  y2={margin.top + (height - margin.top - margin.bottom) * (1 - value / 100)}
                  stroke="#4a5568"
                  strokeWidth="1"
                  opacity="0.3"
                />
                <text
                  x={margin.left - 10}
                  y={margin.top + (height - margin.top - margin.bottom) * (1 - value / 100) + 4}
                  textAnchor="end"
                  className="fill-gray-400 text-xs"
                >
                  {value}
                </text>
              </g>
            ))}

            {/* Vertical grid lines for dates */}
            {dailyAverages.map((_, index) => {
              const x = margin.left + (index / Math.max(1, dailyAverages.length - 1)) * (width - margin.left - margin.right);
              return (
                <line
                  key={index}
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={height - margin.bottom}
                  stroke="#4a5568"
                  strokeWidth="1"
                  opacity="0.2"
                />
              );
            })}

            {/* Trend line */}
            {dailyAverages.length > 1 && (
              <polyline
                points={dailyAverages.map((day, index) => {
                  const x = margin.left + (index / (dailyAverages.length - 1)) * (width - margin.left - margin.right);
                  const y = margin.top + (height - margin.top - margin.bottom) * (1 - day.average / 100);
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="3"
              />
            )}

            {/* Data points */}
            {dailyAverages.map((day, index) => {
              const x = margin.left + (index / Math.max(1, dailyAverages.length - 1)) * (width - margin.left - margin.right);
              const y = margin.top + (height - margin.top - margin.bottom) * (1 - day.average / 100);
              
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#60a5fa"
                  stroke="#1e40af"
                  strokeWidth="2"
                  className="hover:fill-blue-400"
                >
                  <title>
                    {`${day.date.toLocaleDateString()}: ${day.average}% avg (${day.count} submission${day.count !== 1 ? 's' : ''} from ${day.contributors.join(', ')})`}
                  </title>
                </circle>
              );
            })}

            {/* X-axis date labels */}
            {dailyAverages.map((day, index) => {
              const x = margin.left + (index / Math.max(1, dailyAverages.length - 1)) * (width - margin.left - margin.right);
              return (
                <text
                  key={index}
                  x={x}
                  y={height - margin.bottom + 20}
                  textAnchor="middle"
                  className="fill-gray-400 text-xs"
                  transform={`rotate(-45, ${x}, ${height - margin.bottom + 20})`}
                >
                  {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              );
            })}

            {/* Y-axis labels */}
            <text
              x={margin.left - 35}
              y={margin.top + 10}
              className="fill-gray-300 text-xs font-medium"
              textAnchor="middle"
            >
              Startup/Venture
            </text>
            <text
              x={margin.left - 35}
              y={height - margin.bottom - 10}
              className="fill-gray-300 text-xs font-medium"
              textAnchor="middle"
            >
              University/Academic
            </text>

            {/* X-axis title */}
            <text
              x={width / 2}
              y={height - 10}
              textAnchor="middle"
              className="fill-gray-300 text-sm font-medium"
            >
              Time
            </text>
          </svg>
        </div>
        <p className="text-center text-gray-400 text-sm mt-2">
          Daily averages showing shift from academic to venture focus over time ({dailyAverages.length} days tracked)
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Residency Pulse Dashboard
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
              onClick={exportEnhancedCSV}
              disabled={submissions.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              Export Insights CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Visualizations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Heatmaps */}
          <TriadHeatmap
            title="Value Engine Heatmap"
            data={submissions.map(s => s.valueTriad)}
            labels={['The Container', 'The Network', 'The Launchpad']}
          />
          <TriadHeatmap
            title="Identity Map Heatmap"
            data={submissions.map(s => s.identityTriad)}
            labels={['The Sanctuary', 'The Laboratory', 'The Guild']}
          />
        </div>

        {/* Timeline */}
        <div className="mb-8">
          <Timeline />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Total Submissions</h3>
            <p className="text-3xl font-bold text-blue-400">{submissions.length}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Unique Contributors</h3>
            <p className="text-3xl font-bold text-green-400">
              {new Set(submissions.map(s => s.name)).size}
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Avg. Startup Orientation</h3>
            <p className="text-3xl font-bold text-purple-400">
              {submissions.length > 0 
                ? Math.round(submissions.reduce((sum, s) => sum + s.universityStartupSlider, 0) / submissions.length)
                : 0}%
            </p>
          </div>
        </div>

        {/* Data Table Section */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Actions
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <button
                          onClick={() => deleteSubmission(submission.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
                        >
                          Delete
                        </button>
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