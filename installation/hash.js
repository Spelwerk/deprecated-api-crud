let hasher = require('./../lib/hasher');

console.log('secrets:');
console.log('  jwt: ' + hasher(64));
console.log('  aes: ' + hasher(64));
console.log('  sha: ' + hasher(64));