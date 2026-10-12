# JobTracker Backend

The `backend` folder contains the ASP.NET Core 10 API and business layer for JobTracker. It is organized around clear boundaries between HTTP delivery, application use cases, domain rules, and infrastructure services.

For the complete product overview, screenshots, frontend, browser extension, and end-to-end setup, see the [root README](../README.md).

## Architecture

```text
HTTP request
    │
    ▼
API ─────────────── Controllers, middleware, authentication, Swagger
    │
    ▼
Application ─────── MediatR requests, handlers, DTOs, validators, mappings
    │
    ▼
Domain ──────────── Entities, enums, value objects, business rules
    │
    ▼
Infrastructure ──── EF Core, SQL Server, repositories, files, email, AI
```

Dependencies point inward. The domain does not depend on ASP.NET Core, EF Core, SQL Server, MailKit, or Gemini. Infrastructure implements interfaces defined by the application layer, which keeps business workflows testable and provider-independent.

## Technology choices

| Technology | What it does | Why it is used |
|---|---|---|
| **ASP.NET Core 10** | Hosts the HTTP API and middleware pipeline | High-performance, strongly typed platform with built-in DI, auth, configuration, and deployment support |
| **C# nullable reference types** | Makes optional data explicit | Reduces null-related runtime errors and documents contracts in code |
| **MediatR** | Dispatches commands and queries to handlers | Keeps controllers thin and gives each use case a focused entry point |
| **FluentValidation** | Validates commands before handlers execute | Centralizes request rules and produces consistent validation behavior |
| **Entity Framework Core 10** | Maps objects to relational data and manages migrations | Strongly typed persistence with change tracking and versioned schema evolution |
| **SQL Server** | Stores users, applications, interviews, notes, and documents | A natural fit for relational ownership and linked job-search data |
| **ASP.NET Identity** | Handles accounts and cookie sessions | Provides password verification, confirmation, recovery, lockout, and session management |
| **MailKit** | Sends SMTP email | Supports confirmation and password-recovery workflows without coupling to one host |
| **Gemini service boundary** | Powers parsing, resume matching, and cover-letter generation | Keeps AI provider details behind replaceable application interfaces |
| **PDF/OpenXML tooling** | Extracts and handles document content | Supports resume and cover-letter workflows using common formats |
| **Docker Compose** | Runs API, frontend, and SQL Server together | Makes local and hosted environments repeatable |

## Layer responsibilities

### API

`JobAppTracker.API` is the delivery layer. It contains controllers for authentication, applications, interviews, notes, documents, dashboard data, and AI features. It also configures middleware, exception translation, CORS, rate limiting, compression, static files, Swagger, and the authentication pipeline.

Controllers translate HTTP input into application requests. They do not contain database queries or business workflows.

### Application

`JobAppTracker.Application` contains the product’s use cases:

- MediatR commands, queries, and handlers.
- API-facing DTOs and mapping classes.
- FluentValidation validators.
- Repository and external-service interfaces.
- Cross-cutting MediatR behaviors for validation, logging, performance, and exception handling.

This is the primary place to add a new business capability.

### Domain

`JobAppTracker.Domain` contains the business core:

- `JobApplication`, `Interview`, `Note`, `Document`, and user entities.
- Status, job type, work mode, interview type, document type, and gender enums.
- Location and parsed-posting value objects.
- Guards and domain exceptions.

The domain layer is independent of transport, database, email, and AI infrastructure.

### Infrastructure

`JobAppTracker.Infrastructure` implements technical details:

- `AppDbContext` and EF Core configurations.
- Repository implementations.
- SQL Server migrations.
- Current-user resolution.
- Local file storage and document text extraction.
- SMTP email delivery.
- Gemini-backed AI services.
- Dependency-injection registration.

## Request flow

```text
POST /api/JobApp
      │
      ▼
JobAppController
      │ CreateJobAppCommand
      ▼
ValidationBehavior
      │ FluentValidation rules
      ▼
CreateJobAppHandler
      │ current-user ownership + business workflow
      ▼
IJobAppRepository → EF Core → SQL Server
      │
      ▼
CreateJobAppDto inside ApiResponse<T>
```

The same pattern is used for applications, interviews, notes, documents, and AI operations. This gives the Angular frontend and browser extension predictable contracts.

## Authentication and ownership

JobTracker uses ASP.NET Identity with cookie-based sessions. Registration, email confirmation, login, password recovery, logout, and profile access are exposed under `/api/auth`.

Protected handlers resolve the current user through `ICurrentUserService`. Repository queries and handlers scope applications, interviews, notes, documents, and dashboard data to that authenticated account. The browser extension reuses the authenticated public-site session and never asks users to enter their password in the extension.

## Persistence model

```text
User
 ├── JobApplication
 │    └── Interview
 ├── Note
 └── Document
```

EF configuration classes keep table mappings and relationship rules separate from entities. Migrations in `src/JobAppTracker.Infrastructure/Migrations` provide a versioned schema history, including required skills and interview-field changes.

## AI boundary

