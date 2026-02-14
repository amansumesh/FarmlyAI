
import cron from 'node-cron';
import { updateSchemes } from '../services/scheme.service.js';
import { logger } from '../utils/logger.js';

export const startSchemeCron = () => {
    // Run every day at mightnight
    cron.schedule('0 0 * * *', async () => {
        logger.info('Running scheme update cron job...');
        try {
            const updatedCount = await updateSchemes();
            logger.info(`Schemes updated successfully. Total: ${updatedCount}`);
        } catch (error) {
            logger.error('Error updating schemes via cron:', error);
        }
    });

    logger.info('Scheme update cron job scheduled (0 0 * * *)');
};
