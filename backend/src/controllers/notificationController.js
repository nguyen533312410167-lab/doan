import { Op } from 'sequelize';
import models from '../models/index.js';

const { Notification } = models;

export async function getNotifications(req, res) {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { user_id: req.user.id };

    if (type && type !== 'all') {
      where.type = type;
    }

    const { rows, count } = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      notifications: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    await Notification.update({ is_read: true }, { where: { id, user_id: req.user.id } });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function markAllAsRead(req, res) {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.user.id, is_read: false } });
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getUnreadCount(req, res) {
  try {
    const count = await Notification.count({ where: { user_id: req.user.id, is_read: false } });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}