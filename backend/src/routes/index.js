import { Router } from 'express';
import { body } from 'express-validator';
import authMiddleware from '../middlewares/auth.js';
import { uploadAvatar } from '../middlewares/upload.js';

import * as authController from '../controllers/authController.js';
import * as categoryController from '../controllers/categoryController.js';
import * as transactionController from '../controllers/transactionController.js';
import * as goalController from '../controllers/goalController.js';
import * as dashboardController from '../controllers/dashboardController.js';
import * as notificationController from '../controllers/notificationController.js';
import * as settingsController from '../controllers/settingsController.js';

const router = Router();

// Auth routes
router.post('/auth/register', [
  body('fullname').notEmpty().withMessage('Fullname is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
], authController.register);

router.post('/auth/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], authController.login);

router.post('/auth/refresh', authController.refresh);
router.post('/auth/auto-login', authController.autoLogin);
router.get('/auth/me', authMiddleware, authController.getMe);

// User profile
router.put('/user/profile', authMiddleware, async (req, res) => {
  try {
    const { fullname, avatar } = req.body;
    const { User } = (await import('../models/index.js')).default;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (fullname) user.fullname = fullname;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();
    res.json({ id: user.id, fullname: user.fullname, email: user.email, avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/user/avatar', authMiddleware, (req, res) => {
  uploadAvatar(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    try {
      const { User } = (await import('../models/index.js')).default;
      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      user.avatar = `/uploads/avatar/${req.file.filename}`;
      await user.save();
      res.json({ avatar: user.avatar });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
});

router.put('/user/change-password', authMiddleware, async (req, res) => {
  try {
    const bcrypt = (await import('bcryptjs')).default;
    const { User } = (await import('../models/index.js')).default;
    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Old password incorrect' });
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Category routes
router.get('/categories', authMiddleware, categoryController.getCategories);
router.post('/categories', authMiddleware, categoryController.createCategory);
router.put('/categories/:id', authMiddleware, categoryController.updateCategory);
router.delete('/categories/:id', authMiddleware, categoryController.deleteCategory);

// Transaction routes
router.get('/transactions', authMiddleware, transactionController.getTransactions);
router.get('/transactions/:id', authMiddleware, transactionController.getTransactionById);
router.post('/transactions', authMiddleware, transactionController.createTransaction);
router.put('/transactions/:id', authMiddleware, transactionController.updateTransaction);
router.delete('/transactions/:id', authMiddleware, transactionController.deleteTransaction);

// Goal routes
router.get('/goals', authMiddleware, goalController.getGoals);
router.post('/goals', authMiddleware, goalController.createGoal);
router.put('/goals/:id', authMiddleware, goalController.updateGoal);
router.delete('/goals/:id', authMiddleware, goalController.deleteGoal);
router.post('/goals/:id/deposit', authMiddleware, goalController.depositGoal);
router.post('/goals/:id/withdraw', authMiddleware, goalController.withdrawGoal);

// Dashboard
router.get('/dashboard', authMiddleware, dashboardController.getDashboardData);

// Notifications
router.get('/notifications', authMiddleware, notificationController.getNotifications);
router.get('/notifications/unread-count', authMiddleware, notificationController.getUnreadCount);
router.put('/notifications/:id/read', authMiddleware, notificationController.markAsRead);
router.put('/notifications/read-all', authMiddleware, notificationController.markAllAsRead);

// Settings
router.get('/settings', authMiddleware, settingsController.getSettings);
router.put('/settings', authMiddleware, settingsController.updateSettings);

export default router;