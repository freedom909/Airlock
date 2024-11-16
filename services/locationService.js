import Location from "./models/location.js";
import { Sequelize, Op } from "sequelize";
class LocationService {
    constructor({ locationRepository, sequelize }) {
        this.locationRepository = locationRepository;
        this.sequelize = sequelize;
        this.Location = this.sequelize.models.Location;
    }

    async getUnMatchLocation(filter = {}) {
        try {
            const locations = await this.Location.findAll({
                where: {
                    match: false,
                    listingId: {
                        [Op.or]: [null, ''], // Matches null or empty string
                    },
                },
                ...filter, // Allows additional filtering criteria
            });
            return locations || [];
        } catch (error) {
            console.error('Error fetching locations:', error);
            throw new Error('Failed to fetch locations');
        }
    }

    async getMatchLocation() {
        try {
            const locations = await this.Location.findAll({
                where: {
                    match: true,
                },
            });
            return locations;
        } catch (error) {
            console.error('Error fetching locations:', error);
            throw new Error('Failed to fetch locations');
        }
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

    async createLocation(locationInput, { context }) {
        console.log("Context in createLocation:", context);
        if (!locationInput) {
            throw new Error('Location input is required but was not provided.');
        }

        console.log('Location Input received in createLocation:', locationInput);
        console.log('Context in createLocation:', context);

        try {
            // Combine locationInput with any additional context
            const location = await this.locationRepository.create({// Error creating location: Error: Failed to create location.
                ...locationInput,
                listingId: context.listingId || null

            });
            console.log("Created location:", location);
            return location;
        } catch (error) {
            console.error('Error creating location:', error);
            throw new Error('Failed to create location.');
        }
    }

}



export default LocationService;