"use strict";

var http = require("http");
var fs = require("fs");

var server = http.createServer();

server.on("request", function (req, res) {
  var fileData;
  switch (req.url) {
    case "/":
      fileData = fs.readFileSync("./index.html");
      break;
    default:
      try {
        fileData = fs.readFileSync("." + req.url);
      } catch (e) {
        console.error("No file:", "." + req.url);
      }
  }
  res.write(fileData || "null");
  res.end();
});

server.listen(9000, function () {
  console.log("listening", 9000);
});