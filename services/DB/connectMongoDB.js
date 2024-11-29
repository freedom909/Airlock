import pkg from 'mongodb';
const { MongoClient } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/';
const client = new MongoClient(mongoUri);
const dbName = process.env.MONGO_DB_NAME;
let mongodb;

async function connectToMongoDB() {
    if (!mongodb) {
        await client.connect();
        console.log('Connected to MongoDB');
        mongodb = client.db(dbName);
    }
    return mongodb;
}

export default connectToMongoDB;
