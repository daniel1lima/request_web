const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  paymentId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  paymentDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  djId: { type: DataTypes.UUID, allowNull: false }, // Foreign key
}, { timestamps: false });

module.exports = Payment;
