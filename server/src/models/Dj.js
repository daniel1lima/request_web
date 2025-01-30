const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DJ = sequelize.define('DJ', {
  djId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  djName: { type: DataTypes.STRING, allowNull: false },
  djEmail: { type: DataTypes.STRING, allowNull: false },
  djPhone: { type: DataTypes.STRING },
  djInsta: { type: DataTypes.STRING },
}, { timestamps: false });

module.exports = DJ;