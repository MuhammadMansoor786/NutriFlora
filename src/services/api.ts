import type {
  AdminDashboardStats,
  HealthBenefitItem,
  NutritionPer100g,
  ProduceCategory,
  ProduceItem,
  SavedBookmarkRecord,
  ScanHistoryEntry,
} from '../types/produce.ts';

export const TOKEN_STORAGE_KEY = 'nutriflora_token';

export interface AuthUserResponse {
  id: number;
  full_name: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface HealthResponse {
  success: boolean;
  status: string;
  dbMode: 'mysql' | 'offline';
  database: string;
  connected: boolean;
  aiConfigured: boolean;
  timestamp?: string;
}

export function getStoredToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export async function apiFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    error: `HTTP ${response.status} ${response.statusText}`,
  }));

  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }

  return data as T;
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseSeasons(seasonStr?: string | null, metadataSeasons?: unknown): ProduceItem['growingSeason'] {
  const valid = ['Spring', 'Summer', 'Autumn', 'Winter', 'Year-round'] as const;
  if (Array.isArray(metadataSeasons) && metadataSeasons.length > 0) {
    const filtered = metadataSeasons.filter((s): s is ProduceItem['growingSeason'][number] =>
      valid.includes(s as any)
    );
    if (filtered.length > 0) return filtered;
  }
  if (!seasonStr) return [];
  const parts = seasonStr
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is ProduceItem['growingSeason'][number] => valid.includes(s as any));
  return parts;
}

function normalizeUiCategory(raw?: string | null, metaUiCategory?: string | null): ProduceCategory {
  const candidate = (metaUiCategory || raw || '').trim().toLowerCase();
  if (candidate === 'herb') return 'herb';
  if (candidate === 'fruit') return 'fruit';
  return 'vegetable';
}

function normalizeNutritionObject(
  raw: Record<string, unknown> | null | undefined,
  catalogCalories: number = 0
): NutritionPer100g {
  const n = raw || {};
  const num = (v: unknown, def = 0): number => {
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : def;
  };

  return {
    calories: num(n.calories ?? n.calories_kcal, catalogCalories),
    waterPercent: num(n.waterPercent ?? n.water_percent),
    carbsG: num(n.carbsG ?? n.carbs_g),
    sugarsG: num(n.sugarsG ?? n.sugars_g),
    fiberG: num(n.fiberG ?? n.fiber_g),
    proteinG: num(n.proteinG ?? n.protein_g),
    fatG: num(n.fatG ?? n.fat_g),
    vitaminC_mg: num(n.vitaminC_mg ?? n.vitamin_c_mg),
    vitaminA_mcg: num(n.vitaminA_mcg ?? n.vitamin_a_mcg),
    vitaminK_mcg: num(n.vitaminK_mcg ?? n.vitamin_k_mcg),
    potassium_mg: num(n.potassium_mg),
    calcium_mg: num(n.calcium_mg),
    iron_mg: num(n.iron_mg),
    magnesium_mg: num(n.magnesium_mg),
    folate_mcg: num(n.folate_mcg),
  };
}

function normalizeBenefits(raw: unknown): HealthBenefitItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((b: any) => ({
    title: String(b?.title || ''),
    description: String(b?.description || ''),
    targetedSystem: (b?.targetedSystem || b?.targeted_system || '') as HealthBenefitItem['targetedSystem'],
  }));
}

