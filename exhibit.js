const https = require('https');

exports.handler = async (event) => {
  const { region = '', type = '', era = '' } = event.queryStringParameters || {};
  const apiKey = 'f691d8d2-6c0e-4d0b-a3fa-e76ece40d2d8';

  let apiUrl = `https://api.data.go.kr/openapi/tn_pubr_public_pblprfr_event_info_api?serviceKey=${apiKey}&pageNo=1&numOfRows=20&type=json`;
  if(region) apiUrl += `&ctprvnNm=${encodeURIComponent(region)}`;
  if(type) apiUrl += `&pblprfrSe=${encodeURIComponent(type)}`;
  if(era) apiUrl += `&reltsThema=${encodeURIComponent(era)}`;

  return new Promise((resolve) => {
    https.get(apiUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(json),
          });
        } catch(e) {
          resolve({
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Parse error', raw: data.slice(0, 500) }),
          });
        }
      });
    }).on('error', (e) => {
      resolve({
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: e.message }),
      });
    });
  });
};
