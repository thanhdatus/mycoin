const redis = require('redis');

const CHANNELS = {
  TESTS: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION',
};

class PubSub {
  constructor({ blockchain, transactionPool }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.publisher = redis.createClient();
    this.subcriber = redis.createClient();

    this.subcribeToChannels();
    this.subcriber.on('message', (channel, message) =>
      this.handleMessage(channel, message)
    );
  }
  handleMessage(channel, message) {
    console.log(`Message received. Channel: ${channel}. Message: ${message}`);
    const parsedMessage = JSON.parse(message);
    switch (channel) {
      case CHANNELS.BLOCKCHAIN:
        this.blockchain.replaceChain(parsedMessage);
        break;
      case CHANNELS.TRANSACTION:
        this.transactionPool.setTransaction(parsedMessage);
        break;
      default:
        return;
    }
  }
  subcribeToChannels() {
    Object.values(CHANNELS).forEach((channel) => {
      this.subcriber.subscribe(channel);
    });
  }
  publish({ channel, message }) {
    this.subcriber.unsubscribe(channel, () => {
      this.publisher.publish(channel, message, () => {
        this.subcriber.subscribe(channel);
      });
    });
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain),
    });
  }

  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction),
    });
  }
}

module.exports = PubSub;

// const PubNub = require('pubnub');
// const uuid = PubNub.generateUUID();

// const credentials = {
//   publishKey: 'pub-c-fc60d6b8-04ab-4d41-a27d-28afd453614a',
//   subscribeKey: 'sub-c-842f8e82-b755-11eb-bcfa-02017f28bfc9',
//   uuid: uuid,
// };

// const CHANNELS = {
//   TEST: 'TEST',
//   TESTTWO: 'TESTTWO',
// };

// class PubSub {
//   constructor() {
//     this.pubnub = new PubNub(credentials);
//     this.pubnub.subscribe({ channels: Object.values(CHANNELS) });
//     this.pubnub.addListener(this.listener());
//   }
//   listener() {
//     return {
//       message: (messageObject) => {
//         const { channel, message } = messageObject;
//         console.log(
//           `Message received. Channel: ${channel}. Message: ${message}`
//         );
//       },
//     };
//   }
//   publish({ channel, message }) {
//     this.pubnub.publish({ channel, message });
//   }
// }

// const testPubSub = new PubSub();
// testPubSub.publish({ channel: CHANNELS.TEST, message: 'hello pubnub' });

// module.exports = PubSub;
