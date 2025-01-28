const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DJ = sequelize.define('DJ', {
  DJID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  DJName: { type: DataTypes.STRING(50), allowNull: false },
  DJEmail: { type: DataTypes.STRING(50), allowNull: false },
  DJPhone: { type: DataTypes.STRING(50) },
  DJInsta: { type: DataTypes.STRING(100) },
}, { timestamps: false });

module.exports = DJ;