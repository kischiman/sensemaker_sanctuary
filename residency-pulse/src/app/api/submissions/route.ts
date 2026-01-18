import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/kv';

// Initialize Redis client only if REDIS_URL is available
let kv: ReturnType<typeof createClient> | null = null;
if (process.env.REDIS_URL) {
  kv = createClient({
    url: process.env.REDIS_URL,
    token: '' // Empty token when using Redis URL with integrated auth
  });
}

// In-memory fallback for local development
const memoryStore: SubmissionWithAnalysis[] = [];

interface Submission {
  id: string;
  name: string;
  date: string;
  narrative: string;
  valueTriad: { x: number; y: number };
  identityTriad: { x: number; y: number };
  universityStartupSlider: number;
  timestamp: string;
}

interface SubmissionWithAnalysis extends Submission {
  analysis: {
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

// Calculate barycentric coordinates for triads
function getBarycentricCoords(x: number, y: number) {
  const size = 500;
  const margin = 100;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - margin;

  // Triangle vertices (equilateral triangle pointing up)
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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, date, narrative, valueTriad, identityTriad, universityStartupSlider, timestamp } = body;

    // Validate required fields
    if (!name || !date || !narrative || !valueTriad || !identityTriad || universityStartupSlider === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate interpreted values
    const valueCoords = getBarycentricCoords(valueTriad.x, valueTriad.y);
    const identityCoords = getBarycentricCoords(identityTriad.x, identityTriad.y);

    const submission: Submission = {
      id: Date.now().toString(),
      name,
      date,
      narrative,
      valueTriad,
      identityTriad,
      universityStartupSlider,
      timestamp: timestamp || new Date().toISOString(),
    };

    // Add interpreted values for easier analysis
    const submissionWithAnalysis = {
      ...submission,
      analysis: {
        values: {
          container: Math.round(valueCoords[0] * 100),
          network: Math.round(valueCoords[1] * 100),
          launchpad: Math.round(valueCoords[2] * 100),
        },
        identity: {
          sanctuary: Math.round(identityCoords[0] * 100),
          laboratory: Math.round(identityCoords[1] * 100),
          guild: Math.round(identityCoords[2] * 100),
        },
        academicVentureBalance: universityStartupSlider,
      },
    };

    // Store submission in Redis or memory depending on environment
    if (kv) {
      await kv.lpush('residency_stories', JSON.stringify(submissionWithAnalysis));
    } else {
      // Fallback to in-memory storage for local development
      memoryStore.unshift(submissionWithAnalysis); // unshift to mimic lpush behavior
    }

    return NextResponse.json({ 
      message: 'Submission saved successfully',
      id: submission.id 
    });
    
  } catch (error) {
    console.error('Error saving submission:', error);
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    let submissions: SubmissionWithAnalysis[] = [];
    
    if (kv) {
      // Get all submissions from Redis list
      const submissionsData = await kv.lrange('residency_stories', 0, -1);
      
      // Parse JSON strings back to objects
      submissions = submissionsData.map((item: string) => JSON.parse(item));
      
      // Since lpush adds to the beginning, reverse to get chronological order
      submissions.reverse();
    } else {
      // Use in-memory storage for local development
      submissions = [...memoryStore].reverse(); // reverse to get chronological order
    }
    
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error reading submissions:', error);
    return NextResponse.json(
      { error: 'Failed to read submissions' },
      { status: 500 }
    );
  }
}