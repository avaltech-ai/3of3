const GAS_URL = 'https://script.google.com/macros/s/AKfycbxhp0gicx82NNCI58dNmoceEfTUCldZ9Eqp9Uh4zOOGU6vXeowbZuO9DmqDcvG62PLRkQ/exec';

exports.handler = async function (event, context) {
  const method = event.httpMethod;
  if (method !== 'POST' && method !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    let fetchUrl = GAS_URL;
    const fetchOptions = {
      method: method,
      // 在 Node.js 伺服器端發出的 fetch 會自動跟隨 GAS 的 302 跳轉
      redirect: 'follow', 
    };

    if (method === 'GET') {
      const queryString = event.rawQuery;
      if (queryString) {
        fetchUrl += '?' + queryString;
      }
    } else if (method === 'POST') {
      fetchOptions.headers = {
        // 使用 text/plain 符合 GAS doPost 解析規範
        'Content-Type': 'text/plain;charset=utf-8', 
      };
      // 將前端傳來的 JSON 字串直接轉發給 GAS
      fetchOptions.body = event.body;
    }

    const response = await fetch(fetchUrl, fetchOptions);
    const data = await response.text();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      },
      body: data
    };
  } catch (error) {
    console.error('Netlify Proxy Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Netlify 中繼伺服器發生錯誤: ' + error.message })
    };
  }
};
