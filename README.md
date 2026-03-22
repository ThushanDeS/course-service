# Course Service — Smart Campus Services

Course Management microservice for the Smart Campus Services platform (CTSE Cloud Computing Assignment).

## Features

- **Course Catalog** — List, search, filter courses by department/semester
- **Course CRUD** — Create, read, update, soft-delete courses
- **Enrollment** — Enroll/drop courses with capacity management
- **Inter-Service Auth** — JWT validation via Auth Service (`/auth/validate`)
- **Swagger API Docs** — Auto-generated OpenAPI documentation
- **Security** — Helmet, CORS, rate limiting, input validation (Joi)

## Tech Stack

- Node.js 18 + Express
- MongoDB Atlas (Mongoose ODM)
- Axios (for inter-service communication with Auth Service)
- Docker (multi-stage build, non-root user)
- GitHub Actions CI/CD
- SonarCloud + Snyk (DevSecOps)

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Auth Service URL
npm run dev     # http://localhost:3002
```

### Docker

```bash
docker build -t course-service .
docker run -p 3002:3002 --env-file .env course-service
```

## API Endpoints

| Method | Endpoint                    | Auth | Description                 |
| ------ | --------------------------- | ---- | --------------------------- |
| GET    | `/courses`                  | No   | List courses (with filters) |
| GET    | `/courses/:id`              | No   | Get course by ID            |
| POST   | `/courses`                  | JWT  | Create a course             |
| PUT    | `/courses/:id`              | JWT  | Update a course             |
| DELETE | `/courses/:id`              | JWT  | Soft-delete a course        |
| POST   | `/courses/enroll`           | JWT  | Enroll in a course          |
| GET    | `/courses/my`               | JWT  | Get my enrollments          |
| DELETE | `/courses/enroll/:courseId` | JWT  | Drop a course               |
| GET    | `/health`                   | No   | Health check                |

### API Documentation

Once running: http://localhost:3002/api-docs

## Production Deployment

- **Cloud Provider:** Microsoft Azure
- **Service:** Azure Container Apps (managed container orchestration)
- **Registry:** Azure Container Registry (`campusservices.azurecr.io`)
- **Live URL:** https://course-service.redisland-b57e0bf2.eastus.azurecontainerapps.io

## CI/CD Pipeline

1. **Lint & Test** — ESLint + Jest with coverage
2. **Security Scan** — SonarCloud (SAST) + Snyk (dependency vulnerabilities)
3. **Build & Push** — Docker build → push to Azure Container Registry
4. **Deploy** — Update Azure Container App with new image

## Inter-Service Communication

1. **Auth Service → Course Service**: Course Service validates JWTs by calling the Auth Service's `GET /auth/validate` endpoint
2. **Timetable Service → Course Service**: Timetable Service fetches enrolled courses via `GET /courses/my`
3. **Course Service → Notification Service**: Enrollment events sent via `POST /notifications/send`

## Testing

```bash
npm test
```

## License

MIT
