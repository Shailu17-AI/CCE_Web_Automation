# CCE Attendance & Leave Management System

A comprehensive attendance and leave management system for the Computer and Communication Engineering department.

## Features

- **Attendance Entry**: Record student absences with reasons and dates
- **Student Management**: Add, edit, and delete student records
- **Authorization System**: Two-step authorization by Class Advisor and HOD
- **Report Generation**: Download Excel reports for daily attendance and student lists
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Excel Export**: XLSX library
- **Storage**: LocalStorage for data persistence

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/Shailu17-AI/CCE_absentees_automation.git
cd CCE_absentees_automation
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## 🚀 Deployment

### Deploy to Vercel

#### Option 1: Using the deployment script
```bash
./deploy.sh
```

#### Option 2: Manual deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Build the application
npm run build

# Deploy to Vercel
vercel --prod
```

#### Option 3: Deploy via Vercel Dashboard
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will automatically detect it's a Vite project and deploy it

## 🌐 Live Application

Your application will be deployed at: `https://your-app-name.vercel.app`

### Available Routes
- `/` - Home (Attendance Entry)
- `/attendance` - Attendance Entry
- `/students` - Student List  
- `/about` - About page

## Usage

1. **Attendance Entry**: 
   - Search for students by name or register number
   - Select students and add absence reasons
   - Complete entry and proceed to authorization

2. **Authorization Flow**:
   - Class Advisor authorization using 4-digit passcode
   - HOD authorization for final approval
   - Automatic report generation upon completion

3. **Student Management**:
   - View complete student list with attendance statistics
   - Add new students to the system
   - Edit student information and leave counts

4. **Settings**:
   - Configure HOD and Class Advisor passcodes
   - Manage global working days
   - Export reports in Excel format

## Security Features

- Role-based access control
- Passcode-protected authorization
- Secure local storage for sensitive data
- Session-based authentication flow

## Department Information

- **Department**: Computer and Communication Engineering
- **Head of Department**: Dr. R. Saravanan
- **Class Advisor**: Mrs. M. Abirami

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any queries or support, please contact the development team.

---

**Note**: This system is designed specifically for academic institutions and may require customization for different use cases.
