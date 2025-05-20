const express = require("express");
const fs = require("fs");
const app = express();

// // Read SSL certificate
// const privateKey = fs.readFileSync('../ssl/server.key', 'utf8');
// const certificate = fs.readFileSync('../ssl/server.cert', 'utf8');
// const credentials = { key: privateKey, cert: certificate };

const https = require('http');
const httpsServer = https.createServer(app);

const io = require("socket.io")(httpsServer, {
  pingTimeout: 60000,
  maxHttpBufferSize: 100 * 1024 * 1024,
  cors: {
    origin: `${process.env.FRONTEND_URL}`,
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

module.exports = { io, httpsServer, app, express };