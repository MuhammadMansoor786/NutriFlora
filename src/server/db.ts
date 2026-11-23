import mysql from 'mysql2/promise';
import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export type ScanCategory = 'Fruit' | 'Vegetable' | 'Other';
export type UserRole = 'user' | 'admin';
export type FoodCategory = 'Fruit' | 'Vegetable';

export interface DbUser {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
}

export type PublicUser = Omit<DbUser, 'password_hash'>;

export interface DbScanHistory {
  id: number;
  user_id: number | null;
  item_name: string;
  category: ScanCategory;
  scientific_name: string | null;
  origin: string | null;
  growing_regions: string | null;
  nutritional_values: Record<string, unknown> | null;
  health_benefits: unknown[] | Record<string, unknown> | null;
  precautions: Record<string, unknown> | unknown[] | null;
  confidence_score: number;
  created_at: string;
}

export interface CreateScanInput {
  user_id?: number | null;
  item_name: string;
  category: ScanCategory;
  scientific_name?: string | null;
  origin?: string | null;
  growing_regions?: string | null;
  nutritional_values?: Record<string, unknown> | null;
  health_benefits?: unknown[] | Record<string, unknown> | null;
  precautions?: Record<string, unknown> | unknown[] | null;
  confidence_score: number;
}

export interface DbSavedItem {
  id: number;
  user_id: number;
  scan_id: number;
  personal_note: string | null;
  created_at: string;
}

export interface SavedItemWithScan extends DbSavedItem {
  item_name: string;
  category: ScanCategory;
  scientific_name: string | null;
  origin: string | null;
  growing_regions: string | null;
  nutritional_values: Record<string, unknown> | null;
  health_benefits: unknown[] | Record<string, unknown> | null;
  precautions: Record<string, unknown> | unknown[] | null;
  confidence_score: number;
  scan_created_at: string;
}

export interface DbFoodCatalogItem {
  id: number;
  name: string;
  category: FoodCategory;
  scientific_name: string;
  origin: string | null;
  season: string | null;
  calories_per_100g: number;
  nutritional_values: Record<string, unknown> | null;
  health_benefits: unknown[] | Record<string, unknown> | null;
  precautions: Record<string, unknown> | unknown[] | null;
  image_url: string | null;
  created_at: string;
}

export interface CreateFoodInput {
  name: string;
  category: FoodCategory | string;
  scientific_name: string;
  origin?: string | null;
  season?: string | null;
  calories_per_100g?: number;
  nutritional_values?: Record<string, unknown> | null;
  health_benefits?: unknown[] | Record<string, unknown> | null;
  precautions?: Record<string, unknown> | unknown[] | null;
  image_url?: string | null;
}

export type UpdateFoodInput = Partial<CreateFoodInput>;

export interface AdminStats {
  totalUsers: number;
  totalScans: number;
  totalCatalogItems: number;
  recentScans: DbScanHistory[];
}

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface DbStatus {
  mode: 'mysql' | 'offline';
  connected: boolean;
  database: string;
}

function parseJsonColumn<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

function normalizeScanRow(row: RowDataPacket): DbScanHistory {
  return {
    id: Number(row.id),
    user_id: row.user_id !== null && row.user_id !== undefined ? Number(row.user_id) : null,
    item_name: String(row.item_name),
    category: (row.category as ScanCategory) || 'Other',
    scientific_name: row.scientific_name ? String(row.scientific_name) : null,
    origin: row.origin ? String(row.origin) : null,
    growing_regions: row.growing_regions ? String(row.growing_regions) : null,
    nutritional_values: parseJsonColumn<Record<string, unknown>>(row.nutritional_values),
    health_benefits: parseJsonColumn<unknown[] | Record<string, unknown>>(row.health_benefits),
    precautions: parseJsonColumn<Record<string, unknown> | unknown[]>(row.precautions),
    confidence_score: Number(row.confidence_score ?? 0),
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ''),
  };
}

function toFoodCatalogCategory(category?: string | null): FoodCategory {
  return category?.trim().toLowerCase() === 'fruit' ? 'Fruit' : 'Vegetable';
}

