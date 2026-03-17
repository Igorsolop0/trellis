import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { featureRoutes } from './routes/featureRoutes';
import { uploadRoutes } from './routes/uploadRoutes';
import { webhookRoutes } from './routes/webhookRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/features', featureRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', webhookRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
