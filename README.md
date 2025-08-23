# Klondike

I have fond memories of playing "Solitaire" on my grandparents' decrepit 286 box running Windows 3. Recently, I wanted to play the game again, but it's kind of a hassle to boot up a VM, not to mention the fact that you have to be sitting at a desktop to do it. Microsoft does have a "Solitaire Collection" mobile app, but it's full of ads, and doesn't have the retro aesthetic anymore. So of course the natural thing to do would be to spend a ton of time re-programming my own version.

Since I'm super lazy and want access to my game anywhere, I made it as a web page. The cards are all DOM elements, and are moved around the screen with CSS transforms. The crowning achievement (in my humble opinion) was re-creating the "card waterfall" the player gets after winning the game: by using a transparent `<canvas>` background and animating a single card element (with an `<img>` to represent the card face), I was able to draw the card trail by using the `<img>` as a data source for `context.drawImage`.

It's not quite the same as Wes Cherry's original version for Windows (my cards are way worse than Susan Kare's, for instance), but amusing enough for me. You might find it amusing too!
