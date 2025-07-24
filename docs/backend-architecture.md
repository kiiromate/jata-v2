# JATA Backend Architecture

**Project Name:** JATA (Job Application Tracker & Optimization App)  
**Version:** 2.0  
**Date:** July 15, 2025  
**Purpose:** This document provides a detailed guide to JATA’s backend architecture, covering APIs, data models, security measures, and deployment strategies. It serves as a standalone resource for backend developers to build and maintain the system, adhering to zero-budget constraints while ensuring scalability, security, and performance.

---

## 1. Overview & Goals

The JATA backend acts as the core data management layer, delivering RESTful APIs to support job application tracking, web scraping ingestion, bulk intake of job data, and autofill mappings for streamlined form filling. It is designed to be efficient, secure, and scalable, leveraging free-tier tools and a serverless architecture.

### Goals
- **Performance:** Achieve sub-100ms response times for all API requests.
- **Scalability:** Utilize stateless serverless functions to support up to 1,000 concurrent users.
- **Security:** Ensure end-to-end encryption for sensitive data and compliance with privacy best practices.
- **Cost-Efficiency:** Rely on free-tier services and open-source tools to maintain zero operational costs during development.

---

## 2. Monorepo Structure

The backend resides within a monorepo, enabling efficient code sharing and streamlined development across the JATA project.

### Directory Structure
```
packages/
└── backend/
    ├── src/
    │   ├── functions/      # Serverless function handlers
    │   ├── lib/            # Shared utilities and helpers
    │   └── middleware/     # Custom middleware (e.g., auth, validation)
    ├── prisma/             # Prisma schema and migrations
    ├── tests/              # Unit and integration tests
    ├── netlify.toml        # Netlify configuration
    └── package.json        # Backend dependencies
└── common/                 # Shared types and utilities
```

- **`src/functions/`:** Houses individual serverless functions for each API endpoint.
- **`src/lib/`:** Contains reusable utilities like data parsers and transformers.
- **`prisma/`:** Manages database schema and migrations with Prisma ORM.
- **`tests/`:** Stores unit and integration tests for quality assurance.
- **`packages/common/`:** Provides shared types, utilities, and configurations used by both frontend and backend.

---

## 3. Tech Stack & Tooling

The backend leverages a modern, cost-effective tech stack built on free tools and services.

