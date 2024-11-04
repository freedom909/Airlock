import { createContainer, asValue, asClass } from 'awilix';
import connectMysql from './connectMysqlDB.js';

const baseMysqlContainer = async () => {
  const mysqldb = await connectMysql(); // Establishing connection to MySQL database
  const container = createContainer();
  container.register({
    mysqldb: asValue(mysqldb),
  });
  return container;
};

export default baseMysqlContainer;
