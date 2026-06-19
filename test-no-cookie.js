const axios = require('axios');

async function testNoCookie() {
  try {
    const res = await axios.get('http://localhost:5001/api/scms/api/Items');
    console.log('Success:', res.status);
  } catch (err) {
    console.error('Failed with status:', err.response ? err.response.status : err.message);
  }
}

testNoCookie();
