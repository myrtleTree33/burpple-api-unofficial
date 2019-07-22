import ChopeParser from 'node-scraper-chope';

import { CronJob } from 'cron';

import logger from '../logger';
import asyncWorker from './asyncWorker';
import Outlet from '../models/Outlet';

const chopeWorker = asyncWorker({
  initialState: {
    numEntries: undefined,
    page: 1
  },
  maxTimeout: 1000,
  onTriggered: async (prevState = {}) => {
    try {
    } catch (e) {
      logger.error(e);
      logger.error(
        'During Chope page scraping, encountered an exception.  Routine will now terminate.'
      );
    }
  },
  toProceed: async (prevState = {}) => {
    const { numEntries } = prevState;
    return numEntries > 0;
  }
});

const chopeScraperTask = () => {
  logger.info('Started Chope scraping..');
  chopeWorker();
};

const chopeScraperTaskScheduled = () => {
  const job = new CronJob(
    '1 * */1 * *',
    () => chopeScraperTask(),
    null,
    true,
    'America/Los_Angeles'
  );
  job.start();
  logger.info('Scheduled Chope scraping.');

  chopeScraperTask();
};

export default chopeScraperTaskScheduled;
