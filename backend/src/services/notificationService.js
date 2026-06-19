import models from '../models/index.js';

const { Notification } = models;

export async function createNotification(userId, title, message, type) {
  try {
    await Notification.create({
      user_id: userId,
      title,
      message,
      type,
    });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
}