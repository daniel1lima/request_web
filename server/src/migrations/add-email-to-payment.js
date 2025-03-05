'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Payments', 'email', {
      type: Sequelize.STRING,
      defaultValue: '',
      allowNull: true,
      after: 'paymentDate'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Payments', 'email');
  }
}; 