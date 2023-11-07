const nodeFetch = require('node-fetch');
import * as dotenv from 'dotenv';
dotenv.config();
const API_KEY = process.env.PROPERTY_API_KEY;

export async function getPropertyInfo(propertyID: string) {
  const url = `https://api.rentcast.io/v1/properties/${encodeURIComponent(propertyID)}`;
  const options = {
    method: 'GET',
    headers: { accept: 'application/json', 'X-Api-Key': API_KEY },
  };

  try {
    const response = await nodeFetch(url, options);
    const json = await response.json();

    if (json) {
      const lastSaleDate = json.lastSaleDate;
      const lastSalePrice = json.lastSalePrice;
      return { lastSaleDate, lastSalePrice };
    } else {
      throw new Error('No property found for the given ID');
    }
  } catch (error:any) {
    throw new Error('Error fetching property information: ' + error.message);
  }
}

