
import { CsvRecord } from "./actions/csv-upload";
import config from "./tanita-config.json";

export type TanitaData = {
    metadata: {
        unitHeight: number;
        unitWeight: number;
        userSlot: number;
        physiqueRatingScale?: number;
    };
    metrics: {
        [key: string]: string | number;
    };
    segmental: {
        [key: string]: number;
    };
};

export class TanitaParser {
    static parseRow(csvRow: Record<string, any>): Record<string, any> | null {
        // The csvRow input here is expected to be a key-value object where keys are column headers or indices.
        // However, Tanita CSVs are "Tag-Value" based. 
        // We will assume the CSV reader (PapaParse) gave us raw values or we process raw string row.
        // But referencing our current csv-upload.ts, it uses header: true.
        // The Tanita CSV doesn't have standard headers like "Date,Weight". It might be key-value pairs in one row?
        // User said: "It uses a Tag-Value Pair system... Wk;57.6"

        // This means the row is: ~0;1;~1;2... MO;BC-601;DT;01/01/2021...
        // PapaParse with header:false gives us an array of strings.

        return null; // Placeholder for now - logic needs to handle array input
    }

    static parseRawRow(rowValues: string[], dateFormat: 'auto' | 'DMY' | 'MDY' = 'auto'): Record<string, any> {
        const result: Record<string, any> = {};
        const metadata: any = {};

        // Iterate by 2
        for (let i = 0; i < rowValues.length; i += 2) {
            const tag = rowValues[i];
            const value = rowValues[i + 1];

            if (!tag || value === undefined) continue;

            // Check metadata
            if (config.metadata[tag as keyof typeof config.metadata]) {
                const metaField = config.metadata[tag as keyof typeof config.metadata];
                metadata[metaField.field] = parseInt(value, 10);
            }
            // Check metrics
            else if (config.metrics[tag as keyof typeof config.metrics]) {
                const metricConf = config.metrics[tag as keyof typeof config.metrics];
                result[metricConf.field] = this.parseValue(value, metricConf, dateFormat);
            }
            // Check segmental
            else if (config.segmental[tag as keyof typeof config.segmental]) {
                const segField = config.segmental[tag as keyof typeof config.segmental];
                result[segField] = parseFloat(value);
            }
        }

        // ... existing post-processing ...
        if (metadata.unitWeight === 1) { // lbs -> kg
            if (result.weight) result.weight = result.weight * 0.453592;
            if (result.muscleMass) result.muscleMass = result.muscleMass * 0.453592;
            if (result.boneMass) result.boneMass = result.boneMass * 0.453592;
            for (const key in result) {
                if (key.startsWith('muscle')) {
                    result[key] = result[key] * 0.453592;
                }
            }
        }

        if (metadata.unitHeight === 1) { // inches -> cm
            if (result.height) result.height = result.height * 2.54;
        }

        if (metadata.physiqueRatingScale) {
            result.physiqueRatingScale = metadata.physiqueRatingScale;
        }

        return result;
    }

    private static parseValue(value: string, config: any, dateFormat: 'auto' | 'DMY' | 'MDY' = 'auto'): any {
        if (config.type === 'int') {
            const intVal = parseInt(value, 10);
            if (config.field === 'gender') {
                return intVal === 1 ? 'male' : 'female';
            }
            return intVal;
        }
        if (config.type === 'float') return parseFloat(value);
        if (config.type === 'date') {
            const parts = value.split('/');
            if (parts.length === 3) {
                let p0 = parts[0];
                let p1 = parts[1];
                let year = parts[2];

                let month = p0;
                let day = p1;

                if (dateFormat === 'DMY') {
                    month = p1;
                    day = p0;
                } else if (dateFormat === 'MDY') {
                    month = p0;
                    day = p1;
                } else {
                    // auto
                    if (parseInt(p0, 10) > 12) {
                        // Definitely DD/MM
                        month = p1;
                        day = p0;
                    } else if (parseInt(p1, 10) > 12) {
                        // Definitely MM/DD
                        month = p0;
                        day = p1;
                    }
                }

                if (year.length === 2) {
                    year = `20${year}`;
                }

                const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                if (!isNaN(new Date(isoDate).getTime())) {
                    return isoDate;
                }
            }
            return value;
        }
        if (config.field === 'timeRaw') {
            const timeMatch = value.match(/(\d{1,2}):(\d{2}):(\d{2})(.*)/);
            if (timeMatch) {
                let [_, hh, mm, ss, remainder] = timeMatch;
                let hour = parseInt(hh, 10);
                const isPM = remainder.toLowerCase().includes('p');
                const isAM = remainder.toLowerCase().includes('a');
                if (isPM && hour < 12) hour += 12;
                if (isAM && hour === 12) hour = 0;
                return `${hour.toString().padStart(2, '0')}:${mm}:${ss}`;
            }
            return value.split('?')[0];
        }
        return value;
    }
}
