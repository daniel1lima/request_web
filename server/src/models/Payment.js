const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  paymentId: {
    type: DataTypes.STRING,
    defaultValue: null,
    primaryKey: true
  },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  paymentDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  email: { type: DataTypes.STRING, defaultValue: '' },
  phone: { type: DataTypes.STRING, defaultValue: '' },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  djId: { type: DataTypes.STRING, allowNull: false }, // Foreign key
}, { timestamps: true });

module.exports = Payment;


