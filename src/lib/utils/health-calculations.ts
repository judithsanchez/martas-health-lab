export type CalculationResult = {
    value: number;
    label: string;
    description: string;
    level?: 'optimal' | 'increased' | 'high' | 'risk';
    color?: string;
};

export function calculateBMI(weight: number, heightCm: number): CalculationResult {
    const heightM = heightCm / 100;
    const bmi = weight / (heightM * heightM);

    let level: CalculationResult['level'] = 'optimal';
    let label = 'Normal';
    let color = 'text-green-500';

    if (bmi >= 27.5) {
        level = 'high';
        label = 'Riesgo Alto (OMS)';
        color = 'text-red-500';
    } else if (bmi >= 23.0) {
        level = 'increased';
        label = 'Riesgo Incrementado';
        color = 'text-orange-500';
    }

    return {
        value: Number(bmi.toFixed(1)),
        label,
        description: "Puntos de acción étnico-específicos (OMS) para riesgo cardiovascular.",
        level,
        color
    };
}

export function calculateASMI(
    heightCm: number,
    armLeft: number,
    armRight: number,
    legLeft: number,
    legRight: number,
    gender: 'male' | 'female' | string
): CalculationResult {
    const heightM = heightCm / 100;
    const limbSum = armLeft + armRight + legLeft + legRight;
    const asmi = limbSum / (heightM * heightM);

    const threshold = gender === 'male' ? 7.0 : 5.5;
    const isRisk = asmi < threshold;

    return {
        value: Number(asmi.toFixed(2)),
        label: isRisk ? 'Riesgo de Sarcopenia' : 'Masa Muscular Suficiente',
        description: "Índice de Masa Músculo Esquelética Apendicular (Gold Standard para Sarcopenia).",
        level: isRisk ? 'risk' : 'optimal',
        color: isRisk ? 'text-red-500' : 'text-green-500'
    };
}

export function calculateWtHR(waistCm: number, heightCm: number): CalculationResult {
    const ratio = waistCm / heightCm;
    const isRisk = ratio >= 0.5;

    return {
        value: Number(ratio.toFixed(2)),
        label: isRisk ? 'Riesgo Cardiovascular Elevado' : 'Relación Saludable',
        description: "Relación Cintura-Altura. Predictor superior de enfermedad cardíaca sobre el IMC.",
        level: isRisk ? 'risk' : 'optimal',
        color: isRisk ? 'text-red-500' : 'text-green-500'
    };
}

export function calculateFFMI(weight: number, fatPercent: number, heightCm: number, gender: 'male' | 'female' | string): CalculationResult {
    const heightM = heightCm / 100;
    const ffm = weight * (1 - fatPercent / 100);
    const ffmi = ffm / (heightM * heightM);

    // Adjusted FFMI for height (common normalization)
    const normalizedFFMI = ffmi + 6.1 * (1.8 - heightM);
    const value = Number(normalizedFFMI.toFixed(1));

    interface Range { label: string; min?: number; max?: number; status: string; color: string; description: string }
    const ranges: Record<string, Range[]> = {
        male: [
            { label: 'Bajo (Riesgo)', max: 17.9, status: 'risk', color: 'text-red-500', description: 'Masa libre de grasa por debajo del promedio. Riesgo de fragilidad.' },
            { label: 'Promedio', min: 18.0, max: 20.9, status: 'fair', color: 'text-yellow-500', description: 'Nivel estándar para la población general.' },
            { label: 'Excelente', min: 21.0, max: 24.9, status: 'optimal', color: 'text-green-500', description: 'Nivel atlético saludable.' },
            { label: 'Superior (Raro)', min: 25.0, status: 'extreme', color: 'text-blue-500', description: 'Cerca del límite genético natural.' }
        ],
        female: [
            { label: 'Bajo (Riesgo)', max: 14.9, status: 'risk', color: 'text-red-500', description: 'Masa libre de grasa por debajo del promedio. Riesgo de fragilidad.' },
            { label: 'Promedio', min: 15.0, max: 17.9, status: 'fair', color: 'text-yellow-500', description: 'Nivel estándar para la población general.' },
            { label: 'Excelente', min: 18.0, max: 21.9, status: 'optimal', color: 'text-green-500', description: 'Nivel atlético saludable.' },
            { label: 'Superior (Raro)', min: 22.0, status: 'extreme', color: 'text-blue-500', description: 'Cerca del límite genético natural.' }
        ]
    };

    const userGender = gender === 'female' ? 'female' : 'male';
    const genderRanges = ranges[userGender];
    const match = genderRanges.find(r =>
        (r.min === undefined || value >= r.min) &&
        (r.max === undefined || value <= r.max)
    ) || genderRanges[0];

    return {
        value,
        label: match.label,
        description: match.description,
        level: match.status as any,
        color: match.color
    };
}

export function calculateMFR(muscleMass: number, weight: number, fatPercent: number): CalculationResult {
    const fatMass = weight * (fatPercent / 100);
    const ratio = muscleMass / fatMass;
    const value = Number(ratio.toFixed(2));

    let label = 'Pobre';
    let color = 'text-red-500';
    let level: CalculationResult['level'] = 'risk';

    if (value >= 4.0) {
        label = 'Estrella/Atlético';
        color = 'text-blue-500';
        level = 'optimal';
    } else if (value >= 2.5) {
        label = 'Bueno';
        color = 'text-green-500';
        level = 'optimal';
    } else if (value >= 1.5) {
        label = 'Aceptable';
        color = 'text-yellow-500';
        level = 'increased';
    }

    return {
        value,
        label,
        description: "Relación Músculo-Grasa (MFR). El 'Cousin's Choice' para calidad corporal.",
        level,
        color
    };
}

export function interpretVisceralFat(value: number): CalculationResult {
    let level: CalculationResult['level'] = 'optimal';
    let label = 'Saludable';
    let color = 'text-green-500';

    if (value >= 13) {
        level = 'high';
        label = 'Riesgo Alto';
        color = 'text-red-500';
    } else if (value >= 10) {
        level = 'increased';
        label = 'Riesgo Moderado';
        color = 'text-orange-500';
    }

    return {
        value,
        label,
        description: "Grasa rodeando órganos vitales. Principal motor de resistencia a la insulina.",
        level,
        color
    };
}
