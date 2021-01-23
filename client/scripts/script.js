// const express = require("express");
// const app = express();
// const http = require("http").Server(app);
var socket = io();

var character = document.querySelector(".character");
var character_spritesheet = document.querySelector(".character_spritesheet");
var map = document.querySelector(".map");

//start in the middle of the map
var x = 90;
var y = 34;
var held_directions = []; //State of which arrow keys we are holding down
var held_actions = []; //State of which arrow keys we are holding down
var speed = 1; //How fast the character moves in pixels per frame

const signDiv = document.querySelector(".signDiv");
const signDivUser = document.getElementById("signDiv-user");
const signDivPass = document.getElementById("signDiv-pass");
const signDivSignIn = document.getElementById("signDiv-signIn");
const signDivSignUp = document.getElementById("signDiv-signUp");
const kmsButton = document.getElementById("kms-button");
const reviveButton = document.getElementById("revive-button");
const timeStamp = document.getElementById("timeStamp");
const playerListDisplay = document.getElementById("player-list");
const personaje1 = document.getElementById("char1");
const personaje2 = document.getElementById("char2");
const personaje3 = document.getElementById("char3");

const charImg = new Image();
charImg.src = "/client/sprites/tyler1.png";

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
    alert("Registro exitoso!");
  } else alert("Sign Up unsuccessful! Name already taken!");
});

socket.on("signInResponse", function (data) {
  if (data.success) {
    signDiv.style.display = "none";
    alert("Ingreso exitoso!");
  } else alert("Sign in unsuccessful");
});

const chatText = document.getElementById("chat-text");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

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
  playerListDisplay.innerHTML = "";

  for (let player of playerData) {
    console.log(
      "datos usuario" + player.username + ": " + player.points,
      player.x,
      player.y
    );
    playerListDisplay.innerHTML +=
      "<div>" + player.username + ": " + player.points + "</div>";

    placeCharacter(); // replace drawChar(player);
  }
});

socket.on("Time", function () {
  const date = Date().slice(4, 24);
  timeStamp.innerHTML = date;
});

const placeCharacter = () => {
  var pixelSize = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue("--pixel-size")
  );

  character_spritesheet.style.background = "url(/client/sprites/orge.png)";

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
  character.style.transform = `translate3d( ${x * pixelSize + 30}px, ${
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
const actions = {
  star: "star",
  lighting: "down",
  water: "water",
  tree: "tree"
};
const keys = {
  87: directions.up,
  65: directions.left,
  68: directions.right,
  83: directions.down,
  85: actions.star,
  73: actions.lighting,
  74: actions.water,
  75: actions.tree
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
  isPressed = true;
});
document.body.addEventListener("mouseup", () => {
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
//Atando los eventos para el dpad
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

/*0function UpdateCharModel(name) {
  charImg.src = "/client/sprites/" + name + ".png";
  socket.emit("charUpdate", { charName: name });
}*/
