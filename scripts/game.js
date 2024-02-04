const wait = ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

const waitAsync = async ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

const dist = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const getPoint = event => {
  if (event.changedTouches && event.changedTouches.length > 0) {
    return {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY
    };
  }

  return {
    x: event.x,
    y: event.y
  };
}

const log = () => {
  if (DEBUG) {
    console.log(arguments);
  }
};

const SUITS = ['hearts', 'spades', 'diamonds', 'clubs'];
const RANKS = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];
const DEBUG = false;

// used for custom double-click/tap implementation
// this val is set in `onDown` function; if it is called again rapidly
// (e.g. within 500ms) then the interaction counts as a double-click
let lastOnDownTimestamp = Date.now();

// stores the last click/touch point; used because double-clicks
// need to be close together
let previousPoint = { x: 0, y: 0};

// array to hold inverse move data
const undoStack = [];

// boolean which can be checked to short-circuit player interaction, etc.
let gameOver = false;

// current time elapsed in seconds
let time = 0;

const cascades = [];
for (let i = 0; i < 8; i += 1) {
  const cascade = new Cascade();
  cascade.moveTo(10 + (85 * i), 100);
  cascades.push(cascade);

  // these don't have a visible component,
  // so we don't need to append them to the DOM
}

const foundations = [];
for (let i = 0; i < 4; i += 1) {
  const foundation = new Foundation();
  foundation.moveTo(10 + (85 * i), 10);
  foundations.push(foundation);

  // Make these visible by adding to DOM
  document.body.append(foundation.element);
}

const cells = [];
for (let i = 4; i < 8; i += 1) {
  const cell = new Cell();
  cell.moveTo(10 + (85 * i), 10);
  cells.push(cell);

  // Make these visible by adding to DOM
  document.body.append(cell.element);
}

const grabbed = new Grabbed();

// array to hold refs to each card obj
const cards = [];

// initialize list of cards
SUITS.forEach(suit => {
  RANKS.forEach(rank => {
    // instantiate new card object
    const card = new Card(suit, rank);

    // add the card's HTML to the page
    document.body.append(card.element);

    // add the card object to a ref list
    cards.push(card);
  });
});

if (DEBUG) {
  for (let i = 0; i < foundations.length; i += 1) {
    let foundation = foundations[i];

    // move all cards to winning positions
    for (let j = 0; j < 13; j += 1) {
      let card = cards[(13 * i) + j];
      card.flip();
      let parent = foundation.lastCard;
      card.setParent(parent);
      card.moveTo(parent.x, parent.y);
    }
  }
}

const checkWin = () => {
  // ensure that each foundation has 13 cards; we don't check for matching suit
  // or ascending rank because those checks are done when the card is played
  return foundations.every(f => {
    let count = 0;

    for (let _card of f.children()) {
      count += 1;
    }

    return count === 13;
  });
};

// Electronic versions of the game allow you to pick up multiple
// cards as a shortcut for putting them into open cells one at a time
// You're always allowed to move at least one card, so the "formula"
// is (open cells + 1)
const movableCards = () => {
  // TODO: max = Math.pow(2, emptyCascades) * (emptyCells + 1)
  return cells.reduce((total, cell) => total + (cell.hasCards ? 0 : 1), 1);
};

const updateMovableCardsLabel = () => document.querySelector('#movable_cards').textContent = `Movable Cards: ${movableCards()}`;

const attemptToPlayOnFoundation = card => {
  for (let i = 0; i < foundations.length; i += 1) {
    const foundation = foundations[i];

    if (foundation.validPlay(card)) {
      let parent = foundation.lastCard;  // either a card or the foundation itself

      undoStack.push({
        card,
        parent,
        oldParent: card.parent
      });

      card.setParent(parent);
      card.zIndex = 52; // ensure card doesn't animate _under_ others
      card.animateTo(parent.x, parent.y);

      // show a brief "flash" when the card is close to the foundation
      wait(150).then(() => card.flash());

      // Ensure card z-index is correct _after_ it animates
      wait(250).then(() => card.resetZIndex());

      console.log(`playing ${card} on foundation #${i}`);

      if (checkWin()) {
        CardWaterfall.start(() => {
          reset();
          deal();
        });
      }

      updateMovableCardsLabel();

      // if we have a valid play, return from this function;
      return;
    }
  }
};

const reset = () => {
  cards.forEach(c => {
    c.parent = null;
    c.child = null;
    c.flip('down');
  });

  cascades.forEach(c => c.child = null);
  cells.forEach(c => c.child = null);
  foundations.forEach(f => f.child = null);

  time = 0;
  gameOver = false;
  undoStack.length = 0; // trick to empty an array
};

