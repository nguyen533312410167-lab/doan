import models from '../models/index.js';

const { Setting } = models;

export async function getSettings(req, res) {
  try {
    let settings = await Setting.findOne({ where: { user_id: req.user.id } });
    if (!settings) {
      settings = await Setting.create({ user_id: req.user.id });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateSettings(req, res) {
  try {
    let settings = await Setting.findOne({ where: { user_id: req.user.id } });
    if (!settings) {
      settings = await Setting.create({ user_id: req.user.id });
    }
    await settings.update(req.body);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}