import { Model, DataTypes } from 'sequelize';
import sequelize from './seq.js';

class ListingAmenities extends Model { }

ListingAmenities.init({



}, {
  sequelize,
  modelName: 'ListingAmenities', // Specify the model name explicitly
  timestamps: false,
});

export default ListingAmenities;