function normalizePrecautions(
  raw: Record<string, unknown> | unknown[] | null | undefined,
  nutr?: Record<string, unknown> | null
): ProduceItem['precautions'] {
  const p = (!Array.isArray(raw) && raw ? raw : {}) as any;
  const diabetesObj = p.diabetes || {};
  const kidneyObj = p.kidneyDisease || p.kidney_disease || {};
  const hyperObj = p.hypertension || {};
  const gi = Number(diabetesObj.glycemicIndex ?? nutr?.glycemic_index ?? 0);
  const potassiumVal = Number(nutr?.potassium_mg ?? 0);

  const giCategory: 'Low' | 'Medium' | 'High' | '' =
    diabetesObj.category || (gi ? (gi <= 55 ? 'Low' : gi <= 69 ? 'Medium' : 'High') : '');
  const potassiumTier: 'Low Potassium' | 'Moderate Potassium' | 'High Potassium' | '' =
    kidneyObj.potassiumTier ||
    (potassiumVal > 0
      ? potassiumVal < 200
        ? 'Low Potassium'
        : potassiumVal <= 350
        ? 'Moderate Potassium'
        : 'High Potassium'
      : '');

  return {
    diabetes: {
      glycemicIndex: Number.isFinite(gi) ? gi : 0,
      category: giCategory,
      suitability: diabetesObj.suitability || (gi ? (gi <= 55 ? 'Safe' : 'Moderate') : ''),
      advice: diabetesObj.advice || p.diabetes_advice || '',
    },
    kidneyDisease: {
      potassiumTier,
      oxalateLevel: kidneyObj.oxalateLevel || '',
      advice: kidneyObj.advice || p.kidney_disease_advice || '',
    },
    hypertension: {
      advice: hyperObj.advice || '',
    },
    allergiesAndInteractions: Array.isArray(p.allergiesAndInteractions)
      ? p.allergiesAndInteractions.map(String)
      : Array.isArray(p.allergies_and_interactions)
      ? p.allergies_and_interactions.map(String)
      : [],
    contraindications: Array.isArray(p.contraindications)
      ? p.contraindications.map(String)
      : [],
  };
}

export function mapFoodCatalogRowToProduceItem(row: any): ProduceItem {
  const nutrRaw = (row.nutritional_values || {}) as Record<string, unknown>;
  const meta = (nutrRaw._meta || {}) as Record<string, any>;
  const name = String(row.name || '');
  const slug = meta.slug ? String(meta.slug) : slugifyName(name) || `food-${row.id}`;
  const category = normalizeUiCategory(row.category, meta.uiCategory);

  return {
    id: slug,
    dbId: Number(row.id),
    name,
    scientificName: String(row.scientific_name || ''),
    urduName: String(meta.urduName || ''),
    localNames: meta.localNames || undefined,
    category,
    subCategory: String(meta.subCategory || ''),
    family: String(meta.family || ''),
    imageUrl: String(row.image_url || ''),
    origin: String(row.origin || ''),
    cultivationRegions: Array.isArray(meta.cultivationRegions)
      ? meta.cultivationRegions
      : row.origin
      ? [String(row.origin)]
      : [],
    growingSeason: parseSeasons(row.season, meta.growingSeason),
    climate: String(meta.climate || ''),
    varieties: Array.isArray(meta.varieties) ? meta.varieties : [],
    description: String(meta.description || ''),
    nutritionPer100g: normalizeNutritionObject(nutrRaw, Number(row.calories_per_100g ?? 0)),
    healthBenefits: normalizeBenefits(row.health_benefits),
    precautions: normalizePrecautions(row.precautions, nutrRaw),
    recommendedServing: String(meta.recommendedServing || ''),
    culinaryUses: Array.isArray(meta.culinaryUses) ? meta.culinaryUses : [],
    storageTips: String(meta.storageTips || ''),
    sources: Array.isArray(meta.sources) ? meta.sources : [],
  };
}

export function produceItemToFoodPayload(item: ProduceItem) {
  return {
    name: item.name,
    category: item.category === 'fruit' ? 'Fruit' : 'Vegetable',
    scientific_name: item.scientificName,
    origin: item.origin,
    season: item.growingSeason.join(', '),
    calories_per_100g: Math.round(item.nutritionPer100g.calories),
    nutritional_values: {
      ...item.nutritionPer100g,
      _meta: {
        slug: item.id,
        urduName: item.urduName,
        localNames: item.localNames ?? {},
        uiCategory: item.category,
        subCategory: item.subCategory,
        family: item.family,
        cultivationRegions: item.cultivationRegions,
        growingSeason: item.growingSeason,
        climate: item.climate,
        varieties: item.varieties,
        description: item.description,
        recommendedServing: item.recommendedServing,
        culinaryUses: item.culinaryUses,
        storageTips: item.storageTips,
        sources: item.sources,
      },
    },
    health_benefits: item.healthBenefits,
    precautions: item.precautions,
    image_url: item.imageUrl,
  };
}

