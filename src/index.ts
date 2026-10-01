import 'dotenv/config';
import express, { type Request, type Response } from 'express';

const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());

app.get('/health', (_, res: Response) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
    })
})

app.listen(PORT, () => {
    console.log(`[server]: Server is running on port ${PORT}`);
})