const User = require('./User');
const DJ = require('./Dj');
const Event = require('./Event');
const Request = require('./Request');
const Payment = require('./Payment');

// DJ-Event (One-to-Many)
DJ.hasMany(Event, { 
    foreignKey: 'DJID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Event.belongsTo(DJ, { foreignKey: 'DJID' });

// DJ-Payment (One-to-Many)
DJ.hasMany(Payment, { 
    foreignKey: 'DJID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Payment.belongsTo(DJ, { foreignKey: 'DJID' });

// User-Request (One-to-Many)
User.hasMany(Request, { 
    foreignKey: 'userID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Request.belongsTo(User, { foreignKey: 'userID' });

// Event-Request (One-to-Many)
Event.hasMany(Request, { 
    foreignKey: 'eventID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Request.belongsTo(Event, { foreignKey: 'eventID' });

// Payment-Request (One-to-One)
Payment.hasOne(Request, { 
    foreignKey: 'paymentID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Request.belongsTo(Payment, { foreignKey: 'paymentID' });

module.exports = { User, DJ, Event, Request, Payment };