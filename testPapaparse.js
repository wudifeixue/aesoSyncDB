const Papa = require('papaparse')

function cleanCSV(csvData) {
    // 将CSV数据拆分为行
    const lines = csvData.split('\n');

    // 使用数组的filter方法清除不需要的行
    const cleanedLines = lines.filter(line => {
        return line.trim() !== "" && line.trim() !== "Pool Price";
    });

    // 重新组合为CSV并返回
    return cleanedLines.join('\n');
}

function csvToJson(cleanedCSV) {
    const results = Papa.parse(cleanedCSV, {
        header: true,
        skipEmptyLines: true
    });
    return results.data;
}

// 示例使用
const inputCSV = `
Pool Price

""

Date (HE),Price ($),30Ravg ($),AIL Demand (MW)
"10/18/2023 01","35.31","78.75","9013.0"
"10/18/2023 02","27.44","78.73","8917.0"
"10/18/2023 03","25.66","78.71","8815.0"
"10/18/2023 04","24.06","78.69","8773.0"
"10/18/2023 05","20.16","78.67","8818.0"
"10/18/2023 06","18.40","78.64","8995.0"
"10/18/2023 07","23.62","78.58","9458.0"
"10/18/2023 08","24.63","78.46","9877.0"
"10/18/2023 09","40.23","78.43","9976.0"
"10/18/2023 10","28.62","78.40","9937.0"
"10/18/2023 11","32.54","78.38","9969.0"
"10/18/2023 12","32.52","78.38","10015.0"
"10/18/2023 13","30.38","78.38","10011.0"
"10/18/2023 14","27.22","78.37","10038.0"
"10/18/2023 15","-","-","-"
"10/18/2023 16","-","-","-"
"10/18/2023 17","-","-","-"
"10/18/2023 18","-","-","-"
"10/18/2023 19","-","-","-"
"10/18/2023 20","-","-","-"
"10/18/2023 21","-","-","-"
"10/18/2023 22","-","-","-"
"10/18/2023 23","-","-","-"
"10/18/2023 24","-","-","-"


`;

const cleanedCSV = cleanCSV(inputCSV);
const jsonData = csvToJson(cleanedCSV);
console.log(jsonData);
