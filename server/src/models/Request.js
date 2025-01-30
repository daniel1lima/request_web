const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Request = sequelize.define('Request', {
  requestId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  songName: { type: DataTypes.STRING(50) },
  songArtist: { type: DataTypes.STRING(50) },
  songImage: { type: DataTypes.STRING },
  accepted: { type: DataTypes.BOOLEAN, defaultValue: false },
  played: { type: DataTypes.BOOLEAN, defaultValue: false },
  requestUpvotes: { type: DataTypes.INTEGER, defaultValue: 0 },
  userId: { type: DataTypes.UUID }, // Foreign key
  eventId: { type: DataTypes.UUID }, // Foreign key
  paymentId: { type: DataTypes.UUID }, // Foreign key
}, { 
  timestamps: true  // This will add createdAt and updatedAt
});

module.exports = Request;