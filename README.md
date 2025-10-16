# RecCheck - UCLA Recreation Occupancy Tracker

Live occupancy tracking for UCLA Recreation facilities. See real-time crowding levels, find optimal workout times, and avoid the crowds. Check it out here: https://reccheck-wmns.vercel.app/ 

## Features

- **Live Occupancy Data** - Real-time data from UCLA Recreation API
- **Multi-Facility Support** - John Wooden Center, BruinFit, Kinross Recreation Center
- **Zone Breakdown** - Individual occupancy for Cardio, Free Weights, Selectorized equipment
- **Color-Coded Status** - Green (Low), Yellow (Moderate), Red (High) crowding
- **Hours Integration** - Current hours and next schedule changes
- **Mobile-First Design** - Optimized for phones and tablets
- **Custom UI** - UCLA-inspired design with Lato font

## Quick Start

```bash
# Clone the repository
git clone https://github.com/anushaladha04/reccheck.git

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 to view the app.

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Lato font
- UCLA Recreation API

## How It Works

1. Fetches live occupancy data from UCLA Recreation's official API
2. Calculates occupancy percentages for each zone
3. Displays real-time crowding levels with color coding
4. Updates every 30 seconds to keep data current
