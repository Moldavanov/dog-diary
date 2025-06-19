export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  const scriptUrl = 'https://script.google.com/macros/s/AKfycbwd9H6HDIiTgsiPuIOWb07tVrBllZB_tzxIV8wH11W0jmuYv64KNRzmT7d-40JHwmFWNA/exec';

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      body: event.body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();
    return {
      statusCode: 200,
      body: text,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
