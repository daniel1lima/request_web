const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Request = sequelize.define('Request', {
  requestId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  songName: { type: DataTypes.STRING },
  songArtist: { type: DataTypes.STRING },
  songImage: { type: DataTypes.STRING },
  accepted: { type: DataTypes.BOOLEAN, defaultValue: false },
  played: { type: DataTypes.BOOLEAN, defaultValue: false },
  requestUpvotes: { type: DataTypes.INTEGER, defaultValue: 0 },
  userId: { type: DataTypes.UUID, allowNull: true }, // Foreign key
  eventId: { type: DataTypes.UUID }, // Foreign key
  paymentId: { type: DataTypes.STRING }, // Foreign key
  status: { type: DataTypes.STRING }, 
}, { 
  timestamps: true  // This will add createdAt and updatedAt
});

module.exports = Request;