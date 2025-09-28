# Overview

This is a full-stack manga reading website built with React (Vite) frontend and Express.js backend. The application provides a comprehensive manga browsing and reading experience with features including user authentication, favorites management, reading progress tracking, blog functionality, and an admin panel for content management. The site integrates with the MangaDx API to provide manga content while offering additional features like ad management, custom banners, and blog posts.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with Vite for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI components
- **State Management**: TanStack Query for server state management and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: JWT-based authentication with context provider pattern
- **Form Handling**: React Hook Form with Zod validation for type-safe forms

## Backend Architecture
- **Framework**: Express.js with TypeScript for type safety
- **Database**: PostgreSQL with Drizzle ORM for database interactions
- **Authentication**: JWT tokens with bcrypt for password hashing
- **File Uploads**: Multer middleware for handling image uploads
- **API Proxy**: Optional proxy layer for MangaDx API requests to handle rate limiting

## Database Design
- **Users**: Authentication and role management (user/admin)
- **Blog Posts**: Content management with SEO fields, categories, and tags
- **API Configurations**: Dynamic API endpoint management for external services
- **Ad Networks**: Advertisement integration with custom script injection
- **Custom Banners**: Admin-managed promotional banners
- **Site Settings**: Global configuration management
- **User Favorites**: Manga bookmarking system
- **Reading Progress**: Chapter progress tracking per user

## Key Features
- **Public Site**: Homepage, browse/search manga, detailed manga pages, chapter reader, blog section
- **User Features**: Favorites management, reading progress tracking, authentication
- **Admin Panel**: API configuration, blog management, ad network management, user administration, site settings
- **Responsive Design**: Mobile-first approach with adaptive layouts

## External Dependencies

- **Neon Database**: Serverless PostgreSQL database hosting
- **MangaDx API**: Primary source for manga content, covers, and chapter data
- **AWS S3/Cloudinary**: File storage for blog images and custom banners (configured via admin)
- **Ad Networks**: Third-party advertising platforms with script injection capability
- **Font APIs**: Google Fonts for typography (Inter, DM Sans, Geist Mono, etc.)

## Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Fast JavaScript bundling for production builds
- **PostCSS**: CSS processing with Tailwind CSS
- **TypeScript**: Type safety across the entire application
- **Replit Integration**: Development environment plugins for enhanced DX

## Recent UI/UX Improvements (September 2025)
- **Modern Button Design**: Removed all borders and implemented shadow-based button styling for a premium, modern look
- **Enhanced Filter Dropdowns**: Added solid backgrounds, improved hover effects, and better visual hierarchy
- **Advanced Pagination**: Implemented First/Previous/Next/Last buttons with proper disabled states and accurate result counting ("Showing X-Y of Z results")
- **Premium Dark Theme**: Applied consistent dark theme across all components with proper contrast and professional styling
- **Mobile Responsiveness**: Enhanced mobile layouts with responsive grids, collapsible filters, and touch-friendly pagination
- **Flexbox Footer**: Fixed footer positioning using modern flexbox layout to ensure it stays at the bottom
- **Read Chapter Indicators**: Visual indicators show read/unread chapter status with color coding and badges
- **Shadow Design System**: Replaced traditional borders with modern shadows throughout the interface