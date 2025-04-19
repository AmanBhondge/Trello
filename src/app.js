import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import http from 'http';

import { PORT } from './config/config.js';
import connectToDatabase from './config/db.js';
import errorMiddleware from './middlewares/error.middleware.js';
import { initSocket } from './sockets/socket.js';

import authRouter from './routes/auth.route.js';
import userRouter from './routes/user.route.js';
import boardRouter from './routes/board.route.js';
import columnRouter from './routes/column.route.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/board", boardRouter);
app.use("/api/v1/column", columnRouter);


// Error Middleware
app.use(errorMiddleware);

// HTTP Server & Socket.IO
const server = http.createServer(app);
initSocket(server); // Initializes socket.io on the server

// Start Server
const startServer = async () => {
    await connectToDatabase();

    server.listen(PORT, () => {
        console.log(`🚀 API is running on http://localhost:${PORT}`);
    });
};

startServer();

export default app;
