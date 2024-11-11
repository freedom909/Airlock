
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import path from 'path';

const listings = Array.from({ length: 10 }, (_, index) => ({
    id: `listing-${index + 1}`,
    title: `Listing ${index + 1}`,
    locationId: `location-${index + 1}`,
    amenityids: [`am-${index + 1}`, `am-${index + 2}`, `am-${index + 3}`],
    costPerNight: 100 + index * 10,
    pictures: ["https://example.org/foo#bar", "https://example.org/"],
    bookings: [],
    reviews: [],
    description: `Listing ${index + 1} description`,
    createdAt: new Date(),
    updatedAt: new Date(),
    hostid: `host-${index + 1}`,
    checkInDate: new Date(),
    checkOutDate: new Date(),
    isFeatured: false,
    saleAmount: 0,
    bookingNumber: 0,
    listingStatus: 'AVAILABLE',
    numOfBeds: Math.floor(Math.random() * 5) + 1,
}))

const amenities = Array.from({ length: 30 }, (_, index) => ({
    id: `am-${index + 1}`,
    name: `Amenity ${index + 1}`,
    category: `outdoors-${Math.floor(Math.random() * 5) + 1}`,
    description: `Amenity ${index + 1} description`,
}))

const locations = Array.from({ length: 10 }, (_, index) => ({
    id: `uuid()`, // Unique identifier for the location  
    listingId: `listing-${Math.floor(Math.random() * 10) + 1}`, // Reference to a listing  
    name: 'Central Park', // Name of the location  
    radius: parseFloat((Math.random() * 10).toFixed(2)), // Random radius between 0 and 10  
    latitude: parseFloat((Math.random() * (90 - (-90)) + (-90)).toFixed(6)), // Random latitude  
    address: `Address ${i + 1}`, // e.g., Address 1, Address 2, etc.  
    city: `City ${i + 1}`, // e.g., City 1, City 2, etc.  
    state: `State ${i + 1}`, // e.g., State 1, State 2, etc.  
    country: 'USA', // Fixed country  
    zipCode: `ZIP${String(i + 1).padStart(5, '0')}`, // e.g., ZIP00001, ZIP00002, etc.  
    type: i % 2 === 0 ? 'primary' : 'secondary' // Alternate between primary and secondary 
}))
const listingAmenities = []
listings.forEach(listing => {
    const numberOfAmenities = Math.floor(Math.random() * 10) + 1; // Randomly choose number of amenities 
    const selectedAmenities = new Set();
    while (selectedAmenities.size < numberOfAmenities) {
        const randomAmenity = amenities[Math.floor(Math.random() * amenities.length)];
        selectedAmenities.add(randomAmenity.id);
    }
    selectedAmenities.forEach(amenityId => {
        listingAmenities.push({
            amenityId,
            listingId: listing.id
        });
    });
});

// Mock Data output  
const mockData = {
    listings,
    amenities,
    listingAmenities,
    locations
};
// Output to JSON file (if needed)  
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, 'data.json')
fs.writeFileSync(filePath, JSON.stringify(mockData, null, 2));

console.log('Data:', JSON.stringify(mockData, null, 2)); // Pretty print the entire data structure
