// const express = require("express");
// const app = express();
// const http = require("http").Server(app);
var socket = io();

var character = document.querySelector(".character");
var map = document.querySelector(".map");

//start in the middle of the map
var x = 90;
var y = 34;
var held_directions = []; //State of which arrow keys we are holding down
var speed = 1; //How fast the character moves in pixels per frame

const gameDiv = document.getElementById("gameDiv");
const signDiv = document.getElementById("signDiv");
const signDivUser = document.getElementById("signDiv-user");
const signDivPass = document.getElementById("signDiv-pass");
const signDivSignIn = document.getElementById("signDiv-signIn");
const signDivSignUp = document.getElementById("signDiv-signUp");
const kmsButton = document.getElementById("kms-button");
const reviveButton = document.getElementById("revive-button");
const timeStamp = document.getElementById("timeStamp");
const playerListDisplay = document.getElementById("player-list");

const charImg = new Image();
charImg.src = "/client/sprites/tyler1.png";
const imgFrameIndex = 50;
const imgWidth = 50;
const imgHeight = 60;

signDivSignIn.onclick = function () {
  socket.emit("signIn", {
    username: signDivUser.value.trim(),
    password: signDivPass.value.trim()
  });
};

signDivSignUp.onclick = function () {
  socket.emit("signUp", {
    username: signDivUser.value.trim(),
    password: signDivPass.value.trim()
  });
};

kmsButton.onclick = function () {
  socket.emit("kms");
};

reviveButton.onclick = function () {
  socket.emit("revive");
};

socket.on("signUpResponse", function (data) {
  if (data.success) {
    alert("Sign Up Successful! Log in with Your Username and Password!");
  } else alert("Sign Up unsuccessful! Name already taken!");
});

socket.on("signInResponse", function (data) {
  if (data.success) {
    signDiv.style.display = "none";
    gameDiv.style.display = "inline-block";
  } else alert("Sign in unsuccessful");
});

const chatText = document.getElementById("chat-text");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const canvas = document.getElementById("myCanvas").getContext("2d");
canvas.font = "15px Arial";

socket.on("addToChat", function (data) {
  chatText.innerHTML += "<div>" + data + "</div>";
  chatText.scrollTop = chatText.scrollHeight;
});

function inTextField(event) {
  let elem = event.target || event.srcElement;
  if (elem.nodeType === 3) elem = elem.parentNode;

  return (
    elem.tagName === "TEXTAREA" ||
    (elem.tagName === "INPUT" && elem.getAttribute("type") === "text")
  );
}

chatForm.onsubmit = function (event) {
  event.preventDefault();
  if (chatInput.value.substring(0, 1) === "/")
    socket.emit(
      "sendCommandToServer",
      chatInput.value.substring(1, chatInput.value.length)
    );

  socket.emit("sendMsgToServer", chatInput.value);

  chatInput.value = "";
};

socket.on("renderInfo", function (playerData, bulletData) {
  canvas.clearRect(0, 0, 800, 500);

  playerListDisplay.innerHTML = "";

  for (let player of playerData) {
    canvas.fillText(player.username + ": " + player.points, player.x, player.y);
    playerListDisplay.innerHTML +=
      "<div>" + player.username + ": " + player.points + "</div>";

    placeCharacter(); // replace drawChar(player);
  }

  for (let bullet of bulletData) {
    drawBullet(bullet);
  }
});

socket.on("Time", function () {
  const date = Date().slice(4, 24);
  timeStamp.innerHTML = date;
});

document.onkeydown = function (event) {
  if (!inTextField(event)) {
    if (event.keyCode === 68)
      //d
      socket.emit("keyPress", { inputId: "right", state: true });
    else if (event.keyCode === 83)
      //s
      socket.emit("keyPress", { inputId: "down", state: true });
    else if (event.keyCode === 65)
      //a
      socket.emit("keyPress", { inputId: "left", state: true });
    else if (event.keyCode === 87)
      //w
      socket.emit("keyPress", { inputId: "up", state: true });
    else if (event.keyCode === 32)
      //space
      socket.emit("keyPress", { inputId: "shoot", state: true });
  }
};

document.onkeyup = function (event) {
  if (!inTextField(event)) {
    if (event.keyCode === 68)
      //d
      socket.emit("keyPress", { inputId: "right", state: false });
    else if (event.keyCode === 83)
      //s
      socket.emit("keyPress", { inputId: "down", state: false });
    else if (event.keyCode === 65)
      //a
      socket.emit("keyPress", { inputId: "left", state: false });
    else if (event.keyCode === 87)
      //w
      socket.emit("keyPress", { inputId: "up", state: false });
    else if (event.keyCode === 32)
      //space
      socket.emit("keyPress", { inputId: "shoot", state: false });
  }
};

