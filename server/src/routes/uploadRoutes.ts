import { Router } from 'express';
import multer from 'multer';
import { uploadTestFile } from '../controllers/uploadController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), uploadTestFile);

export const uploadRoutes = router;
