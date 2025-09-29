import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";
import { AuthService } from './services/auth';

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let db: any = null;

// Initialize in-memory storage for testing until Supabase is connected
const memoryUsers = new Map();
const memoryAds = new Map();

// Initialize test users
async function initializeTestUsers() {
  const hashedPassword = await AuthService.hashPassword('password123');
  
  memoryUsers.set('admin', {
    id: 'admin-1',
    username: 'admin',
    email: 'admin@manga.com',
    password: hashedPassword,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  memoryUsers.set('user1', {
    id: 'user-1',
    username: 'user1',
    email: 'user@manga.com',
    password: hashedPassword,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  console.log('✅ Test users initialized: admin/password123, user1/password123');
}

async function initializeDatabase() {
  if (process.env.DATABASE_URL) {
    try {
      pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      const testDb = drizzle({ client: pool, schema });
      
      // Test the actual connection
      await testDb.execute(sql`SELECT 1`);
      db = testDb;
      console.log('✅ Connected to PostgreSQL database');
    } catch (error: any) {
      console.warn('❌ Failed to connect to PostgreSQL:', error.message);
      console.log('🔄 Using in-memory storage for testing...');
      db = null; // Ensure db is null for fallback
      await initializeTestUsers();
    }
  } else {
    console.warn("DATABASE_URL not set. Using in-memory storage for testing...");
    await initializeTestUsers();
  }
}

// Initialize database connection
initializeDatabase().catch(console.error);

// Export for fallback
export { pool, db, memoryUsers, memoryAds };
