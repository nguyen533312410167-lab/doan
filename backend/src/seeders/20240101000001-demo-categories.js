export default {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('categories', [
      { name: 'Ăn uống', type: 'expense', icon: 'coffee', color: '#F59E0B', created_at: new Date(), updated_at: new Date() },
      { name: 'Di chuyển', type: 'expense', icon: 'car', color: '#8B5CF6', created_at: new Date(), updated_at: new Date() },
      { name: 'Giải trí', type: 'expense', icon: 'gamepad', color: '#EC4899', created_at: new Date(), updated_at: new Date() },
      { name: 'Mua sắm', type: 'expense', icon: 'shopping-bag', color: '#F97316', created_at: new Date(), updated_at: new Date() },
      { name: 'Sức khỏe', type: 'expense', icon: 'heart', color: '#EF4444', created_at: new Date(), updated_at: new Date() },
      { name: 'Hóa đơn', type: 'expense', icon: 'file-text', color: '#06B6D4', created_at: new Date(), updated_at: new Date() },
      { name: 'Lương', type: 'income', icon: 'briefcase', color: '#22C55E', created_at: new Date(), updated_at: new Date() },
      { name: 'Kinh doanh', type: 'income', icon: 'trending-up', color: '#10B981', created_at: new Date(), updated_at: new Date() },
      { name: 'Freelance', type: 'income', icon: 'code', color: '#3B82F6', created_at: new Date(), updated_at: new Date() },
      { name: 'Làm thêm', type: 'income', icon: 'clock', color: '#6366F1', created_at: new Date(), updated_at: new Date() },
      { name: 'Hỗ trợ gia đình', type: 'income', icon: 'home', color: '#14B8A6', created_at: new Date(), updated_at: new Date() },
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('categories', null, {});
  },
};