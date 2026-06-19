import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Goal = sequelize.define('Goal', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    target_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    current_amount: {
      type: DataTypes.DECIMAL(18, 2),
      defaultValue: 0,
    },
    deadline: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  }, {
    tableName: 'goals',
    underscored: true,
  });

  Goal.associate = (models) => {
    Goal.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Goal;
};