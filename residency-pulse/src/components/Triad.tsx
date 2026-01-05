'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';

interface TriadProps {
  labels: [string, string, string];
  onChange: (position: { x: number; y: number }) => void;
  value?: { x: number; y: number };
}

export function Triad({ labels, onChange, value }: TriadProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(value || { x: 250, y: 250 }); // Center of triangle

  const size = 500;
  const margin = 100;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - margin;

  // Calculate triangle vertices (equilateral triangle pointing up)
  const vertices = useMemo(() => [
    { x: centerX, y: centerY - radius }, // Top
    { x: centerX - radius * Math.cos(Math.PI / 6), y: centerY + radius * Math.sin(Math.PI / 6) }, // Bottom left
    { x: centerX + radius * Math.cos(Math.PI / 6), y: centerY + radius * Math.sin(Math.PI / 6) }, // Bottom right
  ], [centerX, centerY, radius]);

  // Check if point is inside triangle using barycentric coordinates
  const isInsideTriangle = useCallback((x: number, y: number) => {
    const [v1, v2, v3] = vertices;
    const denom = (v2.y - v3.y) * (v1.x - v3.x) + (v3.x - v2.x) * (v1.y - v3.y);
    const a = ((v2.y - v3.y) * (x - v3.x) + (v3.x - v2.x) * (y - v3.y)) / denom;
    const b = ((v3.y - v1.y) * (x - v3.x) + (v1.x - v3.x) * (y - v3.y)) / denom;
    const c = 1 - a - b;
    
    return a >= 0 && b >= 0 && c >= 0;
  }, [vertices]);

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    event.preventDefault();
  };

  const handleMouseMove = useCallback((event: React.MouseEvent | MouseEvent) => {
    if (!isDragging || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (isInsideTriangle(x, y)) {
      const newPosition = { x, y };
      setPosition(newPosition);
      onChange(newPosition);
    }
  }, [isDragging, isInsideTriangle, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global event listeners for mouse move and up
  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (event: MouseEvent) => {
        handleMouseMove(event);
      };
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Calculate barycentric coordinates for display
  const getBarycentricCoords = (x: number, y: number) => {
    const [v1, v2, v3] = vertices;
    const denom = (v2.y - v3.y) * (v1.x - v3.x) + (v3.x - v2.x) * (v1.y - v3.y);
    const a = ((v2.y - v3.y) * (x - v3.x) + (v3.x - v2.x) * (y - v3.y)) / denom;
    const b = ((v3.y - v1.y) * (x - v3.x) + (v1.x - v3.x) * (y - v3.y)) / denom;
    const c = 1 - a - b;
    
    return [Math.max(0, a), Math.max(0, b), Math.max(0, c)];
  };

  const coords = getBarycentricCoords(position.x, position.y);

  return (
    <div className="flex flex-col items-center space-y-4">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        className="border border-gray-700 rounded-lg bg-gray-900/50 cursor-pointer"
        onMouseMove={handleMouseMove}
      >
        {/* Triangle outline */}
        <polygon
          points={vertices.map(v => `${v.x},${v.y}`).join(' ')}
          fill="none"
          stroke="#4a5568"
          strokeWidth="2"
          className="opacity-60"
        />
        
        {/* Grid lines for better visualization */}
        {[0.25, 0.5, 0.75].map((ratio, i) => (
          <g key={i}>
            {/* Lines from each vertex towards opposite side */}
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
        
        {/* Draggable dot */}
        <circle
          cx={position.x}
          cy={position.y}
          r="8"
          fill="#60a5fa"
          stroke="#1e40af"
          strokeWidth="2"
          className="cursor-pointer hover:fill-blue-400 transition-colors"
          onMouseDown={handleMouseDown}
        />
        
        {/* Labels */}
        <text
          x={vertices[0].x}
          y={vertices[0].y - 20}
          textAnchor="middle"
          className="fill-gray-300 text-sm font-medium"
        >
          {labels[0]}
        </text>
        <text
          x={vertices[1].x - 70}
          y={vertices[1].y + 30}
          textAnchor="middle"
          className="fill-gray-300 text-sm font-medium"
        >
          {labels[1]}
        </text>
        <text
          x={vertices[2].x + 70}
          y={vertices[2].y + 30}
          textAnchor="middle"
          className="fill-gray-300 text-sm font-medium"
        >
          {labels[2]}
        </text>
      </svg>
      
      {/* Value display */}
      <div className="flex space-x-6 text-sm">
        {labels.map((label, i) => (
          <div key={label} className="text-center">
            <div className="text-gray-400">{label}</div>
            <div className="text-blue-400 font-mono">
              {(coords[i] * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}