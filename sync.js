const axios = require('axios');
const dayjs = require('dayjs');
const { Client } = require('pg');

// GET数据
const fetchDataFromURL = async () => {
  const beginDate = dayjs().format('MMDDYYYY');
  const endDate = dayjs().add(1, 'day').format('MMDDYYYY');

  const url = `http://ets.aeso.ca/ets_web/ip/Market/Reports/HistoricalPoolPriceReportServlet?beginDate=${beginDate}&endDate=${endDate}&contentType=csv`;

  try {
    const response = await axios.get(url);
    //console.log(response.data)
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from URL: ${error}`);
    return null;
  }
};

// csvtojson清理CSV
const cleanCSVData = (data) => {
  const lines = data.split('\n');
  // 删除开头的无关行，直到找到Date (HE)开始的行为止
  while (lines.length && !lines[0].startsWith('Date (HE)')) {
      lines.shift();
  }
  return lines.join('\n');
};

const parseManualCSVData = (data) => {
  const lines = data.trim().split('\n');
  const headers = lines[0].split(',');
  const entries = [];
  
  for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const entry = {};
      
      for (let j = 0; j < headers.length; j++) {
          entry[headers[j]] = values[j].replace(/"/g, '');
      }
      
      entries.push(entry);
  }
  //console.log(entries)
  return entries;
};

// 插入数据到postgres
const insertOrUpdateDatabase = async (entries) => {
  const client = new Client({
    user: 'atiAdmin',
    host: 'localhost',
    database: 'ati-aesoDataGraph',
    password: '321ewqdsacxz',
    port: 5432,
  });

  await client.connect()
  .catch(e => {
    console.error("Error connecting to the database:", e);
    process.exit(1);
  });

  for (const entry of entries) {
    await client.query(`
      INSERT INTO public.pool_price(date_hours_ending, pool_price, thirty_ravg, all_demand) 
      VALUES($1, $2, $3, $4)
      ON CONFLICT (date_hours_ending)
      DO UPDATE SET pool_price = EXCLUDED.pool_price, thirty_ravg = EXCLUDED.thirty_ravg, all_demand = EXCLUDED.all_demand
    `, [entry['Date (HE)'], parseFloat(entry['Price ($)']), parseFloat(entry['30Ravg ($)']), parseFloat(entry['AIL Demand (MW)'])]);
  }

  await client.end();
};


const main = async () => {
  const rawData = await fetchDataFromURL();
  if (rawData) {
    const cleanedData = cleanCSVData(rawData);
    const parsedData = parseManualCSVData(cleanedData);
    await insertOrUpdateDatabase(parsedData);
    console.log('Data has been updated successfully.');
  } else {
    console.error('Failed to update the data.');
  }
};

main();
