import { Model, DataTypes } from 'sequelize';
import sequelize from './seq.js';
import Listing from './listing.js';

class Location extends Model { }

Location.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  radius: {
    type: DataTypes.FLOAT, // Replacing NUMBER with FLOAT
    allowNull: true,
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  zipCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  units: {
    type: DataTypes.ENUM('kilometers', 'miles'),
    defaultValue: 'kilometers',
  },
}, {
  sequelize,
  modelName: 'Location',
  timestamps: false,
});

export default Location;
