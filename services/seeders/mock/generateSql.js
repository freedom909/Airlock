//import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
// // Load the JSON data  
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


async function generateSQL() {
    try {
        // Read and parse the JSON data  
        const data = JSON.parse(await fs.readFile(path.join(process.cwd(), 'data.json'), 'utf8'));

        // Destructure the data to extract the listingData array  
        const { listingData } = data;

        // Check if listingData is valid  
        if (!Array.isArray(listingData)) {
            throw new Error("'listingData' is missing or not an array");
        }

        // Function to generate SQL statements  
        const generateInsertListings = () => {
            // Check the data  
            if (!Array.isArray(data) || data.length === 0) {
                console.error('Data is not an array or is empty:', data);
                return ''; // Prevent further execution  
            }

            console.log('Data length:', data.length); // Log the number of listings  
            console.log('Data:', JSON.stringify(data, null, 2)); // Log entire data structure  

            return `  
        INSERT INTO listings (id, title, locationId, amenityIds, costPerNight, bookingIds, reviewIds, description, createdAt, updatedAt, hostId, photoThumbnails, checkInDate, checkOutDate, isFeatured, saleAmount, bookingNumber, listingStatus, numOfBeds)  
        VALUES ${data.map((listing) => {
                console.log('Current Listing:', JSON.stringify(listing, null, 2)); // Debug output for each listing  

                const {
                    id,
                    title,
                    locationId,
                    amenityIds,
                    costPerNight,
                    bookingIds,
                    reviewIds,
                    description,
                    createdAt,
                    updatedAt,
                    hostId,
                    photoThumbnails,
                    checkInDate,
                    checkOutDate,
                    isFeatured,
                    saleAmount,
                    bookingNumber,
                    listingStatus,
                    numOfBeds
                } = listing;

                return `('${id || ''}',   
                '${title || ''}',   
                '${locationId || ''}',   
                '${JSON.stringify(amenityIds || [])}',   
                ${costPerNight || 0},   
                '${JSON.stringify(bookingIds || [])}',   
                '${JSON.stringify(reviewIds || [])}',    
                '${description || ''}',   
                '${createdAt || new Date().toISOString()}',   
                '${updatedAt || new Date().toISOString()}',   
                '${hostId || ''}',   
                '${JSON.stringify(photoThumbnails || [])}',   
                '${checkInDate || new Date().toISOString()}',   
                '${checkOutDate || new Date().toISOString()}',   
                ${isFeatured ? 'true' : 'false'},   
                ${saleAmount || 0},   
                ${bookingNumber || 0},   
                '${listingStatus || ''}',   
                ${numOfBeds || 0})`;
            }).join(',\n')};  
            `;
        };
        const sql = generateInsertListings();
        console.log(sql); // Display generated SQL

        // Generate the SQL statements  
        const sqlStatements = generateInsertListings();
        console.log('Generated SQL:', sql);
        if (sql) {
            fs.writeFile('seed.sql', sql, (err) => {
                if (err) {
                    console.error('Error writing to file', err);
                } else {
                    console.log('SQL statements successfully written to ./mock/seedListing.sql');
                }
            });
        } else {
            console.log('No SQL generated to write to the file.');
        }
        // Log the SQL statements (for debugging purposes)  
        console.log(sqlStatements);
        // console.log('Data:', data);
        // Save the SQL statements to a file  
        await fs.writeFile(path.join(process.cwd(), './mock/seedListing1.sql'), sqlStatements.trim());
        console.log('SQL statements written to seed.sql');
    } catch (error) {
        console.error('Error processing the data:', error);
    }
}

// Call the function to execute  
generateSQL();