- **Runtime:** Node.js with Express.js [https://expressjs.com] for API handling.
- **Database:**
  - **MVP:** SQLite [https://www.sqlite.org] for lightweight, file-based storage.
  - **Future Scale:** PostgreSQL [https://www.postgresql.org] via Prisma ORM [https://www.prisma.io].
- **Serverless Platform:** Netlify Functions [https://www.netlify.com/products/functions] for deployment.
- **Authentication:** JSON Web Tokens (JWT) [https://jwt.io] for securing endpoints, with plans for OAuth2 expansion.
- **Logging & Monitoring:** Winston [https://github.com/winstonjs/winston] for logging, Sentry [https://sentry.io] (free tier) for error tracking.

---

## 4. Data Models & Schema

The backend manages key entities using Prisma ORM to ensure type safety and database consistency.

### Entities
- **UserProfile:** Stores user details and preferences.
- **Application:** Tracks job application metadata.
- **ScrapeConfig:** Defines configurations for scraping job boards.
- **BulkJob:** Manages batch-uploaded job data.
- **Mapping:** Stores autofill mappings for form fields.

### Prisma Schema Example
```prisma
model UserProfile {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Application {
  id          Int      @id @default(autoincrement())
  jobTitle    String
  company     String
  description String?
  sourceUrl   String   @unique
  status      String   @default("Applied")
  industry    String?
  dateApplied DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  userId      Int
  user        UserProfile @relation(fields: [userId], references: [id])
}

model ScrapeConfig {
  id       Int    @id @default(autoincrement())
  domain   String
  field    String // e.g., "title", "description"
  selector String // CSS selector or XPath
  userId   Int
  user     UserProfile @relation(fields: [userId], references: [id])
}

model BulkJob {
  id           Int      @id @default(autoincrement())
  fileType     String   // "PDF", "HTML", "CSV"
  extractedData Json    // Parsed job details
  status       String   @default("Pending")
  createdAt    DateTime @default(now())
  userId       Int
  user         UserProfile @relation(fields: [userId], references: [id])
}

model Mapping {
  id       Int    @id @default(autoincrement())
  domain   String
  field    String // e.g., "name", "email"
  selector String
  userId   Int
  user     UserProfile @relation(fields: [userId], references: [id])
}
```

- **Indexing:** Unique constraints on `sourceUrl` (Application) and `email` (UserProfile).
- **Relations:** One-to-many relationships link `UserProfile` to `Application`, `ScrapeConfig`, `BulkJob`, and `Mapping`.

---

## 5. API Design & Endpoints

The backend provides RESTful APIs for frontend and extension interactions, designed to be stateless and secure.

### Endpoint Specifications
- **Authentication:** JWT required for all private endpoints.
- **Input/Output Schemas:** Validated using JSON Schema.
- **Error Codes:** HTTP standards (e.g., 400 Bad Request, 401 Unauthorized, 500 Server Error).

#### Key Endpoints
| **Method** | **Path**                  | **Description**               | **Input**                     | **Output**                  | **Auth** |
|------------|---------------------------|-------------------------------|-------------------------------|-----------------------------|----------|
| POST       | `/api/applications`       | Create a job application      | `{ jobTitle, company, ... }`  | `{ id, ... }`               | JWT      |
| GET        | `/api/applications`       | List/filter applications      | Query: `status`, `industry`   | `[ { id, jobTitle, ... } ]` | JWT      |
| PATCH      | `/api/applications/:id`   | Update application            | `{ status, notes }`           | `{ id, ... }`               | JWT      |
| POST       | `/api/scrape`             | Ingest scraped job data       | `{ url, scrapedData }`        | `{ success: true }`         | JWT      |
| POST       | `/api/bulk`               | Batch intake of job files     | `{ files: [ { type, data } ] }` | `{ success: true, count }` | JWT      |
| POST       | `/api/autofill/mappings`  | Save autofill mappings        | `{ domain, field, selector }` | `{ id, ... }`               | JWT      |
| GET        | `/api/autofill/mappings`  | Retrieve autofill mappings    | Query: `domain`               | `[ { domain, field, ... } ]` | JWT      |

---

## 6. Scraper & Bulk Intake Logic

The backend processes scraped data and bulk uploads, converting them into structured `Application` objects.

### Parsing Flow
1. **Input Validation:** Verify format and structure of incoming data (HTML, PDF, CSV).
2. **Parsing:**
   - **HTML:** Extract data using `cheerio` [https://cheerio.js.org] with user-defined selectors.
   - **PDF:** Parse text with `pdf-parse` [https://www.npmjs.com/package/pdf-parse].
   - **CSV:** Map columns to fields using `papaparse` [https://www.papaparse.com].
3. **Transformation:** Store parsed data as `Application` records in the database.
4. **Error Handling:** Retry transient failures, return descriptive errors for invalid inputs.

### Rate-Limiting & Backoff
- **Rate Limits:** Cap scraping at 1 request/second to avoid abuse or blocking.
- **Backoff:** Use exponential backoff for retries on failed or rate-limited requests.

---

## 7. Autofill Module Support

The backend enables the autofill feature through APIs for profile data and mapping management.

- **GET /api/user/profile:** Retrieves user profile data (e.g., name, email) for autofill.
- **POST /api/autofill/mappings:** Stores user-defined mappings for form fields by domain.
- **GET /api/autofill/mappings:** Fetches mappings for a specific domain.

---

## 8. Security & Privacy

Security measures protect user data and ensure system integrity.

- **Encryption:** AES-256 encryption for sensitive fields (e.g., resume excerpts) at rest.
- **CORS:** Restrict API access to the frontend domain.
- **Input Validation:** Sanitize and validate inputs with `express-validator` [https://express-validator.github.io].
- **Secrets:** Store keys and credentials in environment variables.

---

## 9. Testing & Quality

A comprehensive testing strategy ensures reliability and performance.

- **Unit Tests:** Test core logic (e.g., parsers) with Jest [https://jestjs.io].
- **Integration Tests:** Validate endpoints with Supertest [https://www.npmjs.com/package/supertest].
- **Load Testing:** Use `autocannon` [https://www.npmjs.com/package/autocannon] to simulate traffic.

---

## 10. CI/CD & Deployment

Automated pipelines manage the development lifecycle.

- **Tool:** GitHub Actions [https://github.com/features/actions] for CI/CD.
- **Environments:** Separate `dev`, `staging`, and `prod` configurations.
- **Deployment:** Push to Netlify Functions with versioned releases for rollback.

### Example Workflow
```yaml
name: Deploy Backend
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
      - run: npm run deploy:prod
```

---

## 11. Monitoring & Observability

Monitoring tools track performance and detect issues.

- **Logging:** Structured logs with Winston, errors reported to Sentry.
- **Metrics:** Function durations and error rates via Netlify analytics.

---

## 12. Appendix

### Sample `netlify.toml`
```toml
[build]
  command = "npm run build"
  functions = "packages/backend/src/functions"

[functions]
  directory = "packages/backend/src/functions"
```

### Environment Variables
- `DATABASE_URL`: Database connection string.
- `JWT_SECRET`: Key for JWT authentication.
- `SENTRY_DSN`: Sentry error tracking DSN.

### References
- Prisma: [https://www.prisma.io/docs](https://www.prisma.io/docs)
- Express: [https://expressjs.com](https://expressjs.com)
- Netlify Functions: [https://docs.netlify.com/functions/overview](https://docs.netlify.com/functions/overview)

---

**Summary:** JATA’s backend is a scalable, secure, and cost-efficient system built on Node.js with Express, deployed as serverless functions on Netlify. It uses SQLite for the MVP (with PostgreSQL planned for scale), managed via Prisma ORM, and provides RESTful APIs for job applications, scraping, bulk intake, and autofill mappings. With sub-100ms response times, end-to-end encryption, and free-tier tools, the architecture supports growth and future monetization while maintaining zero operational costs.