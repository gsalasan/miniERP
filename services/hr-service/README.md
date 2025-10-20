# HR Service - miniERP

Human Resources service untuk sistem miniERP yang menangani manajemen karyawan, kehadiran, cuti, dan performa.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL database
- Prisma CLI

### Installation
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

## 📋 Available Scripts

```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm run start              # Start production server

# Database
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run database migrations
npm run prisma:studio      # Open Prisma Studio
npm run prisma:deploy      # Deploy migrations
npm run prisma:reset       # Reset database

# Code Quality
npm run lint               # Lint and fix code
npm run format             # Format code
npm run type-check         # Type check
```

## 🗄️ Database Schema

### Models

#### Employee
- **Personal Information**: Name, email, phone, gender, date of birth, etc.
- **Employment Details**: Position, department, manager, hire date, salary
- **Address Information**: Current and permanent addresses
- **Emergency Contact**: Contact person and details
- **Education**: University, major, graduation year, certifications
- **Skills & Languages**: Skills and language proficiencies

#### Attendance
- **Time Tracking**: Check-in/out times, break times
- **Status**: Present, absent, late, half-day, work from home
- **Calculations**: Total hours, overtime hours
- **Location**: IP address, physical location

#### Leave Request
- **Leave Types**: Annual, sick, maternity, emergency, etc.
- **Status**: Pending, approved, rejected, cancelled
- **Approval**: Approver, approval date, rejection reason
- **Duration**: Start date, end date, total days

#### Performance Review
- **Ratings**: Overall, goals, skills, attitude (1.00-5.00)
- **Feedback**: Strengths, areas for improvement
- **Goals**: Next period objectives
- **Period**: Review year, quarter, period

#### Training Record
- **Training Details**: Name, provider, duration
- **Certification**: Certificate number, file
- **Cost**: Training cost tracking
- **Status**: Completed, in progress, cancelled

#### Employee Document
- **Document Types**: CV, contract, certificate, ID copy
- **File Management**: Path, size, MIME type
- **Security**: Confidentiality flags
- **Expiry**: Document expiration dates

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Server
PORT=3002
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=8h

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# HR Settings
DEFAULT_LEAVE_DAYS=12
MAX_LEAVE_DAYS=30
WORKING_HOURS_PER_DAY=8
WORKING_DAYS_PER_WEEK=5
```

## 📊 API Endpoints

### Health Check
- `GET /health` - Service health status

### Employee Management (Planned)
- `GET /api/v1/employees` - List all employees
- `POST /api/v1/employees` - Create new employee
- `GET /api/v1/employees/:id` - Get employee details
- `PUT /api/v1/employees/:id` - Update employee
- `DELETE /api/v1/employees/:id` - Delete employee

### Attendance (Planned)
- `GET /api/v1/attendance` - List attendance records
- `POST /api/v1/attendance/check-in` - Check in
- `POST /api/v1/attendance/check-out` - Check out
- `GET /api/v1/attendance/employee/:id` - Employee attendance

### Leave Management (Planned)
- `GET /api/v1/leaves` - List leave requests
- `POST /api/v1/leaves` - Create leave request
- `PUT /api/v1/leaves/:id/approve` - Approve leave
- `PUT /api/v1/leaves/:id/reject` - Reject leave

### Performance (Planned)
- `GET /api/v1/performance` - List performance reviews
- `POST /api/v1/performance` - Create performance review
- `GET /api/v1/performance/employee/:id` - Employee performance

## 🏗️ Architecture

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── routes/          # API routes
├── middlewares/     # Custom middlewares
├── utils/           # Utility functions
├── app.ts           # Express app configuration
└── server.ts        # Server entry point
```

## 🔒 Security Features

- JWT authentication
- Role-based access control
- File upload validation
- Input sanitization
- CORS configuration

## 📈 Features

### Employee Management
- Complete employee profiles
- Organizational hierarchy
- Document management
- Skills and competencies tracking

### Attendance System
- Time tracking
- Overtime calculation
- Location tracking
- Flexible work arrangements

### Leave Management
- Multiple leave types
- Approval workflow
- Leave balance tracking
- Calendar integration

### Performance Management
- 360-degree reviews
- Goal setting and tracking
- Rating systems
- Development planning

### Training & Development
- Training records
- Certificate management
- Cost tracking
- Skill development

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm run start
```

### Docker
```bash
docker build -t hr-service .
docker run -p 3002:3002 hr-service
```

## 📝 License

This project is part of the miniERP system.
