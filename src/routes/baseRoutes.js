import { Router } from 'express';
import processEvent from '../utils/chatbotUtils';
import FBMessenger from 'fb-messenger';

const { FACEBOOK_VERIFY_TOKEN, FACEBOOK_ACCESS_TOKEN } = process.env;

const messenger = new FBMessenger({ token: FACEBOOK_ACCESS_TOKEN });

const routes = Router();

// TODO see https://blog.pusher.com/facebook-chatbot-dialogflow/

/**
 * GET home page
 */
routes.get('/', (req, res) => {
  res.json({ message: 'Welcome to starter-backend!' });
});

routes.post('/webhook', async (req, res) => {
  const {
    body: { object, entry }
  } = req;

  if (object === 'page') {
    entry.forEach(entry => {
      const event = entry.messaging[0];
      (async () => {
        await processEvent(event, messenger);
      })();
      res.status(200).send('EVENT_RECEIVED');
    });
  } else {
    res.sendStatus(404);
  }
});

routes.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('hihi');

  if (mode && token) {
    if (mode === 'subscribe' && token === FACEBOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

export default routes;
