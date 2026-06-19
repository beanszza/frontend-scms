const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5007/api/erp-auth/login', {
      username: 'scmuser',
      password: 'Admin@123'
    });
    console.log('Login success');
    
    const cookies = loginRes.headers['set-cookie'];
    console.log('Cookies:', cookies);

    const validateRes = await axios.get('http://localhost:5007/api/erp-auth/validate', {
      headers: {
        Cookie: cookies.join('; ')
      }
    });
    console.log('Validate success:', validateRes.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.status : err.message);
    if (err.response && err.response.data) {
      console.error(err.response.data);
    }
  }
}

test();
