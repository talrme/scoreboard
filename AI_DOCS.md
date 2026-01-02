# Scoreboard - AI Development Documentation

## Project Overview

This is a simple scoreboard application designed to track scores for two teams. It's built with vanilla HTML, CSS, and JavaScript with no dependencies or build process required.

## Architecture

### File Structure
```
scoreboard/
├── index.html      # Main HTML structure
├── styles.css      # All styling and animations
├── script.js       # Score tracking logic
├── README.md       # User-facing documentation
└── AI_DOCS.md      # This file
```

### Design Philosophy
- **Zero Dependencies**: No frameworks, no build tools, no package managers
- **Progressive Enhancement**: Works immediately when opened in browser
- **Mobile-First**: Responsive design that adapts to all screen sizes
- **Accessible**: Clean semantic HTML with proper button interactions

## Code Structure

### HTML (`index.html`)
- Standard HTML5 boilerplate
- Main container with scoreboard div
- Two team sections (A and B) with identical structure
- Each team has: heading, score display, +1/-1 buttons
- Global reset button at bottom
- Links to external CSS and JS files

### CSS (`styles.css`)
- **Layout**: Flexbox for responsive two-column layout
- **Design System**:
  - Primary color: `#667eea` (purple-blue)
  - Secondary: `#764ba2` (purple)
  - Background: Linear gradient between primary colors
  - Typography: System font stack for native feel
- **Responsive**: Breakpoint at 600px switches to single column
- **Animations**: Transform scale on score updates, hover effects on buttons

### JavaScript (`script.js`)
- **State Management**: Simple object `scores = { A: 0, B: 0 }`
- **Core Functions**:
  - `updateScore(team, delta)`: Modifies score, prevents negatives, triggers display update
  - `updateDisplay(team)`: Updates DOM and triggers animation
  - `resetScores()`: Resets both scores to 0
- **Event Handling**: DOMContentLoaded listener adds CSS transitions to score elements

## Key Features

### Score Management
- Scores stored in JavaScript object
- Cannot go below 0 (validation in `updateScore`)
- Updates are immediate and animated

### Animation System
- Score numbers scale up (1.2x) then back to normal (1x) on change
- CSS transitions (0.2s ease) for smooth effect
- Button hover effects with translateY for depth

### User Experience
- Large, readable score display (4rem font size)
- Color-coded buttons (blue for scoring, red for reset)
- Tactile feedback via animations on all interactions
- Tabular numbers for consistent width

## Extending the Application

### Adding More Teams
1. Duplicate a `.team` div in HTML
2. Change IDs (scoreC, scoreD, etc.)
3. Add corresponding entry to `scores` object in JS
4. Adjust CSS grid/flex for new layout

### Adding Score History
1. Create array to store score changes: `let history = []`
2. Push to history in `updateScore()`
3. Add undo button that pops from history
4. Display history list in UI

### Adding Timer/Game Clock
1. Add timer display div to HTML
2. Use `setInterval()` for countdown
3. Add start/stop/pause controls
4. Stop scoring when timer reaches 0

### Persisting Scores
1. Save to localStorage in `updateScore()`
2. Load from localStorage on page load
3. Add "Clear History" to fully reset

### Making it Multiplayer
1. Integrate WebSocket or Firebase
2. Sync `scores` object across clients
3. Add room/game ID system
4. Handle conflict resolution

## Common Modifications

### Change Point Increments
Replace hardcoded values in onclick attributes:
```html
<button onclick="updateScore('A', 2)">+2</button>
<button onclick="updateScore('A', 3)">+3</button>
```

### Add Team Logos
```html
<div class="team">
    <img src="team-a-logo.png" alt="Team A" class="team-logo">
    <h2>Team A</h2>
    ...
</div>
```

### Add Win Condition
```javascript
function updateScore(team, delta) {
    scores[team] += delta;
    if (scores[team] < 0) scores[team] = 0;
    
    // Check for winner
    if (scores[team] >= 10) {
        alert(`Team ${team} wins!`);
        resetScores();
    }
    
    updateDisplay(team);
}
```

### Sound Effects
```javascript
function updateScore(team, delta) {
    scores[team] += delta;
    if (scores[team] < 0) scores[team] = 0;
    
    // Play sound
    const audio = new Audio('point.mp3');
    audio.play();
    
    updateDisplay(team);
}
```

## Testing Notes

- Test on multiple screen sizes (desktop, tablet, phone)
- Verify buttons don't allow negative scores
- Check that reset works properly
- Test rapid clicking (should handle all updates)
- Verify animations are smooth

## Performance

- Minimal DOM manipulation (only updates changed score)
- No memory leaks (no unbounded arrays or listeners)
- Animations use transform (GPU-accelerated)
- No external dependencies to load

## Browser Compatibility

- Modern JavaScript (ES6+)
- CSS Grid and Flexbox
- No polyfills needed for target browsers (2020+)
- Falls back gracefully in older browsers (functionality intact, animations may differ)

## Future Enhancements

- [ ] Add keyboard shortcuts (arrow keys to score)
- [ ] Save game state to localStorage
- [ ] Add game timer/countdown
- [ ] Support for 3+ teams
- [ ] Score history/undo functionality
- [ ] Sound effects toggle
- [ ] Dark mode toggle
- [ ] Customizable team names (input fields)
- [ ] PWA support (manifest.json, service worker)
- [ ] Export score data (CSV/JSON)

