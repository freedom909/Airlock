import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let pool;
let mongodb;

const dbConfig = {
  mysql: async () => {
    if (!pool) {
      pool = mysql.createPool({
        host: process.env.MYSQL_HOST || '127.0.0.1',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'princess',
        database: process.env.MYSQL_DATABASE || 'air',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
      console.log('Connected to the MySQL database');
    }
    return pool;
  },
  mongo: async () => {
    if (!mongodb) {
      const client = await MongoClient.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      mongodb = client.db(process.env.DB_NAME || 'test');
      console.log('Connected to MongoDB');
    }
    return mongodb;
  },
};

export default dbConfig;
