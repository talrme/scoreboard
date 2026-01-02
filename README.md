# Scoreboard

A versatile, interactive scoreboard web application supporting multiple game types with real-time score tracking, customizable themes, and game-specific features.

## Features

### Core Features
- **Multiple Game Modes**: Custom, Pooch (Oh, Shit), and Cribbage with specialized layouts
- **Dynamic Player Management**: Add, remove, and edit 2-10 players on the fly
- **Customizable Themes**: Choose from Purple, Blue, Green, or Dark color schemes
- **Persistent State**: Automatic saving to localStorage and URL parameters
- **Shareable Links**: URL parameters preserve entire game state for easy sharing
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### Game-Specific Features

#### Custom Mode
- Simple scoreboard with flexible player count
- Quick +1, -1, and +5 score buttons
- Clean, minimal interface

#### Pooch (Oh, Shit)
- Round-by-round bid and trick tracking
- Automatic score calculation (bid + 10 if exact, -2 per difference)
- Configurable number of rounds (default 10)
- Visual feedback for positive/negative scores
- Running total display

#### Cribbage
- Traditional cribbage board visualization with SVG
- Animated peg movement (front and back pegs per player)
- 121-point board layout in classic "S" pattern
- Manual score entry with automatic board updates

### Settings
- **Color Themes**: Purple (default), Blue, Green, Dark
- **Round Settings**: Configure number of rounds for Pooch
- **Display Options**: Toggle rounds, bids, tricks, and deal indicators
- **History Management**: Clear saved games from localStorage

## Usage

### Getting Started
1. Open `index.html` in any modern web browser
2. Add players using the "+ Add Player" button
3. Select a game mode (Custom, Pooch, or Cribbage)
4. Start tracking scores!

### Playing Pooch (Oh, Shit)
1. Select "Pooch (Oh, Shit)" game mode
2. Each round, players enter their **bid** (predicted tricks)
3. After the round, enter **tricks** actually won
4. Scores calculate automatically:
   - Made your bid exactly? Get bid + 10 points
   - Missed? Lose 2 points per trick difference
5. Total scores update in real-time

### Playing Cribbage
1. Select "Cribbage" mode
2. Use +1, +2, and +5 buttons to update scores
3. Watch pegs move around the board automatically
4. First to 121 wins!

### Sharing Games
Share your current game state with others by copying the URL - it contains all settings, players, and game mode!

Example URL:
```
?game=pooch&players=Alice,Bob,Charlie&theme=dark&rounds=10
```

## Keyboard Shortcuts
- Edit player names by clicking on them
- Remove players with the × button (minimum 2 players required)
- Reset game clears all scores (confirmation required)

## Technologies

- **Pure HTML5**: Semantic markup, no frameworks
- **CSS3**: Custom properties for theming, Grid & Flexbox layouts, CSS animations
- **Vanilla JavaScript (ES6 modules)**: Clean, modular architecture
- **SVG**: Scalable cribbage board visualization

## File Structure

```
scoreboard/
├── index.html              # Main HTML structure
├── styles.css              # All styling and themes
├── script.js               # Core application logic
├── games.js                # Game preset configurations
├── cribbage-board.js       # SVG cribbage board renderer
├── url-manager.js          # URL parameter handling
├── storage-manager.js      # localStorage persistence
├── DATABASE_PLAN.md        # Future multiplayer integration plan
├── README.md               # This file
└── AI_DOCS.md              # Developer documentation
```

## Customization

### Adding a New Theme

Edit `styles.css` and add a new theme:

```css
[data-theme="custom"] {
  --primary: #your-color;
  --secondary: #your-color;
  --bg-gradient-start: #your-color;
  --bg-gradient-end: #your-color;
}
```

Then add the option to the settings modal in `index.html`.

### Adding a New Game Mode

1. Add game configuration to `games.js`:

```javascript
newgame: {
  name: 'New Game',
  columns: ['Col1', 'Col2'],
  logic: {
    calculateScore: (input) => { /* logic */ }
  }
}
```

2. Add rendering logic to `script.js` in `renderPlayers()` function

### Changing Score Button Values

Modify the button data attributes in `renderCustomPlayers()` or `renderCribbagePlayers()`:

```javascript
<button data-delta="10">+10</button>
```

## Browser Support

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

**Minimum requirements:**
- ES6 module support
- CSS Grid & Custom Properties
- localStorage API

## Future Features

See `DATABASE_PLAN.md` for detailed multiplayer integration roadmap:
- Real-time synchronization across devices
- Room codes for joining games
- Firebase/Supabase integration
- Collaborative gameplay

## Tips & Tricks

- **Quick Setup**: The app remembers your last game in localStorage
- **Sharing**: Copy the URL after setting up your game to share exact configuration
- **Mobile**: Works great on phones - perfect for tracking scores during actual games
- **Offline**: Fully functional without internet (until multiplayer is added)
- **Themes**: Dark mode is perfect for evening gameplay
- **Pooch Strategy**: The game gets harder as rounds progress (fewer cards = harder to predict)

## Development

No build process required! Just:
1. Clone the repository
2. Open `index.html` in a browser
3. Edit files and refresh to see changes

For development with live reload, use any simple HTTP server:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# VS Code
# Install "Live Server" extension and click "Go Live"
```

## Contributing

This is a personal project, but feel free to fork and customize for your own use!

## License

Free to use and modify for any purpose.

## Credits

Created for tracking scores during card game nights. Special focus on Pooch (Oh, Shit) and Cribbage, two family favorites.

---

**Enjoy your games!** 🎮🃏
