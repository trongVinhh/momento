const fs = require('fs')
const path = require('path')
const { Client } = require('pg')
require('dotenv').config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ ERROR: Variable DATABASE_URL is missing in .env file.')
  console.log('👉 Please add DATABASE_URL=postgresql://postgres:[PASSWORD]@db.uicwklmejfnsparzvurk.supabase.co:5432/postgres')
  process.exit(1)
}

async function runMigrations() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase external SSL connections
  })

  try {
    await client.connect()
    console.log('🔌 Connected to Supabase PostgreSQL database.')

    // 1. Create schema_migrations table to track run migrations
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `)

    // 2. Read migration files from folder
    const migrationsDir = path.join(__dirname, '../migrations')
    if (!fs.existsSync(migrationsDir)) {
      console.error(`❌ Migration directory not found at: ${migrationsDir}`)
      process.exit(1)
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort() // Order by filename (0001, 0002...)

    // 3. Fetch already executed migrations
    const { rows } = await client.query('SELECT name FROM public.schema_migrations;')
    const executedMigrations = new Set(rows.map(row => row.name))

    console.log(`🔎 Found ${files.length} migration file(s). Checking for pending updates...`)

    // 4. Run pending migration files
    for (const file of files) {
      if (executedMigrations.has(file)) {
        continue // Skip already executed migrations
      }

      console.log(`🚀 Executing migration: ${file}...`)
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf8')

      // Run migration queries in a single transaction
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO public.schema_migrations (name) VALUES ($1)', [file])
        await client.query('COMMIT')
        console.log(`✅ Success: ${file} completed.`)
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`❌ FAILED migration: ${file}`)
        throw err
      }
    }

    console.log('✨ All migrations completed and database is up to date!')
  } catch (err) {
    console.error('❌ Migration process encountered an error:', err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigrations()
