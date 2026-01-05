'use client';

import { useState } from 'react';

interface SliderProps {
  leftLabel: string;
  rightLabel: string;
  onChange: (value: number) => void;
  value?: number;
}

export function Slider({ leftLabel, rightLabel, onChange, value = 50 }: SliderProps) {
  const [sliderValue, setSliderValue] = useState(value);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value);
    setSliderValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between text-sm text-gray-400 mb-4">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={handleChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        
        {/* Current value indicator */}
        <div 
          className="absolute top-6 text-xs text-blue-400 font-mono transform -translate-x-1/2"
          style={{ left: `${sliderValue}%` }}
        >
          {sliderValue}%
        </div>
      </div>
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #60a5fa;
          cursor: pointer;
          border: 2px solid #1e40af;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #60a5fa;
          cursor: pointer;
          border: 2px solid #1e40af;
        }
      `}</style>
    </div>
  );
}