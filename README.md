# Operator Skills Hub

A comprehensive construction training management platform with AI integration, designed to streamline operations and enhance learning outcomes for construction training providers.

## 🏗️ Project Overview

Operator Skills Hub is a full-stack training management system that addresses the key pain points in construction training:

- **Paper-heavy processes** → Digital transformation
- **Manual lesson planning** → AI-assisted content generation
- **Time-consuming enrollment** → Streamlined CSCS integration
- **Manual test marking** → Automated assessment and grading
- **Limited data insights** → Predictive analytics and performance metrics

## 🚀 Key Features

### Core Functionality
- **Multi-role System**: Students, Instructors, Administrators
- **CSCS Integration**: Automatic qualification verification
- **AI Content Generation**: Automated lesson planning and content creation
- **Predictive Analytics**: Early warning system for at-risk students
- **Mobile-First Design**: Responsive design with offline capability
- **Real-time Analytics**: Instructor performance metrics and learning analytics

### Technical Highlights
- **Backend**: FastAPI with PostgreSQL and Redis
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **AI Integration**: OpenAI GPT API with LangChain
- **Security**: JWT authentication, GDPR compliance
- **Deployment**: Docker containerization with Docker Compose

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI 0.104+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Cache**: Redis
- **AI/ML**: OpenAI GPT, LangChain, scikit-learn
- **Authentication**: JWT with OAuth2
- **File Storage**: AWS S3 / CloudFlare R2

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + TanStack Query
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Deployment**: Vercel (Frontend) + Railway/DigitalOcean (Backend)

## 📁 Project Structure

```
OperatorSkillsHub/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Configuration and database
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── tests/              # Test files
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utility functions
│   │   └── types/         # TypeScript types
│   ├── public/            # Static assets
│   ├── package.json       # Node.js dependencies
│   └── Dockerfile
├── docs/                  # Documentation
├── docker-compose.yml     # Development environment
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd OperatorSkillsHub
   ```

2. **Set up environment variables**
   ```bash
   cp backend/env.example backend/.env
   # Edit backend/.env with your configuration
   ```

3. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

4. **Access the applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development (without Docker)

1. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🗄️ Database Schema

### Core Entities
- **Users**: Authentication and basic user information
- **User Profiles**: Extended user profile data
- **Courses**: Training course information
- **Course Modules**: Course content organization
- **Course Content**: Actual learning materials
- **Enrollments**: Student course enrollments
- **Learning Sessions**: Progress tracking
- **Assessments**: Course evaluations
- **Assessment Attempts**: Student assessment attempts

### AI & Analytics
- **Content Generations**: AI-generated content tracking
- **Predictive Scores**: Student performance predictions
- **Instructor Metrics**: Teaching effectiveness metrics

## 🔐 Security & Compliance

- **Authentication**: JWT tokens with OAuth2
- **Data Protection**: GDPR compliant data handling
- **Encryption**: At-rest and in-transit encryption
- **Access Controls**: Role-based permissions
- **Audit Logging**: Comprehensive activity tracking

## 🤖 AI Integration

### Content Generation
- Automated lesson plan creation
- AI-assisted course content generation
- Quality assurance workflows

### Predictive Analytics
- Student performance prediction
- Early warning system for at-risk students
- Intervention recommendations

### Performance Analytics
- Instructor effectiveness metrics
- Course optimization insights
- Resource allocation recommendations

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/token` - Login and get access token
- `GET /api/auth/me` - Get current user information

### Courses
- `GET /api/courses` - List all published courses
- `GET /api/courses/{id}` - Get specific course details

### Learning
- `GET /api/learning/enrollments` - Get user enrollments
- `POST /api/learning/enrollments/{course_id}` - Enroll in course

### AI & Analytics
- `GET /api/ai/content-generations` - Get AI content generations
- `GET /api/ai/predictive-scores` - Get predictive scores

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📈 Deployment

### Production Deployment
1. Set up production environment variables
2. Configure database and Redis instances
3. Deploy backend to Railway/DigitalOcean
4. Deploy frontend to Vercel
5. Configure domain and SSL certificates

### Environment Variables
See `backend/env.example` for required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is proprietary software for Operator Skills Hub.

## 📞 Support

For support and questions:
- Email: info@operatorskillshub.com
- Phone: +44 20 1234 5678
- Website: https://www.operatorskillshub.com

---

**Built with ❤️ for the construction industry**

