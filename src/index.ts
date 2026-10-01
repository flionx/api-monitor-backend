import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './modules/auth/auth.routes.js';

const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());

app.get('/health', (_, res: Response) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
    })
});

app.use('/api/auth', authRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
