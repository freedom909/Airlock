


import { promises as fs } from 'fs';
import path from 'path';

const loadData = async () => {
    try {
        const filePath = path.join(process.cwd(), 'data.json');
        const data = await fs.readFile(filePath, 'utf-8');
        console.log(data);
        const jsonData = JSON.parse(data);
        return jsonData.listingData; // Adjust according to your JSON structure  
    } catch (error) {
        console.error('Error loading data:', error);
        throw error; // Re-throw the error for further handling  
    }
};

const generateInsertListings = (listings) => {
    if (!Array.isArray(listings) || listings.length === 0) {
        console.error('Data is not an array or is empty:', listings);
        return ''; // Prevent further execution  
    }

    const sqlValues = listings.map((listing) => {
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
        const listings = await loadData(); // Load data once  
        // Check if listings data is loaded correctly  
        if (!listings || listings.length === 0) {
            console.error('No listings data loaded.');
            return;
        }
        const sql = generateInsertListings(listings); // Generate SQL once  

        // Log the generated SQL  
        console.log('Generated SQL:', sql);

        // Write to seed.sql only if SQL is generated  
        if (sql && sql.trim()) {
            const filePath = path.join(process.cwd(), './seeder8/mock/seedListings.sql');
            console.log('Seed file path:', filePath);
            await fs.writeFile(filePath, sql.trim());

            console.log('SQL statements successfully written to seed.sql');
            const writtenContent = await fs.readFile(filePath, 'utf-8');
            // console.log('Content written to seed.sql:', writtenContent);
        } else {
            console.error('No SQL generated to write.');
        }
    } catch (error) {
        console.error('Error in main execution:', error);
    }
};

main(); // Invoke the main function