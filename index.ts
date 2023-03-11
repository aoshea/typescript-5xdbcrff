// Import stylesheets
import './style.css';

// max word len - TODO: get from wordset
const MAX_CHARS = 8;

// physics constants
const FRICTION = 0.99995;
const REST = 28;

window.ZZ_INFO =
  'aeg|aegr|aegrs|adegrs|abdegrs|abdegirs,age|gear|rage|gears|rages|sarge|grades|badgers|abridges|brigades';

// Tile class
function Tile(char: string, position: number) {
  this.char = char;
  this.position = position;
}

Tile.prototype.getKey = function () {
  return `g#b-${this.position}`;
};

Tile.prototype.update = function () {
  return false;
};

// Tile element
function TileView(index: number, handler) {
  this.index = index;
  this.handler = handler;
  this.root_el = document.querySelector(this.getKey());
  this.text_el = this.root_el.querySelector('text');
  this.addListeners(handler);
}

TileView.prototype.getKey = function () {
  return `g#b-${this.index}`;
};

TileView.prototype.addListeners = function (handler) {
  this.root_el.addEventListener('mousedown', handler, false);
  this.root_el.addEventListener('mouseup', handler, false);
  this.root_el.addEventListener('touchstart', handler, false);
  this.root_el.addEventListener('touchend', handler, false);
};

TileView.prototype.drawText = function (char: string) {
  this.text_el.textContent = char;
};

// point class
function Point(x, y) {
  this.x = x;
  this.y = y;
  this.ax = 0;
  this.ay = 0;
}

Point.prototype.update = function () {
  this.ax *= FRICTION;
  this.ay *= FRICTION;
  this.x = this.x + this.ax;
  this.y = this.y + this.ay;
};

Point.prototype.clone = function () {
  return new Point(this.x, this.y);
};

// constraint class
function Constraint(rest, a, b) {
  this.rest = rest;
  this.a = a;
  if (typeof b === 'undefined' || typeof b === null) {
    this.b = a.clone();
    this.pin = true;
  } else {
    this.b = b;
  }
}

Constraint.prototype.update = function () {
  let dx = this.a.x - this.b.x;
  let dy = this.a.y - this.b.y;
  let len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) {
    len += 0.001;
  }
  let dist = 1 * (this.rest - len) * 0.5 * -1;
  let ddx = this.b.x + dx * 0.5;
  let ddy = this.b.y + dy * 0.5;
  dx /= len;
  dy /= len;
  if (!this.pin) {
    this.b.x = ddx + dx * 0.5 * this.rest * -1;
    this.b.y = ddy + dy * 0.5 * this.rest * -1;
    this.b.ax = this.b.ax + dx * dist;
    this.b.ay = this.b.ay + dy * dist;
  }
  this.a.x = ddx + dx * 0.5 * this.rest;
  this.a.y = ddy + dy * 0.5 * this.rest;
  this.a.ax = this.a.ax + dx * -dist;
  this.a.ay = this.a.ay + dy * -dist;
};

// blob class
function Blob(p, char) {
  this.p = p;
  this.char = char;
}

Blob.prototype.update = function () {
  this.p.update();
};

// constraints
const constraints = [];

// tiles
const tiles = [];
// tile view representation indexed by id
const tile_view_map = {};

// game internal count
let t = 0;
// game input text
let input = '';
// input state set initially
let touch = false;
// game level
let game_level = 0;

// svg element
const svgDiv: SVGElement = document.querySelector('svg');
// debug ele
const debugEl: HTMLElement = document.querySelector('.zz--debug');
// input el
const inputEl = document.querySelector('input[name="input"]');
// score plum el
const plumEl = document.querySelector('div.zz--plum');

window.addEventListener('resize', layout);
layout();
init();

function layout() {
  svgDiv.setAttribute('width', '100%');
  svgDiv.setAttribute('height', window.innerHeight + 'px');
}

function getPointOnCircle(i) {
  const cx = 50;
  const cy = 50;
  const angle = (Math.PI / 4) * i;

  // 0,1,2,3 ===

  const radius = 30;
  const x = cx + Math.sin(angle) * radius;
  const y = cy + Math.cos(angle) * radius;
  return { x, y };
}

