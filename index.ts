// Import stylesheets
import './style.css';

// physics constants
const FRICTION = 0.99995;
const REST = 28;

window.ZZ_INFO =
  'aeg|aegr|aegrs|adegrs|abdegrs|abdegirs,age|gear|rage|gears|rages|sarge|grades|badgers|abridges|brigades';

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
// letter blobs
const blobs = [];
// letter blob els
const blob_els = [];
// letter blob text els
const text_els = [];
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
    const { x, y } = getPointOnCircle(i);
    blobs.push(new Blob(new Point(x, y), getChar(i)));
    if (i > 0) {
      // create constraint
      const constraint = new Constraint(REST, blobs[i - 1].p, blobs[i].p);
      constraints.push(constraint);
    }
  }
  const constraint = new Constraint(
    REST,
    blobs[blobs.length - 1].p,
    blobs[0].p
  );
  constraints.push(constraint);
  for (let i = 0; i < 8; ++i) {
    const blob_el = document.querySelector('g#b-' + i);
    const text_el = blob_el.querySelector('text');
    text_els.push(text_el);
    // const debug_el = document.querySelector('g#d-' + i);
    // debug_el.setAttribute('transform', `translate(${x}, ${y})`);
    // blob_el.setAttribute('transform', `translate(${x}, ${y})`);
    blob_el.addEventListener('mousedown', handler, false);
    blob_el.addEventListener('mouseup', handler, false);
    blob_el.addEventListener('touchstart', handler, false);
    blob_el.addEventListener('touchend', handler, false);

    if (i > 2) {
      blob_el.classList.add('inactive');
    }

    blob_els.push(blob_el);
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
    console.log('animatione end!');
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
        if (input.length < 8) {
          input += e.currentTarget.textContent.trim();
        }
      }
      break;
    case 'mouseup':
      if (!touch) {
        if (input.length < 8) {
          input += e.currentTarget.textContent.trim();
        }
      }
      break;
    default:
      console.log('unhandled?', e.type);
  }
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
  for (let i = 0; i < blobs.length; ++i) {
    blobs[i].update();
  }
  for (let i = 0; i < constraints.length; ++i) {
    constraints[i].update();
  }
}

// draw game
function draw() {
  for (let i = 0; i < blobs.length; ++i) {
    const b = blobs[i];
    const b_el = blob_els[i];
    const text_el = text_els[i];
    if (b.char !== '' && text_el.textContent === '') {
      b_el.classList.remove('inactive');
      b_el.classList.add('active');
    }
    text_el.textContent = b.char;
  }
  ++t;
  renderInput();
}

// update input element
function renderInput() {
  inputEl.setAttribute('value', input);
}