function normalizeFoodRow(row: RowDataPacket): DbFoodCatalogItem {
  return {
    id: Number(row.id),
    name: String(row.name),
    category: toFoodCatalogCategory(row.category ? String(row.category) : undefined),
    scientific_name: String(row.scientific_name || ''),
    origin: row.origin ? String(row.origin) : null,
    season: row.season ? String(row.season) : null,
    calories_per_100g: Number(row.calories_per_100g ?? 0),
    nutritional_values: parseJsonColumn<Record<string, unknown>>(row.nutritional_values),
    health_benefits: parseJsonColumn<unknown[] | Record<string, unknown>>(row.health_benefits),
    precautions: parseJsonColumn<Record<string, unknown> | unknown[]>(row.precautions),
    image_url: row.image_url ? String(row.image_url) : null,
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ''),
  };
}

export function resolveDbPassword(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  return trimmed === '' || trimmed.toLowerCase() === 'none' ? '' : raw;
}

export function normalizeCategory(raw?: string | null): ScanCategory {
  if (!raw) return 'Other';
  const lower = raw.trim().toLowerCase();
  if (lower === 'fruit' || lower.includes('fruit')) return 'Fruit';
  if (lower === 'vegetable' || lower.includes('vegetable') || lower === 'veggie') return 'Vegetable';
  return 'Other';
}

export function normalizeRole(raw?: string | null): UserRole {
  return raw && raw.trim().toLowerCase() === 'admin' ? 'admin' : 'user';
}

export class DatabaseService {
  private pool: Pool | null = null;
  private mode: DbStatus['mode'] = 'offline';
  private config: DbConfig;

  constructor(config?: Partial<DbConfig>) {
    this.config = {
      host: config?.host ?? process.env.DB_HOST ?? '127.0.0.1',
      port: config?.port ?? (process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306),
      user: config?.user ?? process.env.DB_USER ?? 'root',
      password: resolveDbPassword(config?.password ?? process.env.DB_PASSWORD),
      database: config?.database ?? process.env.DB_NAME ?? 'fruit_veg_health_db',
    };
  }

