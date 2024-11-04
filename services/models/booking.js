import { DataTypes, Model } from 'sequelize';
import sequelize from './seq.js';

export class Booking extends Model { }

Booking.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  checkInDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  checkOutDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'UPCOMING', 'PAST'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  guestId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  listingId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Booking',
  timestamps: true,
});

Booking.associate = (models) => {
  Booking.belongsTo(models.User, { foreignKey: 'guestId', as: 'guest' });
  Booking.belongsTo(models.Listing, { foreignKey: 'listingId', as: 'listing' });
};

export default Booking;
