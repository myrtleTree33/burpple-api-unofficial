import { SessionsClient } from 'dialogflow';
import TransientMap from './TransientMap';
import getLatLng from './locServices';

const {
  DIALOGFLOW_PRIVATE_KEY,
  DIALOGFLOW_CLIENT_EMAIL,
  DIALOGFLOW_PROJECT_ID,
  DIALOGFLOW_LANG_CODE
} = process.env;

const map = new TransientMap({ expiry: 600000 });

const sessionClient = new SessionsClient({
  credentials: {
    private_key: DIALOGFLOW_PRIVATE_KEY,
    client_email: DIALOGFLOW_CLIENT_EMAIL
  }
});

const processIntent = async ({ sessionId, text }) => {
  const sessionPath = sessionClient.sessionPath(DIALOGFLOW_PROJECT_ID, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text,
        languageCode: DIALOGFLOW_LANG_CODE
      }
    }
  };

  const responses = await sessionClient.detectIntent(request);
  return responses[0].queryResult;
};

const sendDefaultEntry = async ({ messenger, senderId }) => {
  const EVENT_TYPE = 'SELECT_DATE_TYPE';
  return messenger.sendTextMessage({
    id: senderId,
    text: 'Eating out huh 😏😏 Where would you like to go in Singapore? ',
    notificationType: 'REGULAR'
  });
};

const sendWelcomeEntry = async ({ messenger, senderId }) => {
  await messenger.sendTextMessage({
    id: senderId,
    text: 'Hi!  My name is FUBB and I know good Burpple Beyond deals 😏😏'
  });
  return sendDefaultEntry({ messenger, senderId });
};

const sendLocationConfirmation = async ({ messenger, senderId, locationStr, location }) => {
  await messenger.sendTextMessage({
    id: senderId,
    text: `Okay, I've confirmed your input for ${locationStr} to ${location}.`
  });
};

const sendBudgetBtns = async ({ messenger, senderId }) => {
  const EVENT_TYPE = 'SELECT_BUDGET';
  return messenger.sendButtonsMessage({
    id: senderId,
    text: 'Budget please?',
    buttons: [
      {
        type: 'postback',
        title: '$0 - $10',
        payload: JSON.stringify({
          type: EVENT_TYPE,
          value: 'cheap'
        })
      },
      {
        type: 'postback',
        title: '$11 - $30',
        payload: JSON.stringify({
          type: EVENT_TYPE,
          value: 'mid'
        })
      },
      {
        type: 'postback',
        title: ' > $30',
        payload: JSON.stringify({
          type: EVENT_TYPE,
          value: 'pricy'
        })
      }
    ],
    notificationType: 'REGULAR'
  });
};

const processEvent = async (event, messenger) => {
  // Destructure event
  const {
    sender: { id: senderId } = {},
    message: { text, quick_reply: { payload: quickReplyPayload } = {} } = {},
    postback: { title, payload: postbackPayload } = {}
  } = event;

  // Use either the postback or quickReply payloads
  const payload = postbackPayload || quickReplyPayload;

  // Retrieve timed context
  const context = await map.get(senderId);
  const { state, location } = context;

  // Reset state if new context.
  if (!context.state) {
    map.set(senderId, { state: 'START' });
  }

  // Retrieve payload, handle if any
  if (payload) {
    const { type, value } = JSON.parse(payload);

    // if (type === 'SELECT_DATE_TYPE') {
    //   map.set(senderId, { dateType: value });
    //   await sendBudgetBtns({ messenger, senderId });
    //   map.set(senderId, { state: 'SELECT_BUDGET' });
    //   return;
    // } else if (type === 'SELECT_BUDGET') {
    //   map.set(senderId, { budget: value });
    //   await sendTimeSelectBtns({ messenger, senderId });
    //   map.set(senderId, { state: 'SELECT_TIME' });
    //   return;
    // } else if (type === 'SELECT_TIME') {
    //   map.set(senderId, { time: value });
    //   await sendLocSelectBtns({ messenger, senderId });
    //   map.set(senderId, { state: 'SELECT_LOC' });
    //   return;
    // } else if (type === 'SELECT_LOC') {
    //   const ctx = await map.set(senderId, { location: value });
    //   await sendCfmMsg({ messenger, senderId, ctx });
    //   map.set(senderId, { state: 'GEN_DATE' });
    //   console.log('--------------');
    //   console.log(ctx);
    //   console.log('--------------');
    //   return;
    // }
  }

  // Otherwise skip if no message to process
  if (!text) {
    return;
  }

  if (state === 'ASK_LOCATION' && !location) {
    const location2 = await getLatLng(text);
    await sendLocationConfirmation({ messenger, senderId, locationStr: text, location: location2 });
    await sendBudgetBtns({ messenger, senderId });
    map.set(senderId, { state: 'ASK_PRICE', location: location2 });
    return;
  } else if (state === 'ASK_PRICE') {
  }

  // const dialogFlowRes = await processIntent({ sessionId: senderId, text });
  // // console.log(dialogFlowRes);
  // const intent = dialogFlowRes.intent.displayName;

  // if (intent === 'Default Fallback Intent') {
  //   // await sendWelcomeEntry({ messenger, senderId });
  //   return;
  // }

  // if (dialogFlowRes.fulfillmentText) {
  //   const res2 = await messenger.sendTextMessage({
  //     id: senderId,
  //     text: dialogFlowRes.fulfillmentText
  //   });
  // }

  await sendWelcomeEntry({ messenger, senderId });
  map.set(senderId, { state: 'ASK_LOCATION' });
};

export default processEvent;
