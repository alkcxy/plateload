// Test del solver senza dipendenze: node test.mjs
import { createRequire } from 'module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { solvePlateCombinations, solvePairMode } = require('./solver.js');

let passed = 0;
function test(name, fn) {
    fn();
    passed++;
    console.log(`ok - ${name}`);
}

// Inventario dell'utente: 4x5kg, 4x2kg, 8x1kg, 4x0.5kg
const USER_INV = [
    { weight: 5, qty: 4 },
    { weight: 2, qty: 4 },
    { weight: 1, qty: 8 },
    { weight: 0.5, qty: 4 }
];
const TARE = 2;

// pairTotal -> expected per-dumbbell plate weight (target/2 - tare)
function pairCase(total) {
    return solvePairMode(Math.max(0, total / 2 - TARE), USER_INV).solutions[0];
}
function pairTotals(sol) {
    const perUnit = TARE + 2 * sol.sideWeight + sol.extraUnits / 100;
    return { perUnit, total: perUnit * 2 };
}

test('bilanciere: 80 kg con tara 20 -> 30 kg/lato esatti (20+10)', () => {
    const inv = [
        { weight: 20, qty: 2 }, { weight: 10, qty: 2 }, { weight: 5, qty: 4 },
        { weight: 2.5, qty: 4 }, { weight: 1, qty: 4 }, { weight: 0.5, qty: 4 }
    ];
    const r = solvePlateCombinations(30, 2, inv);
    assert.equal(r.exact, true);
    assert.equal(r.solutions[0].sideWeight, 30);
});

test('coppia: 25 kg totali -> esatto, lati 5.5/5.0 con extra 0.5 su un lato', () => {
    const sol = pairCase(25);
    const { total } = pairTotals(sol);
    assert.equal(total, 25);
    assert.equal(sol.sideWeight, 5);
    assert.equal(sol.extraUnits / 100, 0.5);
    assert.deepEqual(sol.plates, { 5: 1 });
});

test('coppia: 21 kg totali -> esatto con extra 0.5 su un lato', () => {
    const sol = pairCase(21);
    const { total } = pairTotals(sol);
    assert.equal(total, 21);
    assert.equal(sol.extraUnits / 100, 0.5);
});

test('coppia: 24 kg totali -> esatto e simmetrico (extra 0)', () => {
    const sol = pairCase(24);
    const { total } = pairTotals(sol);
    assert.equal(total, 24);
    assert.equal(sol.extraUnits, 0);
});

test('coppia: 25.5 kg -> 26 kg simmetrici, scarto +0.5 (minimo disponibile)', () => {
    const r = solvePairMode(25.5 / 2 - TARE, USER_INV);
    const sol = r.solutions[0];
    const { total } = pairTotals(sol);
    assert.equal(r.exact, false);
    assert.equal(total, 26);
    assert.equal(sol.extraUnits, 0);
});

test('coppia: extra non valido se i dischi piccoli sono tutti usati dalla parte simmetrica', () => {
    // 4x0.5kg: la parte simmetrica li consuma tutti (1 per lato x 2 manubri = 4), extra vietato
    const inv = [
        { weight: 5, qty: 4 },
        { weight: 0.5, qty: 4 }
    ];
    // target: 2*(5+0.5)+0.5 = 11.5 per manubrio -> 25 kg totali, ma l'extra 0.5 non e' disponibile
    const sol = solvePairMode(11.5, inv).solutions[0];
    assert.equal(sol.extraUnits, 0);
});

test('perno: divisor 1, ogni disco usable singolarmente', () => {
    const inv = [{ weight: 10, qty: 1 }, { weight: 2.5, qty: 3 }];
    const r = solvePlateCombinations(15, 1, inv);
    assert.equal(r.exact, true);
    assert.equal(r.solutions[0].sideWeight, 15);
});

test('inventario insufficiente: meilleure approssimazione per difetto', () => {
    const inv = [{ weight: 10, qty: 2 }];
    const r = solvePlateCombinations(25, 2, inv); // max 10 per lato
    assert.equal(r.exact, false);
    assert.equal(r.solutions[0].sideWeight, 10);
});

console.log(`\n${passed} test passati`);
