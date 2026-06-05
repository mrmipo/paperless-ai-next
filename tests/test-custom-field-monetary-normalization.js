const assert = require('assert');

const { validateCustomFieldValue } = require('../services/serviceUtils');

function main() {
  const prefixedWithSpace = validateCustomFieldValue('Amount', 'EUR 4550.00', 'monetary');
  assert.strictEqual(prefixedWithSpace.skip, false, 'Expected valid monetary value with currency code');
  assert.strictEqual(prefixedWithSpace.value, 'EUR4550.00');

  const thousandsSeparator = validateCustomFieldValue('Amount', 'EUR 4,550.00', 'monetary');
  assert.strictEqual(thousandsSeparator.skip, false, 'Expected thousand separators to be normalized');
  assert.strictEqual(thousandsSeparator.value, 'EUR4550.00');

  const numericThousands = validateCustomFieldValue('Amount', '4,550.00', 'monetary');
  assert.strictEqual(numericThousands.skip, false, 'Expected plain numeric thousand separators to be normalized');
  assert.strictEqual(numericThousands.value, '4550.00');

  const invalidMonetary = validateCustomFieldValue('Amount', 'EUR', 'monetary');
  assert.strictEqual(invalidMonetary.skip, true, 'Expected non-numeric monetary values to be skipped');
}

try {
  main();
  console.log('[PASS] Monetary custom field normalization works as expected');
} catch (error) {
  console.error('[FAIL] Monetary custom field normalization test failed:', error.message);
  process.exitCode = 1;
}
