# Scoreboard

A simple, clean, and interactive scoreboard web application for tracking scores between two teams.

## Features

- **Two Team Scoring**: Track scores for Team A and Team B simultaneously
- **Increment/Decrement**: Add or subtract points with +1 and -1 buttons
- **Reset Functionality**: Clear all scores with a single button
- **Smooth Animations**: Score changes include subtle scale animations for better UX
- **Negative Score Prevention**: Scores cannot go below zero
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Beautiful gradient background with clean, rounded interface elements

## Usage

Simply open `index.html` in any modern web browser. No server or build process required.

### Controls

- **+1 Button**: Add one point to the respective team
- **-1 Button**: Subtract one point from the respective team (minimum score is 0)
- **Reset Button**: Reset both teams to 0 points

## Technologies

- Pure HTML5
- CSS3 (with Flexbox and CSS animations)
- Vanilla JavaScript (no frameworks required)

## Customization

### Changing Team Names

Edit the `<h2>` tags in `index.html`:

```html
<h2>Team A</h2>  <!-- Change to your team name -->
```

### Adjusting Colors

Modify the CSS variables in `styles.css`:
- Background gradient: `body { background: linear-gradient(...) }`
- Score color: `.score { color: #667eea }`
- Button colors: `.team button { background: #667eea }`

### Adding More Points Per Click

In `script.js`, change the `updateScore` function calls:

```javascript
<button onclick="updateScore('A', 3)">+3</button>
```

## Browser Support

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

Free to use and modify for any purpose.

