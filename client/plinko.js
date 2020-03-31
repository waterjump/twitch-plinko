const Matter = require('matter-js');
const decomp = require('poly-decomp');
const p5 = require('p5');

window.decomp = decomp;

var socket;

var App = {};

App.Chip = class Chip {
  constructor(gate, player, time) {
    this.gate = gate;
    this.player = player;
    this.time = time;
    this.jitter = this.jitter || (Math.floor(Math.random() * 20) - 10);
    this.body = this.body ||
      Matter.Bodies.circle(
        80.5 + ((this.gate - 1) * 60) + this.jitter,
        20,
        22, {
        friction: 0.001,
        restitution: 0.75,
        sleepThreshold: 20,
        isChip: true,
        chip: this
      }
      );
  }
};

/*
 * decaffeinate suggestions:
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { Bodies } = Matter;

App.Interface = class Interface {};

App.Interface.prototype.drawChip = function(p, chip) {
  const { body } = chip;
  const rad = body.circleRadius;
  const ctx = $('canvas')[0].getContext('2d');
  ctx.save();
  ctx.translate(body.position.x, body.position.y);
  ctx.rotate(body.angle);
  ctx.beginPath();
  ctx.arc(0, 0, rad, 0, 2 * Math.PI, false);
  p.fill(chip.player.color || 0);
  ctx.fill();
  p.fill(255);
  p.textSize(30);
  p.text(chip.player.letter, -11, 11);
  ctx.restore();
};

App.Interface.prototype.drawEllipse = function(p, body) {
  p.ellipse(body.position.x, body.position.y, body.circleRadius * 2);
};

App.Interface.prototype.drawRect = function(p, body) {
  if (!body.isSensor) {
    p.rect(
      this.rectX(body),
      this.rectY(body),
      this.rectWidth(body),
      this.rectHeight(body)
    );
  }
};

App.Interface.prototype.drawPoly = function(p, body) {
  const vc = body.vertices;
  p.triangle(vc[0].x, vc[0].y, vc[1].x, vc[1].y, vc[2].x, vc[2].y);
};

App.Interface.prototype.placePegs = function(circles) {
  let x = undefined;
  let y = 20;
  let cols = undefined;
  let offset = undefined;
  let i = 0;
  while (i < 13) {
    y = y + 50;
    if ((i % 2) === 0) {
      cols = 8;
      offset = 110;
    } else {
      cols = 7;
      offset = 140;
    }
    let j = 0;
    x = offset;
    while (j < cols) {
      circles.push(Bodies.circle(x, y, 2.5, { isStatic: true, isPeg: true }));
      x = x + 60;
      j++;
    }
    i++;
  }
};

App.Interface.prototype.placeWalls = function(polygons, rectangles) {
  rectangles.push(Bodies.rectangle(25,420,50,830, {isStatic: true}));
  rectangles.push(Bodies.rectangle(615,420,50,830, {isStatic: true}));
  const leftWallTriangle = Matter.Vertices.fromPath('0 0 30 50 0 100');
  const rightWallTriangle = Matter.Vertices.fromPath('0 0 0 100 -30 50');
  let i = 0;
  while (i < 6) {
    polygons.push(
      Bodies.fromVertices(
        60, 119 + (100 * i), leftWallTriangle, { isStatic: true }
      )
    );

    polygons.push(
      Bodies.fromVertices(
        580, 119 + (100 * i), rightWallTriangle, { isStatic: true }
      )
    );

    i++;
  }
};

App.Interface.prototype.placeBinWalls = function(rectangles) {
  let x = 50;
  let i = 0;
  while (i < 10) {
    rectangles.push(Bodies.rectangle(x, 780, 5, 110, {isStatic: true}));
    x = x + 60;
    i++;
  }
};

App.Interface.prototype.placeSlotNumbers = function(p) {
  let i = 1;
  while (i < 10) {
    p.textSize(40);
    p.fill(0);
    p.text(parseInt(i), 10 + (i * 60), 55);
    i++;
  }
};

App.Interface.prototype.rectWidth = body => body.bounds.max.x - body.bounds.min.x;

App.Interface.prototype.rectHeight = body => body.bounds.max.y - body.bounds.min.y;

App.Interface.prototype.rectX = function(body) {
  return body.position.x - (this.rectWidth(body) / 2);
};

App.Interface.prototype.rectY = function(body) {
  return body.position.y - (this.rectHeight(body) / 2);
};

App.Interface.prototype.placeBinScores = function(p) {
  p.translate(0, 820);
  p.fill(0);
  p.rotate(-Math.PI / 2 );
  const scores = ['100','500','1000','- 0 -','10,000','- 0 -','1000','500','100'];

  scores.forEach(function(score, index) {
    p.text(score, 10, 90 + (index * 60));
  });
};

App.Interface.prototype.placeSensors = function(rectangles) {
  const scores = [100, 500, 1000, 0, 10000, 0, 1000, 500, 100];
  const offset = 80;

  scores.forEach(function(score, index) {
    rectangles.push(
      Bodies.rectangle(
        offset + (60 * index),
        788,
        55,
        80,
        {
          isSensor: true,
          isStatic: true,
          category: 'score',
          value: score
        }
      )
    );
  });
};

App.Interface.compare = function(a,b) {
  if (a.score < b.score) {
    return -1;
  }
  if (a.score > b.score) {
    return 1;
  }
  return 0;
};

App.Interface.prototype.updateScore = function(players) {
  let newHtml = App.Interface.scoreboardHeading;

  sortedPlayers = players.sort(App.Interface.compare).reverse();

  let index = 0;
  let lastScore = undefined;

  sortedPlayers.forEach(function(player) {
    if (player.chips.length > 0) {
      lastScore = lastScore || player.score;
      if (player.score !== lastScore) { index++; };
      newHtml += `<tr><td>${parseInt(index + 1)}.</td>` +
        `<td class="player-name" style="color: ${player.color || '#000'};">` +
        `${player.name}</td><td>${parseInt(player.score)}&nbsp;</td><td>` +
        `${parseInt(5 - player.chips.length)}</td></tr>`;
      lastScore = player.score;
      }
    }
  );

  newHtml += '</table>';
  $('#scoreboard').html(newHtml);
};

App.Interface.scoreboardHeading =
  "<table><tr class='table-heading'><td class='rank-heading'></td>" +
  "<td class='player-heading'>Player</td>" +
  "<td class='score-heading'>Score</td>" +
  "<td class='chips-left-heading'>Chips left</td></tr>";

App.Player = class Player {
  constructor(name, color) {
    this.name = name;
    this.color = color || '#000000';
    this.chips = [];
    this.score = 0;
    this.hasActiveChip = false;
    this.letter = name.charAt(0).toUpperCase();
  }
};

App.Player.prototype.setColor = function(color) {
  this.color = color || '#000000';
};

App.setupPlayer = function(json) {
  const name = json.context.username
  const timestamp = Number(json.context['tmi-sent-ts']);
  const message = json.command.trim();
  const color = json.context.color;
  const values = ['1','2','3','4','5','6','7','8','9'];

  if (values.includes(message)) {
    const player = App.players.filter( p => p.name === name)[0];
    if (player === undefined) {
      App.newPlayer(name, message, timestamp, color);
    } else {
      App.updatePlayer(player, message, timestamp, color);
    }
  }
};

// --- formerly app.js ---

App.circles = [];
App.rectangles = [];
App.polygons = [];
App.engine = undefined;
App.players = [];
App.runPlinkoBot = true;
App.activeChips = [];
App.myInterface = new App.Interface();
App.hue = 0;

App.newGame = function() {
  // Remove all player chips from memory and reset player score
  App.players.forEach(function(player) {
    player.hasActiveChip = false;
    player.chips = [];
    player.score = 0;
  });

  // Remove all activeChips from physics engine and reset activeChips
  App.activeChips.forEach(function(chip) {
    Matter.Composite.remove(App.engine.world, chip.body);
    Matter.Engine.update(App.engine);
  });
  App.activeChips = [];

  //clear scoreboard
  $('#scoreboard').html(App.Interface.scoreboardHeading);

  console.log('new game');

  if (App.runPlinkoBot) { App.playPlinkoBot(); }
}

const myp = new p5(function(p) {
  const { Engine, World, Bodies, Events } = Matter;
  const { circles, rectangles, polygons } = App;

  p.setup = function() {
    p.frameRate(60);
    p.noStroke();
    App.engine = Engine.create({ enableSleeping: true });
    App.engine.world = World.create({ gravity: { x: 0, y: 1, scale: 0.001 } });

    p.createCanvas(641, 850);
    App.myInterface.placePegs(circles);
    App.myInterface.placeWalls(polygons, rectangles);
    App.myInterface.placeBinWalls(rectangles);
    App.myInterface.placeSensors(rectangles);

    // place floor
    rectangles.push(Bodies.rectangle(320, 830, 641, 10, { isStatic: true }));

    World.add(App.engine.world, circles);
    World.add(App.engine.world, rectangles);
    World.add(App.engine.world, polygons);

    Events.on(App.engine, "collisionStart", function(event) {
      event.pairs.forEach(function(pair) {
        const bodies = [pair.bodyA, pair.bodyB];
        const sensor = bodies.filter( b => b.isSensor)[0];
        if (sensor !== undefined) {
          console.log('score ' + sensor.value);
          const body = bodies.filter( b => b.isChip)[0];
          body.restitution = 0;
          const { player } = body.chip;
          player.score = player.score + sensor.value;
          App.myInterface.updateScore(App.players);
        }
      });
    });
    Engine.run(App.engine);

    if (App.runPlinkoBot) { App.playPlinkoBot(); }

    socket = io.connect('http://localhost:8081')
    socket.on('play', App.setupPlayer);
  };

  p.keyPressed = function() {
    if ((p.keyCode > 48) && (p.keyCode < 58)) {
      // 1 through 9
      App.dropPlinkoBotChip(p.keyCode - 48);
    } else if (p.keyCode === 78) {
      // lower case n
      App.newGame();
    }
  };

  // TODO: Seems like this doesn't need to be a p5 function.
  p.dropChip = function(chip) {
    chip.player.hasActiveChip = true;
    const { body } = chip;
    World.add(App.engine.world, body);
    Engine.update(App.engine);

    Events.on(body, 'sleepStart', function(event) {
      if (body.position.y > 750) {
        chip.player.hasActiveChip = false;
        App.activeChips = App.activeChips.filter( aChip => aChip !== chip);
        Matter.Composite.remove(App.engine.world, body);
        Engine.update(App.engine);

        // Automated plinko bot plays
        if (App.runPlinkoBot && chip.player.name === 'PlinkoBot') {
          if (chip.player.chips.length === 5) {
            // reset game
            console.log('restarting game in 10 seconds');
            setTimeout(
              function() { App.newGame() }, 10000
            );
          } else {
            App.playPlinkoBot();
          }
        }
      }
    });
  };

  p.draw = function() {
    p.clear();

    App.activeChips.forEach(function(chip) {
      App.myInterface.drawChip(p, chip);
    });

    p.colorMode(p.HSB);
    p.fill(App.hue, 360, 100);
    App.engine.world.bodies.forEach(function(body) {
      if (!body.isChip) {
        if (body.label === "Circle Body") {
          p.fill(0);
          App.myInterface.drawEllipse(p, body);
          p.fill(App.hue, 360, 100);
        }
        if (body.label === "Rectangle Body") { App.myInterface.drawRect(p, body); }
        if (body.label === "Body") { App.myInterface.drawPoly(p, body); }
      }
    });
    App.myInterface.placeSlotNumbers(p);
    App.myInterface.placeBinScores(p);
    App.hue++;
    if (App.hue > 360) { App.hue = 0; }
  };
});

App.newPlayer = function(name, msg, time, color) {
  const player = new App.Player(name, color);
  const chip = new App.Chip(msg, player, time);
  this.activeChips.push(chip);
  player.chips.push(chip);
  this.players.push(player);
  this.myInterface.updateScore(this.players);
  myp.dropChip(chip);
};

App.updatePlayer = function(player, msg, time, color) {
  player.setColor(color);
  this.myInterface.updateScore(this.players);
  if (!player.hasActiveChip && (player.chips.length < 5)) {
    const chip = new App.Chip(msg, player, time);
    this.activeChips.push(chip);
    player.chips.push(chip);
    this.myInterface.updateScore(this.players);
    myp.dropChip(chip);
  }
};

App.playPlinkoBot = function() {
  const slots = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  let randomSlot = slots[Math.floor(Math.random() * slots.length)];

  console.log('plinko bot dropping new chip in 10 seconds...');

  setTimeout(function() { App.dropPlinkoBotChip(randomSlot) }, 10000);
};

App.dropPlinkoBotChip = function(slot) {
  App.setupPlayer(
    {
      command: `${slot}`,
      context: {
        username: 'PlinkoBot',
        'tmi-sent-ts': (new Date()).getTime(),
        color: '#000'
      }
    }
  )
};
