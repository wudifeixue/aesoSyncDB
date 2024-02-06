const axios = require('axios');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const { Client } = require('pg');
const Papa = require('papaparse');
const dbConfig = require('./dbConfig.json');

dayjs.extend(customParseFormat);

const fetchDataFromURL = async (beginDate, endDate) => {
  const urlHistory = `http://ets.aeso.ca/ets_web/ip/Market/Reports/ActualForecastWMRQHReportServlet?beginDate=${beginDate}&endDate=${endDate}&contentType=csv`;

  try {
    const response = await axios.get(urlHistory);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from URL: ${error}`);
    return null;
  }
};

const cleanCSVData = async (data) => {
  // 将CSV数据拆分为行
  const lines = data.split('\r\n');

  // 使用数组的filter方法清除不需要的行
  const cleanedLines = lines.filter(line => {
    return line.trim() !== "" && line.trim() !== '""';
  });

  const startIndex = cleanedLines.findIndex(line => line.includes('Date,Forecast Pool Price'));
  const processedLines = cleanedLines.slice(startIndex);
  const processedCsv = processedLines.join('\n');
  return processedCsv;
}

const parseCSVData = async (cleanedCSV) => {
  const results = Papa.parse(cleanedCSV, {
    header: true,
    delimiter: ','
  });
  return results.data;
}

const parseDate = (entries) => {
  for (const entry of entries) {
    const format = 'MM/DD/YYYY HH';
    entry['Date_Hours'] = dayjs(entry['Date'], format).toDate();
  }
  return entries;
}

// 插入数据到postgres
const insertOrUpdateDatabase = async (entries) => {
  const client = new Client(dbConfig);

  await client.connect()
    .catch(e => {
      console.error("Error connecting to the database:", e);
      process.exit(1);
    });

  for (const entry of entries) {
    if (entry['Forecast Pool Price'] !== '-' && entry['Actual Posted Pool Price'] !== '-' && entry['Forecast AIL'] !== '-' && entry['Forecast AIL & Actual AIL Difference'] !== '-') {
      await client.query(`
        INSERT INTO public.forecast_price(date_hours_ending, date_hours, forecast_pool_price, actual_pool_price, forecast_ail, actual_ail, difference_ail) 
        VALUES($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (date_hours_ending)
        DO UPDATE SET date_hours = EXCLUDED.date_hours, forecast_pool_price = EXCLUDED.forecast_pool_price, actual_pool_price = EXCLUDED.actual_pool_price, forecast_ail = EXCLUDED.forecast_ail, actual_ail = EXCLUDED.actual_ail, difference_ail = EXCLUDED.difference_ail 
      `, [entry['Date'], entry['Date_Hours'], parseFloat(entry['Forecast Pool Price']), parseFloat(entry['Actual Posted Pool Price']),
      parseFloat(entry['Forecast AIL']), parseFloat(entry['Actual AIL']), parseFloat(entry["Forecast AIL & Actual AIL Difference"])]);
    }
  }
  await client.end();
};

// 仅处理31天数据的请求
const processBatchData = async (startDate, endDate) => {
  const format = 'MMDDYYYY';
  let currentStart = dayjs(startDate, format);
  const end = dayjs(endDate, format);

  while (currentStart.isBefore(end)) {
    let currentEnd = currentStart.add(31, 'day').subtract(1, 'day'); // 31天后的前一天，确保每批最多31天
    if (currentEnd.isAfter(end)) {
      currentEnd = end; // 如果计算的结束日期超过了用户指定的结束日期，则使用用户指定的结束日期
    }
    const batchData = await fetchDataFromURL(currentStart.format(format), currentEnd.format(format));
    if (batchData) {
      const cleanData = await cleanCSVData(batchData);
      const parsedData = await parseCSVData(cleanData);
      const correctDate = parseDate(parsedData);
      await insertOrUpdateDatabase(correctDate);
      console.log(dayjs(currentStart).format('YYYY-MM-DD') + ' to ' + dayjs(currentEnd).format('YYYY-MM-DD') + ' data has been inserted successfully.');
    } else {
      console.error(dayjs(currentStart).format('YYYY-MM-DD') + ' to ' + dayjs(currentEnd).format('YYYY-MM-DD') + ' failed to update the data.');
    }
    currentStart = currentEnd.add(1, 'day'); // 正确地更新currentStart为下一个批次的开始日期
  }
};

const main = async () => {
  // 更改为所需的日期范围
  const beginDate = '01012022'; // 开始日期
  const endDate = '06302023'; // 结束日期

  await processBatchData(beginDate, endDate); // 直接处理数据，无需获取原始数据

  console.log(dayjs().format('YYYY-MM-DD HH:mm:ss') + ' All data have been processed and inserted successfully.');
};

main();