export function mapScanRowToProduceItem(scan: any, matchedImageUrl?: string | null): ProduceItem {
  const nutrRaw = (scan.nutritional_values || {}) as Record<string, unknown>;
  const meta = (nutrRaw._meta || {}) as Record<string, any>;
  const itemName = String(scan.item_name || '');
  const category = normalizeUiCategory(scan.category, meta.uiCategory);
  const regions = scan.growing_regions
    ? String(scan.growing_regions)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return {
    id: meta.slug ? String(meta.slug) : slugifyName(itemName) || `scan-${scan.id}`,
    name: itemName,
    scientificName: String(scan.scientific_name || ''),
    urduName: String(meta.urduName || ''),
    category,
    subCategory: String(meta.subCategory || ''),
    family: String(meta.family || ''),
    imageUrl: String(matchedImageUrl || meta.imageUrl || ''),
    origin: String(scan.origin || ''),
    cultivationRegions: regions,
    growingSeason: [],
    climate: String(meta.climate || ''),
    varieties: Array.isArray(meta.varieties) ? meta.varieties : [],
    description: String(meta.description || ''),
    nutritionPer100g: normalizeNutritionObject(nutrRaw, 0),
    healthBenefits: normalizeBenefits(scan.health_benefits),
    precautions: normalizePrecautions(scan.precautions, nutrRaw),
    recommendedServing: String(meta.recommendedServing || ''),
    culinaryUses: Array.isArray(meta.culinaryUses) ? meta.culinaryUses : [],
    storageTips: String(meta.storageTips || ''),
    sources: Array.isArray(meta.sources) ? meta.sources : [],
  };
}

export function mapScanRowToHistoryEntry(scan: any, matchedImageUrl?: string | null): ScanHistoryEntry {
  const itemData = mapScanRowToProduceItem(scan, matchedImageUrl);
  return {
    id: `scan-${scan.id}`,
    dbId: Number(scan.id),
    timestamp: String(scan.created_at || ''),
    produceName: itemData.name,
    scientificName: itemData.scientificName,
    urduName: itemData.urduName,
    category: itemData.category,
    confidence: Number(scan.confidence_score ?? 0),
    imageUrl: itemData.imageUrl,
    itemData,
  };
}

export function mapSavedRowToBookmark(row: any): SavedBookmarkRecord {
  const itemData = mapScanRowToProduceItem(row);
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    scanId: Number(row.scan_id),
    personalNote: row.personal_note ? String(row.personal_note) : '',
    createdAt: String(row.created_at || ''),
    itemName: String(row.item_name || itemData.name),
    scientificName: String(row.scientific_name || itemData.scientificName),
    category: itemData.category,
    confidenceScore: Number(row.confidence_score ?? 0),
    origin: String(row.origin || itemData.origin),
    growingRegions: String(row.growing_regions || ''),
    itemData,
  };
}

// -----------------------------------------------------------------------------
// API Client Methods
// -----------------------------------------------------------------------------

