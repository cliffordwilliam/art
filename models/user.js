'use strict';


const Helper = require('../helper/helper');


const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.Art)
    }
  }
  User.init({
    username: DataTypes.STRING,
    email: {
      type:DataTypes.STRING,
      unique:true, // unique
      allowNull:false, // required
      validate:{
        notNull:{msg:"username required"}, // required
        notEmpty:{msg:"username required"}, // required
          isEmail:{msg:"wrong email format"}, // email format
      }
    },
    password: {
      type:DataTypes.STRING,
      allowNull:false, // required
      validate:{
          notNull:{msg:"password required"}, // required
          notEmpty:{msg:"password required"}, // required
          len:{args:[5,Infinity],msg:"password char len min 5"}, // char len min 5
      }
    },
    role: {
      type:DataTypes.STRING,
      defaultValue: "Staff", // default value
    },
    phoneNumber: DataTypes.STRING,
    address: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  User.beforeCreate(async (user)=>{
    try {
        user.password = await Helper.hashPassword(user.password)
    } catch (error) {
        throw error
    }
})
  return User;
};