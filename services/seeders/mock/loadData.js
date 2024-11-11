
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const loadData = async () => {
    try {
        // Define the path to your data.json file  
        const filePath = path.join(process.cwd(), 'data.json');

        // Read the file  
        const data = await fs.readFile(filePath, 'utf-8');

        // Parse the JSON data  
        const jsonData = JSON.parse(data);



        // Return the parsed data  
        return jsonData
    } catch (error) {
        console.error('Error loading data:', error);
        throw error; // Re-throw the error for further handling  
    }
};

// Example usage  
// (async () => {
//     try {
//         const listings = await loadData();
//         // console.log('Listings loaded:', listings);
//     } catch (error) {
//         console.error('Failed to load listings:', error);
//     }
// })();

export default loadData