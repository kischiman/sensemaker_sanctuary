# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Residency Pulse is a mobile-responsive web application for capturing research micro-narratives. Built with Next.js 16, TypeScript, and Tailwind CSS, it features interactive SVG-based Triad components and a clean, dark-themed UI.

## Development Commands

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Architecture

### Frontend Components
- **ResidencyForm** (`src/components/ResidencyForm.tsx`): Main form orchestrating all input components
- **Triad** (`src/components/Triad.tsx`): Interactive equilateral triangle for balancing three values using SVG and drag interactions
- **Slider** (`src/components/Slider.tsx`): Range slider for the University/Startup spectrum

### Data Flow
- Form submissions are sent to `/api/submissions` which stores data in JSON format
- Submissions include barycentric coordinates from triads converted to percentage values
- Data is stored in `data/submissions.json` with analysis metadata

### API Routes
- `POST /api/submissions` - Save new submission with automatic analysis calculation
- `GET /api/submissions` - Retrieve all submissions (admin only)

### Admin Interface
- `/admin` route with password protection (password: "residency2024")
- Data export to CSV functionality
- Tabular view of all submissions with interpreted values

### Admin Dashboard
- `/admin/dashboard` route with hardcoded password protection (password: "residency2024")
- **Heatmap Visualizations**: SVG-based scatter plots showing submission distribution on both triads
- **Timeline Analysis**: University vs. Startup trend line showing progression over time
- **Enhanced CSV Export**: Includes X/Y coordinates, barycentric percentages, UTF-8 encoding
- **Real-time Statistics**: Total submissions, unique contributors, average startup orientation

## Data Structure

Each submission contains:
- Micro-narrative text
- Two triad positions (value and identity balance)
- University/startup slider value
- Calculated barycentric percentages for analysis
- Timestamp

## Key Design Patterns

- Dark theme with Web3/research aesthetic using gray-950 background
- Gradient text for headers using blue-purple-cyan colors
- SVG-based interactive components with real-time coordinate calculation
- File-based data storage using fs-extra for simplicity
- Client-side form state management with immediate visual feedback