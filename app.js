// app.js — Frame scrub using vid-frames-webp (WebP, ~70 MB vs 3.5 GB PNG)

function initApp() {
    // -------------------------------------------------------------------------
    // CONFIG
    // -------------------------------------------------------------------------
    const TOTAL_FRAMES = 747;
    const FRAME_PREFIX = 'images/vid-frames-webp/frame_';

    // Virtual frame index runs 0 → TOTAL_FRAMES-1 across all 5 pinned sections.
    // Each section owns 149.4 virtual frames.
    const FRAMES_PER_SECTION = TOTAL_FRAMES / 5; // 149.4

    const images = new Array(TOTAL_FRAMES); // indexed 0..299
    let loadedCount = 0;
    let isUnlocked = false;
    let triggerRedraw = null;
    let lenisInstance = null;

    // Force scroll-to-top on reload
    if (history.scrollRestoration) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    window.addEventListener('load', () => {
        window.scrollTo(0, 0);
        if (lenisInstance) lenisInstance.scrollTo(0, { immediate: true });
    });

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
    // -------------------------------------------------------------------------
    // PAGE UNLOCK
    // -------------------------------------------------------------------------
    function unlockPage() {
        if (isUnlocked) return;
        isUnlocked = true;

        if (loaderBar)     loaderBar.style.width     = '100%';
        if (loaderPercent) loaderPercent.textContent = '100%';

        // Ensure browser resets scroll position before fading out preloader
        window.scrollTo(0, 0);

        setTimeout(() => {
            if (preloader) preloader.classList.add('fade-out');
            try {
                initCanvasScrub();
            } catch (e) {
                console.error('Failed to initialize scroll cinematic:', e);
            }
        }, 200);
    }

    function onFrameLoaded() {
        if (isUnlocked) return;
        loadedCount++;
        const pct = Math.min(99, Math.round((loadedCount / expectedLoads) * 100));
        if (loaderBar)     loaderBar.style.width     = pct + '%';
        if (loaderPercent) loaderPercent.textContent = pct + '%';
        if (loadedCount >= expectedLoads) unlockPage();
    }

    // Safety timeout — force unlock after 3 s even if some frames fail
    setTimeout(() => { if (!isUnlocked) unlockPage(); }, 3000);

    // Determine frame loading step based on mobile/performance configuration.
    // On mobile/tablets, we skip frames (step = 3) to prevent browser out-of-memory crash.
    // On desktop, we load all frames (step = 1) for 60fps cinematic fluidity.
    const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad|Macintosh/i.test(navigator.userAgent) && ('ontouchstart' in window);
    const LOAD_STEP = isMobile ? 3 : 1;

    // Build loading queue
    const framesToLoad = [];
    framesToLoad.push(TOTAL_FRAMES - 1); // Always load the priority first-visible frame
    for (let i = 0; i < TOTAL_FRAMES - 1; i++) {
        if (i % LOAD_STEP === 0) {
            framesToLoad.push(i);
        }
    }
    const expectedLoads = framesToLoad.length;

    // -------------------------------------------------------------------------
    // PRELOAD ALL FRAMES
    // -------------------------------------------------------------------------
    function loadFrame(i) {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
            if (typeof img.decode === 'function') {
                img.decode()
                    .then(() => { images[i] = img; onFrameLoaded(i); })
                    .catch(() => { images[i] = img; onFrameLoaded(i); });
            } else {
                images[i] = img;
                onFrameLoaded(i);
            }
        };
        img.onerror = () => { onFrameLoaded(i); };
        img.src = FRAME_PREFIX + pad4(i + 1) + '.webp';
    }

    function onFrameLoaded(i) {
        // If priority frame (the first-visible frame) arrives after unlock, re-render
        if (isUnlocked && i === TOTAL_FRAMES - 1) {
            const canvas = document.getElementById('canvas-main');
            if (canvas) canvas.dispatchEvent(new CustomEvent('priorityFrameReady'));
            return;
        }
        if (isUnlocked) return;
        loadedCount++;
        const pct = Math.min(99, Math.round((loadedCount / expectedLoads) * 100));
        if (loaderBar)     loaderBar.style.width     = pct + '%';
        if (loaderPercent) loaderPercent.textContent = pct + '%';
        if (loadedCount >= expectedLoads) unlockPage();
    }

    // Trigger loads
    framesToLoad.forEach(i => {
        loadFrame(i);
    });

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

            // Update active receipt image
            const receiptImgs = document.querySelectorAll('.receipt-img');
            receiptImgs.forEach(img => img.classList.remove('active'));
            const activeImg = document.querySelector(`.receipt-img[data-option="${val}"]`);
            if (activeImg) activeImg.classList.add('active');

            // Update active mobile preview image
            const mobilePreviewImgs = document.querySelectorAll('.mobile-preview-img');
            mobilePreviewImgs.forEach(img => img.classList.remove('active'));
            const activeMobileImg = document.querySelector(`.mobile-preview-img[data-option="${val}"]`);
            if (activeMobileImg) activeMobileImg.classList.add('active');
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
            const kgVal = (val * 0.45359237).toFixed(1);
            if (tensionNum) tensionNum.textContent = val;
            const tensionNumKg = document.getElementById('tension-num-kg');
            if (tensionNumKg) tensionNumKg.textContent = kgVal;
            if (receiptTension) receiptTension.textContent = val;
            const receiptTensionKg = document.getElementById('receipt-tension-kg');
            if (receiptTensionKg) receiptTensionKg.textContent = kgVal;
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
                    `Demo request recorded. This is a concept website; no real orders are processed.`;
                
                // Show the demo popup modal
                const demoPopup = document.getElementById('demo-popup-modal');
                if (demoPopup) {
                    demoPopup.classList.add('active');
                    if (lenisInstance) lenisInstance.stop();
                }
                
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

                // Reset active receipt image to set
                const receiptImgs = document.querySelectorAll('.receipt-img');
                receiptImgs.forEach(img => img.classList.remove('active'));
                const defaultImg = document.querySelector('.receipt-img[data-option="set"]');
                if (defaultImg) defaultImg.classList.add('active');

                // Reset active mobile preview image to set
                const mobilePreviewImgs = document.querySelectorAll('.mobile-preview-img');
                mobilePreviewImgs.forEach(img => img.classList.remove('active'));
                const defaultMobileImg = document.querySelector('.mobile-preview-img[data-option="set"]');
                if (defaultMobileImg) defaultMobileImg.classList.add('active');
                
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
                    const tensionNumKg = document.getElementById('tension-num-kg');
                    if (tensionNumKg) tensionNumKg.textContent = '24.9';
                    if (receiptTension) receiptTension.textContent = '55';
                    const receiptTensionKg = document.getElementById('receipt-tension-kg');
                    if (receiptTensionKg) receiptTensionKg.textContent = '24.9';
                    if (tensionDesc) tensionDesc.textContent = 'Optimal Control & Power Balance';
                }
                
                // Regenerate serial number
                generateSerial();
            }, 1500);
        });
    }

    // -------------------------------------------------------------------------
    // TELEMETRY RECEIPT IMAGE ZOOM / FOCUS LOGIC
    // -------------------------------------------------------------------------
    const receiptImageContainer = document.querySelector('.receipt-image-container');
    const mobileImagePreview = document.querySelector('.mobile-image-preview');
    
    // PC Hover Backdrop
    const focusBackdrop = document.querySelector('.image-focus-backdrop');
    const backdropClose = document.querySelector('.backdrop-close-btn');

    // Dedicated root level zoom modal elements
    const zoomModal = document.getElementById('zoom-modal');
    const zoomModalImg = document.getElementById('zoom-modal-img');
    const zoomModalViewportClose = document.querySelector('.zoom-modal-viewport-close');
    const zoomModalClose = document.querySelector('.zoom-modal-close');

    function isMobileOrTouch() {
        return window.innerWidth <= 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Helper to open the dedicated root-level zoom modal
    function openZoomModal(containerEl) {
        if (!zoomModal || !zoomModalImg) return;
        const activeImg = containerEl.querySelector('img.active') || containerEl.querySelector('img');
        if (activeImg) {
            zoomModalImg.src = activeImg.getAttribute('src');
            zoomModal.classList.add('active');
            document.body.classList.add('zoom-active'); // Locks page scroll or flags state
            if (lenisInstance) lenisInstance.stop();
        }
    }

    function closeZoomModal(e) {
        if (e) e.stopPropagation();
        if (zoomModal) {
            zoomModal.classList.remove('active');
            document.body.classList.remove('zoom-active');
        }
        if (lenisInstance) lenisInstance.start();
    }

    if (receiptImageContainer) {
        // PC Hover behavior (unrelated to root level modal click zoom)
        receiptImageContainer.addEventListener('mouseenter', () => {
            if (!isMobileOrTouch()) {
                document.body.classList.add('image-focused');
            }
        });

        receiptImageContainer.addEventListener('mouseleave', () => {
            if (!isMobileOrTouch()) {
                document.body.classList.remove('image-focused');
            }
        });

        // Click to zoom triggers modal on PC and Mobile
        receiptImageContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            openZoomModal(receiptImageContainer);
        });
    }

    if (mobileImagePreview) {
        // Click to zoom triggers modal on PC and Mobile
        mobileImagePreview.addEventListener('click', (e) => {
            e.stopPropagation();
            openZoomModal(mobileImagePreview);
        });
    }

    // Bind modal close triggers
    if (zoomModal) {
        zoomModal.addEventListener('click', closeZoomModal);
    }
    if (zoomModalViewportClose) {
        zoomModalViewportClose.addEventListener('click', closeZoomModal);
    }
    if (zoomModalClose) {
        zoomModalClose.addEventListener('click', closeZoomModal);
    }

    // Bind PC Hover backdrop close
    if (focusBackdrop) {
        focusBackdrop.addEventListener('click', () => {
            document.body.classList.remove('image-focused');
        });
    }
    if (backdropClose) {
        backdropClose.addEventListener('click', () => {
            document.body.classList.remove('image-focused');
        });
    }

    // -------------------------------------------------------------------------
    // INTERACTIVE SPECS HUD
    // -------------------------------------------------------------------------
    const hudCards = document.querySelectorAll('.hud-card');
    const hudNodes = document.querySelectorAll('.hud-node');
    
    let activePart = null;

    function activatePart(part) {
        if (activePart === part) return;
        deactivateAllParts();
        activePart = part;
        document.querySelectorAll(`.blueprint-${part}`).forEach(el => el.classList.add('active'));
        const node = document.getElementById(`node-${part}`);
        if (node) node.classList.add('active');
        document.querySelectorAll(`.hud-card[data-node="${part}"]`).forEach(el => el.classList.add('active'));
    }

    function deactivateAllParts() {
        activePart = null;
        document.querySelectorAll('.blueprint-line').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.hud-node').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.hud-card').forEach(el => el.classList.remove('active'));
    }

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (!isTouchDevice) {
        // Desktop Hover triggers
        hudCards.forEach(card => {
            const part = card.getAttribute('data-node');
            card.addEventListener('mouseenter', () => activatePart(part));
            card.addEventListener('mouseleave', deactivateAllParts);
        });

        hudNodes.forEach(node => {
            const ref = node.getAttribute('data-ref');
            node.addEventListener('mouseenter', () => activatePart(ref));
            node.addEventListener('mouseleave', deactivateAllParts);
        });
    } else {
        // Mobile Tap-to-toggle triggers
        hudCards.forEach(card => {
            const part = card.getAttribute('data-node');
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                if (activePart === part) {
                    deactivateAllParts();
                } else {
                    activatePart(part);
                }
            });
        });

        hudNodes.forEach(node => {
            const ref = node.getAttribute('data-ref');
            node.addEventListener('click', (e) => {
                e.stopPropagation();
                if (activePart === ref) {
                    deactivateAllParts();
                } else {
                    activatePart(ref);
                }
            });
        });

        // Tap outside anywhere to close HUD overlays
        document.addEventListener('click', () => {
            deactivateAllParts();
        });
    }

    // -------------------------------------------------------------------------
    // DEMO POPUP MODAL & SMOOTH SCROLL ROUTERS
    // -------------------------------------------------------------------------
    const demoPopup = document.getElementById('demo-popup-modal');
    const demoPopupClose = document.getElementById('demo-popup-close-btn');
    if (demoPopup && demoPopupClose) {
        demoPopupClose.addEventListener('click', () => {
            demoPopup.classList.remove('active');
            if (lenisInstance) lenisInstance.start();
        });
        demoPopup.addEventListener('click', (e) => {
            if (e.target === demoPopup) {
                demoPopup.classList.remove('active');
                if (lenisInstance) lenisInstance.start();
            }
        });
    }

    // Bind nav links for smooth scroll via Lenis
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    if (lenisInstance) {
                        lenisInstance.scrollTo(target);
                    } else {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }
        });
    });

    // -------------------------------------------------------------------------
    // LEGAL & PROTOCOL COMPLIANCE MODAL
    // -------------------------------------------------------------------------
    const legalModal = document.getElementById('legal-modal');
    const legalLinks = document.querySelectorAll('.legal-link');
    const legalTabBtns = document.querySelectorAll('.legal-tab-btn');
    const legalBodies = document.querySelectorAll('.legal-body');
    const legalClose = document.getElementById('legal-modal-close-btn');
    const legalViewportClose = document.querySelector('.legal-modal-viewport-close');

    function openLegalTab(tabName) {
        legalTabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-target') === tabName);
        });
        legalBodies.forEach(body => {
            body.classList.toggle('active', body.getAttribute('id') === `legal-${tabName}`);
        });
    }

    legalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = link.getAttribute('data-tab');
            openLegalTab(tab);
            if (legalModal) {
                legalModal.classList.add('active');
                if (lenisInstance) lenisInstance.stop();
            }
        });
    });

    legalTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            openLegalTab(target);
        });
    });

    function closeLegalModal(e) {
        if (e) e.stopPropagation();
        if (legalModal) legalModal.classList.remove('active');
        if (lenisInstance) lenisInstance.start();
    }

    if (legalModal) legalModal.addEventListener('click', closeLegalModal);
    if (legalClose) legalClose.addEventListener('click', closeLegalModal);
    if (legalViewportClose) legalViewportClose.addEventListener('click', closeLegalModal);
    
    const legalContent = document.querySelector('.legal-modal-content');
    if (legalContent) {
        legalContent.addEventListener('click', (e) => e.stopPropagation());
    }

    // -------------------------------------------------------------------------
    // CANVAS SCRUB ENGINE
    // -------------------------------------------------------------------------
    function initCanvasScrub() {
        const canvas    = document.getElementById('canvas-main');
        if (!canvas) return;
        const ctx       = canvas.getContext('2d', { alpha: false });
        const container = document.getElementById('global-canvas-container');

        const anim = { current: 0, target: 0, lastDrawn: -1 };

        let mouseX = 0, mouseY = 0;
        let targetMouseX = 0, targetMouseY = 0;
        let lastTx = null, lastTy = null;
        let idleT = 0;

        window.addEventListener('mousemove', (e) => {
            targetMouseX = (e.clientX / window.innerWidth)  - 0.5;
            targetMouseY = (e.clientY / window.innerHeight) - 0.5;
        }, { passive: true });

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas, { passive: true });

        function resizeCanvas() {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
            anim.lastDrawn = -1;
            renderFrame();
        }

        function drawCover(img) {
            const cw = canvas.width,  ch = canvas.height;
            const iw = img.naturalWidth  || img.width  || 1920;
            const ih = img.naturalHeight || img.height || 1080;
            if (iw === 0 || ih === 0) return;
            const r  = Math.max(cw / iw, ch / ih);
            const nw = iw * r, nh = ih * r;
            ctx.drawImage(img, (cw - nw) / 2, (ch - nh) / 2, nw, nh);
        }

        function getImage(virtualIndex) {
            const i = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(virtualIndex)));
            const actualIndex = (TOTAL_FRAMES - 1) - i;
            
            // Fast path: target image is loaded
            if (images[actualIndex]) return images[actualIndex];
            
            // Fallback path: search outward for the nearest loaded frame
            let offset = 1;
            while (offset < TOTAL_FRAMES) {
                const prev = actualIndex - offset;
                const next = actualIndex + offset;
                if (prev >= 0 && images[prev]) return images[prev];
                if (next < TOTAL_FRAMES && images[next]) return images[next];
                offset++;
            }
            return null;
        }

        function renderFrame() {
            const idx = Math.round(anim.current);
            if (idx === anim.lastDrawn) return;
            const img = getImage(anim.current);
            if (!img) return;
            anim.lastDrawn = idx;
            drawCover(img);
        }

        // Listen for the priority frame arriving after unlock
        canvas.addEventListener('priorityFrameReady', () => {
            anim.lastDrawn = -1; // force redraw
            renderFrame();
        });

        // Show canvas immediately and draw whatever is available
        if (container) container.style.opacity = '1';
        renderFrame();

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

            lenisInstance = lenis;
            lenis.scrollTo(0, { immediate: true });
            lenis.on('scroll', ScrollTrigger.update);
            gsap.registerPlugin(ScrollTrigger);

            // Single unified RAF loop
            function unifiedRAF(time) {
                lenis.raf(time);

                // Frame lerp
                const diff = anim.target - anim.current;
                if (Math.abs(diff) > 0.08) {
                    anim.current += diff * 0.12;
                    renderFrame();
                }

                // Mouse parallax — only active in hero section
                const scrollY = window.scrollY;
                const heroHeight = window.innerHeight || 800;
                const factor = Math.max(0, 1 - (scrollY / heroHeight));

                if (factor > 0) {
                    mouseX += (targetMouseX - mouseX) * 0.08;
                    mouseY += (targetMouseY - mouseY) * 0.08;

                    const tx = (-mouseX * 30 * factor);
                    const ty = (-mouseY * 20 * factor);

                    if (lastTx === null || Math.abs(tx - lastTx) > 0.15 || Math.abs(ty - lastTy) > 0.15) {
                        canvas.style.transform = `scale(1.06) translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`;
                        lastTx = tx; lastTy = ty;
                    }
                } else if (lastTx !== null) {
                    // Reset transform when outside hero so it doesn't linger
                    canvas.style.transform = 'scale(1.06)';
                    lastTx = null; lastTy = null;
                }

                requestAnimationFrame(unifiedRAF);
            }
            requestAnimationFrame(unifiedRAF);

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

            // Cinematic entrance (canvas no longer needs to be faded in — it's already visible)
            const entrance = gsap.timeline({ delay: 0.2 });
            entrance
                .to('.main-header', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
                .to('#chapter-orbit [data-gsap-fade]', {
                    opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out',
                }, '+=0')
                .to('#chapter-orbit .scroll-cue', {
                    opacity: 1, duration: 0.4, ease: 'power2.out',
                }, '-=0.3');

            // Initialize scroll animations immediately so scrolling works from the start
            initScrollAnimations();

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

                // Hero text fades out as you scroll down, and snaps back if you scroll to top
                gsap.to(['#chapter-orbit [data-gsap-fade]', '#chapter-orbit .scroll-cue'], {
                    opacity: 0,
                    y: (index, target) => target.classList.contains('scroll-cue') ? 30 : -50,
                    scrollTrigger: {
                        trigger: '#chapter-orbit',
                        start: 'top top',
                        end: 'bottom 80%',
                        scrub: true,
                        onLeaveBack: () => {
                            // Restore hero text when scrolled fully back to top
                            gsap.to(['#chapter-orbit [data-gsap-fade]', '#chapter-orbit .scroll-cue'], {
                                opacity: 1, y: 0, duration: 0.4, ease: 'power2.out'
                            });
                        },
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

                // Header auto-hide on scroll down, show on scroll up (stays visible in Hero section and from specs section downwards)
                ScrollTrigger.create({
                    trigger: 'body',
                    start: 'top top',
                    end: 'bottom bottom',
                    onUpdate: (self) => {
                        const scrollY = window.scrollY;
                        const heroHeight = window.innerHeight;
                        const specsEl = document.getElementById('section-specs');
                        
                        // Calculate specs top dynamically (considering pins)
                        let specsTop = specsEl ? specsEl.getBoundingClientRect().top + scrollY : 99999;
                        
                        if (scrollY <= heroHeight) {
                            // In Hero (Section 1) -> always show header
                            gsap.to('.main-header', { yPercent: 0, duration: 0.3, ease: 'power2.out' });
                        } else if (scrollY >= (specsTop - 50)) {
                            // In Section 6 and downwards -> always show header
                            gsap.to('.main-header', { yPercent: 0, duration: 0.3, ease: 'power2.out' });
                        } else {
                            // In Section 2, 3, 4, 5 -> hide on scroll down, show on scroll up
                            if (self.direction === 1) {
                                gsap.to('.main-header', { yPercent: -120, duration: 0.3, ease: 'power2.out' });
                            } else if (self.direction === -1) {
                                gsap.to('.main-header', { yPercent: 0, duration: 0.3, ease: 'power2.out' });
                            }
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
