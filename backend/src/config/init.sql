-- Drop existing tables
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS security_questions CASCADE;
DROP TABLE IF EXISTS login_history CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS email_verification_tokens CASCADE;
DROP TABLE IF EXISTS password_reset_attempts CASCADE;
DROP TABLE IF EXISTS user_chat_messages CASCADE;
DROP TABLE IF EXISTS user_chats CASCADE;
DROP TABLE IF EXISTS temp_chat_messages CASCADE;
DROP TABLE IF EXISTS temp_chats CASCADE;
DROP TABLE IF EXISTS user_credits CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birthday DATE NOT NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_security_questions_locked BOOLEAN DEFAULT FALSE,
    remaining_security_question_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create security_questions table
CREATE TABLE IF NOT EXISTS security_questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    question1_id VARCHAR(50) NOT NULL,
    answer1 VARCHAR(255) NOT NULL,
    question2_id VARCHAR(50) NOT NULL,
    answer2 VARCHAR(255) NOT NULL,
    question3_id VARCHAR(50) NOT NULL,
    answer3 VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create login_history table
CREATE TABLE IF NOT EXISTS login_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL,
    login_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    status VARCHAR(20) NOT NULL, -- 'success' or 'failed'
    failure_reason VARCHAR(255), -- null for successful logins
    CONSTRAINT valid_status CHECK (status IN ('success', 'failed'))
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create password_reset_attempts table
CREATE TABLE IF NOT EXISTS password_reset_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    attempt_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    status VARCHAR(20) NOT NULL, -- 'success' or 'failed'
    failure_reason VARCHAR(255) -- null for successful attempts
);

-- Create email_verification_tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permanent user chats
CREATE TABLE IF NOT EXISTS user_chats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_chat_messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES user_chats(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Temporary/anonymous user chats
CREATE TABLE IF NOT EXISTS temp_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS temp_chat_messages (
    id SERIAL PRIMARY KEY,
    chat_id UUID REFERENCES temp_chats(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User credits (token/money tracking)
CREATE TABLE IF NOT EXISTS user_credits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    credits NUMERIC(12,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cleanup job: Delete inactive chats
DELETE FROM temp_chats WHERE last_activity < NOW() - INTERVAL '1 hour'; 