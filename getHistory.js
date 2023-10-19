const axios = require('axios');
//const dayjs = require('dayjs');
const { Client } = require('pg');
const Papa = require('papaparse');

// GET数据
const fetchDataFromURL = async () => {
  // change dates for historical data
  const beginDate = 10092023//dayjs().format('MMDDYYYY');
  const endDate = 10192023//dayjs().add(1, 'day').format('MMDDYYYY');
  const urlHistory = `http://ets.aeso.ca/ets_web/ip/Market/Reports/HistoricalPoolPriceReportServlet?beginDate=${beginDate}&endDate=${endDate}&contentType=csv`;

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
        return line.trim() !== "" && line.trim() !== "Pool Price" && line.trim() !== '""';
    });

    // 重新组合为\n CSV并返回
    return cleanedLines.join('\n');
}

const parseCSVData = async (cleanedCSV) => {
  const results = Papa.parse(cleanedCSV, {
      header: true,
      delimiter: ','
  });
  return results.data;
}

// 插入数据到postgres
const insertOrUpdateDatabase = async (entries) => {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'ati-aesoDataGraph',
    password: 'your_password',
    port: 8088,
  });

  await client.connect()
  .catch(e => {
    console.error("Error connecting to the database:", e);
    process.exit(1);
  });

  for (const entry of entries) {
    if (entry['Price ($)'] !== '-' && entry['30Ravg ($)'] !== '-' && entry['AIL Demand (MW)'] !== '-') {
      await client.query(`
        INSERT INTO public.pool_price(date_hours_ending, pool_price, thirty_ravg, all_demand) 
        VALUES($1, $2, $3, $4)
        ON CONFLICT (date_hours_ending)
        DO UPDATE SET pool_price = EXCLUDED.pool_price, thirty_ravg = EXCLUDED.thirty_ravg, all_demand = EXCLUDED.all_demand
      `, [entry['Date (HE)'], parseFloat(entry['Price ($)']), parseFloat(entry['30Ravg ($)']), parseFloat(entry['AIL Demand (MW)'])]);
    }
  }
  await client.end();
};

const main = async () => {
  const rawData = await fetchDataFromURL();
  if (rawData) {
    const cleanData = await cleanCSVData(rawData);
    const parsedData = await parseCSVData(cleanData);
    await insertOrUpdateDatabase(parsedData);
    console.log('History data has been updated successfully.');
  } else {
    console.error('Failed to update the history data.');
  }
};

main();