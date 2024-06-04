// import { Sequelize, DataTypes, Model } from '@sequelize/core';

// import config from '../config/config.json' assert { type: 'json' };

// // Initialize Sequelize
// const env = 'development';
// const { database, user,password,host } = config[env];

// const sequelize = new Sequelize({
//   dialect: MySqlDialect,
//   database,
//   user,
//   password,
//   host,
//   port: 3307,
// });
// export default sequelize;
import { Sequelize } from '@sequelize/core';
import dotenv from 'dotenv';
import { MySqlDialect } from '@sequelize/mysql';
// Ensure environment variables are loaded
dotenv.config();
const dbPort = parseInt(process.env.MYSQL_PORT, 10);
console.log(`DB_HOST: ${process.env.MYSQL_HOST}`);
console.log(`DB_PORT: ${dbPort}`); // This should log 3307 as a number
console.log(`DB_USER: ${process.env.MYSQL_USER}`);
console.log(`DB_PASSWORD: ${process.env.MYSQL_PASSWORD}`);
console.log(`DB_NAME: ${process.env.MYSQL_HOST}`);
const options = {
  user: process.env.MYSQL_USER,
  password:  process.env.MYSQL_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.MYSQL_DB,
  port: dbPort,
  dialect:MySqlDialect,
  logging: console.log, // Enable logging for debugging
}

// Initialize Sequelize

const sequelize = new Sequelize(options);

sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

export default sequelize;