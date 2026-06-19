import { Op } from 'sequelize';
import models from '../models/index.js';
import { createNotification } from '../services/notificationService.js';

const { Transaction, Category } = models;

export async function getTransactions(req, res) {
  try {
    const { page = 1, limit = 10, search, type, startDate, endDate, categoryId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { user_id: req.user.id };

    if (search) {
      where.description = { [Op.like]: `%${search}%` };
    }
    if (type) {
      where.type = type;
    }
    if (startDate && endDate) {
      where.transaction_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.transaction_date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.transaction_date = { [Op.lte]: endDate };
    }
    if (categoryId) {
      where.category_id = categoryId;
    }

    const { rows, count } = await Transaction.findAndCountAll({
      where,
      include: [{ association: 'category', attributes: ['id', 'name', 'icon', 'color', 'type'] }],
      order: [['transaction_date', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      transactions: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('getTransactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getTransactionById(req, res) {
  try {
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{ association: 'category', attributes: ['id', 'name', 'icon', 'color', 'type'] }],
    });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function createTransaction(req, res) {
  try {
    const { type, amount, description, transaction_date, category_id } = req.body;
    const transaction = await Transaction.create({
      user_id: req.user.id,
      type,
      amount,
      description,
      transaction_date,
      category_id,
    });

    const category = category_id ? await Category.findByPk(category_id) : null;
    const typeLabel = type === 'income' ? 'Thu nhập' : 'Chi tiêu';
    const catName = category ? category.name : 'Khác';
    await createNotification(
      req.user.id,
      'Giao dịch mới',
      `Đã thêm giao dịch ${typeLabel}: ${parseFloat(amount).toLocaleString('vi-VN')}₫ - ${catName}`,
      type
    );

    res.status(201).json(transaction);
  } catch (error) {
    console.error('createTransaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateTransaction(req, res) {
  try {
    const transaction = await Transaction.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    await transaction.update(req.body);
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function deleteTransaction(req, res) {
  try {
    const transaction = await Transaction.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const amount = parseFloat(transaction.amount);
    await transaction.destroy();

    await createNotification(
      req.user.id,
      'Giao dịch đã xóa',
      `Đã xóa giao dịch ${transaction.type === 'income' ? 'thu nhập' : 'chi tiêu'} ${amount.toLocaleString('vi-VN')}₫`,
      'delete'
    );

    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}