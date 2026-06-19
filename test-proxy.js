const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5007/api/erp-auth/login', {
      username: 'scmuser',
      password: 'Admin@123'
    });
    const cookies = loginRes.headers['set-cookie'];
    const headers = { Cookie: cookies.join('; ') };

    const urls = [
      'http://localhost:3004/api/erp-auth/validate',
      'http://localhost:5001/api/scms/api/Items?page=1&pageSize=1000',
      'http://localhost:5001/api/scms/api/Suppliers?page=1&pageSize=10&supplierName=&isActive=',
      'http://localhost:5001/api/scms/api/Recipes',
      'http://localhost:5001/api/scms/api/FinishedProducts'
    ];

    for (const url of urls) {
      try {
        const res = await axios.get(url, { headers });
        console.log(`Success: ${url}`);
      } catch (e) {
        console.error(`Failed 500 on: ${url}`);
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
