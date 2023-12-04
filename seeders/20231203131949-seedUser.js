'use strict';


const Helper = require('../helper/helper');


/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // hash here because UP is not caught by before create
    await queryInterface.bulkInsert('Users', [
        {
            username: 'ryoko',
            email: 'ryoko@gmail.com',
            password: await Helper.hashPassword("password"),
            role: 'Admin',
            phoneNumber: '+1 123-456-7890',
            address: '1 Love Lane, Anime City',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ],{})
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {})
  }
};
