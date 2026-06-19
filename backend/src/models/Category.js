import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('income', 'expense'),
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  }, {
    tableName: 'categories',
    underscored: true,
  });

  Category.associate = (models) => {
    Category.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Category.hasMany(models.Transaction, { foreignKey: 'category_id', as: 'transactions' });
  };

  return Category;
};