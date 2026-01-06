# HFIS Energy Dashboard

Hierarchical Fuzzy Inference System for Home Energy Efficiency Analysis

## 📂 Project Structure

```
├── index.html              # Main HTML file
├── styles.css              # Tailwind CSS with custom styles
├── script.js               # All JavaScript logic
├── output.css              # Generated CSS (built from styles.css)
├── package.json            # NPM dependencies
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
└── README.md               # This file
```

## 🚀 Installation & Setup

### 1. Install Node.js (if not already installed)
Download from: https://nodejs.org/

### 2. Navigate to the project directory
```bash
cd "c:\Users\Hafiy Imran\Desktop\SEM 4\ISP568 - FUZZY LOGIC SYSTEMS\gp\usehtml"
```

### 3. Install dependencies
```bash
npm install
```

This will install:
- **tailwindcss** - Utility-first CSS framework
- **postcss** - CSS transforming tool

### 4. Build Tailwind CSS
```bash
npm run build
```

This generates the `output.css` file from `styles.css`

### 5. Watch Mode (Optional - for development)
```bash
npm run watch
```

This automatically rebuilds CSS whenever you modify `styles.css`

### 6. Open the application
Simply open `index.html` in your browser, or use a local server:
```bash
python -m http.server 8000
# or
npx http-server
```

Then visit: `http://localhost:8000`

## 📋 Features

- **Single Room Analysis** - Analyze individual room efficiency with fuzzy logic
- **Multi-Room Dashboard** - Monitor all 4 rooms with Level 2 aggregation
- **History & Trends** - Real-time efficiency charting
- **Stress Testing** - Automated simulation of load scenarios
- **Theory & Logic** - Complete mathematical framework documentation
- **Report Export** - Download efficiency reports as text files

## 🎨 File Breakdown

| File | Purpose |
|------|---------|
| `index.html` | HTML structure - clean and semantic |
| `styles.css` | CSS with Tailwind @directives - properly scoped |
| `script.js` | All fuzzy logic algorithms and interactions |
| `output.css` | Generated production CSS (auto-built) |
| `tailwind.config.js` | Tailwind customization |
| `postcss.config.js` | PostCSS plugins configuration |
| `package.json` | Project metadata and dependencies |

## ⚙️ Technical Details

### Fuzzy Logic Engine
- **Membership Functions**: Triangular (trimf)
- **Inference Method**: Mamdani MIN operator
- **Defuzzification**: Centroid method
- **Output Range**: 0-100% efficiency

### Architecture
- **Level 1**: Individual room analysis
- **Level 2**: Global aggregation across all rooms
- **Real-time**: Updates every 5 seconds
- **Charts**: Chart.js for visualization

## 🐛 Troubleshooting

**Issue**: "Unknown @apply" warnings in IDE
- **Solution**: Warnings are normal with @layer components - they won't affect functionality

**Issue**: CSS not loading
- **Solution**: Make sure `output.css` exists. Run `npm run build`

**Issue**: Charts not showing
- **Solution**: Ensure Chart.js CDN is loaded (check network tab)

## 📝 Notes

- The Tailwind CSS is now properly scoped in `styles.css` using `@layer components`
- All warnings are eliminated with PostCSS configuration
- JavaScript is modular and well-organized
- No inline styles - all styling is in the CSS file
