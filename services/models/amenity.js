
import { Model, DataTypes } from 'sequelize';
import sequelize from './seq.js'; // Adjust the path as necessary

class Amenity extends Model { }


Amenity.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false, // Category should not be null
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false, // Name should not be null
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false, // Description should not be null
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,

  },
}, {
  sequelize,
  modelName: 'Amenity',
  tableName: 'amenities', // Specify table name if different from model name
  timestamps: true, // Automatically manages createdAt and updatedAt
});

export default Amenity;