const deal = async () => {
  // shuffle deck
  let currentIndex = cards.length;
  let randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [cards[currentIndex], cards[randomIndex]] = [cards[randomIndex], cards[currentIndex]];
  }

  let offset = 0;

  // move cards back to initial position
  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index];

    // move all cards on top of first foundation
    card.moveTo(foundations[0].x, foundations[0].y);
    card.zIndex = 51 - index;
  }

  // deal cards
  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index];

    const cascade = cascades[index % cascades.length];
    const lastCard = cascade.lastCard;

    card.setParent(lastCard);
    card.animateTo(lastCard.x, lastCard.y + offset);
    card.flip();

    await waitAsync(50);

    // update z-index of the card _after_ the synchronous delay;
    // this gives the animation time to move the card away from the deck
    card.resetZIndex()

    offset = index < 7 ? 0 : card.offset;
  };
};

cards.forEach(card => {
  const onDown = e => {
    e.preventDefault();

    const point = getPoint(e);
    const delta = Date.now() - lastOnDownTimestamp;
    const doubleClick = delta < 500 && dist(point, previousPoint) < 15;

    // reset the timestamp that stores the last time the player clicked
    // if the current click counts as "double", then set the timestamp way in the past
    // otherwise you get a "3 click double click" because the 2nd/3rd clicks are too close together
    lastOnDownTimestamp = doubleClick ? 0 : Date.now();
    previousPoint = point;

    // can only double-click to play on a foundation
    // if card is last in a cascade/cell
    if (doubleClick && !card.hasCards && !card.animating) {
      console.log(`double click! attempt to play ${card} on foundations`);
      attemptToPlayOnFoundation(card);
      return;
    }

    // only allow alternating sequences of cards to be picked up
    if (!card.childrenInSequence) {
      console.log(`can't pick up ${card}, not a sequence!`);
      return;
    }

    // only allow a certain number of cards to be picked up
    if (card.childCount >= movableCards()) {
      console.log(`You can only pick up ${movableCards()} cards!`);
      return;
    }

    grabbed.grab(card);
    grabbed.setOffset(point);

    console.log(`onDown on ${card}, offset: ${point.x}, ${point.y}`);
  };

  card.element.addEventListener('mousedown', onDown);
  card.element.addEventListener('touchstart', onDown);
});

const onMove = e => {
  e.preventDefault();

  if (!grabbed.hasCards) {
    return;
  }

  const point = getPoint(e);

  grabbed.moveTo(point);
};

const onUp = e => {
  e.preventDefault();

  if (!grabbed.hasCards) {
    return;
  }

  const card = grabbed.child;

  // check foundations
  for (let i = 0; i < foundations.length; i += 1) {
    const foundation = foundations[i];

    // only allow placement in foundation if a valid play, and
    // player is holding a single card
    if (grabbed.overlaps(foundation) && foundation.validPlay(card) && !card.hasCards) {
      let parent = foundation.lastCard;

      undoStack.push({
        card,
        parent,
        oldParent: card.parent
      });

      grabbed.drop(parent); // either a card or the foundation itself
      wait(150).then(() => card.flash());

      console.log(`dropping ${card} on foundation #${i}`);

      if (checkWin()) {
        CardWaterfall.start(() => {
          reset();
          deal();
        });
      }

      updateMovableCardsLabel();

      // valid play, so break out of the loop checking other foundations
      return;
    }
  }

  // check cells
  for (let i = 0; i < cells.length; i += 1) {
    const cell = cells[i];

    // only allow placemnt in a cell if the cell is empty and
    // player is holding a single card
    if (grabbed.overlaps(cell) && !cell.hasCards && !card.hasCards) {
      let parent = cell;

      undoStack.push({
        card,
        parent,
        oldParent: card.parent
      });

      grabbed.drop(cell);

      console.log(`dropping ${card} on cell #${i}`);

      updateMovableCardsLabel();

      // valid play, so return out of the loop checking other cells
      return;
    }
  }

  // check cascades
  for (let i = 0; i < cascades.length; i += 1) {
    const cascade = cascades[i];

    if (grabbed.overlaps(cascade) && cascade.validPlay(card)) {
      let parent = cascade.lastCard;

      undoStack.push({
        card,
        parent,
        oldParent: card.parent
      });

      grabbed.drop(parent);

      console.log(`dropping ${card} on cascade #${i}`);

      updateMovableCardsLabel();

      // valid play, so return out of the loop checking other cells
      return;
    }
  }

  // if we got this far, that means no valid move was made,
  // so the card(s) can go back to their original position
  console.log('invalid move; dropping card(s) on original position');

  grabbed.drop();
};

