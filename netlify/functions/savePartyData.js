const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDS);
  const jwt = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth: jwt });
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const range = 'Sheet2';

  const body = JSON.parse(event.body);

  // 🔹 Запрос на загрузку сохранённых данных
  if (body.get) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${range}!A2:Z2`,
      });
      const headersRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${range}!A1:Z1`,
      });

      const values = res.data.values?.[0] || [];
      const headers = headersRes.data.values?.[0] || [];

      const result = {};
      headers.forEach((key, i) => {
        result[key] = values[i] || '';
      });

      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Ошибка загрузки', details: err.message }),
      };
    }
  }

  // 🔹 Запрос на очистку
  if (body.clear) {
    try {
      const headersRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${range}!A1:Z1`,
      });
      const headers = headersRes.data.values?.[0] || [];
      const emptyRow = headers.map(() => '');

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${range}!A2:Z2`,
        valueInputOption: 'RAW',
        requestBody: { values: [emptyRow] },
      });

      return {
        statusCode: 200,
        body: 'CLEARED',
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Ошибка очистки', details: err.message }),
      };
    }
  }

  // 🔹 Запрос на сохранение данных
  try {
    const headersRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${range}!A1:Z1`,
    });
    const headers = headersRes.data.values?.[0] || [];

    const row = headers.map(h => body[h] ?? '');

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${range}!A2:Z2`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });

    return {
      statusCode: 200,
      body: 'OK',
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Ошибка сохранения', details: err.message }),
    };
  }
};
