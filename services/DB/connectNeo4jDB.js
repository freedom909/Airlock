import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();
const uri = process.env.NEO4J_URI
const username = process.env.NEO4J_USERNAME
const password = process.env.NEO4J_PASSWORD
const connect = async () => {
  const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(username, password)
  );

  try {
    await driver.getServerInfo();
    console.log('NEO4J_URI:', uri);
    console.log('NEO4J_USERNAME:', username);
    console.log('NEO4J_PASSWORD:', password ? '******' : 'Not Set');
    console.log('Connection established');
    return driver;
  } catch (error) {
    console.error('Connection error:', error);
    throw error;
  }
};

export default connect;



