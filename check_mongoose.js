const mongoose = require('mongoose');
console.log(
  Object.keys(mongoose).filter((k) => k.toLowerCase().includes('query')),
);
