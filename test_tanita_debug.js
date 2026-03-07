const Papa = require('papaparse');
const fs = require('fs');

function testParse(filePath) {
    console.log(`--- Testing ${filePath} ---`);
    const csvString = fs.readFileSync(filePath, 'utf8');
    const parseResult = Papa.parse(csvString, {
        header: false,
        skipEmptyLines: true,
        dynamicTyping: false,
    });
    console.log('PapaParse result data:');
    console.log(JSON.stringify(parseResult.data, null, 2));

    const rawRows = parseResult.data;
    rawRows.forEach((row, idx) => {
        console.log(`Row ${idx} length: ${row.length}`);
        // Simulate parseRawRow iteration
        for (let i = 0; i < row.length; i += 2) {
            const tag = row[i];
            const value = row[i + 1];
            console.log(`  i=${i}: tag="${tag}", value="${value}"`);
        }
    });
}

testParse('19022026.csv');
testParse('27022026.csv');
