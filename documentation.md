# Project Documentation

## 1. Overview

This document provides a comprehensive overview of the Mohammadiya App, a madrasa management system. It covers the project's architecture, technology stack, database schema, and key features.

**Project Name:** Mohammadiya App
**Version:** 0.1.0

## 2. Technology Stack

The application is built with a modern, robust, and scalable technology stack:

- **Framework:** [Next.js](https://nextjs.org/) (v15) with Turbopack for rapid development.
- **Language:** [TypeScript](https://www.typescriptlang.org/) (v5) for static typing and improved code quality.
- **Database ORM:** [Prisma](https://www.prisma.io/) (v6) for intuitive and safe database access.
- **Database:** [MongoDB](https://www.mongodb.com/) as the underlying database.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4) for a utility-first styling approach.
- **UI Components & Libraries:**
    - **UI Primitives:** Custom-built React components in `src/components/ui.tsx`.
    - **Icons:** [Lucide React](https://lucide.dev/guide/react) for a comprehensive set of icons.
    - **Charts:** [Recharts](https://recharts.org/) for data visualization.
    - **Notifications:** [Sonner](https://sonner.emilkowal.ski/) for toast notifications.
- **Form Handling:**
    - [Formik](https://formik.org/) for building and managing forms.
    - [Yup](https://github.com/jquense/yup) for object schema validation.
- **Authentication:**
    - [bcryptjs](https://www.npmjs.com/package/bcryptjs) for password hashing.
    - [jose](https://github.com/panva/jose) for JSON Web Token (JWT) management.
- **Internationalization (i18n):**
    - [next-intl](https://next-intl-docs.vercel.app/) for handling multiple languages (English, Arabic, Urdu).
- **API Documentation:**
    - [Swagger UI](https://swagger.io/tools/swagger-ui/) for visualizing and interacting with the API.

## 3. Project Structure

The project follows a standard Next.js App Router structure.

```
/
├── prisma/
│   └── schema.prisma       # Database schema definition
├── public/                 # Static assets
├── src/
│   ├── app/
│   │   ├── [locale]/       # Internationalized routes
│   │   │   ├── dashboard/  # Protected dashboard pages
│   │   │   ├── login/      # Login page
│   │   │   └── layout.tsx  # Root layout for each locale
│   │   ├── api/            # API route handlers
│   │   └── globals.css     # Global styles
│   ├── components/         # Shared React components
│   │   ├── layout/         # Layout components (Header, Sidebar)
│   │   └── ui.tsx          # Core UI components (Button, Card, Table etc.)
│   ├── context/            # React context providers (e.g., ThemeProvider)
│   ├── i18n/               # i18n configuration
│   ├── lib/                # Library functions (auth, prisma client)
│   ├── messages/           # Translation files (en.json, ar.json, ur.json)
├── .env.example            # Environment variable template
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## 4. Database Schema

The database schema is defined in `prisma/schema.prisma` using Prisma's schema definition language. It uses MongoDB as the data source.

### Enums

- `Role`: `ADMIN`, `TEACHER`
- `AdmissionStatus`: `IN_PROGRESS`, `COMPLETED`, `PENDING`
- `StudyStatus`: `REGULAR`, `IRREGULAR`, `COMPLETED`
- `StudentType`: `HAFIZ`, `NAZERA`
- `HafizCategory`: `FULL_TIME`, `HALF_TIME`
- `FullTimeSubCategory`: `HAFIZ_SCHOOL`, `BASICS`, `FULL_COURSE`
- `StudentStatus`: `NEW`, `OLD`
- `ResultStatus`: `PASSED`, `FAILED`, `PENDING`

### Core Models

- **`Admin`**: Stores administrator credentials.
- **`Teacher`**: Stores teacher information and credentials.
- **`ClassLevel`**: Represents a grade or level (e.g., "Deniyaat 1").
- **`TimeSlot`**: Represents a specific time slot for classes (e.g., "7:30 AM - 8:30 AM").
- **`ClassSession`**: The central model connecting a `Teacher`, `ClassLevel`, and `TimeSlot` to create a specific class section. Students are enrolled in a `ClassSession`.
- **`Student`**: Contains all personal, contact, and academic details for a student. It links to a `ClassSession`.
- **`FeePayment`**: Records every fee payment made by a student.
- **`StudentEnrollment`**: Tracks a student's academic history and progress in different class sessions over time.

## 5. Business Logic and Core Workflows

This section details the primary business logic that governs the madrasa's operations within the application.

### 5.1. Class and Student Management

The core of the application revolves around the concept of a **`ClassSession`**. A `ClassSession` is the fundamental unit of teaching and enrollment, representing a specific class taught by a specific teacher at a specific time.

- **Creating a Class:** An administrator defines the basic building blocks:
    1.  **`ClassLevel`**: The academic grade (e.g., "Deniyaat 1").
    2.  **`TimeSlot`**: The time of the class (e.g., "7:30 AM - 8:30 AM").
    3.  **`Teacher`**: The assigned teacher.
- **The `ClassSession`**: By combining these three elements, an admin creates a unique `ClassSession`. This model prevents scheduling conflicts, as it has a unique constraint on `teacherId` and `timeSlotId`, ensuring a teacher cannot be in two places at once.
- **Student Enrollment:** A `Student` is not just enrolled in a `ClassLevel` but is assigned to a specific **`ClassSession`**. This directly links the student to their teacher, classmates, and class time.

### 5.2. Fee Management

The system is designed to handle various types of fees and track payment status.

- **Fee Structure:** Each `Student` has fields for `admissionFee`, `monthlyFees`, and `donation`. This allows for flexible fee structures per student.
- **Recording Payments:** When a payment is made, a `FeePayment` record is created. This record includes the amount, the type of payment (`ADMISSION`, `MONTHLY`, `DONATION`), the months the payment covers (`paidMonths`), and a unique `receiptNo`.
- **Tracking Status:** The `lastFeePaidMonth` field on the `Student` model provides a quick way to identify students with pending dues, which can be used for generating reports or sending reminders.

### 5.3. Academic History and Promotion

The application maintains a complete academic history for each student.

- **`StudentEnrollment` Model:** This model acts as a historical log. When a student is first enrolled in a `ClassSession`, a `StudentEnrollment` record is created for the current academic year.
- **Promotion:** At the end of an academic year, an administrator can "promote" a student. This involves:
    1.  Marking the current `StudentEnrollment` record with a `ResultStatus` of `PASSED`.
    2.  Setting its `isActive` flag to `false`.
    3.  Creating a new `StudentEnrollment` record for the next academic year, linking the student to their new `ClassSession`.
- **Viewing History:** This structure allows the administration to view a student's entire academic journey, including which classes they took, when, and their results.

### 5.4. User Roles and Permissions

- **`ADMIN`:** Has full control over the system. Admins can manage all settings (Classes, Teachers, TimeSlots), enroll students, process fee payments, and view all data.
- **`TEACHER`:** Has limited access. A teacher can view information related to their assigned `ClassSession`s and the students enrolled in them. The system is designed to be extended to allow teachers to mark attendance or update student progress.

### 5.5. Dashboard and Reporting

The API endpoint `GET /api/dashboard/overview` is designed to power the main dashboard, providing a high-level snapshot of the madrasa's key metrics. This involves aggregating data from various models to calculate:

-   Total number of active students.
-   Number of admission applications in progress.
-   Total fee collection overview.
-   Attendance status (if implemented).

## 6. Key Features & Implementation

### 6.1. Authentication

- **JWT-based:** The app uses JSON Web Tokens (JWTs) for securing API routes and managing user sessions.
- **Roles:** The system has two primary roles: `ADMIN` and `TEACHER`.
- **Token Handling:** Access and refresh tokens are managed using `jose`. The access token is stored in memory, and the refresh token is stored in an `httpOnly` cookie for security.
- **Middleware:** `src/middleware.ts` is responsible for handling route protection and internationalization redirects. It verifies the JWT token from the request headers for all protected dashboard routes.

### 6.2. Internationalization (i18n)

- **Multi-language Support:** The app supports English (`en`), Arabic (`ar`), and Urdu (`ur`).
- **Routing:** `next-intl` is configured to use path-based localization (e.g., `/en/dashboard`, `/ar/dashboard`).
- **Translation Files:** All strings are stored in JSON files within the `src/messages/` directory.

### 6.3. Theming

- **Dark/Light Mode:** The application supports both light and dark themes.
- **Implementation:** The theme is managed via a `ThemeProvider` in `src/context/ThemeProvider.tsx` which adds a `dark` class to the `<html>` element.
- **Styling:** Tailwind CSS is configured to use theme-aware utility classes (e.g., `bg-background`, `text-foreground`). The core UI components in `src/components/ui.tsx` are built to respect the current theme.

### 6.4. API Endpoints

The API is built using Next.js API Routes. Here are some of the key endpoints:

- **Authentication:**
    - `POST /api/auth/login`
    - `POST /api/auth/register` (For creating admin/teacher accounts)
    - `POST /api/auth/refresh`
    - `GET /api/auth/profile`
- **Students:**
    - `GET, POST /api/students`
    - `GET, PUT /api/students/[id]`
- **Settings:**
    - `GET, POST /api/settings/classes`
    - `GET, POST /api/settings/teachers`
    - `GET, POST /api/settings/timeslots`
- **Dashboard:**
    - `GET /api/dashboard/overview` (For stats and charts)

### 6.5. Reusable UI Components

The `src/components/ui.tsx` file contains a set of reusable, theme-aware components, including:

- `Button`
- `Card`
- `Table` (and its sub-components: `TableHead`, `TableRow`, etc.)
- `TextField`
- `Select`
- `Badge`
- `Modal`
- `Checkbox`

These components form the design system of the application and ensure a consistent look and feel.

## 7. Getting Started

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    - Copy `.env.example` to `.env.local`.
    - Fill in the required variables, especially the `DATABASE_URL`.
4.  **Run the Prisma generator:**
    ```bash
    npx prisma generate
    ```
5.  **Run the development server:**
    ```bash
    npm run dev
    ```
6.  Open [http://localhost:3000](http://localhost:3000) in your browser.
