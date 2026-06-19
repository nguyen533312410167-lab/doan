import models from '../models/index.js';

const { Category } = models;

export async function getCategories(req, res) {
  try {
    const categories = await Category.findAll({
      where: { user_id: [req.user.id, null] },
      order: [['type', 'ASC'], ['name', 'ASC']],
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function createCategory(req, res) {
  try {
    const { name, type, icon, color } = req.body;
    const category = await Category.create({ user_id: req.user.id, name, type, icon, color });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const category = await Category.findOne({ where: { id, user_id: req.user.id } });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await category.update(req.body);
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const category = await Category.findOne({ where: { id, user_id: req.user.id } });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await category.destroy();
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}