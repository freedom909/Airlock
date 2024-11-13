import Location from "./models/location.js";
class LocationService {
    constructor({ locationRepository, sequelize }) {
        this.locationRepository = locationRepository;
        this.sequelize = sequelize;
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

    async createLocation(listingInput, { transaction } = {},) {
        try {
            const { location, locationId } = listingInput;
            console.log('Received listingInput:', listingInput);
            // if (!listingInput.context?.isListingCreation) {
            // throw new Error('Cannot create location without listing context');
            //}

            // Validate that location data is provided  
            //if (!location || typeof location !== 'object' || !location.name) {
            // throw new Error('Location data must be provided with at least a name.');
            //}

            // Additional property checks  
            const requiredProps = ['latitude', 'longitude', 'address', 'city', 'state', 'country', 'zipCode'];
            for (const prop of requiredProps) {
                if (!location[prop]) {
                    throw new Error(`Location data must include ${prop}.`);
                }
            }

            let existingLocation = locationId
                ? await this.locationRepository.findByPk(locationId, { transaction })
                : null;

            if (!existingLocation) {
                // Create new location if it doesn't exist  
                existingLocation = await this.locationRepository.create({
                    name: location.name,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: location.address,
                    city: location.city,
                    state: location.state,
                    country: location.country,
                    zipCode: location.zipCode,
                    radius: location.radius,
                    units: location.units,
                }, { transaction });
            }

            return existingLocation; // Return the location (existing or newly created)  

        } catch (error) {
            console.error('Error creating location:', error);
            if (transaction) await transaction.rollback(); // Rollback transaction  
            throw error; // Re-throw the error for further handling  
        }
    }
}

export default LocationService;