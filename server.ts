import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import { db, normalizeCategory } from './src/server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nutriflora-dev-jwt-secret-change-in-prod';
const MYSQL_OFFLINE_ERROR = 'MySQL database is offline. Please start MySQL in XAMPP.';

// Middleware for parsing large base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api', async (_req: Request, res: Response, next: NextFunction) => {
  if (!(await db.checkConnection())) {
    return res.status(503).json({ success: false, error: MYSQL_OFFLINE_ERROR });
  }
  next();
});

// Multer memory storage for multipart/form-data image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max upload
});

function optionalMultipartUpload(req: Request, res: Response, next: NextFunction) {
  if (req.is('multipart/form-data')) {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message || 'Image upload error' });
      }
      next();
    });
  } else {
    next();
  }
}

interface JwtPayload {
  userId: number;
  email: string;
  role: 'user' | 'admin';
}

interface AuthenticatedRequest extends Request {
  authUser?: JwtPayload;
}

function getAuthFromRequest(req: Request): JwtPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Partial<JwtPayload>;
    if (typeof decoded.userId !== 'number' || !decoded.email) return null;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role === 'admin' ? 'admin' : 'user',
    };
  } catch {
    return null;
  }
}

function getUserIdFromAuthHeader(req: Request): number | null {
  return getAuthFromRequest(req)?.userId ?? null;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = getAuthFromRequest(req);
  if (!auth) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in first.',
    });
  }
  req.authUser = auth;
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = getAuthFromRequest(req);
  if (!auth) {
    return res.status(401).json({
      success: false,
      error: 'Admin authentication required. Please sign in as an administrator.',
    });
  }
  if (auth.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: administrator privileges required.',
    });
  }
  req.authUser = auth;
  next();
}

// Initialize GoogleGenAI SDK with server-side API key
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI:', err);
  }
}

// =============================================================================
// Health & System Status Endpoint
// =============================================================================

/**
 * GET /api/health - Return server and MySQL status
 */
app.get('/api/health', (_req: Request, res: Response) => {
  const dbStatus = db.getStatus();
  res.json({
    success: true,
    status: 'ok',
    dbMode: dbStatus.mode,
    database: dbStatus.database,
    connected: dbStatus.connected,
    aiConfigured: Boolean(ai && process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// Authentication Endpoints (MySQL + bcryptjs + JWT)
// =============================================================================

/**
 * POST /api/auth/register - Register new user account
 */
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { full_name, name, email, password } = req.body;
    const resolvedName = (full_name || name || '').trim();

    if (!resolvedName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'full_name, email, and password are required.',
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await db.createUser({
      full_name: resolvedName,
      email: String(email),
      password_hash,
      role: 'user',
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role } satisfies JwtPayload,
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (err: any) {
    if (err?.message === 'EMAIL_EXISTS') {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
      });
    }
    console.error('Register error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to register user account.',
    });
  }
});

/**
 * POST /api/auth/login - Authenticate user and return JWT token
 */
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'email and password are required.',
      });
    }

    const user = await db.findUserByEmail(String(email));
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(String(password), user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role } satisfies JwtPayload,
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash: _ignored, ...publicUser } = user;

    return res.json({
      success: true,
      token,
      user: publicUser,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to sign in.',
    });
  }
});

// =============================================================================
// AI Identification & Persistence Endpoint (POST /api/identify)
// =============================================================================

/**
 * POST /api/identify - Identify fruit/vegetable via Gemini 2.5 Flash and persist to scan_history
 * Accepts JSON (imageBase64 or image) or multipart/form-data (file field: "image")
 */
