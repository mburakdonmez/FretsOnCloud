const mongoose = require('mongoose');
mongoose.pluralize(null);

const connection_string = 'mongodb+srv://foc_admin:WLTEARYBcFgu3NUs@fretsoncloud-vwsux.mongodb.net/FretsOnCloud';

exports.conn = mongoose.createConnection(connection_string, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
exports.mongoose = mongoose;