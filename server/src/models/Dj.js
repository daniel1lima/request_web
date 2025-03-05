const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DJ = sequelize.define('DJ', {
  djId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  djName: { type: DataTypes.STRING, allowNull: false },
  djEmail: { type: DataTypes.STRING, allowNull: false },
  djPhone: { type: DataTypes.STRING },
  djInsta: { type: DataTypes.STRING },
  djImageUrl: { type: DataTypes.STRING, defaultValue: "" },
}, { timestamps: true });

module.exports = DJ;