
# 🎯 Job Application Tracker

![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-10.0-blue)
![Angular](https://img.shields.io/badge/Angular-21-red)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF)
![License](https://img.shields.io/badge/license-MIT-green)

## 📌 Overview
 A full-stack web application that helps job seekers stay organized during their job search. Users can track applications, monitor statuses, record interview details, manage documents, and keep notes — all in one place. 
 
Built with **ASP.NET Core 10** REST API and **Angular 21** frontend, secured with **Microsoft Identity** authentication, designed with **Clean Architecture**, **CQRS**, **MediatR**, and rich domain models — backed by **SQL Server**, containerized with **Docker**, and deployed via a **GitHub Actions** CI/CD pipeline.

> 💡 *I built this because I was scattered across multiple files and folders — 
> saving CVs, resumes, and cover letters everywhere while trying to track 
> applications and interviews at the same time. I wanted one clean place for all of it, so I built it.*

🔗 **Live Demo:** [jobapptracker.tryasp.net](https://jobapptracker.tryasp.net/)
 
 
 ## ✨ Features 
 ### 📋 Job Application Management
  - Add, edit, and delete job applications 
  -  Store company name, job title, location, job link, and application date
  -  View all saved applications in one dashboard 
 ### 📊 Status Tracking Track every application through its full lifecycle: 
 - 🔖 Saved→ 📩 Applied → 🎤 Interview → 🎉 Offer → ✅ Accepted | ❌ Rejected  

### 🎤 Interview Tracking
- Record interview date, type, and notes per application
- Add preparation materials before each interview
-  Record feedback and lessons learned after each interview

### 📝 Notes Management
-  **Application Notes** — attach notes to any job application (recruiter info, salary expectations, reminders)
-  **Personal Notes** — a personal space to store your own thoughts, goals, and job search strategy

 ### 📄 Documents Management - 
 -   Upload and save CVs, Resumes, and Cover Letters  
  -   Store preparation materials per interview 
 ### 📊 Dashboard & Statistics 
 -   Overview of all applications and their statuses - 
  -  Summary statistics: 
      -  Total applications 
      - Number of interviews 
     - Number of offers 
     - Number of rejections
  ### 🔐 Authentication & Security 
-    User registration and secure login with **Microsoft Identity**
-   **Email confirmation** for account verification
-    **Forgot password / password reset** via secure email links
-   Each user can only access their own data
-   Secure password hashing and storage



## 🛠️ Tech Stack

**Backend:**
- ASP.NET Core 10
- Entity Framework Core
- SQL Server
- Microsoft Identity (Authentication & Authorization)
- Clean Architecture
- MediatR 
- CQRS
- FluentValidation
- MailKit (transactional email)

**Frontend:**
- Angular 21
- TypeScript
- Bootstrap / Tailwind CSS

**Testing:**
- xUnit (unit & integration tests)
- Testcontainers (real SQL Server instance for integration tests)
- FluentAssertions
- NSubstitute

**DevOps & Tools:**
- Docker & Docker Compose
- GitHub Actions (CI/CD — automated tests + deployment)
- Git & GitHub
- Swagger (API Documentation)
- Visual Studio / VS Code
- Microsoft SQL Server Management Studio (SSMS)

  


## 🏗️ Architecture & Design Patterns 
The backend is built following 
**Clean Architecture** principles with a clear separation of concerns across layers:

```
backend/
├── src/
│   ├── JobAppTracker.API/          # Controllers & HTTP layer
│   ├── JobAppTracker.Application/  # Business logic
│   │   ├── Commands/               # Write operations (CQRS)
│   │   ├── Queries/                # Read operations (CQRS)
│   │   ├── Handlers/               # MediatR handlers
│   │   └── DTOs/                   # Data Transfer Objects
│   ├── JobAppTracker.Domain/       # Core entities, Guard clauses & interfaces
│   └── JobAppTracker.Infrastructure/ # EF Core, Repositories, Identity
└── tests/
    ├── JobAppTracker.Domain.UnitTests/
    ├── JobAppTracker.Application.UnitTests/
    ├── JobAppTracker.Api.IntegrationTests/  # Testcontainers + real MSSQL
    └── JobAppTracker.Tests.Common/
```


### Patterns & Principles Used:
| Pattern | Purpose |
|---------|---------|
| **Clean Architecture** | Separation of concerns across layers |
| **CQRS** | Separate read and write operations |
| **MediatR** | Decoupled communication between layers |
| **Repository Pattern** | Abstraction over data access layer |
| **Guard Clauses** | Enforce domain invariants in rich domain models |

## 🧪 Testing & CI/CD
- **Unit tests** cover domain logic and application handlers.
- **Integration tests** spin up a real SQL Server instance via **Testcontainers**, exercising the full API pipeline end-to-end rather than mocking the database.
- A **GitHub Actions** pipeline runs the full test suite on every push/PR to `main`.
- A separate deployment workflow builds, tests, and publishes the app to production hosting via Web Deploy on every manual trigger.

---



---

## 📸 Screenshots

### 🔐 Authentication
| Login | Register | Forgot Password |
|-------|----------|-----------------|
| ![Login](screenshots/Login.png) | ![Register](screenshots/Register.png) | ![Forgot Password](screenshots/EmailConfirm.png) |

---

### 🏠 Dashboard
| Overview | Statistics |
|----------|------------|
| ![Dashboard](screenshots/Dashboard.png) | ![Stats](screenshots/Dashboard2.png) |

---

### 📄 Applications & Interviews
| Applications List | Application Detail | Interviews |
|-------------------|--------------------|------------|
| ![Applications](screenshots/JobApplications.png) | ![Add Job](screenshots/JobApplication.png) | ![Interviews](screenshots/Interviews.png) |

---

### 📝 Notes & Documents
| Notes | Documents | Profile |
|-------|-----------|---------|
| ![Notes](screenshots/Notes.png) | ![Documents](screenshots/Documents.png) | ![Profile](screenshots/Profile.png) |

---

## 🚀 Getting Started

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/)
- SQL Server

### Installation

### Option A: Run with Docker Compose (recommended)
```bash
git clone https://github.com/mahmoudsaad111/JobAppTracker.git
cd JobAppTracker
docker compose up --build
```

### Option B: Run manually

```bash
# Clone the repo
git clone https://github.com/mahmoudsaad111/JobAppTracker.git

# Backend setup
cd backend
dotnet restore
dotnet run --project src/JobAppTracker.API

# Frontend setup
cd frontend
npm install
ng serve
```

> App runs on `https://localhost:4200` by default  
> API runs on `https://localhost:44315` by default  
> Swagger UI available at `http://localhost:44315/swagger`  
> Database migrations apply automatically on startup

### Running Tests
```bash
cd backend
dotnet test JobAppTracker.sln
```
> Integration tests require Docker running locally (Testcontainers pulls a real SQL Server image).

---


## 📋 API Modules

| Module | Description |
|--------|-------------|
| `/api/auth` | Register, login, logout, Forgot Password |
| `/api/applications` | Manage job applications |
| `/api/notes` | Manage User Notes |
| `/api/documents` | Upload & manage documents |
| `/api/interviews` | Interview tracking & feedback |
| `/api/dashboard` | Statistics & overview |

> 📖 Full API documentation available at `/swagger` when running locally

---

## 📁 Project Structure
```
JobAppTracker/
├── backend/
│   ├── src/
│   │   ├── JobAppTracker.API/
│   │   ├── JobAppTracker.Application/
│   │   │   ├── Commands/
│   │   │   ├── Queries/
│   │   │   ├── Handlers/
│   │   │   └── DTOs/
│   │   ├── JobAppTracker.Domain/
│   │   └── JobAppTracker.Infrastructure/
│   └── tests/
│       ├── JobAppTracker.Domain.UnitTests/
│       ├── JobAppTracker.Application.UnitTests/
│       ├── JobAppTracker.Api.IntegrationTests/
│       └── JobAppTracker.Tests.Common/
│
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       └── services/
│
├── docker-compose.yml
└── .github/workflows/
```   
---

## 🔮 Future Enhancements
- 🔔 Interview reminders & notifications
- 📊 Advanced job search analytics
- 🤖 AI-assisted job search tools
- 🧩 Browser extension for quick application adding

---

## 👤 Author
**Mahmoud**
- GitHub: [@mahmoudsaad111](https://github.com/mahmoudsaad111)
- LinkedIn: [mahmoud-saadeddin-13a9981b4](https://www.linkedin.com/in/mahmoud-saadeddin-13a9981b4)

## 📄 License
This project is licensed under the MIT License.
