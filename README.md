# Aurelia R-1 Landing Page

A premium, highly interactive cinematic landing page for the luxury **Aurelia R-1** tennis racket.

## Features

- **747 High-Density Frames**: Smooth frame-scrubbing animation driven by page scroll instead of heavy, laggy video elements.
- **GPU-Accelerated Texture Preloading**: A warm-up canvas technique decodes and uploads frames to GPU memory on page load for zero-stutter performance.
- **Interactive Mouse Parallax**: Fluid mouse-move-driven background translation in the hero section that fades out dynamically as you scroll down.
- **Responsive Layout**: Customized mobile layouts with clean stacked callouts that remain fully animated and responsive.
- **Auto-Hiding Navigation**: Header automatically slides out of view on scroll down and returns instantly on scroll up.
- **Smooth Easing**: Eased scroll rendering powered by GSAP, ScrollTrigger, and Lenis.

## Technologies Used

- **HTML5 Canvas & JavaScript** (Core rendering & preloading logic)
- **Vanilla CSS** (Typography, layout, & responsive styling)
- **GSAP & ScrollTrigger** (Animation timelines & scroll mapping)
- **Lenis** (High-performance smooth scrolling)

## Getting Started

To run the project locally, you can open `index.html` directly in a browser or serve it using a local HTTP server:

```bash
# Using Python
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) to view the live site.
