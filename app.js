// app.js — Frame scrub using yeyeyeyeyeyeyehhhh_frames (no video)

function initApp() {
    // -------------------------------------------------------------------------
    // CONFIG
    // -------------------------------------------------------------------------
    const TOTAL_FRAMES = 747;
    const FRAME_PREFIX = 'images/yeyeyeyeyeyeyehhhh_frames/frame_';

    // Virtual frame index runs 0 → TOTAL_FRAMES-1 across all 5 pinned sections.
    // Each section owns 149.4 virtual frames.
    const FRAMES_PER_SECTION = TOTAL_FRAMES / 5; // 149.4

    const images = new Array(TOTAL_FRAMES); // indexed 0..299
    let loadedCount = 0;
    let isUnlocked = false;
    let triggerRedraw = null;

    // Force scroll-to-top on reload
    if (history.scrollRestoration) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const preloader    = document.getElementById('preloader');
    const loaderBar    = document.getElementById('loader-bar');
    const loaderPercent = document.getElementById('loader-percent');
    const loaderInfo   = document.querySelector('.loader-info');

    // -------------------------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------------------------
    function pad4(n) {
        return String(n).padStart(4, '0');
    }

    // -------------------------------------------------------------------------
    // GPU WARM-UP — draw every frame into a 1×1 canvas so the browser decodes
    // and uploads all textures before the user starts scrolling.
    // -------------------------------------------------------------------------
    function warmUpGPUTextures(onComplete) {
        if (loaderInfo) loaderInfo.textContent = 'Warming up GPU cache…';

        const tmp    = document.createElement('canvas');
        tmp.width    = 1;
        tmp.height   = 1;
        const tmpCtx = tmp.getContext('2d');

        let idx = 0;
        function batch() {
            const t0 = performance.now();
            try {
                while (idx < TOTAL_FRAMES && performance.now() - t0 < 12) {
                    const img = images[idx];
                    if (img && (img.naturalWidth > 0 || img.width > 0)) {
                        tmpCtx.drawImage(img, 0, 0, 1, 1);
                    }
                    idx++;
                }
            } catch (_) { /* skip bad frame */ }

            if (idx < TOTAL_FRAMES) {
                requestAnimationFrame(batch);
            } else {
                onComplete();
            }
        }
        requestAnimationFrame(batch);
    }

    // -------------------------------------------------------------------------
    // PAGE UNLOCK
    // -------------------------------------------------------------------------
    function unlockPage() {
        if (isUnlocked) return;
        isUnlocked = true;

        if (loaderBar)     loaderBar.style.width     = '100%';
        if (loaderPercent) loaderPercent.textContent = '100%';

        setTimeout(() => {
            warmUpGPUTextures(() => {
                if (preloader) preloader.classList.add('fade-out');
                try {
                    initCanvasScrub();
                } catch (e) {
                    console.error('Failed to initialize scroll cinematic:', e);
                }
            });
        }, 400);
    }

    function onFrameLoaded() {
        if (isUnlocked) return;
        loadedCount++;
        const pct = Math.min(99, Math.round((loadedCount / TOTAL_FRAMES) * 100));
        if (loaderBar)     loaderBar.style.width     = pct + '%';
        if (loaderPercent) loaderPercent.textContent = pct + '%';
        if (loadedCount >= TOTAL_FRAMES) unlockPage();
    }

    // Safety timeout — force unlock after 3 s even if some frames fail
    setTimeout(() => { if (!isUnlocked) unlockPage(); }, 3000);

    // -------------------------------------------------------------------------
    // PRELOAD ALL FRAMES
    // -------------------------------------------------------------------------
    for (let i = 0; i < TOTAL_FRAMES; i++) {
        const img     = new Image();
        img.decoding  = 'async';
        const src     = FRAME_PREFIX + pad4(i + 1) + '.jpg'; // frame_0001.jpg … frame_0747.jpg

        img.onload = () => {
            if (typeof img.decode === 'function') {
                img.decode()
                    .then(() => { images[i] = img; onFrameLoaded(); })
                    .catch(() => { images[i] = img; onFrameLoaded(); });
            } else {
                images[i] = img;
                onFrameLoaded();
            }
        };
        img.onerror = () => {
            // leave slot empty; canvas will just skip it
            onFrameLoaded();
        };
        img.src = src;
    }

    // -------------------------------------------------------------------------
    // PREORDER CONFIGURATOR & RECEIPT TERMINAL
    // -------------------------------------------------------------------------
    const preorderForm = document.getElementById('preorder-form');
    const formMessage  = document.getElementById('form-message');
    const submitBtn    = document.getElementById('submit-btn');
    
    const optionCards = document.querySelectorAll('.option-card');
    const selectionInput = document.getElementById('selection');
    const receiptSelection = document.getElementById('receipt-selection');
    const receiptPrice = document.getElementById('receipt-price');

    const gripBtns = document.querySelectorAll('.grip-btn');
    const gripInput = document.getElementById('grip_size');
    const receiptGrip = document.getElementById('receipt-grip');

    const tensionSlider = document.getElementById('tension');
    const tensionNum = document.getElementById('tension-num');
    const tensionDesc = document.getElementById('tension-desc');
    const receiptTension = document.getElementById('receipt-tension');
    const receiptSerial = document.getElementById('receipt-serial');

    const tensionRecommendations = {
        50: 'Maximum Power & Comfort (Soft Feel)',
        51: 'Maximum Power & Comfort (Soft Feel)',
        52: 'Increased Power & Arm Comfort',
        53: 'Increased Power & Arm Comfort',
        54: 'Excellent Blend of Power & Control',
        55: 'Optimal Control & Power Balance',
        56: 'Optimal Control & Power Balance',
        57: 'Enhanced Precision & Placement',
        58: 'Enhanced Precision & Placement',
        59: 'Advanced Placement & High Spin Control',
        60: 'Maximum Precision & Tension Stability',
        61: 'Maximum Precision & Tension Stability',
        62: 'Professional Control Focus (Stiff Feel)',
        63: 'Professional Control Focus (Stiff Feel)',
        64: 'Ultra Stiff Professional Diagnostic',
        65: 'Ultra Stiff Professional Diagnostic'
    };

    function generateSerial() {
        if (receiptSerial) {
            const randomHex = Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
            const randomBatch = Math.floor(Math.random() * 9) + 1;
            receiptSerial.textContent = `AUR-R1-B${randomBatch}-${randomHex}`;
        }
    }
    
    // Initialize receipt serial number
    generateSerial();

    // Option cards event listeners
    optionCards.forEach(card => {
        card.addEventListener('click', () => {
            optionCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            const val = card.getAttribute('data-value');
            const price = card.getAttribute('data-price');
            const name = card.querySelector('.option-name').textContent;
            
            if (selectionInput) selectionInput.value = val;
            if (receiptSelection) receiptSelection.textContent = name;
            if (receiptPrice) receiptPrice.textContent = `$${parseInt(price).toLocaleString()}`;
        });
    });

    // Grip size event listeners
    gripBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            gripBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            const val = btn.getAttribute('data-value');
            if (gripInput) gripInput.value = val;
            if (receiptGrip) receiptGrip.textContent = val;
        });
    });

    // Tension range event listener
    if (tensionSlider) {
        tensionSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            if (tensionNum) tensionNum.textContent = val;
            if (receiptTension) receiptTension.textContent = val;
            if (tensionDesc) {
                tensionDesc.textContent = tensionRecommendations[val] || 'Custom Calibration';
            }
        });
    }

    // Submit handler
    if (preorderForm) {
        preorderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitBtn.disabled    = true;
            submitBtn.style.opacity = '0.7';
            formMessage.textContent = 'Processing allocation request…';
            formMessage.className   = 'form-message';

            const fd    = new FormData(preorderForm);
            const name  = fd.get('name');
            const email = fd.get('email');

            setTimeout(() => {
                submitBtn.disabled    = false;
                submitBtn.style.opacity = '1';
                formMessage.className   = 'form-message success';
                formMessage.innerHTML   =
                    `Allocation secured for <strong>${name}</strong>. A verification email has been dispatched to <strong>${email}</strong>.`;
                
                // Reset form elements
                preorderForm.reset();
                
                // Reset interactive configurator elements to defaults
                optionCards.forEach(c => c.classList.remove('selected'));
                const defaultCard = document.querySelector('.option-card[data-value="set"]');
                if (defaultCard) {
                    defaultCard.classList.add('selected');
                    if (selectionInput) selectionInput.value = 'set';
                    if (receiptSelection) receiptSelection.textContent = defaultCard.querySelector('.option-name').textContent;
                    if (receiptPrice) receiptPrice.textContent = `$1,250`;
                }
                
                gripBtns.forEach(b => b.classList.remove('selected'));
                const defaultGrip = document.querySelector('.grip-btn[data-value="3"]');
                if (defaultGrip) {
                    defaultGrip.classList.add('selected');
                    if (gripInput) gripInput.value = '3';
                    if (receiptGrip) receiptGrip.textContent = '3';
                }
                
                if (tensionSlider) {
                    tensionSlider.value = 55;
                    if (tensionNum) tensionNum.textContent = '55';
                    if (receiptTension) receiptTension.textContent = '55';
                    if (tensionDesc) tensionDesc.textContent = 'Optimal Control & Power Balance';
                }
                
                // Regenerate serial number
                generateSerial();
            }, 1500);
        });
    }

    // -------------------------------------------------------------------------
    // INTERACTIVE SPECS HUD
    // -------------------------------------------------------------------------
    const hudCards = document.querySelectorAll('.hud-card');
    const hudNodes = document.querySelectorAll('.hud-node');

    hudCards.forEach(card => {
        const part = card.getAttribute('data-node');
        card.addEventListener('mouseenter', () => {
            document.querySelectorAll(`.blueprint-${part}`).forEach(el => el.classList.add('active'));
            const node = document.getElementById(`node-${part}`);
            if (node) node.classList.add('active');
        });
        
        card.addEventListener('mouseleave', () => {
            document.querySelectorAll(`.blueprint-${part}`).forEach(el => el.classList.remove('active'));
            const node = document.getElementById(`node-${part}`);
            if (node) node.classList.remove('active');
        });
    });

    hudNodes.forEach(node => {
        const ref = node.getAttribute('data-ref');
        node.addEventListener('mouseenter', () => {
            node.classList.add('active');
            document.querySelectorAll(`.blueprint-${ref}`).forEach(el => el.classList.add('active'));
            document.querySelectorAll(`.hud-card[data-node="${ref}"]`).forEach(el => el.classList.add('active'));
        });
        
        node.addEventListener('mouseleave', () => {
            node.classList.remove('active');
            document.querySelectorAll(`.blueprint-${ref}`).forEach(el => el.classList.remove('active'));
            document.querySelectorAll(`.hud-card[data-node="${ref}"]`).forEach(el => el.classList.remove('active'));
        });
    });

    // -------------------------------------------------------------------------
    // CANVAS SCRUB ENGINE
    // -------------------------------------------------------------------------
    function initCanvasScrub() {
        const canvas    = document.getElementById('canvas-main');
        if (!canvas) return;
        const ctx       = canvas.getContext('2d');
        const container = document.getElementById('global-canvas-container');

        // Animation state — floating-point for smooth lerp
        const anim = { current: 0, target: 0 };

        // Mouse interaction state for active parallax in Hero
        let mouseX = 0;
        let mouseY = 0;
        let targetMouseX = 0;
        let targetMouseY = 0;

        window.addEventListener('mousemove', (e) => {
            // Normalize mouse coords: -0.5 is left/top, 0.5 is right/bottom
            targetMouseX = (e.clientX / window.innerWidth) - 0.5;
            targetMouseY = (e.clientY / window.innerHeight) - 0.5;
        });

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        function resizeCanvas() {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
            renderFrame();
        }

        // Cover-fit draw
        function drawCover(img) {
            const cw = canvas.width,  ch = canvas.height;
            const iw = img.naturalWidth  || img.width  || 1920;
            const ih = img.naturalHeight || img.height || 1080;
            if (iw === 0 || ih === 0) return;

            const r  = Math.max(cw / iw, ch / ih);
            const nw = iw * r, nh = ih * r;

            ctx.clearRect(0, 0, cw, ch);
            ctx.drawImage(img, (cw - nw) / 2, (ch - nh) / 2, nw, nh);
        }

        function getImage(virtualIndex) {
            const i = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(virtualIndex)));
            // Reverse index lookup to play scroll cinematic backwards
            return images[(TOTAL_FRAMES - 1) - i] || null;
        }

        function renderFrame() {
            const img = getImage(anim.current);
            if (img) drawCover(img);
        }

        // Idle parallax sway & Mouse interaction
        let idleT = 0;
        function updateLoop() {
            idleT += 0.008;

            // Smoothly lerp mouse coordinates
            mouseX += (targetMouseX - mouseX) * 0.08;
            mouseY += (targetMouseY - mouseY) * 0.08;

            // Fade out mouse parallax as we scroll down past the hero height
            const scrollY = window.scrollY;
            const heroHeight = window.innerHeight || 800;
            const factor = Math.max(0, 1 - (scrollY / heroHeight));

            const maxTx = 30; // max translation in pixels
            const maxTy = 20;
            const tx = (-mouseX * maxTx * factor) + Math.sin(idleT) * 4;
            const ty = (-mouseY * maxTy * factor) + Math.cos(idleT * 0.75) * 3;

            canvas.style.transform = `scale(1.06) translate(${tx}px, ${ty}px)`;

            const diff = anim.target - anim.current;
            if (Math.abs(diff) > 0.08) {
                anim.current += diff * 0.12; // faster lerp = more responsive feel
                renderFrame();
            }
            requestAnimationFrame(updateLoop);
        }
        requestAnimationFrame(updateLoop);

        // -----------------------------------------------------------------------
        // GSAP / LENIS / ScrollTrigger
        // -----------------------------------------------------------------------
        if (typeof Lenis === 'undefined' ||
            typeof gsap === 'undefined' ||
            typeof ScrollTrigger === 'undefined') {
            console.warn('CDN libs not loaded — running static mode.');
            return;
        }

        try {
            const lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: 'vertical',
                gestureOrientation: 'vertical',
                smoothWheel: true,
                wheelMultiplier: 1,
                touchMultiplier: 2,
                infinite: false,
            });

            lenis.stop();
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => lenis.raf(time * 1000));
            gsap.ticker.lagSmoothing(0);
            gsap.registerPlugin(ScrollTrigger);

            // Initial hidden states
            gsap.set([
                '#chapter-explode [data-gsap-fade]',
                '#chapter-reassembly [data-gsap-fade]',
                '#chapter-macro [data-gsap-fade]',
            ], { opacity: 0, y: 30 });
            gsap.set('#chapter-manifesto .manifesto-line', { opacity: 0, y: 30 });
            gsap.set('.main-header',                        { opacity: 0, y: -50 });
            gsap.set('#chapter-orbit [data-gsap-fade]',     { opacity: 0, y: 35 });
            gsap.set('#chapter-orbit .scroll-cue',          { opacity: 0 });

            // Cinematic entrance
            const entrance = gsap.timeline({ delay: 0.4 });
            entrance
                .to('.main-header', { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' })
                .to('#chapter-orbit [data-gsap-fade]', {
                    opacity: 1, y: 0, duration: 1.0, stagger: 0.15, ease: 'power3.out',
                }, '+=0')
                .to('#chapter-orbit .scroll-cue', {
                    opacity: 1, duration: 0.8, ease: 'power2.out',
                }, '-=0.5')
                .to('#global-canvas-container', {
                    opacity: 1, duration: 0.6, ease: 'power2.inOut',
                    onComplete: () => {
                        lenis.start();
                        initScrollAnimations();
                    },
                }, '+=0.2');

            // ----------------------------------------------------------------
            // SCROLL ANIMATIONS
            // 5 sections × 60 virtual frames each
            //   Section 1 (orbit):      frames   0 →  59
            //   Section 2 (manifesto):  frames  60 → 119
            //   Section 3 (explode):    frames 120 → 179
            //   Section 4 (reassembly): frames 180 → 239
            //   Section 5 (macro):      frames 240 → 299
            // ----------------------------------------------------------------
            function initScrollAnimations() {

                // ============================================================
                // PER-SECTION: PIN + TEXT ANIMATIONS
                // All pins created FIRST so spacers exist before the master
                // frame controller calculates #section-specs position.
                // ============================================================

                // 1. HERO ORBIT — pin only
                ScrollTrigger.create({
                    trigger: '#chapter-orbit',
                    start: 'top top',
                    end: 'bottom top',
                    pin: true,
                    pinSpacing: true,
                });

                // Hero text fades out as you start scrolling
                gsap.to(['#chapter-orbit [data-gsap-fade]', '#chapter-orbit .scroll-cue'], {
                    opacity: 0,
                    y: (index, target) => target.classList.contains('scroll-cue') ? 30 : -50,
                    scrollTrigger: {
                        trigger: '#chapter-orbit',
                        start: 'top top',
                        end: 'bottom 80%',
                        scrub: true,
                    },
                });

                // 2. MANIFESTO — pin + line reveals
                const manifestoTL = gsap.timeline({
                    scrollTrigger: {
                        trigger: '#chapter-manifesto',
                        start: 'top top',
                        end: 'bottom top',
                        scrub: true,
                        pin: true,
                        pinSpacing: true,
                    },
                });
                manifestoTL
                    .to('#chapter-manifesto .manifesto-line:nth-child(1)', { opacity: 1, y: 0, duration: 1.5 }, 0.5)
                    .to('#chapter-manifesto .manifesto-line:nth-child(2)', { opacity: 1, y: 0, duration: 1.5 }, 1.5)
                    .to('#chapter-manifesto .manifesto-line:nth-child(3)', { opacity: 1, y: 0, duration: 1.5 }, 2.5)
                    .to('#chapter-manifesto .manifesto-line',              { opacity: 0, y: -30, duration: 1.5 }, 4.5);

                // 3. EXPLODE — pin + callouts
                const explodeTL = gsap.timeline({
                    scrollTrigger: {
                        trigger: '#chapter-explode',
                        start: 'top top',
                        end: '+=180%',
                        scrub: true,
                        pin: true,
                        pinSpacing: true,
                        onUpdate: (self) => {
                            const p  = self.progress;
                            const c1 = document.getElementById('callout-1');
                            const c2 = document.getElementById('callout-2');
                            const c3 = document.getElementById('callout-3');
                            const c4 = document.getElementById('callout-4');
                            if (c1) c1.classList.toggle('active', p > 0.15 && p < 0.85);
                            if (c2) c2.classList.toggle('active', p > 0.30 && p < 0.85);
                            if (c3) c3.classList.toggle('active', p > 0.45 && p < 0.85);
                            if (c4) c4.classList.toggle('active', p > 0.60 && p < 0.85);
                        },
                    },
                });
                explodeTL
                    .to('#chapter-explode [data-gsap-fade]', { opacity: 1, y: 0, duration: 1.5 }, 0.2)
                    .to('#chapter-explode [data-gsap-fade]', { opacity: 0, y: -30, duration: 1.5 }, 4.5);

                // 4. REASSEMBLY — pin + text
                const reassemblyTL = gsap.timeline({
                    scrollTrigger: {
                        trigger: '#chapter-reassembly',
                        start: 'top top',
                        end: 'bottom top',
                        scrub: true,
                        pin: true,
                        pinSpacing: true,
                    },
                });
                reassemblyTL
                    .to('#chapter-reassembly [data-gsap-fade]', { opacity: 1, y: 0, duration: 1.5 }, 0.2)
                    .to('#chapter-reassembly [data-gsap-fade]', { opacity: 0, y: -30, duration: 1.5 }, 4.5);

                // 5. MACRO DETAILS — pin + text
                const macroTL = gsap.timeline({
                    scrollTrigger: {
                        trigger: '#chapter-macro',
                        start: 'top top',
                        end: '+=180%',
                        scrub: true,
                        pin: true,
                        pinSpacing: true,
                    },
                });
                macroTL
                    .to('#chapter-macro [data-gsap-fade]', { opacity: 1, y: 0, duration: 1.5 }, 0.2)
                    .to('#chapter-macro [data-gsap-fade]', { opacity: 0, y: -30, duration: 1.5 }, 4.5);

                // Canvas fade out as specs section enters
                gsap.to('#global-canvas-container', {
                    opacity: 0,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: '#section-specs',
                        start: 'top bottom',
                        end: 'top 50%',
                        scrub: true,
                    },
                });

                // ============================================================
                // MASTER FRAME CONTROLLER — created LAST so all pinSpacing
                // spacers are already in the DOM. Force a refresh first so
                // GSAP recalculates #section-specs at its true position.
                // ============================================================
                ScrollTrigger.refresh();
                ScrollTrigger.create({
                    trigger: 'body',
                    start: 'top top',
                    endTrigger: '#section-specs',
                    end: 'top top',
                    scrub: true,
                    onUpdate: (self) => {
                        anim.target = self.progress * (TOTAL_FRAMES - 1);
                    },
                });

                // Header auto-hide on scroll down, show on scroll up (stays visible in Hero section)
                ScrollTrigger.create({
                    trigger: 'body',
                    start: 'top top',
                    end: 'bottom bottom',
                    onUpdate: (self) => {
                        const scrollY = window.scrollY;
                        const heroHeight = window.innerHeight;
                        if (self.direction === 1 && scrollY > heroHeight) {
                            // Scrolling down past Hero -> hide header
                            gsap.to('.main-header', { yPercent: -120, duration: 0.3, ease: 'power2.out' });
                        } else if (self.direction === -1 || scrollY <= heroHeight) {
                            // Scrolling up OR inside the Hero section -> show header
                            gsap.to('.main-header', { yPercent: 0, duration: 0.3, ease: 'power2.out' });
                        }
                    }
                });
            }

        } catch (err) {
            console.error('Failed to initialize scroll timelines:', err);
        }
    }
}

// Robust execution wrapper
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initApp();
} else {
    document.addEventListener('DOMContentLoaded', initApp);
}
