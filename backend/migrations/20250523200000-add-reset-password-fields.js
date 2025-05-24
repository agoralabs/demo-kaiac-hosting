'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // await queryInterface.addColumn('users', 'reset_password_token', {
    //   type: Sequelize.STRING,
    //   allowNull: true
    // });

    // await queryInterface.addColumn('users', 'reset_password_expires', {
    //   type: Sequelize.DATE,
    //   allowNull: true
    // });

    // // Ajouter un index pour optimiser les recherches par token
    // await queryInterface.addIndex('users', ['reset_password_token']);
  },

  down: async (queryInterface, Sequelize) => {
    // await queryInterface.removeIndex('users', ['reset_password_token']);
    // await queryInterface.removeColumn('users', 'reset_password_expires');
    // await queryInterface.removeColumn('users', 'reset_password_token');
  }
};
