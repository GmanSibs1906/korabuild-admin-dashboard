# KoraBuild Admin Dashboard

A comprehensive web-based admin interface for managing the KoraBuild construction project management system. This enterprise-grade dashboard provides complete oversight and control over all mobile app users, projects, contractors, communications, finances, and system operations.

## 🏗️ Project Overview

The KoraBuild Admin Dashboard is built with Next.js 14 and provides:

- **User Management**: Complete CRUD operations on all user accounts
- **Project Oversight**: Real-time monitoring and control of all projects  
- **Financial Control**: Payment approvals, budget management, financial reporting
- **Communication Hub**: Respond to messages, send announcements, manage notifications
- **Quality Assurance**: Review inspections, manage quality standards
- **Schedule Management**: Oversee project timelines, resource allocation
- **Contractor Management**: Approve contractors, manage assignments, track performance
- **Document Control**: Upload, approve, and manage all project documents
- **Analytics & Reporting**: Generate insights and reports for business intelligence
- **System Administration**: Manage settings, users, and system configuration

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand + React Query
- **UI Components**: Radix UI + Custom Components
- **Charts**: Recharts
- **Authentication**: Supabase Auth with RBAC
- **Deployment**: Vercel

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard widgets
│   ├── tables/           # Data table components
│   ├── forms/            # Form components
│   ├── charts/           # Chart components
│   ├── modals/           # Modal components
│   └── layout/           # Layout components
├── lib/                  # Utility libraries
│   ├── supabase/         # Supabase configuration
│   ├── auth/             # Authentication utilities
│   ├── utils/            # General utilities
│   ├── validations/      # Form validation schemas
│   └── constants/        # Application constants
├── hooks/                # Custom React hooks
├── stores/               # Zustand stores
├── types/                # TypeScript type definitions
└── styles/               # Global styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase project (shared with mobile app)
- Environment variables configured

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 🔐 Authentication & Authorization

The admin dashboard implements role-based access control (RBAC) with four admin roles:

- **Super Admin**: Full system access and configuration
- **Project Manager**: Project and contractor management  
- **Finance Admin**: Financial oversight and payment approvals
- **Support Admin**: User support and communication management

## 📊 Database Integration

The admin dashboard connects to the same Supabase database as the mobile app, providing:

- **Real-time data synchronization**
- **Row Level Security (RLS) policies**
- **Comprehensive admin access to all tables**
- **Audit logging for all admin actions**

### Key Database Tables (60+ tables managed):

- User Management: `users`, `notification_preferences`
- Project Management: `projects`, `project_milestones`, `project_updates`
- Financial Management: `payments`, `credit_accounts`, `financial_budgets`
- Contractor Management: `contractors`, `contractor_reviews`, `project_contractors`
- Quality Control: `quality_inspections`, `quality_checklists`, `quality_reports`
- Schedule Management: `project_schedules`, `schedule_tasks`, `crew_members`
- Communication: `conversations`, `messages`, `approval_requests`
- Document Management: `documents`, `document_versions`
- Safety Management: `safety_inspections`, `safety_incidents`
- Orders & Inventory: `suppliers`, `project_orders`, `deliveries`

## 🎨 Design System

The admin dashboard uses a professional construction-focused design system:

- **Primary Color**: Construction Orange (`#fe6700`)
- **Typography**: Inter font family
- **Components**: Built with Radix UI primitives
- **Responsive**: Optimized for desktop (1024px+)
- **Accessibility**: WCAG 2.1 AA compliant

## 🔄 Development Phases

### Phase 1: Foundation & Authentication ✅
- [x] Project setup with Next.js 14 + TypeScript
- [x] Supabase integration
- [x] Basic folder structure
- [x] Core utilities and types
- [ ] Admin authentication system
- [ ] Role-based access control

### Phase 2: Admin Dashboard Overview 🚧
- [ ] Real-time metrics dashboard
- [ ] System overview widgets
- [ ] Navigation and layout
- [ ] Alert system

### Phase 3-12: Feature Implementation 📋
- [ ] User Management System
- [ ] Project Management & Oversight  
- [ ] Financial Management & Control
- [ ] Communication & Response System
- [ ] Contractor & Team Management
- [ ] Quality Control & Safety Management
- [ ] Schedule & Resource Management
- [ ] Document & Content Management
- [ ] Analytics & Business Intelligence
- [ ] System Administration & Configuration

## 🧪 Testing Strategy

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API and database operations
- **E2E Tests**: Playwright for critical workflows
- **Accessibility Tests**: Automated accessibility testing
- **Performance Tests**: Lighthouse and bundle analysis

## 🚀 Deployment

The admin dashboard is designed for deployment on Vercel with:

- **Automatic deployments** from Git
- **Environment management** for staging and production
- **Performance monitoring** with real-time metrics
- **Security scanning** and vulnerability assessment

## 📈 Success Metrics

### Technical Performance
- Page load time: <1 second
- API response time: <500ms  
- System uptime: >99.9%
- Security score: >95%

### Admin Efficiency  
- Task completion time: 50% reduction
- Error rate: <1%
- User satisfaction: >4.5/5
- Response time: <2 hours

## 🔒 Security & Compliance

- **Enterprise-grade security** with multi-factor authentication
- **Audit logging** for all admin actions
- **Data encryption** at rest and in transit
- **GDPR/CCPA compliance** for data handling
- **Regular security scans** and updates

## 📞 Support & Documentation

For detailed development guidance, see:
- `KoraBuild_Admin_Dashboard_Development_Prompt.md` - Comprehensive development guide
- `.cursorrules` - AI coding assistant rules and guidelines
- Component documentation in Storybook (coming soon)

## 🤝 Contributing

This admin dashboard is part of the KoraBuild construction management ecosystem. All changes should maintain compatibility with the mobile app and follow the established coding standards.

---

**Built with ❤️ for the construction industry** 