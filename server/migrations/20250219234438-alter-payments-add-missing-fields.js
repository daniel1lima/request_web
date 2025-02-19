'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Payments', 'requestId', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.addColumn('Payments', 'songName', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.addColumn('Payments', 'albumUrl', {
      type: Sequelize.JSON,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Payments', 'requestId');
    await queryInterface.removeColumn('Payments', 'songName');
    await queryInterface.removeColumn('Payments', 'albumUrl');
  }
};
