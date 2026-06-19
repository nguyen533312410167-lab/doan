export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transactions', {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      category_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: 'categories', key: 'id' }, onDelete: 'SET NULL' },
      type: { type: Sequelize.ENUM('income', 'expense'), allowNull: false },
      amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      transaction_date: { type: Sequelize.DATEONLY, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('transactions', ['user_id']);
    await queryInterface.addIndex('transactions', ['category_id']);
    await queryInterface.addIndex('transactions', ['transaction_date']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('transactions');
  },
};