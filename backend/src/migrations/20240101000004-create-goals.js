export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('goals', {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(255), allowNull: false },
      target_amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      current_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
      deadline: { type: Sequelize.DATEONLY, allowNull: true },
      icon: { type: Sequelize.STRING(100), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('goals');
  },
};