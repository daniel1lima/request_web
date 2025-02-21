'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Requests', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'pending'
    });

    // Update existing rows to have a status
    await queryInterface.sequelize.query(`
      UPDATE "Requests"
      SET status = CASE
        WHEN played = true THEN 'completed'
        WHEN accepted = true THEN 'accepted'
        ELSE 'pending'
      END
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Requests', 'status');
  }
};