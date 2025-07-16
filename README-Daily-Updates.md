# 📱 KoraBuild Daily Updates System - User-Specific Implementation

## Overview
The KoraBuild Admin Dashboard daily updates system is designed to provide **user-specific, project-specific** daily progress updates that integrate seamlessly between the mobile app and admin dashboard.

## 🏗️ Database Architecture

### Primary Table: `project_updates`
```sql
CREATE TABLE public.project_updates (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL,           -- Links to specific project
  milestone_id uuid,                  -- Optional milestone link
  update_type varchar NOT NULL,       -- Type of update
  title varchar NOT NULL,             -- Update title
  description text,                   -- Detailed description
  photo_urls text[],                  -- Array of photo URLs
  photo_ids uuid[],                   -- Array of photo record IDs
  update_priority varchar DEFAULT 'normal',
  visibility varchar DEFAULT 'project',
  is_pinned boolean DEFAULT false,
  location point,                     -- GPS coordinates
  metadata jsonb,                     -- Additional data
  created_by uuid NOT NULL,           -- User who created the update
  created_at timestamp DEFAULT now()
);
```

### User-Project Relationship
```sql
-- Projects table with client ownership
CREATE TABLE public.projects (
  id uuid PRIMARY KEY,
  client_id uuid NOT NULL,            -- Project owner (client)
  project_name varchar NOT NULL,
  project_address text NOT NULL,
  -- ... other fields
  FOREIGN KEY (client_id) REFERENCES users(id)
);
```

## 🎯 User-Specific Flow

### 1. Project Ownership
- **Each project belongs to a specific client** (`projects.client_id`)
- **Daily updates are project-specific** (`project_updates.project_id`)
- **This creates automatic user-specific filtering**

### 2. Mobile App Integration
```typescript
// Mobile app creates daily updates for user's projects
const createDailyUpdate = async (projectId: string, updateData: any) => {
  const response = await fetch('/api/daily-updates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create',
      data: {
        project_id: projectId,        // User's specific project
        update_type: 'progress',
        title: 'Site Progress Update',
        description: 'Today we completed...',
        created_by: currentUserId    // Mobile app user
      }
    })
  });
};
```

### 3. Admin Dashboard View
- **Admins can view all projects and their daily updates**
- **Each project shows updates specific to that client/project**
- **Manual updates can be added by admins for any project**

## 📊 Data Flow Examples

### Example 1: Client's Project Updates
```json
{
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "project_name": "Modern Family Villa",
    "client": {
      "id": "abefe861-97da-4556-8b39-18c5ddbce22c",
      "full_name": "John Smith",
      "email": "john.smith@example.com"
    }
  },
  "daily_updates": [
    {
      "id": "267acde5-c129-4df5-a169-d2df883d93d0",
      "title": "Foundation Work Complete",
      "description": "Foundation pouring completed successfully",
      "created_by": "mobile_app_user_id",
      "created_at": "2025-07-16T10:00:00Z",
      "source": "mobile_app"
    }
  ]
}
```

### Example 2: Admin Manual Update
```json
{
  "update": {
    "id": "new-update-id",
    "project_id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Weather Delay Notice",
    "description": "Work delayed due to heavy rain",
    "created_by": "admin_user_id",
    "metadata": {
      "source": "admin_manual",
      "created_via": "admin_dashboard",
      "admin_email": "sarah.johnson@korabuild.com"
    }
  }
}
```

## 🔐 Security & Access Control

### Project-Level Security
- **Mobile users can only create updates for their own projects**
- **Admins can create updates for any project**
- **All updates are linked to specific projects and users**

### API Endpoints

#### GET /api/schedule?projectId={id}
- Returns project-specific daily updates
- Includes user context and project ownership
- Mobile app compatible data structure

#### POST /api/daily-updates
- Creates new daily updates
- Validates project ownership
- Supports both mobile app and admin manual creation

#### GET /api/projects/{projectId}/milestones
- Returns project-specific milestones for update linking
- Used in admin manual update modal

## 📱 Mobile App Integration Guide

### 1. Get User's Projects
```typescript
const getUserProjects = async (userId: string) => {
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  return data.user.projects; // Array of user's projects
};
```

### 2. Create Daily Update
```typescript
const createDailyUpdate = async (projectId: string, updateData: {
  title: string;
  description: string;
  update_type: 'note' | 'milestone' | 'completion' | 'photo' | 'delay';
  photo_urls?: string[];
  milestone_id?: string;
}) => {
  const response = await fetch('/api/daily-updates', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': currentUser.id,
      'x-user-email': currentUser.email
    },
    body: JSON.stringify({
      action: 'create',
      data: {
        project_id: projectId,
        created_by: currentUser.id,
        ...updateData
      }
    })
  });
  
  return response.json();
};
```

### 3. Get Daily Updates
```typescript
const getDailyUpdates = async (projectId: string) => {
  const response = await fetch(`/api/schedule?projectId=${projectId}`);
  const data = await response.json();
  return data.data.dailyTimeline; // Chronological updates
};
```

## 🎨 Admin Dashboard Features

### Manual Update Creation
- **Project-specific**: Updates are created for specific client projects
- **User context**: Shows which client/user the project belongs to
- **Rich metadata**: Includes admin information and creation source

### Daily Timeline View
- **Chronological display**: Updates sorted by date
- **User attribution**: Shows who created each update
- **Type categorization**: Different icons/colors for update types
- **Photo support**: Progress photos with metadata

### Statistics Dashboard
- **Project-specific metrics**: Updates count per project
- **User activity tracking**: Updates by user/date
- **Real-time synchronization**: Live updates from mobile app

## 🔄 Real-Time Synchronization

### Database Triggers
- Updates automatically appear in admin dashboard
- Statistics refresh when new updates are added
- Mobile app receives real-time notifications

### Caching Strategy
- Project data cached for performance
- Daily updates fetched fresh for accuracy
- User-specific data properly isolated

## 📈 Usage Analytics

### Admin Insights
- Track daily update frequency per project
- Monitor user engagement with mobile app
- Identify projects with low update activity
- Generate progress reports for clients

### Client Benefits
- Real-time visibility into project progress
- Photo documentation of work completed
- Communication history with contractors
- Milestone tracking and completion alerts

## 🎯 Best Practices

### For Mobile App Development
1. **Always validate project ownership** before creating updates
2. **Include rich metadata** (GPS, timestamps, device info)
3. **Support offline creation** with sync when online
4. **Compress photos** before upload
5. **Use appropriate update types** for categorization

### For Admin Dashboard
1. **Filter projects by client** for user-specific views
2. **Provide manual update capability** for admin communication
3. **Show clear attribution** for all updates
4. **Enable bulk operations** for efficiency
5. **Generate reports** for client communication

---

## ✅ Current Implementation Status

✅ **Database schema implemented** with proper relationships  
✅ **User-specific project filtering** working  
✅ **Manual admin updates** functional  
✅ **Daily timeline display** with real data  
✅ **Photo upload support** integrated  
✅ **Mobile app compatible APIs** ready  
✅ **Real-time statistics** updating  
✅ **TypeScript strict mode** compliant  

**Ready for mobile app integration and production deployment!** 🚀 