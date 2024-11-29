import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Ensure environment variables are correctly set
const driver = neo4j.driver(
  "neo4j://localhost:7687",
  neo4j.auth.basic("neo4j", "princess"),
  //{ encrypted: 'ENCRYPTION_ON' } // Ensure encryption is on for Neo4j Aura
);

driver.getServerInfo()
  .then(() => {
    console.log('Connection established');
  })
  .catch((error) => {
    console.error('Connection error:', error);
  });

export default driver;
