const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({ name: String });
const UserModel = mongoose.model('User', UserSchema);
console.log('Parameters of find:', typeof UserModel.find);
