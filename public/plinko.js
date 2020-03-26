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
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { Bodies } = Matter;

App.Interface = class Interface {};

App.Interface.prototype.drawChip = function(p, chip) {
  const { body } = chip;
  p.fill(0);
  const rad = body.circleRadius;
  const ctx = $('canvas')[0].getContext('2d');
  ctx.save();
  ctx.translate(body.position.x, body.position.y);
  ctx.rotate(body.angle);
  const pat = ctx.createPattern(chip.player.element, "repeat");
  ctx.beginPath();
  ctx.arc(0, 0, rad, 0, 2 * Math.PI, false);
  ctx.fillStyle = pat;
  ctx.fill();
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
      circles.push(Bodies.circle(x, y, 2.5, { isStatic: true }));
      x = x + 60;
      j++;
    }
    i++;
  }
};

// Displays image off-screen so it's loaded
App.Interface.prototype.placePicture = (id, picture) => $('body').append(
  '<img id="' + id + '" class="off-screen" src="' + picture + '" />'
);

App.Interface.prototype.placeWalls = function(polygons, rectangles) {
  rectangles.push(Bodies.rectangle(25,420,50,830, {isStatic: true}));
  rectangles.push(Bodies.rectangle(615,420,50,830, {isStatic: true}));
  const leftWallTriangle = Matter.Vertices.fromPath('0 0 30 50 0 100');
  const rightWallTriangle = Matter.Vertices.fromPath('0 0 0 100 -30 50');
  let i = 0;
  return (() => {
    const result = [];
    while (i < 6) {
      polygons.push(Bodies.fromVertices(60, 119 + (100 * i), leftWallTriangle, {isStatic: true}));
      polygons.push(Bodies.fromVertices(580, 119 + (100 * i), rightWallTriangle, {isStatic: true}));
      result.push(i++);
    }
    return result;
  })();
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
  let i = 0;
  while (i < scores.length) {
    p.text(scores[i], 10, 90 + (i * 60));
    i++;
  }
};

App.Interface.prototype.placeSensors = function(rectangles) {
  const scores = [100, 500, 1000, 0, 10000, 0, 1000, 500, 100];
  const offset = 80;
  let i = 0;
  while (i < scores.length) {
    rectangles.push(
      Bodies.rectangle(
        offset + (60 * i),
        788,
        55,
        80,
        {
          isSensor: true,
          isStatic: true,
          category: 'score',
          value: scores[i]
        }
      )
    );
    i++;
  }
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
  $('#scoreboard').html('');
  let newHtml =
    '<tr><td>Player</td><td>Score&nbsp;</td><td>Chips left</td></tr>';
  $.each(
    players.sort(App.Interface.compare).reverse(),
    function(i, player) {
      newHtml = `${newHtml}<tr><td>${parseInt(i + 1)}. ${player.name}&nbsp;` +
        `&nbsp;</td><td>${parseInt(player.score)}&nbsp;</td><td>` +
        `${parseInt(5 - player.chips.length)}</td></tr>`;
    }
  );
  $('#scoreboard').html(newHtml);
};


App.Player = class Player {
  constructor(id, name, lastComment) {
    this.id = id;
    this.name = name;
    this.lastComment = lastComment;
    this.chips = [];
    this.score = 0;
    this.hasActiveChip = false;
  }
};

App.Player.prototype.placePicture = function(intrfc) {
  intrfc.placePicture(this.id, this.picture);
};

App.setupPlayer = function(json) {
  const name = json.context.username
  const id = json.context.username
  const timestamp = Number(json.context['tmi-sent-ts']);
  const message = json.command.trim();

  if (timestamp > App.gameStart) {
    const values = ['1','2','3','4','5','6','7','8','9'];
    if (values.includes(message)) {
      const player = App.players.filter( p => p.id === id)[0];
      if (player === undefined) {
        App.newPlayer(id, name, message, timestamp);
      } else {
        App.updatePlayer(player, message, timestamp);
      }
    }
  }
};

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let foo;
App.circles = [];
App.rectangles = [];
App.polygons = [];
App.engine = undefined;
App.players = [];
App.activeChips = [];
App.myInterface = new App.Interface();
App.gameStart = (new Date()).getTime();
App.hue = 0;
App.commentEndpoint = 'https://graph.facebook.com/v2.12/me?fields=live_videos.limit(1)%7Bstatus%2Ccomments%7D&access_token=EAACBSzUTHmYBAAWaxRadUW7nfNrmAHkoM9P1vHOFwwXcIHbmivCcwQ7ZC8Uu2BBchOrYEp1thxeme1JiscwMztIX3oWib9g1ZB8YDbRVnUZCS5t0odWduhsCYxwaBsySwRZAALWfxFv2ZB1B5QIQHgiKWuDqMVupZBoyUd1lawk7UuQqCHZC1l0WlCZAvpQTfIAiKdNHJkZBOFt4EgCKt4CZBaW6UcTcoqg9x5JmSFSnsgMAZDZD';

