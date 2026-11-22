// Pure plate-solving logic, shared between index.html (browser global) and test.mjs (Node).

// =========================================================================
// ALGORITMO DI OTTIMIZZAZIONE COMBINATORIA (BOUNDED SUBSET SUM / DP)
// =========================================================================
function solvePlateCombinations(neededWeightPerSide, inventoryDivisor, inventory) {
    const SCALE = 100;
    const targetUnits = Math.max(0, Math.round(neededWeightPerSide * SCALE));

    // Plates available per solved unit:
    // - Barbell / single dumbbell: divisor = 2 (a pair adds one plate per side)
    // - Single pin: divisor = 1 (each plate is used directly)
    // - Dumbbell pair is handled separately by solvePairMode (symmetric sides + optional extra plate)
    const availablePerSide = inventory
        .map(item => ({
            weight: item.weight,
            units: Math.round(item.weight * SCALE),
            maxCount: Math.floor(item.qty / inventoryDivisor)
        }))
        .filter(item => item.maxCount > 0 && item.units > 0)
        .sort((a, b) => b.units - a.units);

    const maxReachableUnits = availablePerSide.reduce((acc, p) => acc + p.units * p.maxCount, 0);
    const largestPlateUnits = availablePerSide.length > 0 ? availablePerSide[0].units : 0;
    const searchLimit = Math.min(maxReachableUnits, targetUnits + largestPlateUnits);

    let dp = new Map();
    dp.set(0, { count: 0, plates: {} });

    for (const plate of availablePerSide) {
        const nextDp = new Map(dp);
        for (const [currentSum, combo] of dp.entries()) {
            for (let k = 1; k <= plate.maxCount; k++) {
                const newSum = currentSum + plate.units * k;
                if (newSum > searchLimit) break;

                const newCount = combo.count + k;
                const existing = nextDp.get(newSum);

                if (!existing || newCount < existing.count) {
                    const newPlates = { ...combo.plates };
                    newPlates[plate.weight] = (newPlates[plate.weight] || 0) + k;
                    nextDp.set(newSum, { count: newCount, plates: newPlates });
                }
            }
        }
        dp = nextDp;
    }

    // 1. Peso esatto trovato
    if (dp.has(targetUnits)) {
        return {
            exact: true,
            solutions: [{
                sideWeight: targetUnits / SCALE,
                plates: dp.get(targetUnits).plates,
                plateCount: dp.get(targetUnits).count,
                diffUnits: 0
            }]
        };
    }

    // 2. Migliore approssimazione per difetto e per eccesso
    let bestUnder = null;
    let bestOver = null;

    for (const [sumUnits, combo] of dp.entries()) {
        const diff = sumUnits - targetUnits;
        if (diff < 0) {
            if (!bestUnder || diff > bestUnder.diffUnits) {
                bestUnder = {
                    sideWeight: sumUnits / SCALE,
                    plates: combo.plates,
                    plateCount: combo.count,
                    diffUnits: diff
                };
            }
        } else if (diff > 0) {
            if (!bestOver || diff < bestOver.diffUnits) {
                bestOver = {
                    sideWeight: sumUnits / SCALE,
                    plates: combo.plates,
                    plateCount: combo.count,
                    diffUnits: diff
                };
            }
        }
    }

    const solutions = [];
    if (bestUnder && bestOver) {
        if (Math.abs(bestUnder.diffUnits) <= Math.abs(bestOver.diffUnits)) {
            solutions.push(bestUnder, bestOver);
        } else {
            solutions.push(bestOver, bestUnder);
        }
    } else if (bestUnder) {
        solutions.push(bestUnder);
    } else if (bestOver) {
        solutions.push(bestOver);
    }

    return {
        exact: false,
        solutions
    };
}

// Pair mode: both dumbbells identical and each dumbbell's two sides carry the same plates.
// Only if the exact weight is missing, one extra plate (smallest possible) goes on a single side.
function solvePairMode(platesPerDumbbell, inventory) {
    const SCALE = 100;
    const targetUnits = Math.max(0, Math.round(platesPerDumbbell * SCALE));

    // Symmetric part: per-side weight with sets of 4 identical plates across the pair
    const sym = solvePlateCombinations(platesPerDumbbell / 2, 4, inventory);

    const candidates = sym.solutions.map(sol => {
        const sideUnits = Math.round(sol.sideWeight * SCALE);
        const residual = targetUnits - 2 * sideUnits; // >0: peso mancante, <0: sforo simmetrico
        // One extra plate per dumbbell needs 2 identical plates of that weight left after
        // the symmetric combo (which consumes 4 per plate per side across the pair)
        const invItem = inventory.find(i => Math.round(i.weight * SCALE) === residual);
        const leftover = invItem ? invItem.qty - 4 * (sol.plates[invItem.weight] || 0) : 0;
        const valid = residual === 0 || (residual > 0 && leftover >= 2);
        // The extra plate is placed only when actually available; otherwise the sides stay symmetric
        const extraUnits = valid ? residual : 0;
        return { ...sol, extraUnits, diffUnits: 2 * sideUnits + extraUnits - targetUnits };
    });

    const valid = candidates.filter(c => c.extraUnits > 0 || c.diffUnits === 0);
    const pool = valid.length ? valid : candidates;
    // Prefer no asymmetry, then the smallest extra plate, then the smallest total diff
    pool.sort((a, b) => (a.extraUnits - b.extraUnits) || (Math.abs(a.diffUnits) - Math.abs(b.diffUnits)));

    return {
        exact: pool.length > 0 && pool[0].diffUnits === 0,
        solutions: pool
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { solvePlateCombinations, solvePairMode };
}
