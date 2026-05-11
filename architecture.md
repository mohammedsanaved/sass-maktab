## Database Schema Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION & USERS                              │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐              ┌──────────────────────┐
    │    Admin     │              │      Teacher         │
    ├──────────────┤              ├──────────────────────┤
    │ id           │              │ id                   │
    │ email        │              │ name                 │
    │ password     │              │ email                │
    │ name         │              │ password             │
    │ role         │              │ phone                │
    │ createdAt    │              │ address              │
    └──────────────┘              │ role                 │
                                  └──────────┬───────────┘
                                             │
                                             │ 1:N (has many)
                                             │
┌─────────────────────────────────────────────────────────────────────────┐
│                       SCHEDULING SYSTEM (CORE)                           │
└─────────────────────────────────────────────────────────────────────────┘
                                             │
                                             ▼
    ┌──────────────┐              ┌─────────────────────┐              ┌──────────────┐
    │  ClassLevel  │              │   ClassSession      │              │   TimeSlot   │
    ├──────────────┤              ├─────────────────────┤              ├──────────────┤
    │ id           │◄─────────────┤ id                  ├─────────────►│ id           │
    │ name         │  1:N         │ teacherId    [FK]   │    N:1       │ label        │
    │ description  │  (taught in) │ classLevelId [FK]   │  (uses)      │ startTime    │
    │ createdAt    │              │ timeSlotId   [FK]   │              │ endTime      │
    │ updatedAt    │              │                     │              │ createdAt    │
    └──────┬───────┘              │ UNIQUE(teacherId,   │              │ updatedAt    │
           │                      │        timeSlotId)  │              └──────────────┘
           │                      └─────────────────────┘
           │ 1:N                         ▲
           │ (enrolled)                  │
           │                             │ Links the schedule
           │                             │ (Who teaches What at When)
           │
┌─────────────────────────────────────────────────────────────────────────┐
│                    STUDENTS & FINANCIALS                                 │
└─────────────────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │        Student               │
    ├──────────────────────────────┤
    │ id                           │
    │ formNo                       │
    │ studentName                  │
    │ fatherName                   │
    │ dateOfBirth                  │
    │ age                          │
    │ mobile                       │
    │ fullPermanentAddress         │
    │ parentGuardianOccupation     │
    │ previousTraining             │
    │ type (HAFIZ/NAZERA)          │
    │ hafizCategory                │
    │ fullTimeSub                  │
    │ status (NEW/OLD)             │
    │ classLevelId [FK]            │ ─────┐
    │ admissionFee                 │      │
    │ monthlyFees                  │      │
    │ donation                     │      │ Belongs to ClassLevel
    │ remarks                      │      │ (Many students → One class)
    │ isActive                     │      │
    │ joinedAt                     │      │
    │ updatedAt                    │      │
    └──────────┬───────────────────┘      │
               │                          │
               │ 1:N                      │
               │ (has many)               │
               ▼                          │
    ┌──────────────────────┐              │
    │     FeePayment       │              │
    ├──────────────────────┤              │
    │ id                   │              │
    │ studentId [FK] ──────┼──────────────┘
    │ amount               │
    │ receiptNo            │
    │ paymentDate          │
    │ paymentType          │
    │ remarks              │
    │ createdAt            │
    └──────────────────────┘
```

## Key Relationships Explained

### 1. **ClassSession (The Heart of the System)**

This is the **central scheduling table** that connects three critical pieces:

- **WHO** is teaching → `Teacher` (via `teacherId`)
- **WHAT** they're teaching → `ClassLevel` (via `classLevelId`)
- **WHEN** they're teaching → `TimeSlot` (via `timeSlotId`)

**Example Record:**

```
ClassSession {
  teacherId: "teacher_123" → Teacher "Fatima Ahmed"
  classLevelId: "class_456" → ClassLevel "Deniyaat 1"
  timeSlotId: "time_789" → TimeSlot "7:30 AM - 8:30 AM"
}
```

### 2. **Student → ClassLevel (Enrollment)**

- A student is enrolled in **one** `ClassLevel` (e.g., "Nursery 2").
- A `ClassLevel` can have **many** students.
- This is a **Many-to-One** relationship from the student's perspective.

### 3. **Student → FeePayment (Financial History)**

- Each student has **many** fee payment records.
- This creates a complete audit trail of all admission fees, monthly fees, and donations.
- This is a **One-to-Many** relationship.

### 4. **Teacher → ClassSession (Teaching Load)**

- A teacher can be assigned to **many** class sessions.
- Example: "Teacher Ali" teaches "Deniyaat 1" at 7:30 AM AND "Nursery 1" at 2:00 PM.
- This is a **One-to-Many** relationship.

### 5. **No Direct Student ↔ Teacher Link**

Notice there's **no direct relationship** between `Student` and `Teacher`. Instead:

- Student → ClassLevel → ClassSession → Teacher

This is intentional! It allows flexibility. If you want to find "Who teaches Ahmed?", you query:

1. Find Ahmed's `classLevelId`
2. Find all `ClassSession` records for that `classLevelId`
3. Get the `teacherId` from those sessions

This schema design ensures data integrity and prevents duplicate or conflicting schedules.
