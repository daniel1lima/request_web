const User = require('./User');
const DJ = require('./dj');
const Event = require('./Event');
const Request = require('./Request');
const Payment = require('./Payment');

// DJ-Event (One-to-Many)
DJ.hasMany(Event, { foreignKey: 'DJID' });
Event.belongsTo(DJ, { foreignKey: 'DJID' });

// User-Request (One-to-Many)
User.hasMany(Request, { foreignKey: 'userID' });
Request.belongsTo(User, { foreignKey: 'userID' });

// Event-Request (One-to-Many)
Event.hasMany(Request, { foreignKey: 'eventID' });
Request.belongsTo(Event, { foreignKey: 'eventID' });

// DJ-Payment (One-to-Many)
DJ.hasMany(Payment, { foreignKey: 'DJID' });
Payment.belongsTo(DJ, { foreignKey: 'DJID' });

// Payment-Request (One-to-One)
Payment.hasOne(Request, { foreignKey: 'paymentID' });
Request.belongsTo(Payment, { foreignKey: 'paymentID' });