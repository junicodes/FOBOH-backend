# FOBOH Backend API

A Node.js + Express.js backend API for managing pricing profiles and products, built with TypeScript, Drizzle ORM, and SQLite.

**Backend runs on port 4001**  
**Frontend runs on port 4000**

**API Documentation (Swagger):** `http://localhost:4001/api-docs`

## Table of Contents

- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Database Design](#database-design)
- [API Endpoints](#api-endpoints)
- [Pricing Calculation Logic](#pricing-calculation-logic)
- [Testing](#testing)
- [Deployment](#deployment)
- [Production Improvements](#production-improvements)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (create `.env` file):
```env
PORT=4001
NODE_ENV=development
DATABASE_PATH=./sqlite.db
```

3. Generate database migrations:
```bash
npm run db:generate
```

4. Run migrations:
```bash
npm run db:migrate
```

5. Seed the database:
```bash
npm run seed
```

6. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:4001`

**API Documentation (Swagger):** `http://localhost:4001/api-docs`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database (dev only)
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run seed` - Seed database with sample data
- `npm test` - Run all tests (unit + integration)
- `npm run test:watch` - Run tests in watch mode

## Architecture

### Design Principles

This backend follows **SOLID principles** and a **layered architecture** pattern:

```
Request → Route → Controller → Service → Calculator/Repository
```

**Why this architecture?**

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Testability**: Business logic is isolated and easily testable
3. **Maintainability**: Changes in one layer don't affect others
4. **Scalability**: Easy to add new features without breaking existing code

### Folder Structure

```
src/
├── app.ts              # Express app setup
├── server.ts           # Server entry point
├── config/            # Configuration files
│   ├── db.ts          # Database connection
│   └── env.ts         # Environment variables
├── controllers/       # HTTP request handlers (thin layer)
│   ├── products/
│   └── pricing-profile/
├── services/          # Business logic (thick layer)
│   ├── products/
│   └── pricing-profile/
│       └── calculateAdjustment.ts  # Pure calculation logic
├── routes/            # API route definitions
│   ├── products/
│   └── pricing-profile/
├── schemas/           # Zod validation schemas
├── db/                # Database layer
│   ├── schema.ts      # Drizzle schema definitions
│   ├── migrate.ts     # Migration script
│   └── seed.ts       # Seed data
├── middlewares/       # Express middlewares
│   ├── error.middleware.ts
│   └── validation.middleware.ts
├── utils/             # Utility functions
│   └── money.ts       # Money formatting/rounding
└── docs/              # API documentation
    └── swagger.ts      # Swagger/OpenAPI setup
```

### Key Design Decisions

#### 1. **No Business Logic in Controllers**

Controllers are thin - they only:
- Extract request data
- Call services
- Return responses
- Handle HTTP status codes

**Why?** Keeps controllers simple and testable. Business logic belongs in services.

#### 2. **Pure Calculation Functions**

Pricing calculations are in isolated, pure functions (`calculateAdjustment.ts`):
- No side effects
- No database access
- Easy to test
- Reusable

**Why?** Calculations are complex and critical. Isolating them makes them:
- Testable without database
- Reusable across different contexts
- Easy to verify correctness

#### 3. **Service Layer Contains Business Logic**

Services orchestrate:
- Data fetching from database
- Calling calculation functions
- Business rule validation
- Error handling

**Why?** Centralizes business logic, making it easier to maintain and test.

## Technology Stack

### Core Technologies

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety and better DX
- **Drizzle ORM** - Type-safe database queries
- **SQLite** - Embedded database

### Why SQLite?

**Advantages:**
- ✅ Zero configuration - no separate database server needed
- ✅ Fast for read-heavy workloads
- ✅ Perfect for small to medium applications
- ✅ Easy to backup (single file)
- ✅ Great for development and prototyping
- ✅ Works well with Vercel serverless functions

**Tradeoffs:**
- ❌ Limited concurrent writes (fine for most use cases)
- ❌ No built-in user management
- ❌ File-based (can be a bottleneck at very high scale)

**For Production:**
- SQLite works well for Vercel serverless functions
- Can easily migrate to PostgreSQL if needed (Drizzle supports both)
- For high-traffic production, I would consider PostgreSQL

### Why Drizzle ORM?

**Advantages:**
- ✅ Type-safe queries (TypeScript)
- ✅ Lightweight and performant
- ✅ Great developer experience
- ✅ Works with SQLite, PostgreSQL, MySQL
- ✅ Easy migrations
- ✅ No runtime overhead

**Alternative considered:** Prisma
- Prisma is heavier and has more features
- Drizzle is more lightweight and fits our needs better

### Additional Libraries

- **Zod** - Runtime type validation
- **express-rate-limit** - API rate limiting
- **cors** - Cross-origin resource sharing
- **swagger-jsdoc** + **swagger-ui-express** - API documentation
- **Jest** - Testing framework
- **Supertest** - API testing

## Database Design

### Schema Overview

The database uses normalized tables with foreign key relationships:

```
brands (id, name)
categories (id, name)
subCategories (id, name, categoryId)
segments (id, name)
skus (id, skuCode)
products (id, name, skuId, brandId, categoryId, subCategoryId, segmentId, globalWholesalePrice, quantity)
pricingProfiles (id, name, adjustmentType, adjustmentValue, incrementType, createdAt, updatedAt)
pricingProfileProducts (id, profileId, productId, basedOnPrice, newPrice, createdAt)
```

### Why This Design?

1. **Normalization** - Reduces data duplication
2. **Referential Integrity** - Foreign keys ensure data consistency
3. **Flexibility** - Easy to add new brands/categories without changing product structure
4. **Query Performance** - Indexed foreign keys for fast joins

### Trade-offs and Improvements

#### Current Implementation Trade-offs

**SQLite Database:**
- ✅ **Pros:** Zero configuration, fast for small-medium datasets, perfect for development
- ❌ **Cons:** Limited concurrent writes, file-based (can be bottleneck at scale)

**Current Search Implementation:**
- Uses SQLite `LIKE` queries for product search
- Works well for small datasets (< 10,000 products)
- Can become slow with large datasets or complex filters

#### Recommended Improvements

**1. Elasticsearch for Product Search (Large Data Loads)**

**Problem:** As product catalog grows, SQLite search queries become slow:
- `LIKE` queries don't scale well
- Multiple filter combinations (category + brand + segment) require complex joins
- Full-text search is limited in SQLite

**Solution:** Implement Elasticsearch for product search

**Why Elasticsearch?**
- ✅ **Fast full-text search** - Optimized for search queries
- ✅ **Handles large datasets** - Can index millions of products
- ✅ **Complex queries** - Supports filtering, faceting, aggregations
- ✅ **Real-time updates** - Near real-time indexing
- ✅ **Scalable** - Horizontal scaling across multiple nodes

**Implementation Approach:**
1. Keep SQLite for transactional data (pricing profiles, relationships)
2. Use Elasticsearch for product search and filtering
3. Sync products to Elasticsearch on create/update/delete
4. Route search requests to Elasticsearch, other queries to SQLite

**Trade-off:**
- ❌ Additional infrastructure complexity
- ❌ Need to maintain data sync between SQLite and Elasticsearch
- ✅ Massive performance improvement for search (10-100x faster)

**2. PostgreSQL Migration (Production Scale)**

**When to migrate:**
- Concurrent writes > 10/second
- Database size > 10GB
- Need for replication/backup features

**Benefits:**
- Better concurrent write performance
- Built-in replication
- Better tooling for production
- Drizzle supports both, so migration is straightforward

**3. Redis Caching Layer**

**Use cases:**
- Cache frequently accessed products
- Cache reference data (brands, categories)
- Cache pricing profile lookups
- Session management

**Benefits:**
- Reduces database load
- Faster response times
- Better scalability

## API Endpoints

### Products

- `GET /api/v1/products` - Get all products (with optional filters)
- `GET /api/v1/products/search` - Search products
- `GET /api/v1/brands` - Get all brands
- `GET /api/v1/categories` - Get all categories
- `GET /api/v1/sub-categories` - Get all sub-categories
- `GET /api/v1/segments` - Get all segments
- `GET /api/v1/skus` - Get all SKUs

### Pricing Profiles

- `GET /api/v1/pricing-profiles` - Get all pricing profiles
- `GET /api/v1/pricing-profiles/:id` - Get pricing profile by ID
- `POST /api/v1/pricing-profiles` - Create pricing profile
- `PUT /api/v1/pricing-profiles/:id` - Update pricing profile
- `DELETE /api/v1/pricing-profiles/:id` - Delete pricing profile


## Pricing Calculation Logic

### Calculation Formulas

The backend implements authoritative pricing calculations:

**Fixed Adjustment:**
- Increase: `newPrice = basePrice + adjustmentValue`
- Decrease: `newPrice = max(0, basePrice - adjustmentValue)`

**Dynamic (Percentage) Adjustment:**
- Increase: `newPrice = basePrice + (adjustmentValue% * basePrice)`
- Decrease: `newPrice = max(0, basePrice - (adjustmentValue% * basePrice))`

### Edge Case Validation

The calculation service validates:

1. ✅ Base price must be positive
2. ✅ Adjustment value must be positive
3. ✅ Percentage cannot exceed 100%
4. ✅ Fixed decrease cannot exceed base price
5. ✅ Final price is clamped to 0 (never negative)
6. ✅ Prices are rounded to 2 decimal places

### Why Calculate on Backend?

**Backend calculation = Source of Truth**

- ✅ Final validation before persistence
- ✅ Prevents tampered requests
- ✅ Used for all persisted pricing profiles
- ✅ Reusable for other UIs, reports, exports
- ✅ Ensures data integrity

**Note:** The frontend also calculates for UX preview, but backend result is always authoritative.

## Testing

### Running Tests

```bash
npm test
```

### Test Structure

Tests are located in `tests/` directory:

- `unit/` - Unit tests for services and utilities
- `integration/` - API integration tests

### What We Test

1. **Calculation Logic** (`pricing.calculator.test.ts`)
   - Fixed increase/decrease
   - Dynamic increase/decrease
   - Edge cases (negative values, percentages > 100%, etc.)
   - Price clamping (never negative)

2. **Service Layer** (`pricing.service.test.ts`)
   - Profile creation
   - Profile updates
   - Error handling

3. **API Integration** (`pricing.api.test.ts`)
   - HTTP endpoints
   - Request validation
   - Response formats

## Deployment

### Vercel Deployment

This backend is designed to deploy on Vercel:

1. **Connect GitHub repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Configure build settings:**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

4. **Database considerations:**
   - SQLite file is stored in `/tmp` (ephemeral in serverless)
   - For production, consider:
     - Using Vercel Postgres
     - Or external SQLite storage (S3, etc.)
     - Or migrating to PostgreSQL

### Environment Variables

Required environment variables:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_PATH` - Path to SQLite database file

## Production Improvements

### 1. Database Migration

**Current:** SQLite (file-based)
**Production:** Consider PostgreSQL for:
- Better concurrent write performance
- Built-in replication
- Better tooling for production

**Migration path:** Drizzle supports both, so migration is straightforward.

### 2. Caching

Add Redis caching for:
- Frequently accessed products
- Reference data (brands, categories)
- Pricing profile lookups

### 3. Rate Limiting

Current rate limiting is basic. For production:
- Implement per-user rate limits
- Use Redis for distributed rate limiting
- Add rate limit headers to responses

### 4. Error Monitoring

Add error tracking:
- Sentry for error monitoring
- Logging service (e.g., LogRocket, Datadog)
- Health check endpoints

### 5. API Versioning

Current: `/api/v1`
Future: Implement proper versioning strategy for breaking changes

### 6. Authentication & Authorization

Add:
- JWT-based authentication
- Role-based access control (RBAC)
- API key management

### 7. Database Backups

Implement:
- Automated daily backups
- Point-in-time recovery
- Backup verification

### 8. Performance Optimization

- Add database indexes for frequently queried fields
- Implement pagination for large result sets
- Add query result caching
- Optimize N+1 queries

### 9. Security

- Add input sanitization
- Implement CSRF protection
- Add request size limits
- Implement API key rotation

### 10. Documentation

- Expand Swagger documentation
- Add API usage examples
- Create integration guides

## License

ISC

## Author

Godwin Obi
