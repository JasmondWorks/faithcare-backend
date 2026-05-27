const mongoose = require('mongoose');
const uri = 'mongodb+srv://obafemilared_db_user:YgnYI4sogNQXfkTw@cluster0.lvgzohs.mongodb.net/faith-care';

console.log('Testing Mongoose connection...');
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('Successfully connected to MongoDB!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
