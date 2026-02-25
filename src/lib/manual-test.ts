
import { TanitaParser } from "./tanita-parser";

const testDates = [
    "25/02/2026", // Euro
    "02/25/2026", // US
    "01/02/2026", // Ambiguous
    "1/2/2026",   // Short
    "25/02/26",   // 2-digit year
];

console.log("Starting Manual Date Parsing Test...");
testDates.forEach(date => {
    const row = ["DT", date, "Wk", "60"];
    const result = TanitaParser.parseRawRow(row);
    console.log(`Input: ${date} -> Output: ${result.date}`);
});
