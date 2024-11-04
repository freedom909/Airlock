import { DataTypes } from 'sequelize';
import sequelize from './seq.js'; // Ensure you import your Sequelize instance

const BookingItem = sequelize.define('BookingItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Bookings', // Name of the Bookings model
      key: 'id',
    },
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Items', // Adjust this according to your actual item model
      key: 'id',
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  returnStatus: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  returnRequestStatus: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  refundStatus: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  tableName: 'BookingItems',
});

export default BookingItem;
