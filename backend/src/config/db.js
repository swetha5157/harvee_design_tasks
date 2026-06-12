const { Pool } = require('pg')

const getConnectionString = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  if (process.env.DB_HOST) {
    const user = encodeURIComponent(process.env.DB_USER || '')
    const pass = encodeURIComponent(process.env.DB_PASSWORD || '')
    const host = process.env.DB_HOST
    const port = process.env.DB_PORT || 5432
    const db = process.env.DB_NAME || 'postgres'
    return `postgresql://${user}:${pass}@${host}:${port}/${db}`
  }
  
  return undefined
}

const connectionString = getConnectionString()
const needsSsl =
  process.env.DB_SSL === 'true' ||
  (connectionString && /sslmode=require/i.test(connectionString))

console.log("Connection String:", connectionString)
console.log({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  passwordType: typeof process.env.DB_PASSWORD,
  db: process.env.DB_NAME,
  port: process.env.DB_PORT
})
const pool = new Pool({
  connectionString,
  ...(needsSsl && { ssl: { rejectUnauthorized: false } })
})

const initDb = async () => {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(200) NOT NULL,
      marks FLOAT NOT NULL,
      category VARCHAR(10) NOT NULL CHECK (category IN ('General','OBC','SC','ST')),
      application_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS courses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(200) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      total_seats INT NOT NULL,
      general_seats INT NOT NULL DEFAULT 0,
      obc_seats INT NOT NULL DEFAULT 0,
      sc_seats INT NOT NULL DEFAULT 0,
      st_seats INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS student_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID REFERENCES students(id) ON DELETE CASCADE,
      course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
      priority INT NOT NULL CHECK (priority IN (1,2,3)),
      UNIQUE(student_id, priority)
    );

    CREATE TABLE IF NOT EXISTS allocations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID UNIQUE REFERENCES students(id) ON DELETE CASCADE,
      course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
      category_used VARCHAR(10) NOT NULL,
      preference_priority INT,
      status VARCHAR(30) DEFAULT 'allocated',
      allocated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS uploaded_datasets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      original_filename VARCHAR(255) NOT NULL,
      table_name VARCHAR(100) UNIQUE NOT NULL,
      schema_info JSONB,
      row_count INT DEFAULT 0,
      uploaded_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS query_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      dataset_id UUID REFERENCES uploaded_datasets(id) ON DELETE CASCADE,
      natural_language TEXT NOT NULL,
      generated_sql TEXT,
      status VARCHAR(20) DEFAULT 'success',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `)

  await pool.query(`
    ALTER TABLE allocations ADD COLUMN IF NOT EXISTS preference_priority INT;
  `).catch(() => {})

  console.log('DB ready')
}

initDb().catch(err => console.error('DB init failed:', err.message))

module.exports = pool
