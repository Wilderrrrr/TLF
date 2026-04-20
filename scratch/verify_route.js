const axios = require('axios');
axios.get('http://localhost:3000/api/products/low-stock')
  .then(res => console.log('Success:', res.data))
  .catch(err => console.error('Error:', err.response?.status, err.response?.data));
