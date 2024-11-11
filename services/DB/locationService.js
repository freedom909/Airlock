import Location from "./models/location.js";
class LocationService {
    constructor(listingRepository) {
        this.listingRepository = listingRepository;
        this.Location = Location;
    }

    async getAllLocations() {
        try {
            const locations = await this.Location.findAll();
            return locations;
        } catch (error) {
            console.error('Error fetching locations:', error);
            throw new Error('Failed to fetch locations');
        }
    }
    async getLocationById(id) {
        const location = await Location.findOne(id)
        return location;
    }

    async createLocation(name) {
        const location = new Location(name)
        await location.save()
        return location;
    }
    async updateLocation(id, name) {
        const location = await this.listingRepository.findByIdAndUpdate(id, { name })
        return location;
    }
}

export default LocationService;