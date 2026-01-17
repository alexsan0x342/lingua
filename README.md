# Lms App - Complete Workflow Diagrams & Charts

## 🏗️ System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js App Router]
        B[React Components]
        C[Tailwind CSS + Shadcn/UI]
        D[Client-side State Management]
    end
    
    subgraph "Authentication Layer"
        E[Better Auth]
        F[Email OTP System]
        G[Session Management]
        H[RBAC Middleware]
    end
    
    subgraph "API Layer"
        I[RESTful APIs]
        J[Admin APIs]
        K[User APIs]
        L[Webhook Handlers]
    end
    
    subgraph "Business Logic"
        M[Course Management]
        N[Live Lessons]
        O[Assignment System]
        P[Payment Processing]
        Q[Analytics Engine]
    end
    
    subgraph "External Services"
        R[Stripe Payments]
        S[Zoom Integration]
        T[Mux Video Hosting]
        U[Resend Email]
        V[Supabase Storage]
    end
    
    subgraph "Data Layer"
        W[PostgreSQL Database]
        X[Prisma ORM]
        Y[File Storage]
    end
    
    A --> E
    B --> I
    E --> H
    I --> M
    M --> W
    P --> R
    N --> S
    M --> T
    Q --> U
    Y --> V
    W --> X
```

## 👥 User Role Hierarchy & Permissions

```mermaid
graph TD
    A[User Roles] --> B[🔴 ADMIN]
    A --> C[🟠 MANAGER]
    A --> D[🟡 TEACHER]
    A --> E[🟢 STUDENT]
    
    B --> B1[Full System Control]
    B --> B2[User Management]
    B --> B3[System Settings]
    B --> B4[All Analytics]
    B --> B5[Course Management]
    B --> B6[Live Lessons]
    
    C --> C1[Business Operations]
    C --> C2[Course Creation/Edit]
    C --> C3[Live Lessons]
    C --> C4[Course Analytics]
    C --> C5[User Enrollment]
    
    D --> D1[Live Lesson Management]
    D --> D2[Course Viewing]
    D --> D3[Assignment Grading]
    D --> D4[Student Progress]
    
    E --> E1[Course Access]
    E --> E2[Assignment Submissions]
    E --> E3[Progress Tracking]
    E --> E4[Live Lesson Attendance]
```

## 🔐 Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth API
    participant E as Email Service
    participant D as Database
    participant M as Middleware
    
    U->>F: Enter Email
    F->>A: Request OTP
    A->>E: Send OTP Email
    E-->>U: Email with OTP
    U->>F: Enter OTP
    F->>A: Verify OTP
    A->>D: Create/Update Session
    A-->>F: Session Token
    F->>M: Request Protected Resource
    M->>D: Validate Session
    M->>M: Check RBAC Permissions
    M-->>F: Grant/Deny Access
```

## 💰 Payment & Enrollment Workflow

```mermaid
flowchart TD
    A[Student Browses Course] --> B{Already Enrolled?}
    B -->|Yes| C[Access Course]
    B -->|No| D[Click Enroll]
    D --> E[Create Enrollment Record]
    E --> F[Generate Stripe Checkout]
    F --> G[Student Pays]
    G --> H[Stripe Webhook]
    H --> I[Update Enrollment Status]
    I --> J[Send Invoice Email]
    J --> K[Grant Course Access]
    K --> L[Confetti Animation]
    L --> C
    
    M[Admin Manual Enrollment] --> N[Select User & Course]
    N --> O[Create Free Enrollment]
    O --> K
```

## 🎓 Course Learning Journey

```mermaid
journey
    title Student Learning Journey
    section Discovery
      Browse Courses: 5: Student
      View Course Details: 4: Student
      Check Prerequisites: 3: Student
    section Enrollment
      Make Payment: 5: Student
      Receive Confirmation: 5: Student
      Access Course: 5: Student
    section Learning
      Watch Videos: 5: Student
      Complete Assignments: 4: Student
      Submit Work: 3: Student
      Receive Feedback: 5: Student
    section Live Sessions
      Get Reminder: 4: Student
      Join Live Lesson: 5: Student
      Participate: 4: Student
      Access Recording: 5: Student
    section Completion
      Track Progress: 5: Student
      Earn Points: 5: Student
      Complete Course: 5: Student
```

