const Papa = require("papaparse");

const literalStr =
  '"{0,16,~0,2,~1,2,~2,4,~3,3,MO,""BC-601"",DT,""02/19/2026"",Ti,""08:04:10"",Bt,0,GE,2,AG,76,Hm,166.0,AL,2,Wk,75.0,MI,27.2,FW,41.1,Fr,37.6,Fl,38.5,FR,42.7,FL,43.9,FT,40.3,mW,41.9,mr,2.2,ml,2.3,mR,7.1,mL,6.8,mT,23.5,bW,2.2,IF,11,rD,2198,rA,72,ww,42.7,CS,ED}"';

const result = Papa.parse(literalStr, {
  header: false,
  skipEmptyLines: true,
  dynamicTyping: false,
});

console.log("Result Data:");
console.log(JSON.stringify(result.data, null, 2));
console.log("Row length:", result.data[0].length);
console.log("First element starts with:", result.data[0][0].substring(0, 5));
