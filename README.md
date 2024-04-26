# Klondike (DOM version)

After creating `<canvas>`-based versions of Klondike and FreeCell, I decided that they didn't provide enough player feedback. Double-clicking a card to play on a foundation immediately displayed the card at the target location, with no animation indicating the action. Similarly when turning cards from a talon -> waste pile. The lack of animation wasn't quite so bad when dropping cards, since the cards were usually so close to the target location, it was more obvious when they "snapped" into place. However, more animation directing the player's attention is always nice. Since I didn't use a pre-existing game framework for the `<canvas>`-rendering, I would have had to write an animation engine, which I am too lazy to do. I also have a strong case of [NIH](https://en.wikipedia.org/wiki/Not_invented_here) when working on personal projects, so decided to try the challenge of rewriting the card game engine using the DOM, such that I could use 3D transforms and transitions (for "free"). The final confirmation that I would go ahead with this rewrite was when I discovered I could still create the "card waterfall" effect: by having a `<canvas>` background, animating a single card element (with an `<img>` to represent the card face) and drawing the trail by using the `<img>` as a data source for `context.drawImage`.

## TODO

- [ ] Add undo functionality for flipping cards from talon -> waste ('n back)
- [x] Add three card draw
- [ ] lol you can play cards (e.g. aces) while they're being dealt
- [ ] Cascade height isn't calculated correctly (too short)
- [ ] Double-tapping from waste doesn't immediately play card on foundation
  -> not sure what's happening here, the `if (doubleClick && !card.hasCards && !card.animating)` check isn't evaluating to true, even though all the conditions individually seem to be true
  -> it seems that the `card.animating` property is being set to true, because the first click/release grabs/releases the card, which tries to animate it back to place? but that shouldn't have an effect, because the grabbed card checks to see if it is considered "moved" or not. And the double-click works fine on cards in cascasdes...
  -> **it's because of the `waste.order()` call at the end of the `onUp` handler**
- [ ] Add scoring
