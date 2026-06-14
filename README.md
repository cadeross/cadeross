# Cade Ross — Design & Development Portfolio

An interactive, high-performance design and development portfolio built with Next.js, React, and TypeScript. The site is styled with a sleek, monochromatic greyscale interface supporting system theme detection, fluid animations, and a custom infinite panning archive workspace.

## 🛠️ Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS
*   **Typography**: Source Serif 4 (loaded via Google Fonts) & Geist Mono
*   **Icons & Assets**: Custom inline SVG elements

## ✨ Key Features

### 1. Monochromatic Design System
A responsive greyscale design system that seamlessly adapts to the user's system preferences (Light/Dark mode). The browser viewport metadata matches the page backgrounds (`#ffffff` / `#0a0a0a`) for native browser integration.

### 2. Interactive Infinite Archive Canvas (`/archive`)
A full-screen interactive space mapping design works and code studies across 2D coordinates:
*   **Buttery Smooth Navigation**: Custom translation calculations bypass React rendering loops during drags for 60fps/120fps motion.
*   **Inertia Deceleration**: Tracks drag velocity to slide canvas smoothly with physics-based friction on mouse/touch release.
*   **Dual-Rendering Cards**: High-resolution image cards for key projects, and dashed wireframe blueprints (CAD style) for conceptual work.
*   **Lightbox View**: An immersive backdrop-blur modal to expand and view high-resolution mockups.
*   **Dynamic Layering**: Cards slightly scale, straighten, and automatically lift to the top of the z-index stack on hover.
*   **HUD Controls**: Recenter button, item count badges, and subtle parallax grid backgrounds.

### 3. Micro-Animations & FX
*   **Background Sparkles**: Subtle, procedurally placed terminal sparkles twinkling behind page layouts.
*   **Chronological Flow**: Entrance animations and biography structured in reverse chronological order.

## 📂 Project Structure

```
├── public/                 # Static assets
│   └── images/             # High-resolution project mockups
├── src/
│   ├── app/                # Next.js page router
│   │   ├── archive/        # Infinite canvas page
│   │   ├── globals.css     # Global styles & monochromatic design tokens
│   │   ├── layout.tsx      # Root HTML layout and viewport configuration
│   │   └── page.tsx        # Portfolio homepage / biography layout
│   ├── components/         # Reusable React components
│   │   ├── ArchiveLink.tsx # Interactive archive entrance
│   │   └── BackgroundSparkles.tsx # Sparkle overlay element
│   └── lib/
│       └── projects.ts     # Central projects/works database
```

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/cadeross/cadeross.git
   ```

2. Navigate into the project directory:
   ```bash
   cd cadeross
   ```

3. Install the dependencies:
   ```bash
   npm install
   ```

### Development Server

Run the local development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the portfolio.

### Build and Optimization

To build the application for production deployment:
```bash
npm run build
```

This generates an optimized static export ready for deployment.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
