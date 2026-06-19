import { Sequelize } from 'sequelize';
import config from '../config/database.js';

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    define: config.define,
    pool: config.pool,
    logging: false,
  }
);

const models = {};

import UserModel from './User.js';
import CategoryModel from './Category.js';
import TransactionModel from './Transaction.js';
import GoalModel from './Goal.js';
import NotificationModel from './Notification.js';
import SettingModel from './Setting.js';

models.User = UserModel(sequelize);
models.Category = CategoryModel(sequelize);
models.Transaction = TransactionModel(sequelize);
models.Goal = GoalModel(sequelize);
models.Notification = NotificationModel(sequelize);
models.Setting = SettingModel(sequelize);

// Associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

export { sequelize };
export default models;