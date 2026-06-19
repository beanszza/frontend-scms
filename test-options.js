const axios = require('axios');

async function testGet() {
  try {
    const res = await axios.get('http://localhost:5001/api/scms/api/PurchaseOrders?pageSize=10000');
    console.log('GET success, status:', res.status, res.data ? 'has data' : 'no data');
  } catch (err) {
    console.error('GET failed with status:', err.response ? err.response.status : err.message);
    if (err.response && err.response.data) {
      console.error(err.response.data);
    }
  }
}

testGet();
