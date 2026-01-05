const crypto = require('crypto');
const hash = crypto.createHash('sha256').update('assistant').digest('hex');
require('fs').writeFileSync('hash.txt', hash);
console.log('Hash written to hash.txt');