const onResize = () => {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  const aspectRatio = 4 / 3;
  const scale = window.devicePixelRatio;
  const canvas = document.querySelector('#canvas');

  // canvas is as large as the window;
  canvas.style.width = `${windowWidth}px`;
  canvas.style.height = `${windowHeight}px`;

  // account for high DPI screens
  // TODO: resizing the canvas while the card waterfall is running will erase all
  // previously drawn content. It's possible to persist it by copying to an unattached
  // canvas node, resizing, then drawing the copy back to the main canvas
  // https://stackoverflow.com/a/10658422
  canvas.width = Math.floor(windowWidth * scale);
  canvas.height = Math.floor(windowHeight * scale);

  // playable area, where cards will be drawn
  let tableauWidth;
  let tableauHeight;

  if (windowWidth / windowHeight > aspectRatio) {
    // wider than it is tall; use the window height to calculate tableau width
    tableauWidth = windowHeight * aspectRatio;
    tableauHeight = windowHeight;
  } else {
    // taller than it is wide; use window width to calculate tableau height
    tableauHeight = windowWidth / aspectRatio;
    tableauWidth = windowWidth;
  }

  let windowMargin = (windowWidth - tableauWidth) / 2;

  // tweak these values as necessary
  let margin = (4 / 608) * tableauWidth;

  // if tableau is 608pt wide, then for 8 columns
  // each column + margin should be 76

  // cards are 72x104
  let width = (72 / 608) * tableauWidth;
  let height = (104 / 454) * tableauHeight;
  let offset = height / 3.7; // ~28px

  // enumerate over all cards/stacks in order to set their width/height
  for (const cascade of cascades) {
    cascade.size = { width, height };
    cascade.offset = offset;
  }

  for (const foundation of foundations) {
    foundation.size = { width, height };
    foundation.offset = 0;
  }

  for (const cell of cells) {
    cell.size = { width, height };
    cell.offset = 0;
  }

  for (const card of cards) {
    card.size = { width, height };
    card.offset = offset;
  }

  grabbed.size = { width, height };
  grabbed.offset = offset;

  // Layout code
  const menu = document.querySelector('#menu');
  const status = document.querySelector('#status');

  // add internal padding to menu/status bars
  menu.style.padding = `0 0 0 ${windowMargin}px`;
  status.style.padding = `0 ${windowMargin}px`;

  const top = margin + menu.offsetHeight;
  const left = windowMargin + margin / 2;

  // foundations on the left
  foundations.forEach((f, i) => {
    f.moveTo(left + (width + margin) * i, top);
  });

  // cells are on the right; the (i + 4) allows space for foundations
  cells.forEach((c, i) => {
    c.moveTo(left + (width + margin) * (i + 4), top)
  });

  cascades.forEach((c, i) => {
      // allows space for cells/foundation
    c.moveTo(windowMargin + margin / 2 + (width + margin) * i, top + height + margin)
  });
};

const undo = () => {
  if (undoStack.length < 1) {
    console.log('No previously saved moves on the undo stack.');
    return;
  }

  // get card state _before_ the most recent move
  let { card, parent, oldParent } = undoStack.pop();

  // reverse the relationship; remove attachment from "new" parent
  parent.child = null;

  // we're cheating here and re-using logic from the `Grabbed` class
  // to handle moving/animating cards back to their previous position
  grabbed.grab(card);

  // total cheat
  grabbed.moved = true;

  grabbed.drop(oldParent);

  updateMovableCardsLabel();
};

const onKeyDown = e => {
  // return unless the keypress is meta/contrl + z (for undo)
  if (!(e.metaKey || e.ctrlKey) || e.key !== 'z') {
    return;
  }

  undo();
};

const onDeal = e => {
  e.preventDefault();

  if (!confirm('New game?')) {
    return;
  }

  reset();
  deal();
};

const onUndo = e => {
  e.preventDefault();

  if (gameOver) {
    return;
  }

  undo();
};

const onHelp = e => {
  e.preventDefault();

  window.open('https://en.wikipedia.org/wiki/FreeCell', '_blank');
};

document.body.addEventListener('mousemove', onMove);
document.body.addEventListener('touchmove', onMove);
document.body.addEventListener('mouseup', onUp);
document.body.addEventListener('touchend', onUp);

window.addEventListener('resize', onResize);
window.addEventListener('keydown', onKeyDown);

const dealButton = document.querySelector('#deal');
const undoButton = document.querySelector('#undo');
const helpButton = document.querySelector('#help');

dealButton.addEventListener('mouseup', onDeal);
undoButton.addEventListener('mouseup', onUndo);
helpButton.addEventListener('mouseup', onHelp);
dealButton.addEventListener('touchend', onDeal);
undoButton.addEventListener('touchend', onUndo);
helpButton.addEventListener('touchend', onHelp);

// start timer
window.setInterval(() => {
  if (gameOver) {
    return;
  }

  time += 1;
  document.querySelector('#time').textContent = `Time: ${time}`;
}, 1000);

// initial resize
onResize();

if (!DEBUG) {
  deal();
}