export const api = {
  async getHealth(): Promise<HealthResponse> {
    return apiFetch<HealthResponse>('/api/health');
  },

  async register(fullName: string, email: string, password: string) {
    const data = await apiFetch<{ success: true; token: string; user: AuthUserResponse }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ full_name: fullName, email, password }),
      }
    );
    setStoredToken(data.token);
    return data;
  },

  async login(email: string, password: string) {
    const data = await apiFetch<{ success: true; token: string; user: AuthUserResponse }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    setStoredToken(data.token);
    return data;
  },

  logout() {
    setStoredToken(null);
  },

  async getFoods(filters?: { q?: string; category?: string; season?: string }): Promise<ProduceItem[]> {
    const params = new URLSearchParams();
    if (filters?.q?.trim()) params.set('q', filters.q.trim());
    if (filters?.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters?.season && filters.season !== 'all') params.set('season', filters.season);
    const qs = params.toString();
    const data = await apiFetch<{ success: true; items: any[] }>(`/api/foods${qs ? `?${qs}` : ''}`);
    return (data.items || []).map(mapFoodCatalogRowToProduceItem);
  },

  async createFood(item: ProduceItem): Promise<ProduceItem> {
    const data = await apiFetch<{ success: true; item: any }>('/api/foods', {
      method: 'POST',
      body: JSON.stringify(produceItemToFoodPayload(item)),
    });
    return mapFoodCatalogRowToProduceItem(data.item);
  },

  async updateFood(dbId: number, item: ProduceItem): Promise<ProduceItem> {
    const data = await apiFetch<{ success: true; item: any }>(`/api/foods/${dbId}`, {
      method: 'PUT',
      body: JSON.stringify(produceItemToFoodPayload(item)),
    });
    return mapFoodCatalogRowToProduceItem(data.item);
  },

  async deleteFood(dbId: number): Promise<void> {
    await apiFetch(`/api/foods/${dbId}`, { method: 'DELETE' });
  },

  async identifyProduce(input: {
    imageBase64?: string;
    file?: File;
    mimeType?: string;
    language?: 'en' | 'ur';
    userHint?: string;
  }) {
    let body: FormData | string;
    if (input.file) {
      const form = new FormData();
      form.append('image', input.file);
      form.append('language', input.language || 'en');
      if (input.userHint) form.append('userHint', input.userHint);
      body = form;
    } else {
      body = JSON.stringify({
        imageBase64: input.imageBase64,
        mimeType: input.mimeType || 'image/jpeg',
        language: input.language || 'en',
        userHint: input.userHint,
      });
    }

    const data = await apiFetch<{
      success: true;
      scan: any;
      matchedImageUrl?: string | null;
    }>('/api/identify', {
      method: 'POST',
      body,
    });

    const produceItem = mapScanRowToProduceItem(data.scan, data.matchedImageUrl);
    return {
      scan: data.scan,
      scanId: Number(data.scan.id),
      produceItem,
      confidence: Number(data.scan.confidence_score ?? 0),
      recognizedAt: String(data.scan.created_at || ''),
    };
  },

  async getHistory(filters?: { userId?: number; category?: string; limit?: number }): Promise<ScanHistoryEntry[]> {
    const params = new URLSearchParams();
    if (filters?.userId !== undefined) params.set('user_id', String(filters.userId));
    if (filters?.category) params.set('category', filters.category);
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    const data = await apiFetch<{ success: true; items: any[] }>(`/api/history${qs ? `?${qs}` : ''}`);
    return (data.items || []).map((row) => mapScanRowToHistoryEntry(row));
  },

  async deleteHistory(scanId: number): Promise<void> {
    await apiFetch(`/api/history/${scanId}`, { method: 'DELETE' });
  },

  async getSavedItems(): Promise<SavedBookmarkRecord[]> {
    const data = await apiFetch<{ success: true; items: any[] }>('/api/saved');
    return (data.items || []).map(mapSavedRowToBookmark);
  },

  async saveBookmark(scanId: number, personalNote?: string): Promise<SavedBookmarkRecord> {
    const data = await apiFetch<{ success: true; saved: any }>('/api/saved', {
      method: 'POST',
      body: JSON.stringify({
        scan_id: scanId,
        personal_note: personalNote ?? '',
      }),
    });
    return mapSavedRowToBookmark(data.saved);
  },

  async updateSavedNote(savedId: number, personalNote: string): Promise<SavedBookmarkRecord> {
    const data = await apiFetch<{ success: true; saved: any }>(`/api/saved/${savedId}`, {
      method: 'PUT',
      body: JSON.stringify({ personal_note: personalNote }),
    });
    return mapSavedRowToBookmark(data.saved);
  },

  async deleteSavedItem(savedId: number): Promise<void> {
    await apiFetch(`/api/saved/${savedId}`, { method: 'DELETE' });
  },

  async getAdminStats(): Promise<AdminDashboardStats> {
    return apiFetch<AdminDashboardStats & { success: true }>('/api/admin/stats');
  },

};