## 🎥 Live Lesson Management Flow

```mermaid
sequenceDiagram
    participant T as Teacher/Manager
    participant S as System
    participant Z as Zoom API
    participant D as Database
    participant E as Email Service
    participant St as Students
    
    T->>S: Create Live Lesson
    S->>Z: Create Zoom Meeting
    Z-->>S: Meeting Details
    S->>D: Save Lesson + Attendees
    S->>E: Send Invitations
    E-->>St: Email Invitations
    
    Note over S: 15 minutes before lesson
    S->>E: Send Reminder
    E-->>St: 15min Reminder
    
    Note over S: 5 minutes before lesson
    S->>E: Send Final Reminder
    E-->>St: 5min Reminder
    
    T->>S: Start Lesson
    S->>D: Update Status
    S->>E: Notify Students
    E-->>St: Lesson Started
    
    Note over T,St: Live Lesson Session
    
    T->>S: End Lesson
    S->>D: Update Status
    T->>S: Upload Recording
    S->>D: Save Recording URL
    S->>E: Send Recording Link
    E-->>St: Recording Available
```

## 📊 Analytics & Reporting System

```mermaid
graph LR
    subgraph "Data Collection"
        A[User Interactions]
        B[Course Progress]
        C[Assignment Submissions]
        D[Live Lesson Attendance]
        E[Payment Data]
    end
    
    subgraph "Analytics Engine"
        F[Course Analytics]
        G[User Analytics]
        H[Revenue Analytics]
        I[Engagement Metrics]
    end
    
    subgraph "Reporting Dashboard"
        J[Admin Dashboard]
        K[Manager Dashboard]
        L[Teacher Dashboard]
        M[Student Progress]
    end
    
    A --> F
    B --> G
    C --> I
    D --> I
    E --> H
    
    F --> J
    G --> J
    H --> J
    I --> J
    
    F --> K
    G --> K
    I --> K
    
    G --> L
    I --> L
    
    G --> M
    I --> M
```

## 🗄️ Database Schema Relationships

```mermaid
erDiagram
    User ||--o{ Course : creates
    User ||--o{ Enrollment : has
    User ||--o{ AssignmentSubmission : submits
    User ||--o{ LessonProgress : tracks
    User ||--o{ LiveLessonAttendee : attends
    
    Course ||--o{ Chapter : contains
    Course ||--o{ Enrollment : has
    Course ||--o{ LiveLesson : includes
    
    Chapter ||--o{ Lesson : contains
    Lesson ||--o{ Assignment : has
    Lesson ||--o{ Resource : includes
    Lesson ||--o{ LessonProgress : tracks
    
    Assignment ||--o{ AssignmentSubmission : receives
    
    LiveLesson ||--o{ LiveLessonAttendee : has
    
    CourseCategory ||--o{ Course : categorizes
    
    User {
        string id PK
        string name
        string email UK
        string role
        int totalPoints
        string stripeCustomerId
    }
    
    Course {
        string id PK
        string title
        string description
        int price
        string status
        string userId FK
    }
    
    Enrollment {
        string id PK
        string userId FK
        string courseId FK
        int amount
        string status
    }
    
    LiveLesson {
        string id PK
        string title
        datetime scheduledAt
        string status
        string zoomMeetingId
        string courseId FK
    }
```

## 🔄 Content Management Workflow

```mermaid
flowchart TD
    A[Content Creator] --> B{User Role?}
    B -->|ADMIN/MANAGER| C[Create Course]
    B -->|TEACHER| D[View Courses Only]
    B -->|STUDENT| E[Access Denied]
    
    C --> F[Add Course Details]
    F --> G[Upload Course Image]
    G --> H[Create Chapters]
    H --> I[Add Lessons]
    I --> J[Upload Videos to Mux]
    J --> K[Add Resources]
    K --> L[Create Assignments]
    L --> M[Set Pricing]
    M --> N[Publish Course]
    
    N --> O[Course Available]
    O --> P[Students Can Enroll]
    
    Q[Live Lesson Creation] --> R[Schedule Meeting]
    R --> S[Configure Zoom Settings]
    S --> T[Add Enrolled Students]
    T --> U[Send Notifications]
    U --> V[Conduct Live Session]
    V --> W[Upload Recording]
```

