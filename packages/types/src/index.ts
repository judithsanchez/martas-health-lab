export interface Client {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    createdAt: string;
}

export interface Measurement {
    id: number;
    clientId: number;
    date: string;
    weight: number;
    fatPercent?: number;
    muscleMass?: number;
    waterPercent?: number;
    boneMass?: number;
    visceralFat?: number;
    bmr?: number;
    metabolicAge?: number;
    notes?: string;
    createdAt: string;
}
