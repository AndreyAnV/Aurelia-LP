<p align="center">
  <img src="images/AR-logo.png" alt="Aurelia Logo" width="180">
</p>

# Aurelia R-1 Landing Page

A premium, highly interactive cinematic landing page for the luxury **Aurelia R-1** tennis racket.

## Live Demo

Experience the interactive cinematic showcase live at:  
👉 **[https://andreyanv.github.io/Aurelia-LP/](https://andreyanv.github.io/Aurelia-LP/)**

> [!IMPORTANT]  
> For the smoothest scroll performance, please use a browser with **Hardware Acceleration** enabled in settings.

## Features

- **747 High-Density Frames (WebP Optimized)**: Smooth frame-scrubbing animation driven by page scroll. The original 3.5 GB raw PNG frames were compressed into highly optimized WebP images (~70 MB total), maintaining lossless-adjacent visual quality with a 50× reduction in network payload.
- **Unified RAF Engine**: Drives Lenis scroll physics, canvas interpolation, and interactive mouse parallax in a single, high-performance `requestAnimationFrame` loop.
- **Hardware Compositor Promotion**: Elements are promoted to separate GPU rendering layers via `will-change` properties to bypass main-thread layout recalculations.
- **Adaptive Sticky Header**: Auto-hides on scroll down and slides back in on scroll up throughout the scroll cinematic, but remains fully sticky in the hero (Section 1) and specifications/preorder panels (Section 6+) for easy navigation.
- **Interactive SVG Technical HUD**: Clicking hotspot nodes (head, throat, shaft, grip) updates active technical details on the dashboard.
- **Preorder Configurator with Live Receipt**: Real-time receipt generator with imperial (`lbs`) and metric (`kg`) tension calculations, option-based product image switching, and barcode rendering.
- **Roleplaying Compliance Portals**: Fully functional modal systems directly under the root body, hosting tabbed telemetry agreements and neural data policies. Includes Lenis inputs pause/unpause to allow inner scroll navigation.

## Technologies Used

- **HTML5 Canvas & JavaScript** (Unified layout & rendering loop)
- **Vanilla CSS** (Futuristic styling, glassmorphism, responsive queries, and layout grids)
- **GSAP & ScrollTrigger** (Staggered animations, timeline pins, and scroll-scrub mapping)
- **Lenis** (High-performance smooth scrolling with prevent overlays)
- **FFmpeg** (WebP parallel conversion pipeline)
