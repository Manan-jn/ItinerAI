# ItinerAI - AI-Powered Travel Planning Platform

<div align="center">  
  **Your AI Travel Companion for Seamless Trip Planning**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?style=flat&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
  [![Firebase](https://img.shields.io/badge/Firebase-12.4.0-orange?style=flat&logo=firebase)](https://firebase.google.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
</div>

## User Flow Diagram
![User Flow](https://github.com/user-attachments/assets/99900e3f-7f86-4e59-8861-3533f6073142)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

**ItinerAI** is an intelligent travel planning platform that leverages AI agents to create personalized travel itineraries. The platform provides end-to-end trip planning including destination suggestions, conveyance booking (flights, trains, buses), accommodation recommendations, and detailed day-wise itineraries.

### Key Highlights

- 🤖 **AI-Powered Recommendations**: Intelligent trip suggestions based on user preferences
- 🗺️ **Interactive Itinerary Builder**: Day-by-day planning with visual maps
- ✈️ **Multi-Modal Transport Search**: Flights, trains, and buses from 40K+ cities
- 🏨 **Smart Accommodation Finder**: Hotel recommendations with real-time availability
- 💬 **Conversational Interface**: Natural language chat for seamless planning
- 📱 **Responsive Design**: Beautiful UI that works on all devices

---

## ✨ Features

### 🎯 Core Features

- **AI Trip Suggestions**: Get personalized trip recommendations based on budget, duration, and preferences
- **Smart Chat Interface**: Conversational AI assistant for natural trip planning
- **Conveyance Search**:
  - Search flights, trains, and buses
  - Compare prices across multiple operators
  - Real-time availability and booking
- **Stays Management**:
  - Hotel search with 40K+ properties
  - Filter by rating, price, and amenities
  - Check-in/check-out date management
- **Itinerary Builder**:
  - Day-wise activity planning
  - Interactive map visualization
  - Add/remove/reorder days
  - Activity recommendations
- **User Authentication**: Secure Firebase authentication with Google Sign-In
- **Trip Memory**: Save and restore trips across sessions

### 🎨 UI/UX Features

- Modern glassmorphism design
- Smooth animations with GSAP
- 3D visualizations with Three.js
- Responsive mobile-first design
- Dark/Light theme support
- Loading states and skeleton screens

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│                    Deployed on Cloud Run                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Chat UI    │  │  Conveyance  │  │    Stays     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Itinerary   │  │  Dashboard   │  │   Booking    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (AI Agents)                       │
│              Deployed on VM Instances + ALB                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Chat Agent  │  │ Trip Planner │  │  Conveyance  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Stay Finder  │  │   Memory     │  │   Utility    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Firebase   │  │ Google Maps  │  │  Places API  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Branch Structure

- **`main`**: Production-ready frontend code
- **`agentic`**: Backend AI agent code with deployment configurations

---

## 🛠️ Tech Stack

### Frontend

| Technology       | Version | Purpose                      |
| ---------------- | ------- | ---------------------------- |
| **Next.js**      | 15.5.3  | React framework with SSR/SSG |
| **React**        | 19.1.0  | UI library                   |
| **TypeScript**   | 5.0     | Type-safe JavaScript         |
| **Tailwind CSS** | 4.0     | Utility-first CSS framework  |
| **Firebase**     | 12.4.0  | Authentication & Firestore   |
| **GSAP**         | 3.13.0  | Animation library            |
| **Three.js**     | 0.160.0 | 3D graphics                  |
| **React Icons**  | 5.5.0   | Icon library                 |

### Backend (Agentic Branch)

- Python-based AI agents
- FastAPI/Flask for API endpoints
- LangChain for AI orchestration
- PostgreSQL for data storage
- Redis for caching

### Infrastructure

- **Frontend**: Google Cloud Run
- **Backend**: VM Instances behind Application Load Balancer (ALB)
- **Database**: Firebase Firestore + PostgreSQL
- **CDN**: Google Cloud CDN
- **Monitoring**: Cloud Logging & Monitoring

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.x or higher ([Download](https://nodejs.org/))
- **npm**: v10.x or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **Firebase Account**: For authentication ([Sign up](https://firebase.google.com/))
- **Google Cloud Account**: For Maps API ([Sign up](https://cloud.google.com/))

### Optional (for backend development)

- **Python**: v3.10 or higher
- **Docker**: For containerization
- **Google Cloud SDK**: For deployment

---

## 🚀 Local Setup

### Step 1: Clone the Repository

```bash
# Clone the frontend repository
git clone https://github.com/your-username/itinerai-frontend.git
cd itinerai-frontend

# For backend (agentic branch)
git clone -b agentic https://github.com/your-username/itinerai-backend.git
```

### Step 2: Install Dependencies

```bash
# Install frontend dependencies
npm install

# This will install all required packages including:
# - Next.js, React, TypeScript
# - Tailwind CSS
# - Firebase SDK
# - GSAP, Three.js
# - React Icons
```

### Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials (see [Environment Variables](#environment-variables) section).

### Step 4: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication (Google Sign-In)
4. Enable Firestore Database
5. Copy your Firebase config
6. Update `firebase.js` with your configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### Step 5: Set Up Google Maps API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
3. Create an API key
4. Add the key to your `.env.local` file

### Step 6: Run the Development Server

```bash
# Start the Next.js development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Step 7: (Optional) Run Backend Locally

If you want to run the backend locally:

```bash
# Switch to agentic branch
cd ../itinerai-backend
git checkout agentic

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env

# Run the backend server
python main.py
```

The backend will be available at `http://localhost:8000`

---

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Backend API URL
BACKEND_API_URL=http://localhost:8000
# For production: https://your-backend-alb-url.com

# Google Maps & Places API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Firebase Configuration (Optional - can be in firebase.js)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Optional: Analytics
NEXT_PUBLIC_GA_TRACKING_ID=your_google_analytics_id
```

### Environment Variable Descriptions

| Variable                          | Description                                    | Required |
| --------------------------------- | ---------------------------------------------- | -------- |
| `BACKEND_API_URL`                 | URL of the backend AI agent API                | Yes      |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key                 | Yes      |
| `GOOGLE_PLACES_API_KEY`           | Google Places API key (server-side)            | Yes      |
| `NEXT_PUBLIC_FIREBASE_*`          | Firebase configuration (if not in firebase.js) | Optional |

---

## 📁 Project Structure

```
itinerai-frontend/
├── public/                      # Static assets
│   ├── images/                  # Image assets
│   ├── flights.json            # Flight data
│   ├── stay_data.json          # Stay data
│   └── places.json             # Places database (40K+ cities)
├── src/
│   ├── app/
│   │   ├── api/                # API routes (Next.js API)
│   │   │   ├── chat/           # Chat API endpoint
│   │   │   ├── conveyance/     # Conveyance search API
│   │   │   ├── stay/           # Stay search API
│   │   │   ├── itinerary/      # Itinerary generation API
│   │   │   ├── memory/         # User memory/preferences API
│   │   │   ├── session/        # Session management API
│   │   │   └── utility/        # Utility APIs (places, photos)
│   │   ├── components/         # React components
│   │   │   ├── auth/           # Authentication components
│   │   │   ├── flashcards/     # Trip suggestion cards
│   │   │   ├── flights-page/   # Flight page components
│   │   │   ├── ConveyanceTab.tsx    # Conveyance search UI
│   │   │   ├── StaysTab.tsx         # Stays search UI
│   │   │   ├── ItineraryWidget.tsx  # Itinerary builder
│   │   │   ├── FlightsWidget.tsx    # Flight search widget
│   │   │   ├── StaysWidget.tsx      # Stay search widget
│   │   │   └── ...
│   │   ├── contexts/           # React contexts
│   │   │   └── AuthContext.tsx # Authentication context
│   │   ├── flights/            # Flight pages
│   │   │   ├── [id]/           # Dynamic flight page
│   │   │   └── page.tsx        # Main flight page
│   │   ├── utils/              # Utility functions
│   │   │   ├── sessionManager.ts    # Session management
│   │   │   ├── tripStorage.ts       # Trip data storage
│   │   │   ├── itineraryStorage.ts  # Itinerary storage
│   │   │   ├── preFetchConveyance.ts # Pre-fetch conveyance
│   │   │   ├── preFetchStays.ts     # Pre-fetch stays
│   │   │   ├── placesData.ts        # Places data utilities
│   │   │   └── ...
│   │   ├── globals.css         # Global styles
│   │   └── layout.tsx          # Root layout
│   └── middleware.ts           # Next.js middleware
├── .env.local                  # Environment variables (create this)
├── .gitignore                  # Git ignore file
├── Dockerfile                  # Docker configuration
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

### Key Directories

- **`src/app/api/`**: Next.js API routes that proxy requests to the backend
- **`src/app/components/`**: Reusable React components
- **`src/app/utils/`**: Helper functions and utilities
- **`public/`**: Static assets including JSON data files

---

## 🚢 Deployment

### Frontend Deployment (Google Cloud Run)

#### Prerequisites

- Google Cloud SDK installed
- Docker installed
- Project created in Google Cloud Console

#### Steps

1. **Build the Docker image**:

```bash
docker build -t gcr.io/YOUR_PROJECT_ID/itinerai-frontend:latest .
```

2. **Push to Google Container Registry**:

```bash
docker push gcr.io/YOUR_PROJECT_ID/itinerai-frontend:latest
```

3. **Deploy to Cloud Run**:

```bash
gcloud run deploy itinerai-frontend \
  --image gcr.io/YOUR_PROJECT_ID/itinerai-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars BACKEND_API_URL=https://your-backend-alb-url.com
```

4. **Set up custom domain** (optional):

```bash
gcloud run domain-mappings create \
  --service itinerai-frontend \
  --domain your-domain.com \
  --region us-central1
```

### Backend Deployment (VM Instances + ALB)

The backend is deployed on the `agentic` branch. See the backend repository for detailed deployment instructions.

#### High-Level Steps:

1. Set up VM instances on Google Cloud
2. Configure Application Load Balancer
3. Deploy AI agent code to VMs
4. Configure health checks and auto-scaling
5. Set up SSL certificates

---

## 📚 API Documentation

### Frontend API Routes

All API routes are located in `src/app/api/` and act as proxies to the backend.

#### Chat API

```typescript
POST /api/chat
Body: {
  user_id: string,
  session_id: string,
  message: string
}
Response: {
  response_type: "text" | "trips" | "conveyance" | "stay" | "itinerary",
  message: any
}
```

#### Conveyance API

```typescript
POST /api/conveyance
Body: {
  user_id: string,
  session_id: string,
  message: string
}
Response: {
  conveyances: {
    from_city: string,
    to_city: string,
    conveyance_details: {
      flights?: Flight[],
      trains?: Train[]
    }
  }
}
```

#### Stay API

```typescript
POST /api/stay
Body: {
  user_id: string,
  session_id: string,
  message: string
}
Response: {
  stays: {
    city: string,
    stay_details: Stay[]
  }
}
```

#### Itinerary API

```typescript
POST /api/itinerary
Body: {
  user_id: string,
  session_id: string,
  message: string,
  current_itinerary: Itinerary[],
  current_day: number,
  trip_duration: number
}
Response: {
  itinerary: DayItinerary
}
```

### Backend API Endpoints

See the `agentic` branch documentation for detailed backend API documentation.

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint -- --fix
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Coding Standards

- Use TypeScript for all new code
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

#### Firebase Authentication Issues

- Ensure Firebase config is correct in `firebase.js`
- Check that Google Sign-In is enabled in Firebase Console
- Verify authorized domains in Firebase Console

#### Backend Connection Issues

- Check `BACKEND_API_URL` in `.env.local`
- Ensure backend is running (if local)
- Check CORS settings on backend

#### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Frontend Team**: Next.js, React, UI/UX
- **Backend Team**: AI Agents, Python, FastAPI
- **DevOps Team**: Cloud Infrastructure, CI/CD

---

## 📞 Support

For support, email support@itinerai.com or join our [Discord community](https://discord.gg/itinerai).

---

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Firebase for authentication and database
- Google Maps for location services
- All open-source contributors

---

<div align="center">
  Made with ❤️ by the ItinerAI Team
  
  [Website](https://itinerai.com) • [Documentation](https://docs.itinerai.com) • [Blog](https://blog.itinerai.com)
</div>
