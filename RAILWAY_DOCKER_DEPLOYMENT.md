# Railway Docker Deployment Configuration
# This file contains all the necessary configurations for deploying miniERP to Railway using Docker

# 1. Railway Project Structure
# Each service will be deployed as a separate Railway service
# Services communicate via Railway's internal networking

# 2. Environment Variables Required
# DATABASE_URL - PostgreSQL connection string (provided by Railway)
# NODE_ENV=production
# PORT - Railway will provide this automatically
# JWT_SECRET - Your secret key for JWT tokens
# CORS_ORIGIN - Your frontend domain

# 3. Service Dependencies
# Identity Service -> Database (PostgreSQL)
# All other services -> Identity Service (for authentication)
# Frontend services -> Backend services (for API calls)

# 4. Railway Service Configuration
# Each service needs its own railway.json with Docker configuration