const placeCharacter = () => {
  var pixelSize = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue("--pixel-size")
  );

  const held_direction = held_directions[0];
  if (held_direction) {
    if (held_direction === directions.right) {
      x += speed;
    }
    if (held_direction === directions.left) {
      x -= speed;
    }
    if (held_direction === directions.down) {
      y += speed;
    }
    if (held_direction === directions.up) {
      y -= speed;
    }
    character.setAttribute("facing", held_direction);
  }
  character.setAttribute("walking", held_direction ? "true" : "false");

  //Limits (gives the illusion of walls)
  var leftLimit = -8;
  var rightLimit = 16 * 11 + 8;
  var topLimit = -8 + 32;
  var bottomLimit = 16 * 7;
  if (x < leftLimit) {
    x = leftLimit;
  }
  if (x > rightLimit) {
    x = rightLimit;
  }
  if (y < topLimit) {
    y = topLimit;
  }
  if (y > bottomLimit) {
    y = bottomLimit;
  }

  var camera_left = pixelSize * 66;
  var camera_top = pixelSize * 42;

  map.style.transform = `translate3d( ${-x * pixelSize + camera_left}px, ${
    -y * pixelSize + camera_top
  }px, 0 )`;
  character.style.transform = `translate3d( ${x * pixelSize}px, ${
    y * pixelSize
  }px, 0 )`;
};

//Set up the game loop
const step = () => {
  placeCharacter();
  window.requestAnimationFrame(() => {
    step();
  });
};
step(); //kick off the first step!

/* Direction key state */
const directions = {
  up: "up",
  down: "down",
  left: "left",
  right: "right"
};
const keys = {
  38: directions.up,
  37: directions.left,
  39: directions.right,
  40: directions.down
};
document.addEventListener("keydown", (e) => {
  var dir = keys[e.which];
  if (dir && held_directions.indexOf(dir) === -1) {
    held_directions.unshift(dir);
  }
});

document.addEventListener("keyup", (e) => {
  var dir = keys[e.which];
  var index = held_directions.indexOf(dir);
  if (index > -1) {
    held_directions.splice(index, 1);
  }
});

/* BONUS! Dpad functionality for mouse and touch */
var isPressed = false;
const removePressedAll = () => {
  document.querySelectorAll(".dpad-button").forEach((d) => {
    d.classList.remove("pressed");
  });
};
document.body.addEventListener("mousedown", () => {
  console.log("mouse is down");
  isPressed = true;
});
document.body.addEventListener("mouseup", () => {
  console.log("mouse is up");
  isPressed = false;
  held_directions = [];
  removePressedAll();
});
const handleDpadPress = (direction, click) => {
  if (click) {
    isPressed = true;
  }
  held_directions = isPressed ? [direction] : [];

  if (isPressed) {
    removePressedAll();
    document.querySelector(".dpad-" + direction).classList.add("pressed");
  }
};
//Bind a ton of events for the dpad
document
  .querySelector(".dpad-left")
  .addEventListener("touchstart", (e) =>
    handleDpadPress(directions.left, true)
  );
document
  .querySelector(".dpad-up")
  .addEventListener("touchstart", (e) => handleDpadPress(directions.up, true));
document
  .querySelector(".dpad-right")
  .addEventListener("touchstart", (e) =>
    handleDpadPress(directions.right, true)
  );
document
  .querySelector(".dpad-down")
  .addEventListener("touchstart", (e) =>
    handleDpadPress(directions.down, true)
  );

document
  .querySelector(".dpad-left")
  .addEventListener("mousedown", (e) => handleDpadPress(directions.left, true));
document
  .querySelector(".dpad-up")
  .addEventListener("mousedown", (e) => handleDpadPress(directions.up, true));
document
  .querySelector(".dpad-right")
  .addEventListener("mousedown", (e) =>
    handleDpadPress(directions.right, true)
  );
document
  .querySelector(".dpad-down")
  .addEventListener("mousedown", (e) => handleDpadPress(directions.down, true));

document
  .querySelector(".dpad-left")
  .addEventListener("mouseover", (e) => handleDpadPress(directions.left));
document
  .querySelector(".dpad-up")
  .addEventListener("mouseover", (e) => handleDpadPress(directions.up));
document
  .querySelector(".dpad-right")
  .addEventListener("mouseover", (e) => handleDpadPress(directions.right));
document
  .querySelector(".dpad-down")
  .addEventListener("mouseover", (e) => handleDpadPress(directions.down));

function drawChar(player) {
  const playersImg = new Image();
  playersImg.src = "/client/sprites/" + player.char + ".png";

  switch (player.lastPosition) {
    case "down":
      canvas.drawImage(
        playersImg,
        0,
        0,
        imgWidth,
        imgHeight,
        player.x,
        player.y,
        imgWidth,
        imgHeight
      );
      break;
    case "up":
      canvas.drawImage(
        playersImg,
        imgFrameIndex,
        0,
        imgWidth,
        imgHeight,
        player.x,
        player.y,
        imgWidth,
        imgHeight
      );
      break;
    case "left":
      canvas.drawImage(
        playersImg,
        imgFrameIndex * 2,
        0,
        imgWidth,
        imgHeight,
        player.x,
        player.y,
        imgWidth,
        imgHeight
      );
      break;
    case "right":
      canvas.drawImage(
        playersImg,
        imgFrameIndex * 3,
        0,
        imgWidth,
        imgHeight,
        player.x,
        player.y,
        imgWidth,
        imgHeight
      );
      break;
    default:
      console.log("entro en default");
  }
}

function drawBullet(bullet) {
  const bulletImg = new Image();
  bulletImg.src = "/client/sprites/bullet.png";

  canvas.drawImage(
    bulletImg,
    0,
    0,
    imgWidth,
    imgHeight,
    bullet.x,
    bullet.y,
    imgWidth,
    imgHeight
  );
}

/*0function UpdateCharModel(name) {
  charImg.src = "/client/sprites/" + name + ".png";
  socket.emit("charUpdate", { charName: name });
}*/
