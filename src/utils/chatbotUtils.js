import { SessionsClient } from 'dialogflow';
import TransientMap from './TransientMap';
import getLatLng from './locServices';
import Outlet from '../models/Outlet';

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

const sendBudgetConfirmation = async ({ messenger, senderId, priceMin, priceMax }) => {
  await messenger.sendTextMessage({
    id: senderId,
    text: `Great!  I'll search for restaurants \$${priceMin} - \$${priceMax}.`
  });
};

const sendDistConfirmation = async ({ messenger, senderId, maxDist }) => {
  await messenger.sendTextMessage({
    id: senderId,
    text: `Great!  I'll search for restaurants ${maxDist}m away.`
  });
};

const sendQueryConfirmation = async ({ messenger, senderId }) => {
  await messenger.sendTextMessage({
    id: senderId,
    text: 'Finding restaurants for you..'
  });
};

const sendResults = async ({ messenger, senderId, query }) => {
  const results = await Outlet.retrieveNearestBeyond(query);

  if (!results || results.length === 0) {
    await map.set(senderId, { state: 'ASK_LOCATION' });
    await messenger.sendTextMessage({
      id: senderId,
      text: "Sorry, no restaurants available.  \n\nLet's retry.  Where would you like to go?"
    });
  }

  const elements = results
    .map(r => {
      const { title, address, link, price, numReviews, imgUrls = [] } = r;
      const subtitle = `Price / pax: ~$${price /
        2}\nAddress: ${address}\nNo. reviews: ${numReviews}`;
      return {
        title,
        image_url: imgUrls.length > 0 ? imgUrls[0] + '?w=400&h=400&fit=crop&q=80&auto=format' : '',
        subtitle,
        default_action: {
          type: 'web_url',
          url: link,
          webview_height_ratio: 'tall'
        },
        buttons: [
          {
            type: 'web_url',
            url: link,
            title: 'See review'
          }
        ]
      };
    })
    .slice(0, 10);

  await messenger.sendGenericMessage({
    id: senderId,
    elements,
    notificationType: 'REGULAR'
  });

  // await messenger.sendTextMessage({
  //   id: senderId,
  //   text: 'Finding restaurants for you..'
  // });
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
          value: 'pricey'
        })
      }
    ],
    notificationType: 'REGULAR'
  });
};

const sendDistQuery = async ({ messenger, senderId }) => {
  const EVENT_TYPE = 'SELECT_DIST';
  return messenger.sendButtonsMessage({
    id: senderId,
    text: 'How far away?',
    buttons: [
      {
        type: 'postback',
        title: '< 5 mins',
        payload: JSON.stringify({
          type: EVENT_TYPE,
          value: 'near'
        })
      },
      {
        type: 'postback',
        title: '< 10 mins',
        payload: JSON.stringify({
          type: EVENT_TYPE,
          value: 'mid'
        })
      },
      {
        type: 'postback',
        title: '< 15 mins',
        payload: JSON.stringify({
          type: EVENT_TYPE,
          value: 'far'
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
    await map.set(senderId, { state: 'START' });
  }

  console.log(context);

  if (text) {
    const dialogFlowRes = await processIntent({ sessionId: senderId, text });
    const intent = dialogFlowRes.intent.displayName;

    if (intent === 'Default Welcome Intent') {
      await sendWelcomeEntry({ messenger, senderId });
      await map.set(senderId, { state: 'ASK_LOCATION' });
      return;
    }
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

  // // Otherwise skip if no message to process
  // if (!text) {
  //   return;
  // }

  if (state === 'ASK_LOCATION') {
    const location2 = await getLatLng(`${text} , Singapore`);
    await sendLocationConfirmation({ messenger, senderId, locationStr: text, location: location2 });
    await sendBudgetBtns({ messenger, senderId });
    await map.set(senderId, { state: 'SELECT_BUDGET', location: location2 });
    return;
  } else if (state === 'SELECT_BUDGET' && payload) {
    const { type, value } = JSON.parse(payload);

    if (type !== 'SELECT_BUDGET') {
      // TODO retry and return.
      return;
    }

    let priceMin = 0;
    let priceMax = 90;

    if (value === 'cheap') {
      priceMin = 0;
      priceMax = 10;
    } else if (value === 'mid') {
      priceMin = 10;
      priceMax = 30;
    } else if (value === 'pricey') {
      priceMin = 30;
      priceMax = 90;
    }

    await sendBudgetConfirmation({ messenger, senderId, priceMin, priceMax });
    await sendDistQuery({ messenger, senderId });
    await map.set(senderId, { state: 'SELECT_DIST', priceMin, priceMax });
    return;
  } else if (state === 'SELECT_DIST' && payload) {
    const { type, value } = JSON.parse(payload);

    if (type !== 'SELECT_DIST') {
      // TODO retry and return.
      return;
    }

    let maxDist = 2000;

    if (value === 'near') {
      maxDist = 500;
    } else if (value === 'mid') {
      maxDist = 1000;
    } else if (value === 'far') {
      maxDist = 2000;
    }

    await sendDistConfirmation({ messenger, senderId, maxDist });
    await sendQueryConfirmation({ messenger, senderId });

    const { priceMin, priceMax } = context;

    const query = {
      minPrice: priceMin,
      maxPrice: priceMax,
      maxDistance: maxDist,
      coordinates: location
    };

    await sendResults({ messenger, senderId, query });

    // TODO run query here------------------------
    // await map.set(senderId, { state: 'DO_QUERY', maxDist });
    await map.set(senderId, {});
    return;
  }

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
