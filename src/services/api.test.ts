import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapFoodCatalogRowToProduceItem,
  mapScanRowToHistoryEntry,
  mapSavedRowToBookmark,
  produceItemToFoodPayload,
} from './api.ts';

test('mapFoodCatalogRowToProduceItem preserves rich metadata and normalizes calories & season', () => {
  const item = mapFoodCatalogRowToProduceItem({
    id: 42,
    name: 'Mango',
    category: 'Fruit',
    scientific_name: 'Mangifera indica',
    origin: 'South Asia',
    season: 'Summer',
    calories_per_100g: 60,
    nutritional_values: {
      calories: 60,
      fiberG: 1.6,
      vitaminC_mg: 36.4,
      potassium_mg: 168,
      _meta: {
        slug: 'mango',
        urduName: 'آم (Aam)',
        uiCategory: 'fruit',
        family: 'Anacardiaceae',
      },
    },
    health_benefits: [{ title: 'Eye health', description: 'Rich in beta-carotene', targetedSystem: 'Skin & Vision' }],
    precautions: { diabetes: { glycemicIndex: 51, category: 'Low', suitability: 'Moderate', advice: 'Limit portions' } },
    image_url: 'https://example.com/mango.jpg',
  });

  assert.equal(item.id, 'mango');
  assert.equal(item.dbId, 42);
  assert.equal(item.category, 'fruit');
  assert.equal(item.urduName, 'آم (Aam)');
  assert.equal(item.nutritionPer100g.calories, 60);
  assert.deepEqual(item.growingSeason, ['Summer']);
  assert.equal(item.precautions.diabetes.glycemicIndex, 51);
});

test('produceItemToFoodPayload serializes UI ProduceItem into food_catalog payload', () => {
  const item = mapFoodCatalogRowToProduceItem({
    id: 7,
    name: 'Ginger',
    category: 'Vegetable',
    scientific_name: 'Zingiber officinale',
    season: 'Year-round, Autumn',
    calories_per_100g: 80,
    nutritional_values: { _meta: { uiCategory: 'herb', urduName: 'ادرک' } },
  });

  const payload = produceItemToFoodPayload(item);
  assert.equal(payload.category, 'Vegetable');
  assert.equal(payload.calories_per_100g, 80);
  assert.equal(payload.season, 'Year-round, Autumn');
  assert.equal(payload.nutritional_values._meta.uiCategory, 'herb');
});

test('mapScanRowToHistoryEntry and mapSavedRowToBookmark normalize Gemini snake_case payloads', () => {
  const scanRow = {
    id: 19,
    user_id: 2,
    item_name: 'Spinach',
    category: 'Vegetable',
    scientific_name: 'Spinacia oleracea',
    origin: 'Persia',
    growing_regions: 'China, Pakistan, India',
    nutritional_values: {
      calories_kcal: 23,
      carbs_g: 3.6,
      fiber_g: 2.2,
      potassium_mg: 558,
      glycemic_index: 15,
    },
    health_benefits: [{ title: 'Nitrates', description: 'Supports blood pressure', targeted_system: 'Cardiovascular' }],
    precautions: {
      diabetes_advice: 'Very safe',
      kidney_disease_advice: 'High potassium & oxalate',
    },
    confidence_score: 95.5,
    created_at: '2026-11-20T09:00:00.000Z',
  };

  const hist = mapScanRowToHistoryEntry(scanRow);
  assert.equal(hist.dbId, 19);
  assert.equal(hist.produceName, 'Spinach');
  assert.equal(hist.confidence, 95.5);
  assert.equal(hist.itemData.nutritionPer100g.calories, 23);
  assert.equal(hist.itemData.nutritionPer100g.potassium_mg, 558);
  assert.equal(hist.itemData.precautions.kidneyDisease.potassiumTier, 'High Potassium');

  const bookmark = mapSavedRowToBookmark({
    ...scanRow,
    id: 8,
    scan_id: 19,
    personal_note: 'Boil before cooking',
  });
  assert.equal(bookmark.id, 8);
  assert.equal(bookmark.scanId, 19);
  assert.equal(bookmark.personalNote, 'Boil before cooking');
});
