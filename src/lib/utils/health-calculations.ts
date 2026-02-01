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

    const limit = gender === 'male' ? 25.0 : 22.0; // General natural limits
    const isExtreme = normalizedFFMI > limit;

    return {
        value: Number(normalizedFFMI.toFixed(1)),
        label: isExtreme ? 'Nivel Atlético Superior' : 'Nivel Saludable',
        description: "Índice de Masa Libre de Grasa. Evalúa calidad de la composición corporal.",
        level: isExtreme ? 'increased' : 'optimal',
        color: isExtreme ? 'text-blue-500' : 'text-green-500'
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
