import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { AuthService } from './services/auth';

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let db: any = null;

// Initialize in-memory users for testing until Supabase is connected
const memoryUsers = new Map();

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

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log('✅ Connected to Supabase database');
  } catch (error: any) {
    console.warn('❌ Failed to connect to Supabase:', error.message);
    console.log('🔄 Using in-memory storage for testing...');
    initializeTestUsers();
  }
} else {
  console.warn("DATABASE_URL not set. Using in-memory storage for testing...");
  initializeTestUsers();
}

// Export both for fallback
export { pool, db, memoryUsers };
