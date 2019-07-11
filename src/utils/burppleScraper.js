import BurppleParser from 'node-scraper-burpple';

import logger from '../logger';
import asyncWorker from '../utils/asyncWorker';
import Outlet from '../models/Outlet';

const burppleWorker = asyncWorker({
  initialState: {
    numEntries: undefined,
    page: 1
  },
  maxTimeout: 1000,
  onTriggered: async (prevState = {}) => {
    try {
      const { page } = prevState;

      const entries = await BurppleParser.scrapePage({
        page,
        priceMin: 0,
        priceMax: 90
      });

      if (page % 5 === 0) {
        logger.info(`Scraping page ${page}..`);
      }

      const outletPromises = entries.map(entry => {
        const { id, title, numReviews, price, categories, hasBeyond, genericLoc, link } = entry;
        return Outlet.update(
          { outletId: id },
          {
            outletId: id,
            dateAdded: Date.now(),
            title,
            numReviews,
            price,
            categories,
            hasBeyond,
            genericLoc,
            link
          },
          {
            upsert: true,
            new: true
          }
        );
      });

      await Promise.all(outletPromises);

      return { ...prevState, page: page + 1, numEntries: entries.length };
    } catch (e) {
      logger.error(e);
      logger.error('During page scraping, encountered an exception.  Routine will now terminate.');
    }
  },
  toProceed: async (prevState = {}) => {
    const { numEntries } = prevState;
    return numEntries > 0;
  }
});

const burppleWorkerSingle = asyncWorker({
  initialState: {
    toContinue: true
  },
  maxTimeout: 1000,
  onTriggered: async () => {
    try {
      const outlet = await Outlet.findOne({ location: null });

      if (!outlet) {
        return {
          toContinue: false
        };
      }

      logger.info(`Updating ${outlet.outletId}`);

      const entry = await BurppleParser.scrapeEntry({
        url: outlet.link
      });

      const { address, location } = entry;

      await Outlet.update(
        { outletId: outlet.outletId },
        {
          address,
          location: {
            type: 'Point',
            coordinates: location
          }
        },
        {
          upsert: true,
          new: true
        }
      );

      return {
        toContinue: true
      };
    } catch (e) {
      logger.error(e);
      logger.error(
        'During scraping a single entry, encountered an exception.  Routine will now terminate.'
      );
    }
  },
  toProceed: async (prevState = {}) => {
    const { toContinue } = prevState;
    return toContinue;
  }
});

const burppleScraperTask = () => {
  logger.info('Started Burpple scraping..');
  burppleWorker();
  burppleWorkerSingle();
};

export default burppleScraperTask;
