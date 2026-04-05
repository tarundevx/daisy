-- Daisy Database Schema
-- Optimized for both standard PostgreSQL and Hydra (columnar)

-- Extensions (optional, but requested)
-- CREATE EXTENSION IF NOT EXISTS pg_duckdb;

-- 1. Users table (Rowstore)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sessions table (Rowstore - for transactional access)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    scenario_id TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress', -- in_progress, completed, failed
    summary_json JSONB, -- For the final report card
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- 3. Session Events table (Columnar - for analytical queries)
-- In standard Postgres, this is a normal table. 
-- In Hydra, add 'USING columnar'
CREATE TABLE IF NOT EXISTS session_events (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    event_type TEXT NOT NULL, -- session_start, question_served, hint_requested, code_submitted, follow_up_answered, session_ended
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- CREATE INDEX idx_session_events_session_id ON session_events(session_id);
-- CREATE INDEX idx_session_events_event_type ON session_events(event_type);

-- 4. Question Bank (Columnar)
CREATE TABLE IF NOT EXISTS question_bank (
    id SERIAL PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed some initial data if needed
-- INSERT INTO users (email, password_hash, name) VALUES ('test@example.com', '$2b$10$YourHashHere', 'Test User');
