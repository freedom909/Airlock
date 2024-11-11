
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import loadData from './loadData.js';

const { listingsData, amenitiesData, listingAmenitiesData, locationsData } = jsonData
const generateInsertListings = (listingsData) => {
    if (!Array.isArray(listingsData) || listingsData.length === 0) {
        console.error('Data is not an array or is empty:', listingsData);
        return ''; // Prevent further execution  
    }

    const sqlValues = listingsData.map((listing) => {
        return `('${listing.id || "NULL"}',   
        '${listing.title || "NULL"}',   
        '${listing.locationId || "NULL"}',   
        '${JSON.stringify(listing.amenityIds || [])}',   
        ${listing.costPerNight !== undefined ? listing.costPerNight : "NULL"},   
        '${JSON.stringify(listing.bookingIds || [])}',   
        '${JSON.stringify(listing.reviewIds || [])}',    
        '${listing.description || "NULL"}',   
        '${listing.createdAt || "NULL"}',   
        '${listing.updatedAt || "NULL"}',   
        '${listing.hostId || "NULL"}',   
        '${JSON.stringify(listing.photoThumbnails || [])}',   
        '${listing.checkInDate || "NULL"}',   
        '${listing.checkOutDate || "NULL"}',   
        ${listing.isFeatured !== undefined ? listing.isFeatured : "NULL"},   
        ${listing.saleAmount !== undefined ? listing.saleAmount : "NULL"},   
        ${listing.bookingNumber !== undefined ? listing.bookingNumber : "NULL"},   
        '${listing.listingStatus || "NULL"}',   
        ${listing.numOfBeds !== undefined ? listing.numOfBeds : "NULL"})`;
    });

    const sql = `INSERT INTO listings (id, title, locationId, amenityIds, costPerNight, bookingIds, reviewIds, description, createdAt, updatedAt, hostId, photoThumbnails, checkInDate, checkOutDate, isFeatured, saleAmount, bookingNumber, listingStatus, numOfBeds)  
VALUES ${sqlValues.join(',\n')};`;

    return sql;
};


const main = async () => {
    try {

        const listings = await loadData(); // Assuming this exists and loads your data  
        const sql = generateInsertListings(listings); // Assuming this generates valid SQL  

        console.log('Generated SQL:', sql);

        if (sql && sql.trim()) {
            // Construct the file path using path.join  
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const filePath = path.join(__dirname, 'seed1.sql'); // Use __dirname for relative path  
            console.log('Seed file path:', filePath);
            console.log('Writing to seed.sql...');

            // Write the generated SQL to the seed.sql file  
            await fs.writeFile(filePath, sql.trim());
            console.log(`Writing started at: ${new Date().toISOString()}`);
            console.log('SQL statements successfully written to seed.sql.');
            console.log(`Writing completed at: ${new Date().toISOString()}`);

            // Verify the content was written  
            const writtenContent = await fs.readFile(filePath, 'utf-8');
            console.log('Content of seed.sql:', writtenContent);
        } else {
            console.error('No SQL generated to write.');
        }
    } catch (error) {
        console.error('Error in main execution:', error);
    }
};

main();