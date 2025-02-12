const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  eventId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  eventName: { type: DataTypes.STRING, allowNull: false },
  eventImage: { type: DataTypes.STRING }, // Store image path
  eventDateTime: { type: DataTypes.DATE, allowNull: false },
  eventLocation: { type: DataTypes.STRING, allowNull: false },
  requestFee: { type: DataTypes.FLOAT, allowNull: false },
  djId: { type: DataTypes.STRING, allowNull: false }, // Foreign key
}, { timestamps: true });

module.exports = Event;