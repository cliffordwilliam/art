'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Type extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.Art)
    }
  }
  Type.init({
    name: {
      type:DataTypes.STRING,
      allowNull:false, // required
      validate:{
          notNull:{msg:"username required"}, // required
          notEmpty:{msg:"username required"}, // required
      }
  },
  }, {
    sequelize,
    modelName: 'Type',
  });
  return Type;
};