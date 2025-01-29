const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DJ = sequelize.define('DJ', {
  DJID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  DJName: { type: DataTypes.STRING, allowNull: false },
  DJEmail: { type: DataTypes.STRING, allowNull: false },
  DJPhone: { type: DataTypes.STRING },
  DJInsta: { type: DataTypes.STRING },
}, { timestamps: false });

module.exports = DJ;