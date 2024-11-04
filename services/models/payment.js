import { DataTypes, Model } from 'sequelize';
import sequelize from './seq.js';

export class Payment extends Model {}

Payment.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  bookingId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Payment',
  timestamps: true,
});

Payment.associate = (models) => {
  Payment.belongsTo(models.Booking, { foreignKey: 'bookingId', as: 'booking' });
};

export default Payment;
