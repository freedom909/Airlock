import UserRepository from './userRepository.js';
import pkg from 'mongodb';
const { MongoClient } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://chika:13GhspHKakjX4UPx@cluster0.lidru.mongodb.net/air';
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  
    try {
      await client.connect();
      const db = client.db('air'); // Your database name
      console.log('Database object:', db);
  
      // Pass the db object to your UserRepository
      const userRepository = new UserRepository(db);
      userRepository.findOne( {"email":"nuDdfaFA@gmail.com"})
      console.log('UserRepository initialized successfully');
    } catch (e) {
      console.error('Error:', e);
    } finally {
      await client.close();
    }
  }
  
  main().catch(console.error);
  
