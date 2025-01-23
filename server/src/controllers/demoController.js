const demoService = require('../services/demoService');

exports.checkDbConnection = async (req, res) => {
    const isConnect = await demoService.testDbConnection();
    res.send(isConnect ? 'connected' : 'unable to connect');
};

exports.getDemoTable = async (req, res) => {
    const tableContent = await demoService.fetchDemotableFromDb();
    res.json({ data: tableContent });
};

exports.initiateDemotable = async (req, res) => {
    const result = await demoService.initiateDemotable();
    res.json({ success: result });
};

exports.insertDemotable = async (req, res) => {
    const { id, name } = req.body;
    const result = await demoService.insertDemotable(id, name);
    res.json({ success: result });
};

exports.updateNameDemotable = async (req, res) => {
    const { oldName, newName } = req.body;
    const result = await demoService.updateNameDemotable(oldName, newName);
    res.json({ success: result });
}; 