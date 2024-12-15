const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.get('/', (req, res) => {
  res.send('Backend is alive');
});


const PORT = process.env.PORT || 3000; // Используем порт из переменных окружения или 3000
const MESSAGES_FILE = 'messages.json';

// Функция для загрузки сообщений из файла
const loadMessages = () => {
  try {
    if (!fs.existsSync(MESSAGES_FILE)) {
      fs.writeFileSync(MESSAGES_FILE, '[]');
    }
    const data = fs.readFileSync(MESSAGES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading messages:', err);
    return [];
  }
};

// Функция для сохранения сообщений в файл
const saveMessages = (messages) => {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
};

// Инициализация сообщений
let messages = loadMessages();

// Маршрут для сервирования клиента
app.use(express.static('public'));

// События socket.io
io.on('connection', (socket) => {
  console.log('A user connected');

  // Отправляем историю сообщений новому клиенту
  socket.emit('chat history', messages);

  // Получение нового сообщения
  socket.on('new message', (msg) => {
    const message = { text: msg, timestamp: new Date() };
    messages.push(message);
    saveMessages(messages);

    // Рассылаем новое сообщение всем клиентам
    io.emit('new message', message);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Запуск сервера
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