  async init(): Promise<DbStatus> {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 2500,
        ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
      });
    }

    await this.checkConnection();
    if (this.mode === 'mysql') {
      console.log(`[DB] Connected to MySQL database "${this.config.database}" at ${this.config.host}:${this.config.port}`);
    } else {
      console.error(`[DB] MySQL database "${this.config.database}" is offline.`);
    }
    return this.getStatus();
  }

  async checkConnection(): Promise<boolean> {
    if (!this.pool) {
      this.mode = 'offline';
      return false;
    }
    try {
      await this.pool.query('SELECT 1');
      this.mode = 'mysql';
      return true;
    } catch {
      this.mode = 'offline';
      return false;
    }
  }

  getStatus(): DbStatus {
    return {
      mode: this.mode,
      connected: this.mode === 'mysql',
      database: this.config.database,
    };
  }

  private requirePool(): Pool {
    if (!this.pool || this.mode !== 'mysql') {
      throw new Error('MYSQL_OFFLINE');
    }
    return this.pool;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    this.mode = 'offline';
  }

  async createUser(input: {
    full_name: string;
    email: string;
    password_hash: string;
    role?: UserRole;
  }): Promise<PublicUser> {
    const pool = this.requirePool();
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await this.findUserByEmail(normalizedEmail);
    if (existing) throw new Error('EMAIL_EXISTS');

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [input.full_name.trim(), normalizedEmail, input.password_hash, normalizeRole(input.role)]
    );
    const created = await this.findUserById(result.insertId);
    if (!created) throw new Error('USER_CREATE_FAILED');
    return created;
  }

  async findUserByEmail(email: string): Promise<DbUser | null> {
    const [rows] = await this.requirePool().execute<RowDataPacket[]>(
      'SELECT id, full_name, email, password_hash, role, created_at FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: Number(row.id),
      full_name: String(row.full_name),
      email: String(row.email),
      password_hash: String(row.password_hash),
      role: normalizeRole(row.role ? String(row.role) : undefined),
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    };
  }

  async findUserById(id: number): Promise<PublicUser | null> {
    const [rows] = await this.requirePool().execute<RowDataPacket[]>(
      'SELECT id, full_name, email, role, created_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: Number(row.id),
      full_name: String(row.full_name),
      email: String(row.email),
      role: normalizeRole(row.role ? String(row.role) : undefined),
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    };
  }

  async getFoods(filters?: { q?: string; category?: string; season?: string }): Promise<DbFoodCatalogItem[]> {
    const pool = this.requirePool();
    const clauses: string[] = [];
    const params: string[] = [];
    const category = filters?.category?.trim().toLowerCase();
    const season = filters?.season?.trim().toLowerCase();

    if (category && category !== 'all' && category !== 'herb') {
      clauses.push('category = ?');
      params.push(toFoodCatalogCategory(category));
    }
    if (season && season !== 'all') {
      clauses.push('(LOWER(season) LIKE ? OR LOWER(season) LIKE ?)');
      params.push(`%${season}%`, '%year-round%');
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM food_catalog ${where} ORDER BY id DESC`,
      params
    );
    let foods = rows.map(normalizeFoodRow);

    if (category === 'herb') {
      foods = foods.filter((food) => {
        const meta = (food.nutritional_values as any)?._meta;
        return String(meta?.uiCategory || '').toLowerCase() === 'herb';
      });
    }

    const query = filters?.q?.trim().toLowerCase();
    if (query) {
      foods = foods.filter((food) => {
        const meta = (food.nutritional_values as any)?._meta;
        return (
          food.name.toLowerCase().includes(query) ||
          food.scientific_name.toLowerCase().includes(query) ||
          (food.origin || '').toLowerCase().includes(query) ||
          String(meta?.urduName || '').toLowerCase().includes(query) ||
          String(meta?.family || '').toLowerCase().includes(query)
        );
      });
    }
    return foods;
  }

  async getFoodById(id: number): Promise<DbFoodCatalogItem | null> {
    const [rows] = await this.requirePool().execute<RowDataPacket[]>(
      'SELECT * FROM food_catalog WHERE id = ? LIMIT 1',
      [id]
    );
    return rows.length ? normalizeFoodRow(rows[0]) : null;
  }

  async createFood(input: CreateFoodInput): Promise<DbFoodCatalogItem> {
    const pool = this.requirePool();
    const calories = Math.max(0, Math.round(Number(input.calories_per_100g ?? 0)));
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO food_catalog
        (name, category, scientific_name, origin, season, calories_per_100g, nutritional_values, health_benefits, precautions, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.name.trim(),
        toFoodCatalogCategory(input.category),
        input.scientific_name.trim(),
        input.origin ?? null,
        input.season ?? null,
        calories,
        input.nutritional_values ? JSON.stringify(input.nutritional_values) : null,
        input.health_benefits ? JSON.stringify(input.health_benefits) : null,
        input.precautions ? JSON.stringify(input.precautions) : null,
        input.image_url ?? null,
      ]
    );
    const created = await this.getFoodById(result.insertId);
    if (!created) throw new Error('FOOD_CREATE_FAILED');
    return created;
  }

  async updateFood(id: number, input: UpdateFoodInput): Promise<DbFoodCatalogItem | null> {
    const pool = this.requirePool();
    const existing = await this.getFoodById(id);
    if (!existing) return null;

    await pool.execute(
      `UPDATE food_catalog
       SET name = ?, category = ?, scientific_name = ?, origin = ?, season = ?, calories_per_100g = ?,
           nutritional_values = ?, health_benefits = ?, precautions = ?, image_url = ?
       WHERE id = ?`,
      [
        input.name !== undefined ? input.name.trim() : existing.name,
        input.category !== undefined ? toFoodCatalogCategory(input.category) : existing.category,
        input.scientific_name !== undefined ? input.scientific_name.trim() : existing.scientific_name,
        input.origin !== undefined ? input.origin : existing.origin,
        input.season !== undefined ? input.season : existing.season,
        input.calories_per_100g !== undefined
          ? Math.max(0, Math.round(Number(input.calories_per_100g)))
          : existing.calories_per_100g,
        input.nutritional_values !== undefined
          ? input.nutritional_values ? JSON.stringify(input.nutritional_values) : null
          : existing.nutritional_values ? JSON.stringify(existing.nutritional_values) : null,
        input.health_benefits !== undefined
          ? input.health_benefits ? JSON.stringify(input.health_benefits) : null
          : existing.health_benefits ? JSON.stringify(existing.health_benefits) : null,
        input.precautions !== undefined
          ? input.precautions ? JSON.stringify(input.precautions) : null
          : existing.precautions ? JSON.stringify(existing.precautions) : null,
        input.image_url !== undefined ? input.image_url : existing.image_url,
        id,
      ]
    );
    return this.getFoodById(id);
  }

  async deleteFood(id: number): Promise<boolean> {
    const [result] = await this.requirePool().execute<ResultSetHeader>(
      'DELETE FROM food_catalog WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  async createScanHistory(input: CreateScanInput): Promise<DbScanHistory> {
    const pool = this.requirePool();
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO scan_history
        (user_id, item_name, category, scientific_name, origin, growing_regions, nutritional_values, health_benefits, precautions, confidence_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.user_id ?? null,
        input.item_name.trim(),
        normalizeCategory(input.category),
        input.scientific_name ?? null,
        input.origin ?? null,
        input.growing_regions ?? null,
        input.nutritional_values ? JSON.stringify(input.nutritional_values) : null,
        input.health_benefits ? JSON.stringify(input.health_benefits) : null,
        input.precautions ? JSON.stringify(input.precautions) : null,
        Math.max(0, Math.min(100, Number(input.confidence_score) || 0)),
      ]
    );
    const created = await this.getScanById(result.insertId);
    if (!created) throw new Error('SCAN_CREATE_FAILED');
    return created;
  }

  async getScanById(id: number): Promise<DbScanHistory | null> {
    const [rows] = await this.requirePool().execute<RowDataPacket[]>(
      'SELECT * FROM scan_history WHERE id = ? LIMIT 1',
      [id]
    );
    return rows.length ? normalizeScanRow(rows[0]) : null;
  }

  async getScanHistory(filters?: {
    user_id?: number;
    category?: string;
    limit?: number;
  }): Promise<DbScanHistory[]> {
    const pool = this.requirePool();
    const limit = filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 200) : 50;
    const clauses: string[] = [];
    const params: (string | number)[] = [];
    if (filters?.user_id !== undefined && !Number.isNaN(filters.user_id)) {
      clauses.push('user_id = ?');
      params.push(filters.user_id);
    }
    if (filters?.category?.trim()) {
      clauses.push('category = ?');
      params.push(normalizeCategory(filters.category));
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM scan_history ${where} ORDER BY created_at DESC, id DESC LIMIT ${limit}`,
      params
    );
    return rows.map(normalizeScanRow);
  }

  async deleteScanHistory(id: number): Promise<boolean> {
    const [result] = await this.requirePool().execute<ResultSetHeader>(
      'DELETE FROM scan_history WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  async createSavedItem(input: {
    user_id: number;
    scan_id: number;
    personal_note?: string | null;
  }): Promise<SavedItemWithScan> {
    const pool = this.requirePool();
    if (!(await this.getScanById(input.scan_id))) throw new Error('SCAN_NOT_FOUND');
    if (!(await this.findUserById(input.user_id))) throw new Error('USER_NOT_FOUND');

    const [existingRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM saved_items WHERE user_id = ? AND scan_id = ? LIMIT 1',
      [input.user_id, input.scan_id]
    );
    let savedId: number;
    if (existingRows.length) {
      savedId = Number(existingRows[0].id);
      await pool.execute('UPDATE saved_items SET personal_note = ? WHERE id = ?', [
        input.personal_note ?? null,
        savedId,
      ]);
    } else {
      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO saved_items (user_id, scan_id, personal_note) VALUES (?, ?, ?)',
        [input.user_id, input.scan_id, input.personal_note ?? null]
      );
      savedId = result.insertId;
    }
    const saved = (await this.getSavedItems(input.user_id)).find((item) => item.id === savedId);
    if (!saved) throw new Error('SAVED_ITEM_CREATE_FAILED');
    return saved;
  }

  async getSavedItems(user_id?: number): Promise<SavedItemWithScan[]> {
    const pool = this.requirePool();
    const clauses: string[] = [];
    const params: number[] = [];
    if (user_id !== undefined && !Number.isNaN(user_id)) {
      clauses.push('si.user_id = ?');
      params.push(user_id);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT si.id, si.user_id, si.scan_id, si.personal_note, si.created_at,
              sh.item_name, sh.category, sh.scientific_name, sh.origin, sh.growing_regions,
              sh.nutritional_values, sh.health_benefits, sh.precautions, sh.confidence_score,
              sh.created_at AS scan_created_at
       FROM saved_items si
       INNER JOIN scan_history sh ON si.scan_id = sh.id
       ${where}
       ORDER BY si.created_at DESC, si.id DESC`,
      params
    );
    return rows.map((row) => ({
      id: Number(row.id),
      user_id: Number(row.user_id),
      scan_id: Number(row.scan_id),
      personal_note: row.personal_note ? String(row.personal_note) : null,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      item_name: String(row.item_name),
      category: (row.category as ScanCategory) || 'Other',
      scientific_name: row.scientific_name ? String(row.scientific_name) : null,
      origin: row.origin ? String(row.origin) : null,
      growing_regions: row.growing_regions ? String(row.growing_regions) : null,
      nutritional_values: parseJsonColumn<Record<string, unknown>>(row.nutritional_values),
      health_benefits: parseJsonColumn<unknown[] | Record<string, unknown>>(row.health_benefits),
      precautions: parseJsonColumn<Record<string, unknown> | unknown[]>(row.precautions),
      confidence_score: Number(row.confidence_score ?? 0),
      scan_created_at:
        row.scan_created_at instanceof Date ? row.scan_created_at.toISOString() : String(row.scan_created_at),
    }));
  }

  async updateSavedItemNote(
    id: number,
    personal_note: string | null,
    user_id?: number
  ): Promise<SavedItemWithScan | null> {
    const pool = this.requirePool();
    const sql =
      user_id !== undefined
        ? 'UPDATE saved_items SET personal_note = ? WHERE id = ? AND user_id = ?'
        : 'UPDATE saved_items SET personal_note = ? WHERE id = ?';
    const params = user_id !== undefined ? [personal_note, id, user_id] : [personal_note, id];
    const [result] = await pool.execute<ResultSetHeader>(sql, params);
    if (result.affectedRows === 0) return null;
    return (await this.getSavedItems(user_id)).find((item) => item.id === id) ?? null;
  }

  async deleteSavedItem(id: number, user_id?: number): Promise<boolean> {
    const sql =
      user_id !== undefined
        ? 'DELETE FROM saved_items WHERE id = ? AND user_id = ?'
        : 'DELETE FROM saved_items WHERE id = ?';
    const params = user_id !== undefined ? [id, user_id] : [id];
    const [result] = await this.requirePool().execute<ResultSetHeader>(sql, params);
    return result.affectedRows > 0;
  }

  async getAdminStats(): Promise<AdminStats> {
    const pool = this.requirePool();
    const [[userRow]] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM users');
    const [[scanRow]] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM scan_history');
    const [[foodRow]] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM food_catalog');
    return {
      totalUsers: Number(userRow?.cnt ?? 0),
      totalScans: Number(scanRow?.cnt ?? 0),
      totalCatalogItems: Number(foodRow?.cnt ?? 0),
      recentScans: await this.getScanHistory({ limit: 20 }),
    };
  }
}

export const db = new DatabaseService();
