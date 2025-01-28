To build an Express.js backend for your ERD, follow these steps:

### 1. Project Setup
```bash
mkdir dj-backend && cd dj-backend
npm init -y
npm install express sequelize pg pg-hstore cors
npm install --save-dev nodemon
```

### 2. Database Configuration (`config/database.js`)
```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('database_name', 'username', 'password', {
  host: 'localhost',
  dialect: 'postgres',
});

module.exports = sequelize;
```

### 3. Define Models

#### User Model (`models/User.js`)
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  userID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  UserName: { type: DataTypes.STRING(50), allowNull: false },
  userEmail: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(50), allowNull: false },
}, { timestamps: false });

module.exports = User;
```

#### DJ Model (`models/DJ.js`)
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DJ = sequelize.define('DJ', {
  DJID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  DJName: { type: DataTypes.STRING(50), allowNull: false },
  DJEmail: { type: DataTypes.STRING(50), allowNull: false },
  DJPhone: { type: DataTypes.STRING(50) },
  DJInsta: { type: DataTypes.STRING(100) },
}, { timestamps: false });

module.exports = DJ;
```

#### Event Model (`models/Event.js`)
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  eventID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  eventName: { type: DataTypes.STRING(50), allowNull: false },
  eventImage: { type: DataTypes.STRING }, // Store image path
  eventDateTime: { type: DataTypes.DATE, allowNull: false },
  eventLocation: { type: DataTypes.STRING(100), allowNull: false },
  requestFee: { type: DataTypes.INTEGER, allowNull: false },
  DJID: { type: DataTypes.INTEGER, allowNull: false }, // Foreign key
}, { timestamps: false });

module.exports = Event;
```

#### Payment Model (`models/Payment.js`)
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  paymentID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  amount: { type: DataTypes.INTEGER, allowNull: false },
  paymentDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  DJID: { type: DataTypes.INTEGER, allowNull: false }, // Foreign key
}, { timestamps: false });

module.exports = Payment;
```

#### Request Model (`models/Request.js`)
```javascript
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
```

### 4. Model Associations (`models/index.js`)
```javascript
const User = require('./User');
const DJ = require('./DJ');
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
```

### 5. Create Routes

#### Event Routes (`routes/events.js`)
```javascript
const express = require('express');
const router = express.Router();
const { Event } = require('../models');

// Get all events
router.get('/', async (req, res) => {
  const events = await Event.findAll();
  res.json(events);
});

// Create event
router.post('/', async (req, res) => {
  try {
    const newEvent = await Event.create(req.body);
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Other routes (GET by ID, PUT, DELETE) follow similarly...
```

#### Request Route Example (POST with Payment)
```javascript
router.post('/', async (req, res) => {
  try {
    const { userID, eventID, ...requestData } = req.body;

    // Get event details
    const event = await Event.findByPk(eventID);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Create payment
    const payment = await Payment.create({
      amount: event.requestFee,
      DJID: event.DJID,
      status: 'pending',
    });

    // Create request
    const request = await Request.create({
      userID,
      eventID,
      paymentID: payment.paymentID,
      ...requestData,
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 6. Initialize Server (`app.js`)
```javascript
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const app = express();

// Sync database
sequelize.sync({ force: false }).then(() => {
  console.log('Database synced');
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/events', require('./routes/events'));
app.use('/requests', require('./routes/requests'));
// Add other routes...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 7. Run the Application
```bash
nodemon app.js
```

### Key Notes:
- **Database**: Uses PostgreSQL with Sequelize ORM.
- **Associations**: Properly handles one-to-many and one-to-one relationships.
- **Image Handling**: Stores image paths (use `multer` for file uploads).
- **Error Handling**: Basic error handling included; enhance as needed.
- **Security**: Add authentication/authorization (e.g., JWT) and password hashing in production.

This setup provides a RESTful API to interact with your ERD entities. Test endpoints using Postman or curl.