## 📧 Email Notification System

```mermaid
graph TD
    A[System Events] --> B{Event Type}
    
    B -->|Enrollment| C[Payment Success]
    B -->|Assignment| D[Grade Notification]
    B -->|Live Lesson| E[Reminder System]
    B -->|Course| F[Content Updates]
    
    C --> G[Send Invoice Email]
    D --> H[Send Grade Email]
    E --> I[15min Reminder]
    E --> J[5min Reminder]
    E --> K[Recording Available]
    F --> L[Course Update Email]
    
    G --> M[Resend Service]
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M
    
    M --> N[Email Delivered]
```

## 🛡️ Security & Access Control

```mermaid
graph TB
    subgraph "Request Flow"
        A[User Request] --> B[Middleware Layer]
        B --> C[Authentication Check]
        C --> D[Session Validation]
        D --> E[RBAC Permission Check]
        E --> F[Resource Access]
    end
    
    subgraph "Security Layers"
        G[Input Validation]
        H[SQL Injection Prevention]
        I[CSRF Protection]
        J[File Upload Security]
        K[Rate Limiting]
    end
    
    subgraph "Data Protection"
        L[Data Encryption]
        M[Secure Sessions]
        N[API Key Management]
        O[Environment Variables]
    end
    
    B --> G
    C --> H
    D --> I
    E --> J
    F --> K
    
    G --> L
    H --> M
    I --> N
    J --> O
```

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        A[Load Balancer]
        B[Next.js App Instance 1]
        C[Next.js App Instance 2]
        D[Next.js App Instance N]
    end
    
    subgraph "Database Layer"
        E[PostgreSQL Primary]
        F[PostgreSQL Replica]
    end
    
    subgraph "External Services"
        G[Stripe API]
        H[Zoom API]
        I[Mux Video]
        J[Resend Email]
        K[Supabase Storage]
    end
    
    subgraph "Monitoring"
        L[Health Checks]
        M[Error Tracking]
        N[Performance Monitoring]
        O[Log Aggregation]
    end
    
    A --> B
    A --> C
    A --> D
    
    B --> E
    C --> E
    D --> E
    
    E --> F
    
    B --> G
    B --> H
    B --> I
    B --> J
    B --> K
    
    B --> L
    C --> M
    D --> N
    E --> O
```

## 📱 Mobile-First User Experience

```mermaid
graph LR
    subgraph "Responsive Design"
        A[Desktop View]
        B[Tablet View]
        C[Mobile View]
    end
    
    subgraph "Progressive Enhancement"
        D[Core Functionality]
        E[Enhanced Features]
        F[Advanced Interactions]
    end
    
    subgraph "Performance Optimization"
        G[Image Optimization]
        H[Code Splitting]
        I[Lazy Loading]
        J[Caching Strategy]
    end
    
    A --> D
    B --> E
    C --> F
    
    D --> G
    E --> H
    F --> I
    G --> J
```

---

## 📈 Key Performance Indicators (KPIs)

### Student Engagement Metrics
- Course completion rates
- Average time spent per lesson
- Assignment submission rates
- Live lesson attendance
- Video engagement duration

### Business Metrics
- Monthly recurring revenue (MRR)
- Customer acquisition cost (CAC)
- Course enrollment conversion rates
- User retention rates
- Average revenue per user (ARPU)

### Technical Metrics
- Page load times
- API response times
- Error rates
- Uptime percentage
- Database query performance

### Content Performance
- Most popular courses
- Video completion rates
- Assignment difficulty analysis
- Live lesson engagement
- Resource download rates

---

*This comprehensive workflow documentation covers all major aspects of the LMS APPsystem, from user authentication to content delivery and analytics.*
