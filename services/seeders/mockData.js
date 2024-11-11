import { UUID } from 'uuidjs';
import fs from 'fs';
const listings = Array.from({ length: 10 }, (_, index) => ({
    id: UUID.generate(),
    title: `Listing ${index + 1}`,
    locationId: 'location-1',
    amenities: ['wifi', 'kitchen', 'parking'],
    costPerNight: 100 + index * 10,
    bookings: [],
    reviews: [],
    description: `Listing ${index + 1} description`,
    createdAt: new Date(),
    updatedAt: new Date(),
    host: {
        id: UUID.generate(),
        name: 'Host',
        photo: 'host.jpg',
        bio: 'Host bio',
        listings: [],
        reviews: [],
    },
    pictures: ['pic1.jpg', 'pic2.jpg'],
    checkInDate: new Date(),
    checkOutDate: new Date(),
    reviews: [],
    hostReviews: [],
    guestReviews: [],
    isFeatured: Math.random() < 0.5,
    saleAmount: 0,
    bookingNumber: 0,
    listingStatus: 'available',
    numOfBeds: Math.floor(Math.random() * 5) + 1,
}))

const amenities = Array.from({ length: 30 }, (_, index) => ({
    id: UUID.generate(),
    name: `Amenity ${index + 1}`,
    category: 'outdoors',
    description: `Amenity ${index + 1} description`,
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
    listingAmenities
};
// Output to JSON file (if needed)  

fs.writeFileSync('listingamenity.json', JSON.stringify(mockData, null, 2));

console.log(mockData);  