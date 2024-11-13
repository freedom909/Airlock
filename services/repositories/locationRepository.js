import connectMysql from "../DB/connectMysqlDB.js";
import Location from "../models/location.js";
class LocationRepository {
    constructor() {
        // No need to pass in `locationRepository` here; it's just the model
        this.model = Location;
    }
    // Define findById method properly using Sequelize's findByPk method

    async create(location, { transaction }) {
        try {
            const newLocation = await this.model.create(location, { transaction });
            console.log('Created location with ID:', newLocation.id);
            return newLocation;
        } catch (error) {
            console.error('Error creating location:', error);
            throw new Error(`Error creating location: ${error.message}`);
        }
    }

    async findById(id) {
        try {
            return await this.model.findByPk(id);
        } catch (error) {
            console.error('Error finding location by ID:', error);
            throw new Error(`Error finding location by ID: ${error.message}`);
        }
    }

    // You can add more methods to this repository like `findOne`, `findAll`, etc.
    async findOne(query) {
        try {
            return await this.model.findOne(query);
        } catch (error) {
            console.error('Error finding location:', error);
            throw new Error(`Error finding location: ${error.message}`);
        }
    }
    async destroy(id) {
        try {
            await this.model.destroy({ where: { id } });
        } catch (error) {
            console.error('Error deleting location:', error);
            throw new Error(`Error deleting location: ${error.message}`);
        }
    }
}

export default LocationRepository;