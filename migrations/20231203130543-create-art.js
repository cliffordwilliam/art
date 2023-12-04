'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Arts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull:false, // required
      },
      description: {
        type: Sequelize.STRING,
        allowNull:false, // required
      },
      price: {
        type: Sequelize.INTEGER,
        allowNull:false, // required
        validate:{
            min:100, // number min 100
        },
      },
      stock: {
        type: Sequelize.INTEGER
      },
      imgUrl: {
        type: Sequelize.STRING
      },
      TypeId: {
        type: Sequelize.INTEGER,
        references:{model:"Types",key:"id"}, // fk
        onUpdate:"cascade", // fk
        onDelete:"cascade", // fk
      },
      UserId: {
        type: Sequelize.INTEGER,
        references:{model:"Users",key:"id"}, // fk
        onUpdate:"cascade", // fk
        onDelete:"cascade", // fk
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Arts');
  }
};