const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Waitlist = sequelize.define('Waitlist', {
  email: { type: DataTypes.STRING, allowNull: false, primaryKey: true},
  eventId: { type: DataTypes.STRING, allowNull: true},
  songRequested: { type: DataTypes.STRING, allowNull: true },
}, { timestamps: true });

module.exports = Waitlist;