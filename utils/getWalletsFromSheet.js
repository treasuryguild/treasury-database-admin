import axios from 'axios';

export async function getWalletsFromSheet() {
  const SHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEET;
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'Form responses 1'?key=${API_KEY}`;

  try {
    const response = await axios.get(API_URL);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
