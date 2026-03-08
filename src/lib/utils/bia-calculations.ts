/**
 * Bioelectrical Impedance Analysis (BIA) Calculations
 * 
 * Note: Commercial BIA devices (like Tanita, InBody) use proprietary algorithms 
 * to calculate body composition from raw electrical impedance.
 * 
 * This module implements standardized open scientific equations. 
 * Specifically, it uses the widely accepted Sun et al. (2003) equation for 
 * estimating Fat-Free Mass (FFM) and Total Body Water (TBW), from which 
 * Body Fat Percentage and Muscle Mass are derived.
 * 
 * Variables:
 * - H: Height in cm
 * - W: Weight in kg
 * - Z: Impedance in ohms (at 50kHz)
 * - A: Age in years
 */

export interface BIAInputs {
    impedance: number; // Z (ohms)
    heightCm: number;  // H
    weightKg: number;  // W
    ageYears: number;  // A
    gender: 'male' | 'female';
}

export interface BIAResults {
    fatFreeMassKg: number;
    fatMassKg: number;
    bodyFatPercent: number;
    muscleMassKg: number;
    totalBodyWaterKg: number;
    waterPercent: number;
}

/**
 * Sun et al. (2003) Equation for Fat-Free Mass (FFM)
 * Reference: Sun, S. S., et al. "Development of bioelectrical impedance analysis 
 * prediction equations for body composition with the use of a multicomponent model 
 * for use in epidemiologic surveys." The American journal of clinical nutrition (2003).
 */
export function calculateBIA(inputs: BIAInputs): BIAResults {
    const { impedance, heightCm, weightKg, ageYears, gender } = inputs;

    // Height in meters for certain parts of the equation, or squared cm/ohms
    const statureIndex = Math.pow(heightCm, 2) / impedance; // H^2 / Z

    let ffmKg = 0;
    let tbwKg = 0;

    if (gender === 'male') {
        // Male FFM Equation (Sun 2003)
        ffmKg = -9.73 + (0.69 * statureIndex) + (0.17 * weightKg) + (0.02 * ageYears);
        // Male TBW Equation (Sun 2003)
        tbwKg = 1.20 + (0.45 * statureIndex) + (0.18 * weightKg);
    } else {
        // Female FFM Equation (Sun 2003)
        ffmKg = -9.05 + (0.65 * statureIndex) + (0.16 * weightKg) + (0.02 * ageYears);
        // Female TBW Equation (Sun 2003)
        tbwKg = 3.75 + (0.45 * statureIndex) + (0.11 * weightKg);
    }

    // Safety checks for edge cases (e.g. extremely high impedance yielding negative FFM)
    if (ffmKg <= 0 || ffmKg > weightKg) {
        throw new Error("Invalid BIA inputs resulting in impossible Fat-Free Mass.");
    }

    const fatMassKg = weightKg - ffmKg;
    const bodyFatPercent = (fatMassKg / weightKg) * 100;
    const waterPercent = (tbwKg / weightKg) * 100;

    // Muscle mass is technically a subset of FFM (FFM includes bone and organs).
    // Often in commercial scales, "Muscle Mass" estimates skeletal + smooth muscle.
    // A common rudimentary estimation is that muscle mass is approx ~75-80% of FFM.
    const muscleMassKg = ffmKg * 0.78;

    return {
        fatFreeMassKg: Number(ffmKg.toFixed(2)),
        fatMassKg: Number(fatMassKg.toFixed(2)),
        bodyFatPercent: Number(bodyFatPercent.toFixed(1)),
        muscleMassKg: Number(muscleMassKg.toFixed(2)),
        totalBodyWaterKg: Number(tbwKg.toFixed(2)),
        waterPercent: Number(waterPercent.toFixed(1))
    };
}
