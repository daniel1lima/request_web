const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventDJ = sequelize.define('EventDJ', {
  // You can include an ID if you want
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // These must match the foreign key names you specified in the associations
  eventId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  djId: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, { timestamps: true });

module.exports = EventDJ;