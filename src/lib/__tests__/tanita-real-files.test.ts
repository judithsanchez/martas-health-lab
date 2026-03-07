import { describe, it, expect } from "vitest";
import { TanitaParser } from "../tanita-parser";

describe("TanitaParser - Real Files Regression", () => {
    it("should parse 19022026.csv (wrapped in quotes with curly braces)", () => {
        const rawRow = ["{0,16,~0,2,~1,2,~2,4,~3,3,MO,\"BC-601\",DT,\"02/19/2026\",Ti,\"08:04:10\",Bt,0,GE,2,AG,76,Hm,166.0,AL,2,Wk,75.0,MI,27.2,FW,41.1,Fr,37.6,Fl,38.5,FR,42.7,FL,43.9,FT,40.3,mW,41.9,mr,2.2,ml,2.3,mR,7.1,mL,6.8,mT,23.5,bW,2.2,IF,11,rD,2198,rA,72,ww,42.7,CS,ED}"];
        const splitRow = TanitaParser.splitWrappedRow(rawRow);
        const result = TanitaParser.parseRawRow(splitRow);

        expect(result).toMatchObject({
            date: "2026-02-19",
            weight: 75.0,
            age: 76,
            gender: "female"
        });
    });

    it("should parse 27022026.csv (wrapped in quotes without closing brace in sample)", () => {
        // Sample shows: "{0,16...CS,B6" without closing brace? 
        // Let's re-verify the content from Step 199: 1: "{0,16,...ww,44.6,CS,B6" 
        // Wait, the sample from Step 199 didn't show a closing brace. 
        // But our splitWrappedRow handles it by checking startsWith("{0").
        const rawRow = ["{0,16,~0,2,~1,2,~2,4,~3,3,MO,\"BC-601\",DT,\"02/27/2026\",Ti,\"06:55:20\",Bt,0,GE,2,AG,46,Hm,160.0,AL,2,Wk,77.1,MI,30.1,FW,39.7,Fr,41.8,Fl,42.5,FR,43.5,FL,42.4,FT,37.1,mW,44.1,mr,2.2,ml,2.3,mR,7.4,mL,7.5,mT,24.7,bW,2.4,IF,8,rD,2333,rA,64,ww,44.6,CS,B6"];
        const splitRow = TanitaParser.splitWrappedRow(rawRow);
        const result = TanitaParser.parseRawRow(splitRow);

        expect(result).toMatchObject({
            date: "2026-02-27",
            weight: 77.1,
            age: 46,
            gender: "female"
        });
    });
});