const myp = new p5(function(p) {
  // module aliases
  const { Engine, World, Bodies, Events } = Matter;
  const { circles, rectangles, polygons } = App;
  let { engine } = App;
  let img = undefined;

  p.preload = () => img = p.loadImage('bob.png');

  p.setup = function() {
    p.frameRate(60);
    p.noStroke();
    engine = Engine.create({enableSleeping: true});
    engine.world = World.create({ gravity: { x: 0, y: 1, scale: 0.0009 } });

    p.createCanvas(641, 850);
    App.myInterface.placePegs(circles);
    App.myInterface.placeWalls(polygons, rectangles);
    App.myInterface.placeBinWalls(rectangles);
    App.myInterface.placeSensors(rectangles);
    rectangles.push(Bodies.rectangle(320, 830, 641, 10, {isStatic: true})); // floor

    World.add(engine.world, circles);
    World.add(engine.world, rectangles);
    World.add(engine.world, polygons);

    Events.on(engine, "collisionStart", function(event) {
      const bodies = [event.pairs[0].bodyA, event.pairs[0].bodyB];
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
    Engine.run(engine);

    socket = io.connect('http://localhost:8081')
    socket.on('play', App.setupPlayer);
  };

  p.keyPressed = function() {
    if ((p.keyCode > 48) && (p.keyCode < 58)) {
      const player = App.players.filter(p => p.id === 'me')[0];
      if (player === undefined) {
        App.newPlayer('me', 'dummy', p.keyCode - 48, (new Date).toISOString());
      } else {
        App.updatePlayer(player, p.keyCode - 48, (new Date).toISOString());
      }
    }
  };

  p.dropChip = function(chip) {
    chip.player.hasActiveChip = true;
    const { body } = chip;
    circles.push(body);
    World.add(engine.world, body);
    Events.on(body, 'sleepStart', function(event) {
      if (body.position.y > 750) {
        chip.player.hasActiveChip = false;
        App.activeChips = App.activeChips.filter( aChip => aChip !== chip);
        Matter.Composite.remove(engine.world, body);
      }
    });
    Engine.update(engine);
  };

  p.draw = function() {
    p.clear();
    $.each(App.activeChips, function(_i, chip) {
      App.myInterface.drawChip(p, chip);
    });
    p.colorMode(p.HSB);
    p.fill(App.hue, 360, 100);
    $.each(engine.world.bodies, function(_i, body) {
      if (!body.isChip) {
        if (body.label === "Circle Body") { App.myInterface.drawEllipse(p, body); }
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

const hitFb = function() {
  myp.httpGet(
    App.commentEndpoint,
    {},
    'json',
    App.setupPlayer
  );
};

App.fetchPicture = function(id) {
  let result = undefined;
  $.ajax({
    async: false,
    headers: { Accept : "application/json" },
    method: 'GET',
    url: 'https://graph.facebook.com/v2.12/' + id + '/picture?redirect=false&access_token=EAACBSzUTHmYBAAWaxRadUW7nfNrmAHkoM9P1vHOFwwXcIHbmivCcwQ7ZC8Uu2BBchOrYEp1thxeme1JiscwMztIX3oWib9g1ZB8YDbRVnUZCS5t0odWduhsCYxwaBsySwRZAALWfxFv2ZB1B5QIQHgiKWuDqMVupZBoyUd1lawk7UuQqCHZC1l0WlCZAvpQTfIAiKdNHJkZBOFt4EgCKt4CZBaW6UcTcoqg9x5JmSFSnsgMAZDZD',
    success(json) {
      return result = json.data.url;
    }
  });
  return result;
};

App.newPlayer = function(id, name, msg, time) {
  const player = new App.Player(id, name, time);
  const chip = new App.Chip(msg, player, time);
  this.activeChips.push(chip);
  // player.picture = this.fetchPicture(player.id);
  player.placePicture(this.myInterface);
  player.element = $('#' + player.id)[0];
  player.chips.push(chip);
  this.players.push(player);
  this.myInterface.updateScore(this.players);
  myp.dropChip(chip);
};

App.updatePlayer = function(player, msg, time) {
  if ((time > player.lastComment) && !player.hasActiveChip && (player.chips.length < 5)) {
    player.lastComment = time;
    const chip = new App.Chip(msg, player, time);
    this.activeChips.push(chip);
    player.chips.push(chip);
    return myp.dropChip(chip);
  }
};

// NOTE: Maybe obsolete now that we are using websockets.
App.compare = function(a,b) {
  if (a.created_time < b.created_time) {
    return -1;
  }
  if (a.created_time > b.created_time) {
    return 1;
  }
  return 0;
};


window.onload = (foo = function() {
  // hitFb();
  // setInterval(hitFb, 5000);
});
