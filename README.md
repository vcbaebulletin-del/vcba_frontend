# VCBA E-Bulletin Board Frontend

A modern React.js frontend application for the VCBA E-Bulletin Board System, built with TypeScript and modern web technologies.

## Features

- **Modern UI/UX**: Clean, responsive design with intuitive navigation
- **Real-time Updates**: Live updates using WebSocket integration
- **Role-based Access**: Different interfaces for admins, faculty, and students
- **Announcement Management**: Create, edit, and manage announcements with rich content
- **Calendar System**: Interactive calendar with events and holidays
- **Comment System**: Interactive commenting and reactions on announcements
- **File Upload**: Support for images and documents with drag-and-drop
- **PDF Generation**: Export reports and announcements to PDF
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: User preference-based theming
- **Search & Filter**: Advanced search and filtering capabilities

## Tech Stack

- **Framework**: React 19.1.0
- **Language**: TypeScript 4.9.5
- **Routing**: React Router DOM 6.0.0
- **HTTP Client**: Axios 1.10.0
- **Real-time**: Socket.IO Client 4.8.1
- **Date Handling**: React DatePicker 8.7.0
- **PDF Generation**: jsPDF 3.0.3 with AutoTable 5.0.2
- **Drag & Drop**: @dnd-kit/core 6.3.1
- **Icons**: Lucide React 0.525.0
- **Build Tool**: React Scripts 5.0.1

## Quick Start

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Backend API running (see backend repository)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vcbaebulletin-del/vcba_frontend.git
cd vcba_frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Create .env file in root directory
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API service functions
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── styles/             # CSS and styling files
└── assets/             # Static assets (images, icons)
```

## Key Features

### Authentication
- Secure login/logout functionality
- Role-based access control (Admin, Faculty, Student)
- JWT token management with automatic refresh

### Dashboard
- Personalized dashboard for each user role
- Quick access to recent announcements and events
- Real-time notifications and updates

### Announcements
- Rich text editor for creating announcements
- File attachment support (images, PDFs)
- Category-based organization
- Approval workflow for faculty announcements

### Calendar
- Interactive calendar view
- Event creation and management
- Holiday and academic calendar integration
- Event categories and filtering

### Comments & Reactions
- Real-time commenting system
- Emoji reactions on announcements and events
- Threaded comment discussions
- Moderation tools for admins

## Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000

# App Configuration
REACT_APP_NAME=VCBA E-Bulletin Board
REACT_APP_VERSION=1.0.0

# Feature Flags
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_DARK_MODE=true
```

## Building for Production

1. Build the application:
```bash
npm run build
```

2. The build folder will contain the optimized production files ready for deployment.

## Deployment

The application can be deployed to various platforms:

- **Netlify**: Connect your GitHub repository for automatic deployments
- **Vercel**: Deploy with zero configuration
- **GitHub Pages**: Use `gh-pages` package for deployment
- **Traditional Web Hosting**: Upload the build folder contents

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
