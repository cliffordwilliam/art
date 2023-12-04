'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Art extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User)
      this.belongsTo(models.Type)
    }
  }
  Art.init({
    name: {
      type:DataTypes.STRING,
      allowNull:false, // required
      validate:{
          notNull:{msg:"name required"}, // required
          notEmpty:{msg:"name required"}, // required
      }
    },
    description: {
      type:DataTypes.STRING,
      allowNull:false, // required
      validate:{
          notNull:{msg:"description required"}, // required
          notEmpty:{msg:"description required"}, // required
      }
    },
    price: {
      type:DataTypes.INTEGER,
      allowNull:false, // required
      validate:{
          notNull:{msg:"description required"}, // required
          notEmpty:{msg:"description required"}, // required
          min:{args:[100],msg:"price number min 100"}, // number min 100
      }
    },
    stock: DataTypes.INTEGER,
    imgUrl: DataTypes.STRING,
    TypeId: DataTypes.INTEGER,
    UserId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Art',
  });
  return Art;
};