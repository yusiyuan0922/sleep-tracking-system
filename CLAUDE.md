# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a sleep tracking system (睡眠小程序) for insomnia patients - a medication tracking and clinical scale management system. The system uses a **monorepo structure with npm workspaces** containing:

- **backend/** - NestJS backend API
- **miniprogram/** - uni-app WeChat miniprogram (patient and doctor interfaces)
- **web-admin/** - Vue 3 + Element Plus web admin dashboard
- **shared/** - Shared TypeScript types and constants across all packages

## Essential Commands

### ⚠️ IMPORTANT: Docker Deployment
**This project uses Docker Compose for deployment.** All services (backend, database, web-admin, MinIO) run in Docker containers.

#### Docker Commands
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild and restart backend after code changes
docker-compose build backend
docker-compose up -d backend

# Rebuild and restart web-admin after code changes
docker-compose build web-admin
docker-compose up -d web-admin

# View logs
docker logs sleep-backend --tail 50
docker logs sleep-web-admin --tail 50
docker logs sleep-postgres --tail 50

# View all running containers
docker ps

# Restart a specific service
docker-compose restart backend
```

### Backend Development
```bash
# PRODUCTION (Docker) - Primary deployment method
docker-compose build backend
docker-compose up -d backend

# DEVELOPMENT (Local) - Only for local testing without Docker
# From project root
npm run dev:backend

# From backend directory
cd backend
npm run start:dev      # Development mode with hot reload
npm run build          # Production build
npm run start:prod     # Run production build
npm run lint           # ESLint
npm run test           # Run tests
npm run test:watch     # Watch mode
npm run test:cov       # With coverage
```

### Database Initialization
```bash
# Initialize scale configurations (run once after database setup)
docker exec sleep-postgres psql -U postgres -d sleep_tracking -f /tmp/init-scales.sql

# Or copy the seed file first:
docker cp backend/src/database/seeds/init-scales.sql sleep-postgres:/tmp/
docker exec sleep-postgres psql -U postgres -d sleep_tracking -f /tmp/init-scales.sql
```

The `init-scales.sql` script initializes 6 clinical scales with complete questions and scoring rules:
- **AIS** (雅典失眠量表) - 8 questions, patient self-assessment
- **ESS** (Epworth嗜睡量表) - 8 questions, patient self-assessment
- **GAD7** (广泛性焦虑障碍量表) - 7 questions, patient self-assessment
- **PHQ9** (抑郁症筛查量表) - 9 questions, patient self-assessment
- **HAMA** (汉密尔顿焦虑量表) - 14 questions, doctor assessment
- **HAMD** (汉密尔顿抑郁量表) - 17 questions, doctor assessment

### Web Admin Development
```bash
# From project root
npm run dev:web
npm run build:web

# From web-admin directory
cd web-admin
npm run dev            # Start Vite dev server (port 5173)
npm run build          # Production build
npm run preview        # Preview production build
```

### Miniprogram Development
```bash
cd miniprogram/med-tracker
npm run dev:mp-weixin  # WeChat miniprogram development
npm run build:mp-weixin # Production build
```

## Backend Architecture

### Core Modules
The backend follows NestJS modular architecture with these business modules:
- **AuthModule** - JWT-based authentication with passport
- **UserModule** - User account management
- **HospitalModule** - Hospital information
- **DoctorModule** - Doctor profiles and assignments
- **PatientModule** - Patient management and stage tracking
- **ScaleModule** - Clinical scale configurations and records
- **UploadModule** - File upload to Aliyun OSS

### Database Design
- **PostgreSQL** as the primary database
- **TypeORM** for ORM with entities in `backend/src/database/entities/`
- Auto-synchronization enabled in development (`synchronize: true` when `NODE_ENV=development`)
- All entities use `bigint` for primary keys where applicable

### Key Entities and Relationships
- **User** (base user account) → links to Doctor or Patient via role
- **Patient** → belongs to Doctor and Hospital, tracks visit stages (V1-V4)
- **StageRecord** → records visit completion and metadata
- **ScaleConfig** → stores scale definitions (AIS, ESS, GAD7, PHQ9, HAMA, HAMD)
- **ScaleRecord** → patient scale submission records
- **MedicationRecord** → daily medication tracking
- **ConcomitantMedication** → concurrent medications
- **AdverseEvent** → adverse event reporting with attachments
- **MedicalFile** → patient medical records

### Authentication & Guards
- **Global JWT guard** applied via `APP_GUARD` in `app.module.ts`
- All routes require authentication by default
- Use `@Public()` decorator to bypass authentication
- JWT configured with 7-day expiration

### Development Mode WeChat Login
- **Mock login enabled** when `NODE_ENV=development` and `WECHAT_APP_ID` is not configured or equals `'your_wechat_app_id'`
- In development mode, the backend creates mock users without calling WeChat API
- Mock users have `openid` format: `mock_openid_{code}`
- This allows testing miniprogram login without real WeChat credentials
- For production, configure real `WECHAT_APP_ID` and `WECHAT_APP_SECRET` in `.env.development`

### Configuration
Environment variables loaded from `.env.development` or `.env`:
- Database: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- WeChat: `WECHAT_APP_ID`, `WECHAT_APP_SECRET`
- Aliyun OSS: `OSS_REGION`, `OSS_ACCESS_KEY_ID`, `OSS_ACCESS_KEY_SECRET`, `OSS_BUCKET`
- CORS: `CORS_ORIGIN` (defaults to `http://localhost:5173`)

Copy `backend/.env.example` to `backend/.env.development` and configure before starting.

### API Documentation
Swagger UI available at `http://localhost:3000/api-docs` when backend is running.

## Domain Logic: Patient Visit Stages

The system tracks patient progress through 4 visit stages (V1, V2, V3, V4) with strict timing windows and requirements.

### Stage Progression Timeline
Defined in `shared/constants/stages.ts`:
- **V1 → V2**: 7 days ±1 day tolerance
- **V2 → V3**: 21 days ±2 days tolerance
- **V3 → V4**: 7 days ±2 days tolerance

### Stage Requirements
Each stage has specific requirements (from `STAGE_REQUIREMENTS`):
- **V1**: All 6 scales (AIS, ESS, GAD7, PHQ9, HAMA, HAMD) + medical files + medication record
- **V2**: 4 scales (AIS, ESS, GAD7, PHQ9) + medication record + concomitant meds
- **V3**: All 6 scales + medical files + medication record
- **V4**: 4 scales + concomitant meds

### Patient Entity Stage Tracking
The `Patient` entity stores:
- `currentStage`: Current visit stage (V1/V2/V3/V4/completed)
- `enrollmentDate`: Initial enrollment date
- `v1CompletedAt`, `v2CompletedAt`, `v3CompletedAt`, `v4CompletedAt`: Completion timestamps
- `v2WindowStart`, `v2WindowEnd`, etc.: Calculated time windows for each visit

Stage transitions are calculated based on completion times and window tolerances.

## Shared Types

The `shared/` workspace contains type definitions and constants used across backend, web-admin, and miniprogram:
- User types and role definitions
- Stage types and configurations
- Scale definitions
- Import from shared package in all workspaces

## Web Admin Stack

- Vue 3 (Composition API)
- Vite for build tooling
- Element Plus for UI components
- Pinia for state management
- Vue Router for routing
- Axios for HTTP requests
- ECharts for data visualization
- TypeScript throughout

## Miniprogram Stack

- uni-app framework (Vue 3 based)
- Targets WeChat miniprogram platform
- Uses uni-app's cross-platform components
- Development command: `npm run dev:mp-weixin`
- **Tabbar icons** located in `miniprogram/med-tracker/src/static/tabbar/`
  - Current icons are simple placeholders (gray/blue squares)
  - Replace with professional 81px × 81px PNG icons for production
  - Icons auto-copy to `dist/dev/mp-weixin/static/tabbar/` during compilation

## Development Workflow

### Docker Deployment (Primary Method)
1. **Ensure Docker is running**
2. **Configure environment**: Environment variables are in `backend/.env.development`
3. **Start all services**: `docker-compose up -d`
4. **Access services**:
   - Backend API: http://localhost:3000
   - Swagger docs: http://localhost:3000/api-docs
   - Web Admin: http://localhost:5173
   - MinIO Console: http://localhost:9001
5. **After code changes**:
   - Backend: `docker-compose build backend && docker-compose up -d backend`
   - Web Admin: `docker-compose build web-admin && docker-compose up -d web-admin`
6. **View logs**: `docker logs sleep-backend --tail 50`

### Local Development (Alternative)
1. **Start PostgreSQL** database (required for backend)
2. **Configure environment**: Copy and edit `.env.development` in backend
3. **Install dependencies**: Run `npm install` in project root (installs all workspaces)
4. **Start backend**: `npm run dev:backend` from root
5. **Start web admin**: `npm run dev:web` from root in separate terminal
6. **Access Swagger docs**: http://localhost:3000/api-docs

### Miniprogram Development
1. **Start backend services** (via Docker or locally)
2. **Compile miniprogram**: `cd miniprogram/med-tracker && npm run dev:mp-weixin`
3. **Open in WeChat DevTools**: Import `miniprogram/med-tracker` directory
4. **Project configuration**: `miniprogramRoot` is set to `dist/dev/mp-weixin/`

## Code Style Notes

- Backend uses **CommonJS** (`"type": "commonjs"`)
- Frontend packages use **ES modules** (`"type": "module"`)
- Use **class-validator** and **class-transformer** for DTO validation in backend
- Global validation pipe configured in `main.ts` with `whitelist: true` and `transform: true`
- All API responses follow consistent structure via NestJS response handling