AI capabilities are accessed through interfaces such as `IJobPostingParserService`, `IResumeMatchService`, `ICoverLetterGeneratorService`, and `IGeminiClient`. The API never talks directly to Gemini. Infrastructure owns provider-specific HTTP calls, model configuration, response parsing, and external-service errors.

Current workflows:

1. Parse raw job-posting text into structured role data.
2. Compare a stored resume with an application and return matched/missing skills.
3. Generate a tailored cover-letter draft from an application and document.

## API areas

| Route | Responsibility |
|---|---|
| `/api/auth` | Registration, login, confirmation, recovery, profile, logout |
| `/api/JobApp` | Application CRUD, listing, and status updates |
| `/api/Interview` | Interview CRUD and linked application context |
| `/api/notes` | Notes CRUD |
| `/api/Document` | Upload, list, download, and delete documents |
| `/api/Dashboard/summary` | User-specific dashboard aggregation |
| `/api/job-postings/parse` | AI-assisted job-posting parsing |
| `/api/job-applications/{id}/match` | Resume matching |
| `/api/job-applications/{id}/cover-letter` | Cover-letter generation |

Responses use the project’s `ApiResponse<T>` envelope where appropriate. Enum values are serialized as strings for a stable frontend contract.

## Cross-cutting behavior

- **Validation:** MediatR validation behavior rejects invalid requests before handlers run.
- **Exceptions:** API middleware translates application exceptions into consistent HTTP responses.
- **Observability:** logging and performance behaviors instrument use cases centrally.
- **Rate limiting:** the API uses a fixed-window limiter for basic abuse protection.
- **Compression:** response compression reduces transfer size for API responses.
- **CORS:** the configured frontend origin is allowed with credentials for cookie sessions.
- **Reverse proxy:** nginx serves the Angular application and proxies `/api/` to the API container.

## Configuration

Use user secrets or environment variables for credentials. Do not commit real values to `appsettings*.json`.

Important keys include:

- `ConnectionStrings:SQLServer`
- `Frontend:BaseUrl`
- `Email:SmtpServer`, `Email:Port`, `Email:SenderEmail`, `Email:PASSWORD`
- `Gemini:ApiKey`, `Gemini:Model`, `Gemini:BaseUrl`
- `Auth:AbsoluteSessionDays`, `Auth:SlidingSessionExpireHours`, `Auth:SecureCookie`, `Auth:SameSite`

Example from the `backend` directory:

```powershell
dotnet user-secrets set "ConnectionStrings:SQLServer" "Server=(localdb)\\MSSQLLocalDB;Database=JobAppTracker;Trusted_Connection=True;TrustServerCertificate=True" --project src/JobAppTracker.API
dotnet user-secrets set "Gemini:ApiKey" "your-key" --project src/JobAppTracker.API
```

## Run locally

Requirements: .NET 10 SDK and SQL Server, unless using Docker.

```powershell
dotnet restore JobAppTracker.sln
dotnet run --project src/JobAppTracker.API
```

The HTTP development profile uses `http://localhost:5220`. Swagger is available at `/swagger` in Development. Pending EF migrations are applied during startup.

Explicit migration commands:

```powershell
dotnet ef database update --project src/JobAppTracker.Infrastructure --startup-project src/JobAppTracker.API
dotnet ef migrations add YourMigrationName --project src/JobAppTracker.Infrastructure --startup-project src/JobAppTracker.API
```

Install the EF CLI once if needed:

```powershell
dotnet tool install --global dotnet-ef
```

## Docker deployment

The repository-level `docker-compose.yml` runs the API, Angular/nginx frontend, and SQL Server together. SQL Server data and uploaded documents use persistent volumes.

```powershell
Copy-Item .env.example .env
# Edit .env with a strong DB password and optional email/AI credentials.
docker compose up --build
```

See the [root README](../README.md) for the complete end-to-end setup.

## Testing

```powershell
dotnet test JobAppTracker.sln
```

The solution includes domain unit tests, application unit tests, mapper/validator coverage, and API integration tests. A new feature should normally add domain tests for invariants, application tests for handlers and validation, and integration tests for important HTTP/authentication paths.

## Adding a feature

1. Add domain entities, value objects, or enums only when the business model requires them.
2. Add a command/query, handler, DTOs, validator, and mapper under `Application/Features`.
3. Add repository/service interfaces in Application and implementations in Infrastructure.
4. Add EF configuration and a migration for persistence changes.
5. Add a thin controller action.
6. Add unit and integration tests.
7. Update the root README when the feature is user-facing.

## Repository map

```text
backend/
├── src/
│   ├── JobAppTracker.API/
│   ├── JobAppTracker.Application/
│   ├── JobAppTracker.Domain/
│   └── JobAppTracker.Infrastructure/
├── tests/
│   ├── JobAppTracker.Application.UnitTests/
│   ├── JobAppTracker.Domain.UnitTests/
│   ├── JobAppTracker.Api.IntegrationTests/
│   └── JobAppTracker.Tests.Common/
├── JobAppTracker.sln
└── Dockerfile
```
