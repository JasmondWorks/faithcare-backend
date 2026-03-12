const mongoose = require('mongoose');
const Model = mongoose.Model;
console.log('FilterQuery exported:', !!mongoose.FilterQuery);
console.log('QueryFilter exported:', !!mongoose.QueryFilter);
console.log('UpdateQuery exported:', !!mongoose.UpdateQuery);
