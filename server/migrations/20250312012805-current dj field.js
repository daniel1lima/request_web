'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the currentDjId column to the Events table
    await queryInterface.addColumn('Events', 'currentDjId', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'djId' // Position the column after djId
    });
    
    // Optionally, you can set the initial value of currentDjId to be the same as djId
    await queryInterface.sequelize.query(`
      UPDATE "Events"
      SET "currentDjId" = "djId" 
      WHERE "currentDjId" IS NULL
    `);
    
    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the currentDjId column if we need to rollback
    await queryInterface.removeColumn('Events', 'currentDjId');
    return Promise.resolve();
  }
};