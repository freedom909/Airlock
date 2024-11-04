
import Cart from '../models/cart.js'; // adjust the import path to your Cart model
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../models/seq.js';

const models = {Cart}
async function loadJSON(filePath) {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  }

  async function seedModel(model, data) {
    for (const item of data) {
      await model.create(item);
    }
  }

async function seedCart() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    try {
      await sequelize.sync({ force: true });
      console.log('Database synced!');
      const carts = await loadJSON(path.join(__dirname, 'carts.json'));
      await seedModel(Cart, carts);

    
    console.log('Data seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}


seedCart();
