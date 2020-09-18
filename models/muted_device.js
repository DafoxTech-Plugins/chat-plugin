'use strict'
var model_name = 'MutedDevice'
var table_name = 'muted_devices'
var opts = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  timestamps: true,
  tableName: table_name
}

module.exports = (sequelize, Sequelize) => {
  var model = sequelize.define(model_name, {
    machine_id: {
      type: Sequelize.STRING
    },
    mobile_device_id: {
      type: Sequelize.INTEGER,
    },
    muted_at: {
      type: Sequelize.DATE
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE
    }
  }, opts);

  return model;
}
