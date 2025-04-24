import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import http from 'http';

import { PORT } from './config/config.js';
import connectToDatabase from './config/db.js';
import errorMiddleware from './middlewares/error.middleware.js';
import { initSocket, io } from './sockets/socket.js';

import authRouter from './routes/auth.route.js';
import userRouter from './routes/user.route.js';
import boardRouter from './routes/board.route.js';
import columnRouter from './routes/column.route.js';
import taskRouter from './routes/task.route.js';

const app = express();

app.use(cors({
  origin: "https://trello-sigma-pearl.vercel.app",
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/board", boardRouter);
app.use("/api/v1/column", columnRouter);
app.use("/api/v1/task", taskRouter);

app.use(errorMiddleware);

const server = http.createServer(app);
initSocket(server);

const startServer = async () => {
  await connectToDatabase();
  server.listen(PORT, () => {
    console.log(`🚀 API is running on http://localhost:${PORT}`);
  });
};

startServer();

export default app;