# 🌟 Star Hopper Adventures 🐰

A fun and engaging 3D platform puzzle game for kids aged 5+, built with React, Vite, and Three.js!

## 🎮 Game Features

- **Cute 3D bunny character** that hops and collects stars
- **Multiple levels** with increasing difficulty
- **Puzzle elements** including color sequences and special blocks
- **Responsive design** - works perfectly on 4-inch to 10-inch screens
- **Touch controls** for mobile devices
- **Keyboard support** for desktop play
- **Beautiful 3D graphics** with clouds, sparkles, and colorful platforms

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The game will open at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## 🎯 How to Play

### Controls

**Desktop:**
- **Arrow Keys** or **A/D**: Move left/right
- **Space** or **W** or **Up Arrow**: Jump

**Mobile/Touch:**
- Use the **on-screen buttons** to move and jump

### Objective

- Collect all the stars in each level
- Jump on colored blocks to solve puzzles
- Reach new platforms to explore the world
- Complete levels to unlock new challenges

## 🌈 Game Elements

### Platform Types

1. **Static Platforms** (Green/Blue/Orange): Normal platforms to jump on
2. **Moving Platforms** (Purple): Move back and forth
3. **Bouncy Platforms** (Green): Give extra jump height
4. **Disappearing Platforms** (Red): Vanish after stepping on them
5. **Rotating Platforms** (Blue): Spin continuously

### Puzzle Blocks

- Jump on colored blocks in the correct sequence
- Look for number hints to solve puzzles
- Complete puzzles to unlock bonus stars

## 📱 Mobile Optimization

The game is fully optimized for mobile devices:
- Responsive UI that adapts to screen size
- Large, easy-to-tap controls for small fingers
- Smooth performance on mobile browsers
- Works in both portrait and landscape orientations

## 🛠️ Technical Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Three.js** - 3D graphics engine
- **React Three Fiber** - React renderer for Three.js
- **React Three Drei** - Useful helpers for R3F
- **Howler.js** - Audio library for sound effects

## 🎨 Features for Kids

- Bright, colorful graphics
- Simple, intuitive controls
- Forgiving gameplay (can't fall off the world)
- Encouraging messages and rewards
- Safe, ad-free environment
- No in-app purchases or external links

## 🔧 Development

### Project Structure

```
star-hopper-game/
├── src/
│   ├── components/
│   │   ├── Game.jsx         # Main game logic
│   │   ├── Player.jsx       # Bunny character
│   │   ├── Platform.jsx     # Platform types
│   │   ├── Star.jsx         # Collectible stars
│   │   ├── PuzzleBlock.jsx  # Puzzle elements
│   │   ├── Cloud.jsx        # Decorative clouds
│   │   └── UI components... # Menus and HUD
│   ├── App.jsx              # Main app component
│   ├── App.css              # Styles
│   └── main.jsx             # Entry point
├── index.html
└── package.json
```

## 🎉 Have Fun!

This game is designed to be fun, educational, and safe for young children. Enjoy playing Star Hopper Adventures!