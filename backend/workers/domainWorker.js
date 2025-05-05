require('dotenv').config();
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const axios = require('axios');

const sqs = new SQSClient({ region: 'us-west-2' });
const queueUrl = process.env.EMAIL_DOMAIN_CREATION_QUEUE_URL;
const MAILCOW_HOST = `https://${process.env.MAILCOW_HOST}`;
const API_KEY = process.env.MAILCOW_API_KEY;

const pollMessages = async () => {
  try {
    const receiveParams = {
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 5,
      WaitTimeSeconds: 20, // long polling
    };

    const data = await sqs.send(new ReceiveMessageCommand(receiveParams));

    if (data.Messages && data.Messages.length > 0) {
      for (const message of data.Messages) {
        try {
          const body = JSON.parse(message.Body);
          const { domain, userId } = body;

          console.log(`Processing domain "${domain}" for user ${userId}`);

          const response = await axios.post(
            `${MAILCOW_HOST}/api/v1/add/domain`,
            { domain },
            {
              headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json',
              },
            }
          );

          console.log(`✅ Domain "${domain}" created successfully.`);

          // Delete message from queue once processed
          await sqs.send(new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: message.ReceiptHandle,
          }));

        } catch (err) {
          console.error('❌ Error processing message:', err.message);
          // Optionally: move to a dead-letter queue or log for retry
        }
      }
    } else {
      console.log('No messages received. Waiting...');
    }

  } catch (err) {
    console.error('Error receiving messages:', err.message);
  }

  // Continue polling
  setTimeout(pollMessages, 5000);
};

// Start worker
console.log('📡 Starting domain creation worker...');
pollMessages();
