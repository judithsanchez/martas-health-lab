
import { TanitaParser } from "../src/lib/tanita-parser";

const testTime = "7:00:34?a. m.";
console.log(`Testing time: '${testTime}'`);

// Mocking the config import since we can't easily import json in ts-node without flags usually, 
// but let's try direct import if environment supports it, or just use the parser logic directly if I could.
// Actually, TanitaParser depends on tanita-config.json.
// Let's just run it via tsx or similar.

const row = ["Ti", testTime];
const result = TanitaParser.parseRawRow(row);
console.log("Result:", result);

if (result.timeRaw === "07:00:34") {
    console.log("SUCCESS: Time parsed correctly");
} else {
    console.log("FAILURE: Time mismatch", result.timeRaw);
}
