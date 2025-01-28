const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Request = sequelize.define('Request', {
  requestID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fileChanged: { type: DataTypes.INTEGER },
  scopName: { type: DataTypes.STRING(50) },
  scopArtist: { type: DataTypes.STRING(50) },
  scopImage: { type: DataTypes.STRING },
  accepted: { type: DataTypes.BOOLEAN, defaultValue: false },
  played: { type: DataTypes.BOOLEAN, defaultValue: false },
  requestUpvotes: { type: DataTypes.INTEGER, defaultValue: 0 },
  userID: { type: DataTypes.INTEGER }, // Foreign key
  eventID: { type: DataTypes.INTEGER }, // Foreign key
  paymentID: { type: DataTypes.INTEGER }, // Foreign key
}, { timestamps: false });

module.exports = Request;