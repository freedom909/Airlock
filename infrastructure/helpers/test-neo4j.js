import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();
const username = process.env.NEO4J_USERNAME || "neo4j"
const password = process.env.NEO4J_PASSWORD || "princess"
const uri = process.env.NEO4J_URI || "bolt://localhost:7687"
console.log('NEO4J_URI:', uri);
console.log('NEO4J_USERNAME:', username);
console.log('NEO4J_PASSWORD:', password ? '******' : 'Not Set');

const driver = neo4j.driver(
  uri,
  neo4j.auth.basic(username, password)
);

driver.getServerInfo()
  .then(() => {
    console.log('Connection established');
  })
  .catch((error) => {
    console.error('Connection error:', error);
  });
