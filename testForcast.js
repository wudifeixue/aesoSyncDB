const Papa = require('papaparse')

function cleanCSV(csvData) {
  // 将CSV内容按行分割
  const lines = csvData.split('\n');

  // 找到包含"Date,Forecast Pool Price"的那一行
  const startIndex = lines.findIndex(line => line.includes('Date,Forecast Pool Price'));

  // 从那一行开始，获取剩下的所有行
  const processedLines = lines.slice(startIndex);

  // 将处理后的行数组转换回字符串形式的CSV
  const processedCsv = processedLines.join('\n');

  return processedCsv;
}

function csvToJson(cleanedCSV) {
    const results = Papa.parse(cleanedCSV, {
        header: true,
        skipEmptyLines: true
    });
    return results.data;
}

// 示例使用
const inputCSV = `Actual / Forecast


"January 02, 2024."
Date,Forecast Pool Price,Actual Posted Pool Price,Forecast AIL,Actual AIL,Forecast AIL & Actual AIL Difference

"01/02/2024 01","41.28","40.66","9,821","9,804","17"
"01/02/2024 02","38.99","37.96","9,711","9,735","-24"
"01/02/2024 03","31.61","34.87","9,672","9,675","-3"
"01/02/2024 04","38.49","37.31","9,672","9,706","-34"
"01/02/2024 05","39.88","40.78","9,734","9,752","-18"
"01/02/2024 06","47.21","44.11","9,906","9,930","-24"
"01/02/2024 07","42.15","62.65","10,231","10,303","-72"
"01/02/2024 08","43.70","44.07","10,698","10,692","6"
"01/02/2024 09","43.78","53.44","10,838","10,917","-79"
"01/02/2024 10","66.66","48.45","10,934","10,966","-32"
"01/02/2024 11","44.05","44.22","10,981","11,035","-54"
"01/02/2024 12","50.00","45.16","11,030","11,070","-40"
"01/02/2024 13","44.82","43.40","11,026","11,077","-51"
"01/02/2024 14","41.93","42.57","11,046","11,076","-30"
"01/02/2024 15","43.34","68.56","11,054","11,044","10"
"01/02/2024 16","100.05","123.34","11,075","11,087","-12"
"01/02/2024 17","295.31","376.28","11,231","11,189","42"
"01/02/2024 18","414.68","325.97","11,412","11,356","56"
"01/02/2024 19","63.59","115.20","11,226","11,179","47"
"01/02/2024 20","44.25","45.19","11,033","11,100","-67"
"01/02/2024 21","44.29","45.75","10,964","11,079","-115"
"01/02/2024 22","205.65","61.61","10,883","10,927","-44"
"01/02/2024 23","263.07","100.00","10,664","10,662","2"
"01/02/2024 24","143.39","154.37","10,401","10,389","12"


`


const cleanedCSV = cleanCSV(inputCSV);
const jsonData = csvToJson(cleanedCSV);
console.log(jsonData);
