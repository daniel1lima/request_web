const User = require('./User');
const DJ = require('./Dj');
const Event = require('./Event');
const Request = require('./Request');
const Payment = require('./Payment');

// Define the many-to-many relationship between Event and DJ with explicit foreign keys
Event.belongsToMany(DJ, { 
  through: 'EventDJs',
  foreignKey: 'eventId',  // This is the name of the column in EventDJs that references Event
  otherKey: 'djId'        // This is the name of the column in EventDJs that references DJ
});

DJ.belongsToMany(Event, { 
  through: 'EventDJs',
  foreignKey: 'djId',     // This is the name of the column in EventDJs that references DJ
  otherKey: 'eventId'     // This is the name of the column in EventDJs that references Event
});

// One-to-many relationship for the main DJ
Event.belongsTo(DJ, { foreignKey: 'djId', as: 'MainDJ' });
DJ.hasMany(Event, { foreignKey: 'djId', as: 'OwnedEvents' });

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