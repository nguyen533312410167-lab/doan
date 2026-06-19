import bcrypt from 'bcryptjs';

export default {
  up: async (queryInterface) => {
    const hashedPassword = await bcrypt.hash('123456789', 12);
    await queryInterface.bulkInsert('users', [
      {
        fullname: 'admin',
        email: 'admin@financemanager.com',
        password: hashedPassword,
        avatar: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Also create default settings for admin
    const [user] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@financemanager.com' LIMIT 1`
    );
    if (user && user.length > 0) {
      await queryInterface.bulkInsert('settings', [
        {
          user_id: user[0].id,
          currency: 'VND',
          language: 'vi',
          theme: 'light',
          notifications_enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', { email: 'admin@financemanager.com' }, {});
    await queryInterface.bulkDelete('settings', { user_id: null }, {});
  },
};