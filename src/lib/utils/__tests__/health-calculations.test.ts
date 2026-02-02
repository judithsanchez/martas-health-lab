import { describe, it, expect } from 'vitest';
import { calculateFFMI } from '../health-calculations';

describe('calculateFFMI', () => {
    it('correctly calculates and categorizes FFMI for males', () => {
        // Example: weight: 80, fat: 15%, height: 180cm
        // FFM = 80 * (1 - 0.15) = 68
        // ffmi = 68 / (1.8 * 1.8) = 20.98...
        // normalized = 20.98 + 6.1 * (1.8 - 1.8) = 20.98 -> 21.0
        const result = calculateFFMI(80, 15, 180, 'male');
        expect(result.value).toBe(21.0);
        expect(result.label).toBe('Excelente');
    });

    it('correctly calculates and categorizes low FFMI for females', () => {
        // Example: weight: 50, fat: 25%, height: 160cm
        // FFM = 50 * 0.75 = 37.5
        // ffmi = 37.5 / (1.6 * 1.6) = 14.64...
        // normalized = 14.64 + 6.1 * (1.8 - 1.6) = 14.64 + 1.22 = 15.86 -> 15.9
        const result = calculateFFMI(50, 25, 160, 'female');
        expect(result.value).toBe(15.9);
        expect(result.label).toBe('Promedio');
    });

    it('categorizes "Bajo" correctly for males', () => {
        const result = calculateFFMI(65, 18, 180, 'male'); // 16.5 approx
        expect(result.label).toBe('Bajo (Riesgo)');
    });

    it('categorizes "Superior" correctly for females', () => {
        const result = calculateFFMI(75, 18, 170, 'female'); // 22.0 approx after normalization
        // FFM = 75 * 0.82 = 61.5
        // ffmi = 61.5 / (1.7^2) = 21.28
        // normalized = 21.28 + 6.1 * 0.1 = 21.89 -> 21.9?
        // Wait, for 22.0 it should be Superior.
        // Let's use 76kg.
        const result2 = calculateFFMI(76, 18, 170, 'female');
        expect(result2.value).toBeGreaterThanOrEqual(22.0);
        expect(result2.label).toBe('Superior (Raro)');
    });
});
