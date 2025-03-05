'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Events', 'acceptFreeRequests', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });

    await queryInterface.changeColumn('Events', 'acceptEmailRequests', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Events', 'acceptFreeRequests', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    });

    await queryInterface.changeColumn('Events', 'acceptEmailRequests', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    });
  }
};
