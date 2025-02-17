'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Events', 'acceptRequests', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    });
    await queryInterface.addColumn('Events', 'acceptFreeRequests', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Events', 'acceptRequests');
    await queryInterface.removeColumn('Events', 'acceptFreeRequests');
  }
};



