import Bullet from "./Bullet";

const X_STARTING_POS = 100;
const Y_STARTING_POS = 100;
const STARTING_DIR = "down";
const PLAYER_SPEED = 10;

const bulletList = [];

const Player = (id, name, points) => {
  const player = {
    x: X_STARTING_POS,
    y: Y_STARTING_POS,
    id: id,
    username: name,
    points: points,
    char: "tyler1",

    rightPress: false,
    leftPress: false,
    upPress: false,
    downPress: false,
    lastPosition: STARTING_DIR,

    speed: PLAYER_SPEED
  };

  player.updatePosition = function () {
    if (player.rightPress) player.x += player.speed;
    if (player.leftPress) player.x -= player.speed;
    if (player.upPress) player.y -= player.speed;
    if (player.downPress) player.y += player.speed;
  };

  player.addPoint = function () {
    player.points++;
  };

  player.shootBullet = function () {
    var bullet = Bullet(player.id, player.x, player.y, player.lastPosition);
    bulletList[bullet.id] = bullet;
  };

  return player;
};

export default Player;
