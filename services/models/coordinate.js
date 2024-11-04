import { Model, DataTypes } from 'sequelize';
import sequelize from './seq.js'; // Correct path to seq.js
import Listing from './listing.js';

class Coordinate extends Model { }

Coordinate.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    radius: {
        type: DataTypes.FLOAT,
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    listingId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'Listings',
            key: 'id',
        },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize,
    modelName: 'Coordinate',
    timestamps: true,
});

export default Coordinate;