const axios = require('axios');
const csv = require('csvtojson');
const dayjs = require('dayjs');
const { Client } = require('pg');

const fetchDataFromURL = async () => {
  const beginDate = dayjs().format('MMDDYYYY');
  const endDate = dayjs().add(1, 'day').format('MMDDYYYY');

  const url = `http://ets.aeso.ca/ets_web/ip/Market/Reports/HistoricalPoolPriceReportServlet?beginDate=${beginDate}&endDate=${endDate}&contentType=csv`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from URL: ${error}`);
    return null;
  }
};

const parseCSVData = async (data) => {
  const jsonArray = await csv().fromString(data);
  return jsonArray.filter(entry => entry['Price ($)'] !== '-' && entry['Date (HE)']);
};

const insertOrUpdateDatabase = async (entries) => {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'ati-aesoDataGraph',
    password: '321ewqdsacxz',
    port: 5432,
  });

  await client.connect();

  for (const entry of entries) {
    await client.query(`
      INSERT INTO public.pool_price(date_hours_ending, pool_price, thirty_ravg, all_demand) 
      VALUES($1, $2, $3, $4)
      ON CONFLICT (date_hours_ending)
      DO UPDATE SET pool_price = EXCLUDED.pool_price, thirty_ravg = EXCLUDED.thirty_ravg, all_demand = EXCLUDED.all_demand
      WHERE public.pool_price.pool_price <> EXCLUDED.pool_price OR 
            public.pool_price.thirty_ravg <> EXCLUDED.thirty_ravg OR 
            public.pool_price.all_demand <> EXCLUDED.all_demand
    `, [entry['Date (HE)'], parseFloat(entry['Price ($)']), parseFloat(entry['30Ravg ($)']), parseFloat(entry['AIL Demand (MW)'])]);
  }

  await client.end();
};

const main = async () => {
  const rawData = await fetchDataFromURL();
  if (rawData) {
    const parsedData = await parseCSVData(rawData);
    await insertOrUpdateDatabase(parsedData);
    console.log('Data has been updated successfully.');
  } else {
    console.error('Failed to update the data.');
  }
};

main();
