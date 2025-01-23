const express = require('express');
const demoController = require('../controllers/demoController');

const router = express.Router();

router.get('/check-db-connection', demoController.checkDbConnection);
router.get('/demotable', demoController.getDemoTable);
router.post('/initiate-demotable', demoController.initiateDemotable);
router.post('/insert-demotable', demoController.insertDemotable);
router.post('/update-name-demotable', demoController.updateNameDemotable);

module.exports = router; 