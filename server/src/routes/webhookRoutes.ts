import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Jira webhook — creates/updates a Feature from Jira issue
router.post('/webhook/jira', async (req, res) => {
    try {
        const issue = req.body?.issue;
        if (!issue) {
            return res.status(400).json({ error: 'Invalid Jira payload format' });
        }

        const name = issue.fields?.summary;
        const description = issue.fields?.description;
        const category = 'Imported';

        const feature = await prisma.feature.create({
            data: { name, description, category },
        });

        console.log(`Successfully synced Jira Feature: ${issue.key} -> ${feature.id}`);
        res.status(200).json({ message: 'Feature synced successfully', featureId: feature.id });
    } catch (e: any) {
        console.error('Failed to sync Jira webhook:', e.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export const webhookRoutes = router;
