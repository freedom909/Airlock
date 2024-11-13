import { Model, DataTypes } from 'sequelize';
import sequelize from './seq.js';

class Location extends Model { }

Location.init({
  id: {
    type: DataTypes.UUID,  // UUID type
    defaultValue: DataTypes.UUIDV4,  // Auto-generate UUID
    allowNull: false,
    primaryKey: true
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
  tableName: 'Locations',
  timestamps: false,
});

export default Location;
