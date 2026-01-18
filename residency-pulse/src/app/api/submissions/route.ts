import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/kv';

// Initialize Redis client only if Vercel KV environment variables are properly set
let kv: ReturnType<typeof createClient> | null = null;
const kvUrl = process.env.KV_REST_API_URL;
const kvToken = process.env.KV_REST_API_TOKEN;

if (kvUrl && kvToken && kvUrl.trim() !== '' && kvToken.trim() !== '') {
  // Validate URL format
  if (kvUrl.startsWith('https://')) {
    try {
      kv = createClient({
        url: kvUrl,
        token: kvToken
      });
    } catch (error) {
      console.error('Failed to initialize KV client:', error);
    }
  } else {
    console.warn('KV_REST_API_URL must start with https://');
  }
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
      
      // Handle case where list might be empty, null, or undefined
      if (submissionsData != null && Array.isArray(submissionsData)) {
        if (submissionsData.length > 0) {
          // Parse JSON strings back to objects, filtering out any invalid entries
          submissions = submissionsData
            .map((item: unknown) => {
              try {
                if (typeof item === 'string') {
                  return JSON.parse(item);
                }
                // If item is already an object, return it directly
                if (typeof item === 'object' && item !== null) {
                  return item;
                }
                return null;
              } catch (parseError) {
                console.warn('Failed to parse submission item:', parseError, 'Item:', item);
                return null;
              }
            })
            .filter((item): item is SubmissionWithAnalysis => item !== null);
        
          // Since lpush adds to the beginning, reverse to get chronological order
          submissions.reverse();
        }
        // If submissionsData is an empty array, submissions remains empty array (correct behavior)
      } else {
        console.warn('Unexpected submissionsData format:', typeof submissionsData, submissionsData);
      }
    } else {
      // Use in-memory storage for local development
      submissions = [...memoryStore].reverse(); // reverse to get chronological order
    }
    
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error reading submissions:', error);
    return NextResponse.json(
      { error: 'Failed to read submissions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}