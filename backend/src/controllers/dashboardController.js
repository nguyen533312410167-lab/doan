import { Op, fn, col, literal } from 'sequelize';
import models from '../models/index.js';

const { Transaction, Goal } = models;

export async function getDashboardData(req, res) {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Current month stats
    const monthTransactions = await Transaction.findAll({
      where: {
        user_id: userId,
        transaction_date: { [Op.between]: [startOfMonth, endOfMonth] },
      },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    monthTransactions.forEach(t => {
      const amt = parseFloat(t.amount);
      if (t.type === 'income') totalIncome += amt;
      else totalExpense += amt;
    });
    const balance = totalIncome - totalExpense;

    // All-time balance
    const allTransactions = await Transaction.findAll({ where: { user_id: userId } });
    let allIncome = 0;
    let allExpense = 0;
    allTransactions.forEach(t => {
      const amt = parseFloat(t.amount);
      if (t.type === 'income') allIncome += amt;
      else allExpense += amt;
    });
    const currentBalance = allIncome - allExpense;

    // Expense by category (pie chart)
    const expenseByCategory = await Transaction.findAll({
      where: { user_id: userId, type: 'expense' },
      include: [{ association: 'category', attributes: ['name', 'color', 'icon'] }],
      attributes: ['category_id', [fn('SUM', col('amount')), 'total']],
      group: ['category_id', 'category.id', 'category.name', 'category.color', 'category.icon'],
    });

    // Monthly income vs expense (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      const monthTxns = await Transaction.findAll({
        where: { user_id: userId, transaction_date: { [Op.between]: [start, end] } },
      });

      let inc = 0, exp = 0;
      monthTxns.forEach(t => {
        const amt = parseFloat(t.amount);
        if (t.type === 'income') inc += amt;
        else exp += amt;
      });

      monthlyData.push({
        month: `T${d.getMonth() + 1}`,
        income: inc,
        expense: exp,
      });
    }

    // Recent transactions
    const recentTransactions = await Transaction.findAll({
      where: { user_id: userId },
      include: [{ association: 'category', attributes: ['id', 'name', 'icon', 'color'] }],
      order: [['created_at', 'DESC']],
      limit: 5,
    });

    // Goals summary
    const goals = await Goal.findAll({ where: { user_id: userId } });
    const savingProgress = goals.reduce((acc, g) => {
      const target = parseFloat(g.target_amount);
      const current = parseFloat(g.current_amount);
      return { target: acc.target + target, current: acc.current + current };
    }, { target: 0, current: 0 });

    res.json({
      currentBalance,
      totalIncome: allIncome,
      totalExpense: allExpense,
      monthIncome: totalIncome,
      monthExpense: totalExpense,
      balance,
      savingProgress,
      expenseByCategory,
      monthlyData,
      recentTransactions,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}