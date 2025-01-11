import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();
const uri = process.env.NEO4J_URI || "bolt://localhost:7687"
const username = process.env.NEO4J_USERNAME || "neo4j"
const password = process.env.NEO4J_PASSWORD || "princess"
const connect = async () => {
  const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(username, password)
  );

  try {
    await driver.getServerInfo();
    console.log('NEO4J_URI:', process.env.NEO4J_URI);
    console.log('NEO4J_USERNAME:', process.env.NEO4J_USERNAME);
    console.log('NEO4J_PASSWORD:', process.env.NEO4J_PASSWORD ? '******' : 'Not Set');
    console.log('Connection established');
    return driver;
  } catch (error) {
    console.error('Connection error:', error);
    throw error; // 抛出错误，以便调用者可以处理
  }
};

export default connect;



