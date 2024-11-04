import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();
let pool;
const db = process.env.DB_NAME
const user = process.env.DB_USER
const password = process.env.DB_PASSWORD

const connectMysql = async () => {
  if (!pool) {
    pool = mysql.createPool({
      host: '127.0.0.1',
      user: "user",
      password: "password",
      database: "db",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      logging: console.log
    });
    console.log('Connected to the mysql database');
  }
  return pool;
};
export default connectMysql;

