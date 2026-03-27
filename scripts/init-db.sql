-- BeBlue Database Initialization
-- This runs automatically when PostgreSQL container starts

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Ensure proper encoding
ALTER DATABASE beblue SET timezone TO 'America/Sao_Paulo';
