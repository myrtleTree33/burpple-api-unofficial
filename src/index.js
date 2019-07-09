// load environment variables
const dotenv = require('dotenv');
dotenv.load();
// import logger
import logger from './logger';
// import app
import app from './app';

const { PORT = 8080 } = process.env;
app.listen(PORT, () => logger.info(`Listening on port ${PORT}`)); // eslint-disable-line no-console
