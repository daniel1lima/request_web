const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  userID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  UserName: { type: DataTypes.STRING(50), allowNull: false },
  userEmail: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(50), allowNull: false },
}, { timestamps: false });

module.exports = User;