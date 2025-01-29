const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  eventID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  eventName: { type: DataTypes.STRING, allowNull: false },
  eventImage: { type: DataTypes.STRING }, // Store image path
  eventDateTime: { type: DataTypes.DATE, allowNull: false },
  eventLocation: { type: DataTypes.STRING, allowNull: false },
  requestFee: { type: DataTypes.FLOAT, allowNull: false },
  DJID: { type: DataTypes.INTEGER, allowNull: false }, // Foreign key
}, { timestamps: false });

module.exports = Event;