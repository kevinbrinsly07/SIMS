# Student Information Management System (SIMS)

A comprehensive web-based application for managing student information, built with Laravel backend and React frontend. This system provides a complete solution for educational institutions to manage students, courses, grades, attendance, fees, and more.

## 🚀 Features

### Core Functionality
- **Student Management**: Complete student profiles with personal information, enrollment history, and academic records
- **Course Management**: Create and manage courses, assign instructors, and track course offerings
- **Grade Management**: Record and track student grades, assessments, and academic performance
- **Attendance Tracking**: Monitor student attendance with detailed records and analytics
- **Fee Management**: Handle tuition fees, payments, and financial transactions
- **Assessment System**: Create and manage quizzes, exams, and assignments

### Administrative Features
- **Dashboard Analytics**: Comprehensive overview with interactive charts and statistics
- **User Management**: Multi-role system (Admin, Student, Parent) with proper access controls
- **Admissions Management**: Handle student applications and enrollment processes
- **Notification System**: Send announcements and alerts to students and staff
- **Behavior Management**: Track student behavior incidents and disciplinary records
- **Health Records**: Maintain student health information and medical records

### Data Visualization
- Student department distribution charts
- Application status analytics
- Grade distribution analysis
- Fee payment status tracking
- Attendance trend monitoring
- Assessment type breakdowns
- User role statistics

## 🛠️ Tech Stack

### Backend
- **Laravel 12** - PHP web framework
- **Laravel Sanctum** - API authentication
- **MySQL** - Database
- **Composer** - PHP dependency management

### Frontend
- **React 19** - JavaScript library for UI
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Chart library for data visualization
- **Axios** - HTTP client for API calls
- **React Router** - Client-side routing

### Development Tools
- **ESLint** - Code linting
- **PHPUnit** - PHP testing framework
- **npm** - Node.js package manager

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **PHP 8.2 or higher**
- **Composer** (PHP dependency manager)
- **Node.js 18+ and npm**
- **MySQL 8.0+**
- **Git**

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/kevinbrinsly07/SIMS.git
cd SIMS
```

### 2. Backend Setup
```bash
cd backend

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure your database in .env file
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=sims
# DB_USERNAME=your_username
# DB_PASSWORD=your_password

# Run database migrations
php artisan migrate

# (Optional) Seed the database with sample data
php artisan db:seed
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install Node.js dependencies
npm install
```

## 🏃‍♂️ Running the Application

### Development Mode
You can run both backend and frontend simultaneously using Laravel's built-in development script:

```bash
cd backend
composer run dev
```

This will start:
- Laravel development server (http://localhost:8000)
- Queue worker for background jobs
- Vite development server for frontend (http://localhost:5173)
- Log monitoring

### Manual Startup

#### Backend Only
```bash
cd backend
php artisan serve
```

#### Frontend Only
```bash
cd frontend
npm run dev
```

### Production Build
```bash
# Build frontend for production
cd frontend
npm run build

# The built files will be in frontend/dist/
# Copy them to backend/public/ or serve them separately
```

## 📊 API Endpoints

The API provides RESTful endpoints for all major entities:

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get authenticated user info

### Core Resources
- `/api/students` - Student management
- `/api/courses` - Course management
- `/api/enrollments` - Enrollment records
- `/api/grades` - Grade management
- `/api/attendance` - Attendance tracking
- `/api/assessments` - Assessment management
- `/api/fees` - Fee management
- `/api/payments` - Payment processing
- `/api/applications` - Admission applications
- `/api/schedules` - Class schedules
- `/api/notifications` - Notification system
- `/api/behavior-logs` - Behavior incident tracking
- `/api/health-records` - Health record management
- `/api/users` - User management

### Student-Specific Endpoints
- `GET /api/students/{id}/courses` - Get student's enrolled courses
- `GET /api/students/{id}/grades` - Get student's grades
- `GET /api/students/{id}/attendance` - Get student's attendance
- `GET /api/students/{id}/fees` - Get student's fees
- `GET /api/students/{id}/payments` - Get student's payments
- `GET /api/students/{id}/notifications` - Get student's notifications

## 🔐 User Roles & Permissions

### Admin
- Full access to all features
- User management
- System configuration
- Complete CRUD operations on all entities
- Access to analytics dashboard

### Student
- View personal profile and academic records
- Access grades and attendance
- View fee information and payment history
- Receive notifications

### Parent/Guardian
- View children's information
- Monitor academic progress
- Access fee and payment details
- Receive notifications about their children

## 📈 Dashboard Features

The admin dashboard provides comprehensive analytics:

- **Overview Statistics**: Total counts of students, courses, applications, and pending fees
- **Student Department Distribution**: Pie chart showing students by department
- **Application Status**: Visual representation of application approval rates
- **Grade Distribution**: Bar chart showing grade ranges (A-F)
- **Fee Payment Status**: Payment completion tracking
- **Attendance Trends**: Daily attendance patterns over time
- **Assessment Types**: Breakdown of different assessment categories
- **User Role Statistics**: Distribution of system users by role

## 🧪 Testing

### Backend Tests
```bash
cd backend
php artisan test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 📁 Project Structure

```
SIMS/
├── backend/                 # Laravel API backend
│   ├── app/                # Application code
│   │   ├── Http/Controllers/  # API controllers
│   │   ├── Models/          # Eloquent models
│   │   └── Providers/       # Service providers
│   ├── database/           # Migrations and seeders
│   ├── routes/             # API routes
│   ├── config/             # Configuration files
│   └── public/             # Public assets
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── assets/         # Static assets
│   │   └── main.jsx        # Application entry point
│   ├── public/             # Public assets
│   └── dist/               # Built files (after npm run build)
└── README.md              # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PSR-12 coding standards for PHP
- Use ESLint configuration for JavaScript/React
- Write descriptive commit messages
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/kevinbrinsly07/SIMS/issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

## 🙏 Acknowledgments

- [Laravel](https://laravel.com/) - The PHP framework
- [React](https://reactjs.org/) - The JavaScript library
- [Tailwind CSS](https://tailwindcss.com/) - The CSS framework
- [Recharts](https://recharts.org/) - The charting library
- [Vite](https://vitejs.dev/) - The build tool

---

**Built with ❤️ for educational institutions worldwide**