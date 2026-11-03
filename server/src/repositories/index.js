import { connectDatabase } from '../config/db.js';
import { createMemoryRepository } from './memory/repository.js';
import { createPgRepository } from './pg/repository.js';

const pool = await connectDatabase();
export const repository = pool ? createPgRepository(pool) : createMemoryRepository();
