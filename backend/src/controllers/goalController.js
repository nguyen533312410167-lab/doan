import { Op } from 'sequelize';
import models from '../models/index.js';
import { createNotification } from '../services/notificationService.js';

const { Goal } = models;

export async function getGoals(req, res) {
  try {
    const goals = await Goal.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });
    const result = goals.map(g => {
      const target = parseFloat(g.target_amount);
      const current = parseFloat(g.current_amount);
      const progressPercent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
      let daysLeft = null;
      if (g.deadline) {
        const diff = new Date(g.deadline) - new Date();
        daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }
      return {
        ...g.toJSON(),
        progressPercent: Math.round(progressPercent),
        daysLeft,
      };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function createGoal(req, res) {
  try {
    const { name, target_amount, deadline, icon } = req.body;
    const goal = await Goal.create({
      user_id: req.user.id,
      name,
      target_amount,
      current_amount: 0,
      deadline,
      icon,
    });

    await createNotification(
      req.user.id,
      'Mục tiêu mới',
      `Đã tạo mục tiêu "${name}" với số tiền ${parseFloat(target_amount).toLocaleString('vi-VN')}₫`,
      'goal'
    );

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateGoal(req, res) {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    await goal.update(req.body);
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function deleteGoal(req, res) {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    await goal.destroy();

    await createNotification(
      req.user.id,
      'Mục tiêu đã xóa',
      `Đã xóa mục tiêu "${goal.name}"`,
      'delete'
    );

    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function depositGoal(req, res) {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const { amount } = req.body;
    const newAmount = Math.min(
      parseFloat(goal.target_amount),
      parseFloat(goal.current_amount) + parseFloat(amount)
    );
    await goal.update({ current_amount: newAmount });

    await createNotification(
      req.user.id,
      'Nạp tiền vào mục tiêu',
      `Đã nạp ${parseFloat(amount).toLocaleString('vi-VN')}₫ vào mục tiêu "${goal.name}"`,
      'goal_deposit'
    );

    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function withdrawGoal(req, res) {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const { amount } = req.body;
    const current = parseFloat(goal.current_amount);
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount > current) {
      return res.status(400).json({ message: 'Insufficient balance in goal' });
    }

    await goal.update({ current_amount: current - withdrawAmount });

    await createNotification(
      req.user.id,
      'Rút tiền từ mục tiêu',
      `Đã rút ${withdrawAmount.toLocaleString('vi-VN')}₫ từ mục tiêu "${goal.name}"`,
      'goal_withdraw'
    );

    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}