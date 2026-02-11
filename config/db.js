const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Task = require('../models/Task');
const User = require('../models/User');

const seedTasksData = [
  { title: 'Подготовить презентацию', description: 'Слайды для итоговой защиты', status: 'in-progress', priority: 'high', category: 'Учёба', assignee: 'Turar', dueDate: '2026-02-05', tags: ['slides', 'defense'] },
  { title: 'Написать README', description: 'Описать установку и деплой', status: 'pending', priority: 'medium', category: 'Документация', assignee: 'Alkhan', tags: ['docs'] },
  { title: 'Проверить CRUD UI', description: 'Создание/редактирование/удаление задач', status: 'pending', priority: 'high', category: 'Тесты', assignee: 'Turar', tags: ['ui', 'qa'] },
  { title: 'Настроить Render env', description: 'Добавить MONGO_URI в переменные', status: 'done', priority: 'critical', category: 'Деплой', assignee: 'Turar', tags: ['deploy'] },
  { title: 'Добавить auth middleware', description: 'Защита POST/PUT/DELETE', status: 'pending', priority: 'high', category: 'Безопасность', assignee: 'Alkhan', tags: ['auth', 'security'] },
  { title: 'Хеширование пароля', description: 'bcrypt для пользователей', status: 'pending', priority: 'high', category: 'Безопасность', assignee: 'Turar', tags: ['password', 'bcrypt'] },
  { title: 'Создать тестового админа', description: 'admin@example.com / admin123', status: 'pending', priority: 'medium', category: 'Учёба', assignee: 'Alkhan', tags: ['seed', 'user'] },
  { title: 'Валидация задач', description: 'Проверка обязательных полей', status: 'in-progress', priority: 'medium', category: 'Код', assignee: 'Turar', tags: ['validation'] },
  { title: 'Логирование ошибок', description: 'Без падений на неверных данных', status: 'pending', priority: 'medium', category: 'Код', assignee: 'Turar' },
  { title: 'Обновить DEFENSE.md', description: 'Добавить шаги по сессиям', status: 'pending', priority: 'medium', category: 'Документация', assignee: 'Alkhan', tags: ['defense'] },
  { title: 'Добавить категории задач', description: 'Категории Учёба/Деплой/Код', status: 'pending', priority: 'low', category: 'Идеи', assignee: 'Turar' },
  { title: 'Проверить cookie флаги', description: 'HttpOnly и Secure в проде', status: 'pending', priority: 'high', category: 'Безопасность', assignee: 'Alkhan', tags: ['cookie'] },
  { title: 'UI поля приоритет/дата', description: 'Добавить в форму и таблицу', status: 'pending', priority: 'medium', category: 'UI', assignee: 'Turar', tags: ['ui'] },
  { title: 'Тест на мобильном', description: 'Проверить адаптивность', status: 'pending', priority: 'low', category: 'Тесты', assignee: 'Alkhan' },
  { title: 'Настроить сессии', description: 'express-session + MongoStore', status: 'pending', priority: 'critical', category: 'Безопасность', assignee: 'Turar', tags: ['session'] },
  { title: 'Проверить сетевые правила Atlas', description: '0.0.0.0/0 для Render', status: 'done', priority: 'medium', category: 'Деплой', assignee: 'Turar', tags: ['atlas'] },
  { title: 'Генерик ошибки авторизации', description: 'Сообщение Invalid credentials', status: 'pending', priority: 'medium', category: 'Безопасность', assignee: 'Alkhan' },
  { title: 'HTTP коды на API', description: '400/401/500 по стандарту', status: 'pending', priority: 'medium', category: 'Код', assignee: 'Turar', tags: ['http'] },
  { title: 'Создать демо-теги', description: 'tags: deploy, ui, docs', status: 'pending', priority: 'low', category: 'Данные', assignee: 'Alkhan' },
  { title: 'Проверить статус done', description: 'Закрыть задачи после проверки', status: 'pending', priority: 'low', category: 'Учёба', assignee: 'Turar' }
];

async function seedTasksIfNeeded(owners) {
  const count = await Task.countDocuments();
  if (count >= 20) return;
  const existingTitles = new Set((await Task.find({}, 'title')).map((t) => t.title));
  const toInsert = seedTasksData.filter((t) => !existingTitles.has(t.title));
  if (toInsert.length) {
    const withOwners = toInsert.map((t, index) => ({
      ...t,
      owner: owners[index % owners.length]
    }));
    await Task.insertMany(withOwners);
    console.log(`Seeded ${toInsert.length} tasks`);
  }
}

async function ensureAdminUser() {
  const existing = await User.findOne({ email: 'admin@example.com' });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash('admin123', 10);
  const user = await User.create({
    email: 'admin@example.com',
    passwordHash,
    name: 'Admin User',
    role: 'admin'
  });
  console.log('Seeded admin user: admin@example.com / admin123');
  return user;
}

async function ensureNamedUser(email, password, name) {
  const existing = await User.findOne({ email });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    passwordHash,
    name,
    role: 'user'
  });
  console.log(`Seeded user: ${email} / ${password}`);
  return user;
}

async function connectDB(mongoUri) {
  await mongoose.connect(mongoUri, {});
  console.log('MongoDB connected');
  await ensureAdminUser();
  const turar = await ensureNamedUser('turar@example.com', 'turar123', 'Turar Nurbauli');
  const alkhan = await ensureNamedUser('alkhan@example.com', 'alkhan123', 'Alkhan Almas');
  await seedTasksIfNeeded([turar._id, alkhan._id]);
}

module.exports = {
  connectDB
};

