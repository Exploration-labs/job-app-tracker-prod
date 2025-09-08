# Job Application Tracker

> A comprehensive, privacy-focused web application for managing job applications, resumes, and interview preparation with intelligent features and browser integration.

## 🎯 Key Highlights

- **🔒 Privacy First**: All data stays on your local machine - no cloud storage
- **📱 Fully Self-Hosted**: Deploy anywhere you want complete control
- **🚀 Production Ready**: Built with Next.js 14, TypeScript, and modern tools
- **🌐 Browser Integration**: Chrome extension for one-click job capture
- **📊 Complete Workflow**: From job discovery to interview preparation

## ✨ Features

### 📄 **Smart Resume Management**
- **Version Control**: Track resume versions for different applications
- **Bulk Import**: Import existing resumes from local folders
- **Format Support**: Upload PDF, DOCX, and text documents
- **Auto-naming**: Intelligent file naming based on job details (Company_Role_Date)
- **Preview & Download**: View resume content before sending

### 🎯 **Application Tracking**
- **Status Management**: Track applications from "Applied" to "Rejected" or "Offer"
- **Job Details**: Store company info, role descriptions, and application dates
- **Notes & Reminders**: Add personal notes and follow-up reminders
- **Duplicate Detection**: Automatically detect and merge duplicate applications
- **CSV Export**: Export your data for analysis and backup

### 🌐 **Browser Integration**
- **Chrome Extension**: One-click job posting capture from any website
- **Auto-fill**: Extract job details automatically from job boards
- **Quick Save**: Save job descriptions with a single click
- **Cross-platform**: Works on LinkedIn, Indeed, Glassdoor, and more

### 📊 **Analytics & Export**
- **Progress Tracking**: Visual dashboard of application status
- **Export Options**: CSV export with filtering and date ranges
- **Interview Prep**: Dedicated mode for interview preparation
- **Email Templates**: Pre-built follow-up email drafts

### 🔧 **Advanced Features**
- **Deduplication Engine**: Smart detection of duplicate job applications
- **File Management**: Organize job descriptions and attachments
- **Undo System**: Reversible operations with detailed change log
- **Bulk Operations**: Perform actions on multiple applications at once

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS + shadcn/ui components
- **PDF Processing**: PDF parsing and text extraction
- **File Handling**: Support for PDF, DOCX, and text formats
- **Browser Extension**: Chrome extension for job capture
- **State Management**: React hooks and context
- **Build Tool**: Next.js with optimized production builds

## 🚦 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/Exploration-labs/job-app-tracker-prod.git
cd job-app-tracker-prod

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Production Build

```bash
# Create production build
npm run build

# Start production server
npm start
```

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# File Upload Settings
MAX_UPLOAD_FILES=20
MAX_FILE_SIZE_MB=10
ALLOWED_EXTENSIONS=pdf,docx,doc,rtf,txt

# Storage Settings (optional - defaults to ./managed-resumes and ./data)
# MANAGED_RESUMES_PATH=/path/to/your/resume/storage
# DATA_STORAGE_PATH=/path/to/your/data/storage

# Optional: Custom branding
# APP_NAME="Job Application Tracker"
# APP_DESCRIPTION="Track your job applications and manage resumes"
```

## 🚀 Deployment Options

### Self-Hosted (Recommended)

#### **VPS/Server Deployment**
1. Clone repository on your server
2. Install Node.js and dependencies
3. Configure environment variables
4. Run production build
5. Use PM2 or systemd for process management

```bash
# Example with PM2
npm install -g pm2
npm run build
pm2 start npm --name "job-tracker" -- start
```

#### **Docker Deployment**
```dockerfile
# Example Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### **Railway**
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on every push

#### **Render.com**
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy with auto-rebuild on push

### Cloud Platforms

#### **Vercel** (Requires storage modifications)
- Works out of the box for demo purposes
- For production, configure external storage (AWS S3, etc.)

#### **Netlify** (Static export)
```bash
# Configure for static export
npm run build
npm run export
```

## 📁 Project Structure

```
job-app-tracker/
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   ├── globals.css         # Global styles
│   └── page.tsx            # Main page
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   └── *.tsx              # Feature components
├── lib/                    # Utility functions
├── browser-extension/      # Chrome extension
├── public/                # Static assets
├── .env.example           # Environment configuration template
└── README.md              # This file
```

## 🔒 Privacy & Security

### Local-First Architecture
- **Complete Privacy**: All personal data stays on your local machine
- **No Analytics**: No tracking, telemetry, or data collection
- **Offline Capable**: Full functionality without internet connection
- **Self-Hosted**: You control where your data lives

### Security Features
- Input validation and sanitization
- File type restrictions and scanning
- XSS protection with Content Security Policy
- Secure file handling and storage

## 🎮 How to Use

### 1. **Setting Up Your First Application**
- Click "Add Job" to start the job application wizard
- Fill in company name, role, and paste the job description
- Upload a tailored resume for this specific application

### 2. **Resume Management** 
- Go to "Resume Manager" to upload and organize your resumes
- Create different versions for different types of applications
- Use the "Create Job" feature to start applications with pre-selected resumes

### 3. **Browser Extension** (Optional)
- Install the Chrome extension from the `browser-extension/` folder
- Navigate to job boards (LinkedIn, Indeed, etc.)
- Click the extension icon to capture job details automatically

### 4. **Tracking Progress**
- Update application status as you progress through the hiring process
- Add notes for interview feedback and follow-up reminders
- Use the dashboard to visualize your application pipeline

### 5. **Data Export & Analysis**
- Export your application data as CSV for external analysis
- Filter exports by date range, company, or application status
- Use exported data for personal job search analytics

## 🤝 Contributing

This is an open-source project! Areas where you can help:

- 🐛 **Bug Fixes**: Report and fix issues
- ✨ **Features**: Suggest and implement new functionality  
- 📚 **Documentation**: Improve guides and examples
- 🎨 **UI/UX**: Enhance the user interface
- 🔧 **Performance**: Optimize loading and processing

### Development Setup

```bash
git clone https://github.com/Exploration-labs/job-app-tracker-prod.git
cd job-app-tracker-prod
npm install
npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: Report bugs via [GitHub Issues](https://github.com/Exploration-labs/job-app-tracker-prod/issues)
- **Discussions**: Feature requests and questions welcome
- **Documentation**: Check the guides above for setup help

---

**Built for job seekers who want complete control over their data while staying organized and productive in their job search.**

*Make your job search systematic, not chaotic - while keeping your privacy intact.*