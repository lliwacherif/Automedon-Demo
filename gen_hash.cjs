const crypto = require('crypto');
const fs = require('fs');
const hash = crypto.createHash('sha256').update('assistant').digest('hex');
fs.writeFileSync('hash.txt', hash);
console.log('Hash written to hash.txt');
