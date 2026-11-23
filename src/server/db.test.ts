import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseService, normalizeCategory, resolveDbPassword } from './db.ts';

test('resolveDbPassword defaults omitted or "none" passwords to empty string for XAMPP', () => {
  assert.equal(resolveDbPassword(undefined), '');
  assert.equal(resolveDbPassword(null), '');
  assert.equal(resolveDbPassword(''), '');
  assert.equal(resolveDbPassword('   '), '');
  assert.equal(resolveDbPassword('none'), '');
  assert.equal(resolveDbPassword('NONE'), '');
  assert.equal(resolveDbPassword('  None  '), '');
  assert.equal(resolveDbPassword('secret123'), 'secret123');
});

test('normalizeCategory maps fruit, vegetable, and other values accurately', () => {
  assert.equal(normalizeCategory('fruit'), 'Fruit');
  assert.equal(normalizeCategory('Tropical Fruit'), 'Fruit');
  assert.equal(normalizeCategory('vegetable'), 'Vegetable');
  assert.equal(normalizeCategory('veggie'), 'Vegetable');
  assert.equal(normalizeCategory('herb'), 'Other');
  assert.equal(normalizeCategory(undefined), 'Other');
});

test('DatabaseService reports MySQL offline and refuses non-MySQL data access', async () => {
  const testDb = new DatabaseService({
    host: '127.0.0.1',
    port: 39999,
    user: 'root',
    password: '',
    database: 'fruit_veg_health_db',
  });

  const status = await testDb.init();
  assert.equal(status.mode, 'offline');
  assert.equal(status.connected, false);
  assert.equal(status.database, 'fruit_veg_health_db');
  await assert.rejects(testDb.getFoods(), { message: 'MYSQL_OFFLINE' });
  await testDb.close();
});
