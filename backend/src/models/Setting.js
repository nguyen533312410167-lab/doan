import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Setting = sequelize.define('Setting', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
    },
    dark_mode: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    notification_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'VND',
    },
  }, {
    tableName: 'settings',
    underscored: true,
  });

  Setting.associate = (models) => {
    Setting.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Setting;
};