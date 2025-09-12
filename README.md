# Operator Skills Hub

A comprehensive learning management system designed specifically for construction and heavy equipment operator training. Built with modern web technologies and AI-powered features.

## 🚀 Features

### Multi-Role System
- **Admin Dashboard**: Complete system management, user oversight, and analytics
- **Instructor Portal**: Course creation, content management, and student monitoring
- **Student Portal**: Learning interface with progress tracking and assessments

### Learning Management
- **Structured Course Content**: Modular learning with videos, documents, and interactive content
- **AI-Powered Assessments**: Automated knowledge test generation using OpenAI GPT-3.5
- **Time Tracking**: Monitor learning session duration and engagement
- **Progress Analytics**: Detailed learning analytics and reporting

### Course Management
- **Content Upload**: PDF document processing and content extraction
- **Course Authorization**: Request/approval system for course access
- **NOCN Compliance**: Built-in assessment templates for industry standards
- **Multi-format Support**: Videos, documents, images, and interactive content

### AI Integration
- **Intelligent Content Generation**: AI-powered course content creation
- **Knowledge Test Automation**: Generate assessments from course materials
- **RAG (Retrieval-Augmented Generation)**: Context-aware content processing
- **Smart Recommendations**: Personalized learning paths

## 🛠 Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Modern component library

### Backend
- **FastAPI** - High-performance Python web framework
- **SQLAlchemy** - Python ORM for database operations
- **PostgreSQL (Neon DB)** - Cloud-hosted database
- **Pydantic** - Data validation and serialization

### AI & ML
- **OpenAI GPT-3.5-turbo** - Content generation and assessments
- **FAISS** - Vector similarity search for RAG
- **LangChain** - AI application framework

### Infrastructure
- **Docker** - Containerization
- **Git** - Version control
- **GitHub** - Code repository and collaboration

## 📁 Project Structure

```
OperatorSkillsHub/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── lib/            # Utility functions and API client
│   │   └── hooks/          # Custom React hooks
│   └── public/             # Static assets
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic services
│   └── alembic/            # Database migrations
├── learning-content/        # Course content and templates
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL database (or Neon DB account)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd OperatorSkillsHub
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment template
   cp backend/env.example backend/.env
   
   # Edit backend/.env with your configuration:
   # - Database URL
   # - OpenAI API key
   # - JWT secret key
   ```

5. **Database Setup**
   ```bash
   cd backend
   alembic upgrade head
   ```

6. **Start Services**
   ```bash
   # Terminal 1 - Backend
   cd backend
   source venv/bin/activate
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 👥 Default Users

### Admin
- **Email**: admin@example.com
- **Password**: password123
- **Access**: Full system administration

### Instructor
- **Email**: instructor@example.com
- **Password**: password123
- **Access**: Course creation and student management

### Student
- **Email**: student@example.com
- **Password**: password123
- **Access**: Learning portal and course enrollment

## 📚 Usage Guide

### For Administrators
1. **User Management**: Create and manage user accounts
2. **System Analytics**: Monitor platform usage and performance
3. **Course Oversight**: Review and approve course content
4. **System Configuration**: Manage platform settings and preferences

### For Instructors
1. **Course Creation**: Build comprehensive learning modules
2. **Content Upload**: Add PDFs, videos, and interactive materials
3. **AI Content Generation**: Use AI to create assessments and content
4. **Student Management**: Monitor progress and provide feedback

### For Students
1. **Course Discovery**: Browse available courses and request access
2. **Learning Interface**: Access course content with time tracking
3. **Assessments**: Complete knowledge tests and track progress
4. **Progress Monitoring**: View learning analytics and achievements

## 🔧 API Documentation

The backend provides a comprehensive REST API with the following main endpoints:

- **Authentication**: `/api/auth/` - User login, registration, and JWT management
- **Courses**: `/api/course-management/` - Course CRUD operations
- **Learning**: `/api/learning/` - Student learning interface
- **AI Services**: `/api/instructor-ai/` - AI-powered content generation
- **Time Tracking**: `/api/time-tracking/` - Learning session monitoring
- **Analytics**: `/api/analytics/` - Learning analytics and reporting

Full API documentation is available at `/docs` when the backend is running.

## 🤖 AI Features

### Content Generation
- **Course Materials**: Generate structured learning content from PDFs
- **Knowledge Tests**: Create assessments with multiple-choice questions
- **Learning Objectives**: Generate course goals and outcomes
- **Content Summarization**: Extract key points from documents

### RAG (Retrieval-Augmented Generation)
- **Document Processing**: Convert PDFs to searchable content
- **Vector Search**: Find relevant information using semantic search
- **Context-Aware Responses**: Generate content based on course context

## 📊 Learning Analytics

### Student Metrics
- **Time Tracking**: Monitor learning session duration
- **Progress Tracking**: Track completion rates and milestones
- **Assessment Performance**: Analyze test scores and improvement
- **Engagement Metrics**: Measure content interaction and time spent

### Instructor Insights
- **Course Performance**: Analyze course effectiveness
- **Student Progress**: Monitor individual and group progress
- **Content Analytics**: Track most/least engaging content
- **Assessment Results**: Review test performance and feedback

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions for different user types
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Comprehensive data validation and sanitization
- **SQL Injection Prevention**: Parameterized queries and ORM protection

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
1. **Backend**: Deploy FastAPI application to your preferred hosting service
2. **Frontend**: Build and deploy Next.js application
3. **Database**: Set up PostgreSQL database (Neon DB recommended)
4. **Environment**: Configure production environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation at `/docs` when running locally

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Multi-role authentication system
- ✅ Course management and content delivery
- ✅ AI-powered content generation
- ✅ Time tracking and analytics
- ✅ Course request/approval system

### Phase 2 (Planned)
- 🔄 Mobile application
- 🔄 Advanced analytics dashboard
- 🔄 Integration with external LMS systems
- 🔄 Video streaming optimization
- 🔄 Offline learning capabilities

### Phase 3 (Future)
- 🔄 VR/AR training modules
- 🔄 Advanced AI tutoring
- 🔄 Multi-language support
- 🔄 Enterprise integrations
- 🔄 Advanced reporting and compliance

---

**Built with ❤️ for the construction industry**