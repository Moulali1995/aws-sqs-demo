var express = require('express');
var router = express.Router();
require('dotenv').config()
const AWS = require('aws-sdk');

// aws config
AWS.config.update({
  accessKeyId: process.env.aws_access_key_id,
  secretAccessKey: process.env.aws_secret_access_key,
  region: process.env.region
});

// sqs instance
var sqs = new AWS.SQS();

//----------------------------------------Part 1------------------------------------------
// Once login is done. Check for queue-url exists for the employee else create a new one.
// Get a queue url
router.get('/queue-url/:queue_name', function (req, res) {
  var params = {
    QueueName: req.params.queue_name + '.fifo', /* required .fifo only for FIFO queues */
    QueueOwnerAWSAccountId: process.env.aws_aws_iam_user_id
  };

  sqs.getQueueUrl(params, function (err, data) {
    if (err) {
      res.send(err);
    } // an error occurred
    else {
      res.send(data);  // store the url for further uses
    }          // successful response
  });


})

// Creating a queue
router.get('/create', function (req, res) {
  var params = {
    QueueName: req.query.queuename + '.fifo',
    Attributes: {
      FifoQueue: "true", // for FIFO queues
      ContentBasedDeduplication: "true" // avoiding duplicate messages to be delivered based on content
    }


  };

  sqs.createQueue(params, function (err, data) {
    if (err) {
      res.send(err);
    }
    else {
      res.send(data);
    }
  });
});

// Listing queues.
router.get('/list', function (req, res) {
  sqs.listQueues(function (err, data) {
    if (err) {
      res.send(err);
    }
    else {
      res.send(data);
    }
  });
});

//-----------------------------------------------------------------------------

//--------------------------------------Part 2--------------------------------
// Sending a message.
// NOTE: Here we need to populate the queue url you want to send to.
// That variable is indicated at the top of router.js.
router.post('/send', function (req, res) {
  var params = {
    MessageBody: req.body.message.toString(),
    QueueUrl: req.body.queueUrl, // call getQueueUrl API to obtain the queue url and store it in localstorage or db...
    DelaySeconds: 0,
    MessageGroupId: "Notifications",

  };

  sqs.sendMessage(params, function (err, data) {
    if (err) {
      res.send(err);
    }
    else {
      res.send(data);
    }
  });
});

// Receive a message.
// NOTE: This is a great long polling example. You would want to perform
// this action on some sort of job server so that you can process these
// records. In this example I'm just showing you how to make the call.
// It will then put the message "in flight" and I won't be able to 
// reach that message again until that visibility timeout is done.
router.post('/receive', function (req, res) {
  var params = {
    QueueUrl: req.body.queueUrl,
    VisibilityTimeout: 10, // after this time the message will be visible again
    MaxNumberOfMessages: 10 // number of messages to recieve

  };

  sqs.receiveMessage(params, function (err, data) {
    if (err) {
      res.send(err);
    }
    else {
      res.send(data);
    }
  });
});

// Deleting a message.
router.post('/delete', function (req, res) {
  var params = {
    QueueUrl: req.body.queueUrl,
    ReceiptHandle: req.body.ReceiptHandle // send ReceiptHandle which can be obtained from recieved messages
  };

  sqs.deleteMessage(params, function (err, data) {
    if (err) {
      res.send(err);
    }
    else {
      res.send(data);
    }
  });
});


//------------------------------------------------------------------------


module.exports = router;
