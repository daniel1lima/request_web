'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('EventDJs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      // These must match the foreign key names you specified in the associations
      eventId: {
        type: Sequelize.UUID,
        references: {
          model: 'Events',
          key: 'eventId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      djId: {
        type: Sequelize.STRING,
        references: {
          model: 'DJs',
          key: 'djId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add a composite unique constraint to prevent duplicate associations
    await queryInterface.addConstraint('EventDJs', {
      fields: ['eventId', 'djId'],
      type: 'unique',
      name: 'unique_event_dj'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('EventDJs');
  }
};