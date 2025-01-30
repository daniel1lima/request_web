const User = require('./User');
const DJ = require('./Dj');
const Event = require('./Event');
const Request = require('./Request');
const Payment = require('./Payment');

// DJ-Event (One-to-Many)
DJ.hasMany(Event, { 
    foreignKey: 'djId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Event.belongsTo(DJ, { foreignKey: 'djId' });

// DJ-Payment (One-to-Many)
DJ.hasMany(Payment, { 
    foreignKey: 'djId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Payment.belongsTo(DJ, { foreignKey: 'djId' });

// User-Request (One-to-Many)
User.hasMany(Request, { 
    foreignKey: 'userId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Request.belongsTo(User, { foreignKey: 'userId' });

// Event-Request (One-to-Many)
Event.hasMany(Request, { 
    foreignKey: 'eventId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Request.belongsTo(Event, { foreignKey: 'eventId' });

// Payment-Request (One-to-One)
Payment.hasOne(Request, { 
    foreignKey: 'paymentId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Request.belongsTo(Payment, { foreignKey: 'paymentId' });

module.exports = { User, DJ, Event, Request, Payment };