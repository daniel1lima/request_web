const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  paymentId: {
    type: DataTypes.STRING,
    defaultValue: null,
    primaryKey: true
  },
  requestId: { type: DataTypes.STRING, allowNull: false },
  songName: { type: DataTypes.STRING, allowNull: false },
  albumUrl: { type: DataTypes.JSON, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  paymentDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  djId: { type: DataTypes.STRING, allowNull: false }, // Foreign key
}, { timestamps: false });

module.exports = Payment;