// init game
function init() {
  // set input el
  renderInput();

  // create letter blobs
  for (let i = 0; i < 8; ++i) {
    tiles.push(new Tile(getChar(i), i));

    const tile_view = new TileView(i, handler);
    tile_view_map[tile_view.getKey()] = tile_view;
  }

  // add listeners to buttons
  const delete_btn = document.querySelector('button[name="delete"]');
  const enter_btn = document.querySelector('button[name="enter"]');
  const shuffle_btn = document.querySelector('button[name="shuffle"]');
  delete_btn.addEventListener('click', handleDelete, false);
  enter_btn.addEventListener('click', handleEnter, false);
  shuffle_btn.addEventListener('click', handleShuffle, false);

  // init plum
  plumEl.addEventListener('animationend', () => {
    plumEl.classList.remove('show');
  });

  gameloop();
}

function advanceLevel() {
  if (game_level < 5) {
    const plumtexts = ['Nice!', 'Great!', 'Amazing!', 'Super!', 'Incredible!'];
    plumEl.textContent = plumtexts[game_level];
    plumEl.classList.add('show');

    ++game_level;
    // add letter to board
    // next available
    /*
    const wordsets = window.ZZ_INFO.split(',')[0].split('|');

    let set = wordsets[game_level];
    while (set.length > 0) {
      let char = set.charAt(set.length - 1);
      set = set.slice(0, set.length - 1);
      // already there?
      const index = blobs.map((x) => x.char).indexOf(char);
      if (index === -1) {
        for (let i = 0; i < blobs.length; ++i) {
          if (blobs[i].char === '') {
            blobs[i].char = char;
            break;
          }
        }
      }
    }

    if (set.length > 0) {
      for (let i = 0; i < set.length; ++i) {
        for (let j = 0; j < blobs.length; ++j) {
          if (blobs[j].char === '') {
            blobs[j].char = set.charAt(i);
            break;
          }
        }
      }
    }
    */
  } else {
    plumEl.textContent = 'You win!';
    plumEl.classList.add('show');
  }
}

// get char by index
function getChar(i) {
  const wordsets = window.ZZ_INFO.split(',')[0].split('|');
  const set = wordsets[game_level];
  const result = set.charAt(i);
  return result;
}

// handle delete
function handleDelete() {
  if (input.length > 0) {
    input = input.slice(0, input.length - 1);
  }
}

function handleEnter() {
  console.log('compare ', input, 'with answer?');
  const answers = window.ZZ_INFO.split(',')[1].split('|');
  const len = game_level + 3;
  const game_level_answers = answers.filter((x) => x.length === len);
  console.log(game_level_answers);
  if (game_level_answers.indexOf(input.toLowerCase()) !== -1) {
    advanceLevel();
  }
  input = '';
}

function handleShuffle() {
  console.log('jumble the letters');
}

function getCharByPosition(position: number): string {
  for (let i = 0; i < tiles.length; ++i) {
    if (tiles[i].position === position) {
      return tiles[i].char;
    }
  }
  return '';
}

function addInput(char: string): boolean {
  if (input.length < MAX_CHARS) {
    input += char;
    return true;
  }
  return false;
}

// handle click
function handler(e) {
  e.stopPropagation();
  debug(e.type);
  switch (e.type) {
    case 'touchstart':
      touch = true;
      break;
    case 'touchend':
      if (touch) {
        handleInput(e.currentTarget);
      }
      break;
    case 'mouseup':
      if (!touch) {
        handleInput(e.currentTarget);
      }
      break;
    default:
      console.log('unhandled?', e.type);
  }
}

function handleInput(target) {
  const elementPosition = parseInt(target.id.split('-')[1], 10);
  const char = getCharByPosition(elementPosition);
  addInput(char);
}

// debug looging
let log = '';
function debug(message) {
  log += message + '<br>';
  debugEl.innerHTML = log;
}

// loop
function gameloop() {
  window.requestAnimationFrame(gameloop);
  update();
  draw();
}

// update game
function update() {
  for (let i = 0; i < tiles.length; ++i) {
    tiles[i].update();
  }
  /*
  for (let i = 0; i < constraints.length; ++i) {
    constraints[i].update();
  }
  */
}

// draw game
function draw() {
  for (let i = 0; i < tiles.length; ++i) {
    const tile = tiles[i];
    // get view for tile
    const tile_view = tile_view_map[tile.getKey()];
    tile_view.drawText(tile.char);
  }
  /*
  for (let i = 0; i < tile_views.length; ++i) {
    const b_el = tile_views[i];
    const text_el = b_el.text_el;
    
    if (b.char !== '' && text_el.textContent === '') {
      b_el.classList.remove('inactive');
      b_el.classList.add('active');
    }
    text_el.textContent = b.char;
  }
  */
  ++t;
  renderInput();
}

// update input element
function renderInput() {
  inputEl.setAttribute('value', input);
}
