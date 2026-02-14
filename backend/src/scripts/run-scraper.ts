
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../utils/db.js';
import { updateSchemes } from '../services/scheme.service.js';
import { logger } from '../utils/logger.js';

async function runScraper() {
    try {
        await connectDB();
        logger.info('Connected to database. Starting scheme update...');

        const count = await updateSchemes();
        logger.info(`Successfully updated ${count} schemes with the new language data.`);

        process.exit(0);
    } catch (error) {
        logger.error('Error running scraper:', error);
        process.exit(1);
    }
}

runScraper();
