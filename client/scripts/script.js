const socket = require("socket.io");

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

signDivSignIn.onclick = function() {
  socket.emit("signIn", {
    username: signDivUser.value.trim(),
    password: signDivPass.value.trim()
  });
};

signDivSignUp.onclick = function() {
  socket.emit("signUp", {
    username: signDivUser.value.trim(),
    password: signDivPass.value.trim()
  });
};

kmsButton.onclick = function() {
  socket.emit("kms");
};

reviveButton.onclick = function() {
  socket.emit("revive");
};

socket.on("signUpResponse", function(data) {
  if (data.success) {
    alert("Sign Up Successful! Log in with Your Username and Password!");
  } else alert("Sign Up unsuccessful! Name already taken!");
});

socket.on("signInResponse", function(data) {
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

socket.on("addToChat", function(data) {
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

chatForm.onsubmit = function(event) {
  event.preventDefault();
  if (chatInput.value.substring(0, 1) === "/")
    socket.emit(
      "sendCommandToServer",
      chatInput.value.substring(1, chatInput.value.length)
    );

  socket.emit("sendMsgToServer", chatInput.value);

  chatInput.value = "";
};

socket.on("renderInfo", function(playerData, bulletData) {
  canvas.clearRect(0, 0, 800, 500);

  playerListDisplay.innerHTML = "";

  for (let player of playerData) {
    canvas.fillText(player.username + ": " + player.points, player.x, player.y);
    playerListDisplay.innerHTML +=
      "<div>" + player.username + ": " + player.points + "</div>";

    drawChar(player);
  }

  for (let bullet of bulletData) {
    drawBullet(bullet);
  }
});

socket.on("Time", function() {
  const date = Date().slice(4, 24);
  timeStamp.innerHTML = date;
});

document.onkeydown = function(event) {
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

document.onkeyup = function(event) {
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
