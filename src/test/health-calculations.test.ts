import { describe, it, expect } from 'vitest';
import { calculateAge, calculateBMI } from '../lib/utils/health-calculations';

describe('Health Calculations', () => {
    describe('calculateAge', () => {
        it('should return 0 if no birthday is provided', () => {
            expect(calculateAge(null)).toBe(0);
            expect(calculateAge(undefined)).toBe(0);
        });

        it('should calculate age accurately for past birthdays', () => {
            const today = new Date();
            const pastDate = new Date(today);
            pastDate.setFullYear(today.getFullYear() - 25);
            // Ensure verify logic isn't off by a day due to timezones in test runner
            expect(calculateAge(pastDate)).toBe(25);
        });
    });

    describe('calculateBMI', () => {
        it('should calculate BMI correctly (Normal)', () => {
            // 70kg, 170cm => 24.22
            const result = calculateBMI(70, 170);
            expect(result.value).toBe(24.2);
            expect(result.level).toBe('optimal');
        });

        it('should identify Obesity (High Risk)', () => {
            // 100kg, 170cm => 34.6
            const result = calculateBMI(100, 170);
            expect(result.value).toBe(34.6);
            expect(result.level).toBe('risk');
            expect(result.label).toBe('Obesidad');
        });

        it('should identify Underweight', () => {
            // 50kg, 175cm => 16.3
            const result = calculateBMI(50, 175);
            expect(result.value).toBe(16.3);
            expect(result.label).toBe('Bajo Peso');
        });
    });
});