app.post('/api/identify', optionalMultipartUpload, async (req: Request, res: Response) => {
  try {
    const language: 'en' | 'ur' = req.body?.language === 'ur' ? 'ur' : 'en';
    const userHint: string | undefined = req.body?.userHint;
    const tokenUserId = getUserIdFromAuthHeader(req);
    const bodyUserId = req.body?.user_id ? parseInt(String(req.body.user_id), 10) : null;
    const resolvedUserId = tokenUserId ?? (bodyUserId && !Number.isNaN(bodyUserId) ? bodyUserId : null);

    let rawBase64 = '';
    let mimeType = req.body?.mimeType || 'image/jpeg';

    if (req.file && req.file.buffer) {
      rawBase64 = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype || 'image/jpeg';
    } else {
      const imageInput = req.body?.imageBase64 || req.body?.image || '';
      if (!imageInput) {
        return res.status(400).json({
          success: false,
          error: 'Image upload is required (multipart "image" file or JSON "imageBase64").',
        });
      }
      rawBase64 = String(imageInput);
      const dataUrlMatch = rawBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (dataUrlMatch) {
        mimeType = dataUrlMatch[1];
        rawBase64 = dataUrlMatch[2];
      }
    }

    let structuredPayload: {
      item_name: string;
      category: 'Fruit' | 'Vegetable' | 'Other';
      scientific_name: string;
      origin: string;
      growing_regions: string;
      nutritional_values: Record<string, unknown>;
      health_benefits: unknown[];
      precautions: Record<string, unknown>;
      confidence_score: number;
    } | null = null;
    if (!rawBase64) {
      return res.status(400).json({
        success: false,
        error: 'Image upload is required (multipart "image" file or JSON "imageBase64").',
      });
    }
    if (!ai || !process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, error: 'AI recognition is not configured.' });
    }

    try {
        const languageInstruction =
          language === 'ur'
            ? 'Provide item_name in both English and Urdu, and write explanations inside origin, health_benefits, and precautions clearly including Urdu terminology where helpful.'
            : 'Provide clear, authoritative English agricultural and clinical nutrition terminology.';

        const prompt = `You are a senior agricultural botanist and clinical nutritionist.
Analyze the provided produce image and return structured botanical, origin, nutritional (per 100g USDA FoodData Central standard), and clinical precaution data.
${languageInstruction}
${userHint ? `User hint: "${userHint}"` : ''}

Return ONLY valid JSON matching the schema.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: rawBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                item_name: { type: Type.STRING },
                category: { type: Type.STRING, description: "Must be 'Fruit', 'Vegetable', or 'Other'" },
                scientific_name: { type: Type.STRING },
                origin: { type: Type.STRING },
                growing_regions: { type: Type.STRING },
                nutritional_values: {
                  type: Type.OBJECT,
                  properties: {
                    calories_kcal: { type: Type.NUMBER },
                    carbs_g: { type: Type.NUMBER },
                    sugars_g: { type: Type.NUMBER },
                    fiber_g: { type: Type.NUMBER },
                    protein_g: { type: Type.NUMBER },
                    fat_g: { type: Type.NUMBER },
                    vitamin_c_mg: { type: Type.NUMBER },
                    potassium_mg: { type: Type.NUMBER },
                    glycemic_index: { type: Type.NUMBER },
                  },
                },
                health_benefits: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      targeted_system: { type: Type.STRING },
                    },
                  },
                },
                precautions: {
                  type: Type.OBJECT,
                  properties: {
                    diabetes_advice: { type: Type.STRING },
                    kidney_disease_advice: { type: Type.STRING },
                    allergies_and_interactions: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    medical_disclaimer: { type: Type.STRING },
                  },
                },
                confidence_score: { type: Type.NUMBER },
              },
              required: [
                'item_name',
                'category',
                'scientific_name',
                'origin',
                'growing_regions',
                'nutritional_values',
                'health_benefits',
                'precautions',
                'confidence_score',
              ],
            },
          },
        });

        const jsonText = response.text ? response.text.trim() : '';
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          structuredPayload = {
            item_name: String(parsed.item_name || '').trim(),
            category: normalizeCategory(parsed.category),
            scientific_name: String(parsed.scientific_name || ''),
            origin: String(parsed.origin || ''),
            growing_regions: Array.isArray(parsed.growing_regions)
              ? parsed.growing_regions.join(', ')
              : String(parsed.growing_regions || ''),
            nutritional_values: parsed.nutritional_values || {},
            health_benefits: Array.isArray(parsed.health_benefits) ? parsed.health_benefits : [],
            precautions: parsed.precautions || {},
            confidence_score: Number(parsed.confidence_score ?? 0),
          };
        }
      if (!structuredPayload?.item_name) {
        return res.status(502).json({ success: false, error: 'AI recognition returned no produce record.' });
      }
    } catch (geminiErr) {
      console.error('Gemini identification failed:', geminiErr);
      return res.status(502).json({ success: false, error: 'AI recognition could not process this image.' });
    }

    const savedRecord = await db.createScanHistory({
      user_id: resolvedUserId,
      ...structuredPayload,
    });

    const matchedCatalog = (await db.getFoods({ q: structuredPayload.item_name }))[0];

    return res.status(201).json({
      success: true,
      scan: savedRecord,
      matchedImageUrl: matchedCatalog?.image_url || null,
    });
  } catch (err: any) {
    console.error('Identify endpoint error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to identify and save produce scan.',
    });
  }
});

// =============================================================================
// History & Bookmarks CRUD Endpoints
// =============================================================================

/**
 * GET /api/history - List recent scans, optionally filtered by user_id or category
 */
app.get('/api/history', async (req: Request, res: Response) => {
  try {
    const queryUserId = req.query.user_id ? parseInt(String(req.query.user_id), 10) : undefined;
    const category = req.query.category ? String(req.query.category) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;

    const items = await db.getScanHistory({
      user_id: queryUserId !== undefined && !Number.isNaN(queryUserId) ? queryUserId : undefined,
      category,
      limit: !Number.isNaN(limit) ? limit : 50,
    });

    return res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (err: any) {
    console.error('Get history error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve scan history.',
    });
  }
});

/**
 * DELETE /api/history/:id - Delete a scan record
 */
app.delete('/api/history/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid numeric scan id is required.',
      });
    }

    const deleted = await db.deleteScanHistory(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Scan history record not found.',
      });
    }

    return res.json({
      success: true,
      message: 'Scan record deleted successfully.',
    });
  } catch (err: any) {
    console.error('Delete history error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete scan record.',
    });
  }
});

/**
 * POST /api/saved - Bookmark a scanned fruit/vegetable with a personal health note
 */
app.post('/api/saved', async (req: Request, res: Response) => {
  try {
    const tokenUserId = getUserIdFromAuthHeader(req);
    const bodyUserId = req.body?.user_id ? parseInt(String(req.body.user_id), 10) : null;
    const user_id = tokenUserId ?? bodyUserId;
    const scan_id = req.body?.scan_id ? parseInt(String(req.body.scan_id), 10) : NaN;
    const personal_note =
      req.body?.personal_note !== undefined ? String(req.body.personal_note) : null;

    if (!user_id || Number.isNaN(user_id)) {
      return res.status(400).json({
        success: false,
        error: 'user_id (via JWT Authorization header or body) is required.',
      });
    }

    if (Number.isNaN(scan_id) || scan_id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid numeric scan_id is required.',
      });
    }

    const saved = await db.createSavedItem({
      user_id,
      scan_id,
      personal_note,
    });

    return res.status(201).json({
      success: true,
      saved,
    });
  } catch (err: any) {
    if (err?.message === 'SCAN_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Referenced scan_id not found.' });
    }
    if (err?.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Referenced user_id not found.' });
    }
    console.error('Create saved item error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to save bookmark.',
    });
  }
});

/**
 * GET /api/saved - Retrieve bookmarked scanned items (filtered by user_id if provided)
 */
app.get('/api/saved', async (req: Request, res: Response) => {
  try {
    const tokenUserId = getUserIdFromAuthHeader(req);
    const queryUserId = req.query.user_id ? parseInt(String(req.query.user_id), 10) : undefined;
    const resolvedUserId =
      queryUserId !== undefined && !Number.isNaN(queryUserId)
        ? queryUserId
        : tokenUserId ?? undefined;

    const items = await db.getSavedItems(resolvedUserId);

    return res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (err: any) {
    console.error('Get saved items error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve saved bookmarks.',
    });
  }
});

/**
 * PUT /api/saved/:id - Update personal note on a saved bookmark
 */
app.put('/api/saved/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Valid numeric saved item id is required.' });
    }

    const tokenUserId = getUserIdFromAuthHeader(req);
    const personal_note =
      req.body?.personal_note !== undefined && req.body?.personal_note !== null
        ? String(req.body.personal_note)
        : null;

    const updated = await db.updateSavedItemNote(id, personal_note, tokenUserId ?? undefined);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Saved bookmark not found.' });
    }

    return res.json({ success: true, saved: updated });
  } catch (err: any) {
    console.error('Update saved item error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update saved bookmark.' });
  }
});

/**
 * DELETE /api/saved/:id - Remove a saved bookmark
 */
app.delete('/api/saved/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Valid numeric saved item id is required.' });
    }

    const tokenUserId = getUserIdFromAuthHeader(req);
    const deleted = await db.deleteSavedItem(id, tokenUserId ?? undefined);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Saved bookmark not found.' });
    }

    return res.json({ success: true, message: 'Bookmark removed successfully.' });
  } catch (err: any) {
    console.error('Delete saved item error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete saved bookmark.' });
  }
});

// =============================================================================
// Food Catalog & Admin Endpoints (MySQL)
// =============================================================================

/**
 * GET /api/foods - List food_catalog items with optional search (q/search), category, and season filters
 */
app.get('/api/foods', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q ?? req.query.search) ? String(req.query.q ?? req.query.search) : undefined;
    const category = req.query.category ? String(req.query.category) : undefined;
    const season = req.query.season ? String(req.query.season) : undefined;

    const items = await db.getFoods({ q, category, season });
    return res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (err: any) {
    console.error('Get foods error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to load food catalog.',
    });
  }
});

/**
 * GET /api/foods/:id - Get single food catalog item
 */
app.get('/api/foods/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Valid numeric food id is required.' });
    }
    const item = await db.getFoodById(id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Food catalog item not found.' });
    }
    return res.json({ success: true, item });
  } catch (err: any) {
    console.error('Get food by id error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve food item.' });
  }
});

/**
 * POST /api/foods - Add a food_catalog item (Admin JWT required)
 */
app.post('/api/foods', requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const name = body.name ? String(body.name).trim() : '';
    const category = body.category ? String(body.category) : '';
    const scientific_name = String(body.scientific_name || body.scientificName || '').trim();

    if (!name || !category || !scientific_name) {
      return res.status(400).json({
        success: false,
        error: 'name, category, and scientific_name are required.',
      });
    }

    const nutritionalValues = body.nutritional_values ?? body.nutritionPer100g ?? null;
    const caloriesPer100g =
      body.calories_per_100g !== undefined
        ? Number(body.calories_per_100g)
        : Number((nutritionalValues as any)?.calories ?? 0);

    const created = await db.createFood({
      name,
      category,
      scientific_name,
      origin: body.origin ?? null,
      season: Array.isArray(body.growingSeason)
        ? body.growingSeason.join(', ')
        : body.season ?? null,
      calories_per_100g: caloriesPer100g,
      nutritional_values: nutritionalValues,
      health_benefits: body.health_benefits ?? body.healthBenefits ?? null,
      precautions: body.precautions ?? null,
      image_url: body.image_url ?? body.imageUrl ?? null,
    });

    return res.status(201).json({
      success: true,
      item: created,
    });
  } catch (err: any) {
    if (err?.message === 'FOOD_EXISTS') {
      return res.status(409).json({
        success: false,
        error: 'A food item with this name already exists in the catalog.',
      });
    }
    console.error('Create food error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to create food catalog item.',
    });
  }
});

/**
 * PUT /api/foods/:id - Update a food_catalog item (Admin JWT required)
 */
app.put('/api/foods/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Valid numeric food id is required.' });
    }

    const body = req.body || {};
    const nutritionalValues = body.nutritional_values ?? body.nutritionPer100g;
    const caloriesPer100g =
      body.calories_per_100g !== undefined
        ? Number(body.calories_per_100g)
        : nutritionalValues?.calories !== undefined
        ? Number(nutritionalValues.calories)
        : undefined;

    const updated = await db.updateFood(id, {
      name: body.name,
      category: body.category,
      scientific_name: body.scientific_name ?? body.scientificName,
      origin: body.origin,
      season: Array.isArray(body.growingSeason) ? body.growingSeason.join(', ') : body.season,
      calories_per_100g: caloriesPer100g,
      nutritional_values: nutritionalValues,
      health_benefits: body.health_benefits ?? body.healthBenefits,
      precautions: body.precautions,
      image_url: body.image_url ?? body.imageUrl,
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Food catalog item not found.' });
    }

    return res.json({
      success: true,
      item: updated,
    });
  } catch (err: any) {
    console.error('Update food error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to update food catalog item.',
    });
  }
});

/**
 * DELETE /api/foods/:id - Delete a food_catalog item (Admin JWT required)
 */
app.delete('/api/foods/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Valid numeric food id is required.' });
    }

    const deleted = await db.deleteFood(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Food catalog item not found.' });
    }

    return res.json({
      success: true,
      message: 'Food catalog item deleted successfully.',
    });
  } catch (err: any) {
    console.error('Delete food error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete food catalog item.',
    });
  }
});

/**
 * GET /api/admin/stats - Return total users, total scans, total catalog items, and recent scan_history logs (Admin JWT required)
 */
app.get('/api/admin/stats', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const adminStats = await db.getAdminStats();

    return res.json({
      success: true,
      totalUsers: adminStats.totalUsers,
      totalScans: adminStats.totalScans,
      totalCatalogItems: adminStats.totalCatalogItems,
      recentScans: adminStats.recentScans,
    });
  } catch (err: any) {
    console.error('Get admin stats error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve admin statistics.',
    });
  }
});

// Production / Dev handling with Vite
async function startServer() {
  await db.init();

  if (process.env.NODE_ENV === 'production') {
    // Serve production build files
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Vite dev server middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
