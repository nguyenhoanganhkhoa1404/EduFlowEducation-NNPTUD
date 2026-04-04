const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: '660d1f2e1f4e3c1b1c1c1c1c' }, 'secret', { expiresIn: '1d' });
console.log(token);
