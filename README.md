# OPSMONITOR - Digital Operations Monitoring Tool

## Overview
OPSMONITOR is a professional infrastructure monitoring dashboard designed to track the health and performance of distributed server nodes. It provides real-time insights into CPU usage, RAM utilization, network traffic, and system latency.

## Key Features
- **Real-time Dashboard:** Live visualization of system metrics using Recharts.
- **Node Management:** Add and monitor multiple server nodes across different regions (e.g., us-east-1).
- **Alerting System:** Automated warnings for high resource utilization (CPU > 90%).
- **Infrastructure Map:** Geographic distribution of nodes visualized through interactive charts.
- **System Health Checks:** Real-time status indicators for backend connectivity.

## Technical Fixes & Improvements
- **Optimized State Management:** Resolved "Maximum update depth exceeded" errors by refining React `useEffect` hooks and alert logic.
- **Stable Backend Integration:** Fixed "Backend health check" issues to ensure consistent data streaming via Socket.io.
- **Responsive UI:** Built with Tailwind CSS and Framer Motion for a smooth, professional user experience.

## How to Run
1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Open the application in your browser at `http://localhost:3000`

## Credits
Developed with ❤️ using React, Express, and AI Studio.
