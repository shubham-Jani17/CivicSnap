# CivicSnap

CivicSnap is an AI-powered civic reporting and local volunteering action hub. It empowers citizens to snap photos of neighborhood issues, automatically generate municipal complaint drafts using AI, and organize volunteer cleanups.

## Features

- **AI-Powered Reporting**: Snap a photo of an issue (pothole, graffiti, etc.), and the integrated Gemini AI engine automatically classifies the severity and drafts a professional municipal complaint.
- **Interactive Civic Map**: View real-time reports and hyper-local risk overlays in your neighborhood on an interactive map.
- **Community Feed**: Discover and engage with community reports and upcoming volunteer cleanup events.
- **Volunteer Organization**: Join local cleanup campaigns and coordinate with neighbors.
- **Admin Dashboard**: Dedicated portal for administrators to review, approve, and manage civic issues.
- **Cinematic Experience**: Premium, responsive user interface featuring glassmorphism, Framer Motion animations, and a secure "Command Center" theme.

## Tech Stack

### Frontend
- **React 19** with **Vite**
- **Tailwind CSS v4** for styling and responsive design
- **Framer Motion** for elegant animations and transitions
- **Lucide React** for beautiful, consistent iconography
- **React Leaflet** for interactive mapping
- **Recharts** for data visualization

### Backend & API
- **Express.js (Node.js)**: Serves static assets and acts as a gateway/proxy.
- **FastAPI (Python)**: Handles core AI logic, data processing, and API routes.
- **Firebase**: Provides secure authentication and NoSQL database capabilities (Firestore).
- **Google Gemini API**: Powers the AI analytics and automatic complaint generation.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Firebase project credentials
- Google Gemini API Key

### Installation

1. **Clone the repository** (if applicable) or open it in your environment.
2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```
3. **Install Python dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. **Environment Variables**:
   Create a `.env` file in the root directory based on `.env.example` and add your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   FIREBASE_PROJECT_ID=your_firebase_project_id
   ```

### Running the Development Server

Start the full-stack development environment (this runs both the Express Vite server and the Python FastAPI backend):

```bash
npm run dev
```
The application will be available at `http://localhost:3000`. The API requests are automatically proxied to the Python backend running on port `8000`.

### Building for Production

Compile the frontend assets and bundle the server for production:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## Project Structure

- `/src`: Frontend React application code (Components, Pages, Services, Contexts).
- `/backend`: Python FastAPI backend code (Routers, Services, Schemas).
- `/server.ts`: The Express server entry point that serves the Vite app and spawns/proxies the Python backend.
- `metadata.json`: Application configuration and required permissions (Camera, Geolocation).

## Design Philosophy

CivicSnap uses a "Cyber Command Center" theme, characterized by Deep Navy backgrounds, Cyan/Teal accents, glassmorphic elements, and smooth spring animations. The interface is designed to make users feel like they are accessing an intelligent civic operating system.

## License
Apache-2.0
