# The Ledger — a Dungeon! treasure tracker

A tiny, no-build website for keeping score in the *Dungeon!* board game (or any "collect treasure until you hit a goal" game). No backend, no database — everything lives in your browser's local storage on whatever device you open it on.

## What it does

- Set up as many characters as *you* want to track (your kid can open the same page on their own device and track just theirs).
- Each character gets a name, a class with a preset treasure goal, or a custom goal.
- Big **+ / −** buttons plus quick preset chips (10 / 50 / 100 / 500 / 1000 / 2500) for fast scoring during play.
- A gem-shaped meter and progress bar fill up as each character gets closer to their goal.
- A card lights up green and says "ESCAPED THE DUNGEON!" once someone hits their goal.
- Progress is saved automatically (to that browser, on that device) so refreshing or closing the tab doesn't lose your game.
- "Edit Roster," "Reset Treasure," and "New Game" controls for managing an in-progress or finished game.

Class goals are pre-filled from the official Wizards of the Coast *Dungeon!* rules: Rogue and Cleric need 10,000 gp, Fighter needs 20,000 gp, and Wizard needs 30,000 gp.[^1] If your edition uses different classes (older TSR printings used Hero, Elf, Superhero, and Wizard) or house rules, just pick "Custom goal…" and type in whatever number you're using — it's fully editable per character either way.

## Hosting it on GitHub Pages

1. Create a new repository on GitHub (public repos get free Pages hosting).
2. Add these three files to the repo root: `index.html`, `style.css`, `script.js`.
3. Commit and push them to the `main` branch.
4. In the repo, go to **Settings → Pages**.
5. Under "Build and deployment," set **Source** to "Deploy from a branch," pick **main** and **/ (root)**, then save.
6. GitHub will give you a URL like `https://yourusername.github.io/your-repo-name/` after a minute or two. That's the link everyone in your family can open on their own phone/tablet.

No build tools, no npm install, no server — just static files.

## Notes

- Because each device stores its own data locally, nothing syncs between phones. That's by design: everyone tracks their own character(s), and you can track more than one (e.g., yourself and a younger kid) from a single device.
- If you ever clear your browser's site data for that page, the saved game is gone — there's no cloud backup.
- Works offline after the first load, except the Google Fonts (Cinzel, Inter, Space Mono) which need an internet connection the first time; after that they're cached by the browser.

[^1]: TechRaptor, ["Dungeon! Board Game Review"](https://techraptor.net/tabletop/reviews/dungeon-board-game-review-fun-youngsters); GamerFront, ["Review – Dungeon! Board Game"](http://gamerfront.net/2012/10/review-dungeon-board-game-tabletop/24644).
