import Player from "./server/model/Player";

const SERVER_PORT = 8000;
const REFRESH_RATE = 25;

const MONGO_REPO = "Account";
const express = require("express");
const app = require("express")();
const server = require("http").createServer(app);

const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const url =
  "mongodb+srv://admin:admin@cluster0.n3ilx.mongodb.net/mmorpg?retryWrites=true&w=majority";
let dbo;
const io = require("socket.io")(server);

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/client/index.html");
});

app.use("/client", express.static(__dirname + "/client"));

let socketList = {};
let playerList = {};
let bulletList = {};

const client = new MongoClient(url, { useUnifiedTopology: true });

client.connect(function (err, db) {
  assert.equal(null, err);
  if (err) throw err;
  dbo = db.db("mmorpg");
  dbo.createCollection(MONGO_REPO, function (err, res) {
    if (err) throw err;
    console.log("Collection creada!");
  });
});
//console.log(app);
io.on("connection", function (socket) {
  socket.id = Math.random();
  socketList[socket.id] = socket;
  console.log("Socket " + socket.id + " has connected");

  socket.on("signUp", function (userData) {
    isValidNewCredential(userData).then(function (res) {
      if (res) insertCredential(userData);
      io.emit("signUpResponse", { success: res });
    });
  });

  socket.on("signIn", function (userData) {
    isCorrectCredential(userData).then(function (res) {
      if (res.valid) onConnect(socket, userData.username, res.points);
      io.emit("signInResponse", { success: res.valid });
    });
  });

  socket.on("disconnect", function () {
    if (socketList[socket.id] != null) {
      delete socketList[socket.id];
      console.log(socket.id + " has disconnected");
    }
    const player = playerList[socket.id];
    if (Array.isArray(playerList) || playerList.length) {
      //encaso de que el array es no esté vacio ...
      toAllChat(player.username + " has disconnected.");

      const query = {
        username: player.username
      };
      const newValues = { $set: { points: player.points } };
      dbo
        .collection(MONGO_REPO)
        .updateOne(query, newValues, function (err, res) {
          if (err) throw err;
          console.log("MongoDB Document Updated: " + res.result);
        });

      delete playerList[socket.id];
    }
  });
});
server.listen(process.env.PORT || SERVER_PORT);
console.log("Server Started! localhost at port: " + SERVER_PORT);

setInterval(function () {
  const pack = [];

  for (let i in playerList) {
    let player = playerList[i];
    player.updatePosition();
    pack.push({
      x: player.x,
      y: player.y,
      username: player.username,
      points: player.points,
      lastPosition: player.lastPosition,
      char: player.char
    });
  }

  let bulletPack = [];

  for (let i in bulletList) {
    if (bulletList[i].toRemove === true) {
      delete bulletList[i];
    } else {
      let bullet = bulletList[i];
      bullet.update();

      for (let i in playerList) {
        const player = playerList[i];
        if (
          bullet.x > player.x &&
          bullet.x < player.x + 50 &&
          bullet.y > player.y &&
          bullet.y < player.y + 60
        ) {
          if (player.id !== bullet.playerId)
            playerList[bullet.playerId].addPoint();
        }
      }

      bulletPack.push({
        x: bullet.x,
        y: bullet.y,
        playerId: bullet.playerId
      });
    }
  }
  for (let i in socketList) {
    const socket = socketList[i];
    socket.emit("renderInfo", pack, bulletPack);
    socket.emit("Time");
  }
}, REFRESH_RATE);

function isValidNewCredential(userData) {
  return new Promise(function (callback) {
    var query = {
      username: userData.username
    };
    dbo
      .collection(MONGO_REPO)
      .find(query)
      .toArray(function (err, result) {
        if (err) throw err;
        if (result.length === 0) {
          console.log(
            "user credential not taken yet: " + JSON.stringify(userData)
          );
          callback(true);
        } else {
          callback(false);
          console.log(
            "User credential already exist: " + JSON.stringify(result)
          );
        }
      });
  });
}

function isCorrectCredential(userData) {
  return new Promise(function (callback) {
    var query = {
      username: userData.username,
      password: userData.password
    };
    dbo
      .collection(MONGO_REPO)
      .find(query)
      .toArray(function (err, result) {
        if (err) throw err;
        if (result.length !== 0) {
          console.log("Matching Credential: " + JSON.stringify(result[0]));
          callback({ valid: true, points: result[0].points });
        } else {
          callback({ valid: false, points: null });
          console.log("incorrect user or password");
        }
      });
  });
}

function insertCredential(data) {
  const account = {
    username: data.username,
    password: data.password,
    points: 0
  };
  dbo.collection(MONGO_REPO).insertOne(account, function (err, res) {
    if (err) throw err;
    console.log("MongoDB Document Inserted: " + JSON.stringify(account));
  });
}

function toAllChat(line) {
  for (let i in socketList) socketList[i].emit("addToChat", line);
}

function onConnect(socket, name, points) {
  const player = Player(socket.id, name, points);
  playerList[socket.id] = player;

  socket.on("keyPress", function (data) {
    //glitchy character movement
    if (data.inputId === "right") player.rightPress = data.state;
    else if (data.inputId === "left") player.leftPress = data.state;
    else if (data.inputId === "up") player.upPress = data.state;
    else if (data.inputId === "down") player.downPress = data.state;

    if (data.inputId === "shoot" && playerList[socket.id] != null)
      player.shootBullet();
    else player.lastPosition = data.inputId;
  });

  socket.on("sendMsgToServer", function (data) {
    const playerName = "" + player.username;
    toAllChat(playerName + ": " + data);
  });

  socket.on("kms", function () {
    if (playerList[socket.id] != null) {
      delete playerList[socket.id];
    }
  });

  socket.on("revive", function () {
    if (playerList[socket.id] == null) {
      playerList[socket.id] = player;
    }
  });

  socket.on("charUpdate", function (data) {
    player.char = data.charName;
  });
}
