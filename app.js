

(function () {
    'use strict';

    // ─── Globals ───────────────────────────────────────────
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    let scrollProgress = 0;
    let flowerCount = 0;

    // ─── Loader ────────────────────────────────────────────
    function hideLoader() {
        const loader = document.getElementById('loader');
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 2200);
    }

    // ─── Music Controller ──────────────────────────────────
    function initMusic() {
        const btn = document.getElementById('music-toggle');
        const audio = document.getElementById('bg-music');
        const iconOff = document.getElementById('music-icon-off');
        const iconOn = document.getElementById('music-icon-on');
        let isPlaying = false;

        // Start from second 45
        audio.currentTime = 45;

        btn.addEventListener('click', () => {
            if (isPlaying) {
                audio.pause();
                btn.classList.remove('playing');
                iconOff.style.display = '';
                iconOn.style.display = 'none';
            } else {
                if (audio.currentTime < 45) audio.currentTime = 45;
                audio.play().catch(() => {});
                btn.classList.add('playing');
                iconOff.style.display = 'none';
                iconOn.style.display = '';
            }
            isPlaying = !isPlaying;
        });

        // Auto-play attempt on first interaction
        const autoPlay = () => {
            if (!isPlaying) {
                audio.currentTime = 45;
                audio.play().then(() => {
                    isPlaying = true;
                    btn.classList.add('playing');
                    iconOff.style.display = 'none';
                    iconOn.style.display = '';
                }).catch(() => {});
            }
            document.removeEventListener('click', autoPlay);
            document.removeEventListener('touchstart', autoPlay);
        };
        document.addEventListener('click', autoPlay, { once: true });
        document.addEventListener('touchstart', autoPlay, { once: true });
    }

    // ─── Three.js 3D Scene ─────────────────────────────────
    function initThreeJS() {
        const canvas = document.getElementById('three-canvas');
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 30;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xFFF9C4, 0.4);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0xFFEB3B, 1.5, 100);
        pointLight1.position.set(10, 15, 20);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xFFB300, 1, 80);
        pointLight2.position.set(-10, -10, 15);
        scene.add(pointLight2);

        // ─── Create 3D Flowers ─────────────────────────────
        const flowers = [];
        const flowerGroup = new THREE.Group();
        scene.add(flowerGroup);

        function createFlowerMesh(x, y, z, scale) {
            const flower = new THREE.Group();

            // Center (dark brown/orange)
            const centerGeo = new THREE.SphereGeometry(0.5, 16, 16);
            const centerMat = new THREE.MeshPhongMaterial({
                color: 0x8B4513,
                emissive: 0x4A2800,
                emissiveIntensity: 0.3,
                shininess: 60,
            });
            const center = new THREE.Mesh(centerGeo, centerMat);
            flower.add(center);

            // Petals
            const petalCount = 12;
            const petalGeo = new THREE.SphereGeometry(1, 8, 8);
            petalGeo.scale(1, 0.3, 0.5);

            for (let i = 0; i < petalCount; i++) {
                const angle = (i / petalCount) * Math.PI * 2;
                const hue = 0.12 + Math.random() * 0.05; // yellow range
                const saturation = 0.8 + Math.random() * 0.2;
                const lightness = 0.5 + Math.random() * 0.15;

                const petalMat = new THREE.MeshPhongMaterial({
                    color: new THREE.Color().setHSL(hue, saturation, lightness),
                    emissive: new THREE.Color().setHSL(hue, 0.6, 0.2),
                    emissiveIntensity: 0.2,
                    shininess: 40,
                    transparent: true,
                    opacity: 0.92,
                    side: THREE.DoubleSide,
                });

                const petal = new THREE.Mesh(petalGeo, petalMat);
                petal.position.x = Math.cos(angle) * 1.1;
                petal.position.z = Math.sin(angle) * 1.1;
                petal.rotation.y = -angle;
                petal.rotation.z = 0.3;
                flower.add(petal);
            }

            // Stem
            const stemGeo = new THREE.CylinderGeometry(0.08, 0.1, 4, 8);
            const stemMat = new THREE.MeshPhongMaterial({
                color: 0x2E7D32,
                emissive: 0x1B5E20,
                emissiveIntensity: 0.1,
            });
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = -2.5;
            flower.add(stem);

            // Leaf
            const leafGeo = new THREE.SphereGeometry(0.6, 8, 8);
            leafGeo.scale(1.5, 0.2, 0.8);
            const leafMat = new THREE.MeshPhongMaterial({
                color: 0x388E3C,
                emissive: 0x1B5E20,
                emissiveIntensity: 0.15,
                side: THREE.DoubleSide,
            });
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.position.set(0.5, -1.8, 0.2);
            leaf.rotation.z = -0.5;
            flower.add(leaf);

            flower.position.set(x, y, z);
            flower.scale.setScalar(scale);

            flower.userData = {
                baseX: x,
                baseY: y,
                baseZ: z,
                phase: Math.random() * Math.PI * 2,
                speed: 0.3 + Math.random() * 0.5,
                rotSpeed: 0.1 + Math.random() * 0.3,
                bobAmount: 0.5 + Math.random() * 1,
            };

            return flower;
        }

        // Create scattered flowers
        const flowerPositions = [
            { x: -12, y: 5, z: -8, s: 1.2 },
            { x: 14, y: -3, z: -12, s: 0.9 },
            { x: -8, y: -8, z: -6, s: 1.0 },
            { x: 10, y: 8, z: -15, s: 0.7 },
            { x: -15, y: 0, z: -10, s: 0.8 },
            { x: 6, y: 12, z: -20, s: 0.6 },
            { x: -5, y: -12, z: -14, s: 0.85 },
            { x: 16, y: 4, z: -18, s: 0.65 },
            { x: -18, y: 8, z: -16, s: 0.55 },
            { x: 0, y: -6, z: -5, s: 1.3 },
            { x: 20, y: -8, z: -22, s: 0.5 },
            { x: -10, y: 14, z: -20, s: 0.45 },
        ];

        flowerPositions.forEach(pos => {
            const f = createFlowerMesh(pos.x, pos.y, pos.z, pos.s);
            flowerGroup.add(f);
            flowers.push(f);
        });

        // ─── Particle System (3D sparkles) ─────────────────
        const particleCount = isMobile ? 150 : 350;
        const particlesGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const particlePhases = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
            sizes[i] = Math.random() * 3 + 1;
            particlePhases[i] = Math.random() * Math.PI * 2;
        }

        particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const particleMat = new THREE.PointsMaterial({
            color: 0xFFEB3B,
            size: 0.4,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
        });

        const particles = new THREE.Points(particlesGeo, particleMat);
        scene.add(particles);

        // ─── Orbiting Ring of Light ─────────────────────────
        const ringGeo = new THREE.TorusGeometry(15, 0.05, 8, 100);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xFFEB3B,
            transparent: true,
            opacity: 0.15,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI * 0.4;
        scene.add(ring);

        // ─── Animation Loop ────────────────────────────────
        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            // Smooth mouse tracking
            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;

            // Camera slight movement based on mouse
            camera.position.x = mouseX * 3;
            camera.position.y = mouseY * 2;
            camera.lookAt(0, 0, -10);

            // Animate flowers
            flowers.forEach(flower => {
                const d = flower.userData;
                flower.position.y = d.baseY + Math.sin(t * d.speed + d.phase) * d.bobAmount;
                flower.rotation.y = Math.sin(t * d.rotSpeed + d.phase) * 0.3;
                flower.rotation.z = Math.cos(t * d.rotSpeed * 0.7 + d.phase) * 0.1;
            });

            // Rotate flower group subtly based on scroll
            flowerGroup.rotation.y = scrollProgress * Math.PI * 0.5 + t * 0.05;
            flowerGroup.rotation.x = Math.sin(scrollProgress * Math.PI) * 0.2;

            // Animate particles
            const pPositions = particlesGeo.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                pPositions[i * 3 + 1] += Math.sin(t * 0.5 + particlePhases[i]) * 0.01;
                pPositions[i * 3] += Math.cos(t * 0.3 + particlePhases[i]) * 0.005;

                // Reset particles that drift too far
                if (pPositions[i * 3 + 1] > 30) pPositions[i * 3 + 1] = -30;
            }
            particlesGeo.attributes.position.needsUpdate = true;

            // Rotate ring
            ring.rotation.z = t * 0.1;

            // Pulse lights
            pointLight1.intensity = 1.5 + Math.sin(t * 0.8) * 0.5;
            pointLight2.intensity = 1 + Math.cos(t * 0.6) * 0.3;

            renderer.render(scene, camera);
        }

        animate();

        // Resize handler
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // ─── 2D Petal Particle System (Canvas Overlay) ─────────
    function initPetals() {
        const canvas = document.getElementById('petals-canvas');
        const ctx = canvas.getContext('2d');
        let width, height;

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        const petals = [];
        const maxPetals = isMobile ? 30 : 60;

        const petalColors = [
            'rgba(255, 235, 59, ',  // yellow
            'rgba(255, 193, 7, ',   // amber
            'rgba(255, 213, 79, ',  // gold
            'rgba(255, 241, 118, ', // light yellow
            'rgba(255, 167, 38, ',  // orange-ish
        ];

        class Petal {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = -20 - Math.random() * 100;
                this.size = 4 + Math.random() * 10;
                this.speedY = 0.5 + Math.random() * 1.5;
                this.speedX = (Math.random() - 0.5) * 1;
                this.rotation = Math.random() * Math.PI * 2;
                this.rotSpeed = (Math.random() - 0.5) * 0.05;
                this.opacity = 0.3 + Math.random() * 0.5;
                this.color = petalColors[Math.floor(Math.random() * petalColors.length)];
                this.wobblePhase = Math.random() * Math.PI * 2;
                this.wobbleSpeed = 0.02 + Math.random() * 0.03;
                this.wobbleAmount = 1 + Math.random() * 2;
            }

            update() {
                this.y += this.speedY;
                this.wobblePhase += this.wobbleSpeed;
                this.x += this.speedX + Math.sin(this.wobblePhase) * this.wobbleAmount;
                this.rotation += this.rotSpeed;

                // Wind effect from mouse
                this.x += mouseX * 0.5;
                this.y += mouseY * 0.2;

                if (this.y > height + 20 || this.x < -50 || this.x > width + 50) {
                    this.reset();
                }
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.globalAlpha = this.opacity;

                // Draw petal shape
                ctx.beginPath();
                ctx.fillStyle = this.color + this.opacity + ')';
                ctx.moveTo(0, -this.size);
                ctx.bezierCurveTo(
                    this.size * 0.8, -this.size * 0.5,
                    this.size * 0.8, this.size * 0.5,
                    0, this.size
                );
                ctx.bezierCurveTo(
                    -this.size * 0.8, this.size * 0.5,
                    -this.size * 0.8, -this.size * 0.5,
                    0, -this.size
                );
                ctx.fill();

                // Subtle glow
                ctx.shadowColor = 'rgba(255, 235, 59, 0.3)';
                ctx.shadowBlur = 8;
                ctx.fill();

                ctx.restore();
            }
        }

        // Initialize petals
        for (let i = 0; i < maxPetals; i++) {
            const p = new Petal();
            p.y = Math.random() * height; // spread initial placement
            petals.push(p);
        }

        function animatePetals() {
            requestAnimationFrame(animatePetals);
            ctx.clearRect(0, 0, width, height);

            petals.forEach(p => {
                p.update();
                p.draw();
            });
        }

        animatePetals();
    }

    // ─── Mouse / Touch Tracking ────────────────────────────
    function initMouseTracking() {
        document.addEventListener('mousemove', (e) => {
            targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            targetMouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
        });

        document.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            targetMouseX = (touch.clientX / window.innerWidth - 0.5) * 2;
            targetMouseY = -(touch.clientY / window.innerHeight - 0.5) * 2;
        }, { passive: true });
    }

    // ─── Scroll Tracking ───────────────────────────────────
    function initScrollTracking() {
        window.addEventListener('scroll', () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            scrollProgress = window.scrollY / maxScroll;
        }, { passive: true });
    }

    // ─── Interactive Flower Spawning (Garden Section) ──────
    function initGardenInteraction() {
        const garden = document.getElementById('garden');
        const counterEl = document.getElementById('flower-count');
        const flowerEmojis = ['🌻', '🌼', '💛', '✿', '❀', '🌸', '🌺'];
        let lastSpawnTime = 0;

        function spawnFlower(x, y) {
            const now = Date.now();
            if (now - lastSpawnTime < 100) return; // Throttle
            lastSpawnTime = now;

            const emoji = flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)];
            const el = document.createElement('div');
            el.className = 'spawned-flower';
            el.textContent = emoji;
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.style.fontSize = (1.5 + Math.random() * 2) + 'rem';
            document.body.appendChild(el);

            flowerCount++;
            counterEl.textContent = flowerCount;

            // Animate with GSAP
            if (window.gsap) {
                gsap.fromTo(el, {
                    scale: 0,
                    rotation: 0,
                    opacity: 0,
                }, {
                    scale: 1 + Math.random() * 0.5,
                    rotation: (Math.random() - 0.5) * 60,
                    opacity: 1,
                    duration: 0.4,
                    ease: 'back.out(1.7)',
                    onComplete: () => {
                        gsap.to(el, {
                            y: -120 - Math.random() * 100,
                            x: (Math.random() - 0.5) * 80,
                            rotation: (Math.random() - 0.5) * 120,
                            opacity: 0,
                            scale: 0.3,
                            duration: 1.5 + Math.random(),
                            ease: 'power2.out',
                            onComplete: () => el.remove(),
                        });
                    }
                });
            } else {
                setTimeout(() => el.remove(), 3000);
            }

            // Touch ripple
            createRipple(x, y);
        }

        function createRipple(x, y) {
            const ripple = document.createElement('div');
            ripple.className = 'touch-ripple';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            document.body.appendChild(ripple);
            setTimeout(() => ripple.remove(), 800);
        }

        // Mouse events
        garden.addEventListener('mousemove', (e) => {
            spawnFlower(e.clientX, e.clientY);
        });

        garden.addEventListener('click', (e) => {
            // Burst of flowers
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    spawnFlower(
                        e.clientX + (Math.random() - 0.5) * 80,
                        e.clientY + (Math.random() - 0.5) * 80
                    );
                }, i * 50);
            }
        });

        // Touch events
        garden.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            spawnFlower(touch.clientX, touch.clientY);
        }, { passive: true });

        garden.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    spawnFlower(
                        touch.clientX + (Math.random() - 0.5) * 80,
                        touch.clientY + (Math.random() - 0.5) * 80
                    );
                }, i * 50);
            }
        }, { passive: true });
    }

    // ─── GSAP ScrollTrigger Animations ─────────────────────
    function initScrollAnimations() {
        gsap.registerPlugin(ScrollTrigger);

        // Message card reveal
        gsap.from('.glass-card', {
            scrollTrigger: {
                trigger: '#message',
                start: 'top 80%',
                end: 'top 30%',
                toggleActions: 'play none none reverse',
            },
            y: 80,
            opacity: 0,
            scale: 0.9,
            duration: 1.2,
            ease: 'power3.out',
        });

        // Message texts staggered
        gsap.from('.message-text', {
            scrollTrigger: {
                trigger: '#message',
                start: 'top 60%',
                toggleActions: 'play none none reverse',
            },
            y: 40,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power2.out',
        });

        // Garden title
        gsap.from('.garden-title', {
            scrollTrigger: {
                trigger: '#garden',
                start: 'top 70%',
                toggleActions: 'play none none reverse',
            },
            y: 60,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
        });

        gsap.from('.garden-hint', {
            scrollTrigger: {
                trigger: '#garden',
                start: 'top 65%',
                toggleActions: 'play none none reverse',
            },
            y: 40,
            opacity: 0,
            duration: 0.8,
            delay: 0.3,
            ease: 'power2.out',
        });

        gsap.from('.flower-counter', {
            scrollTrigger: {
                trigger: '#garden',
                start: 'top 60%',
                toggleActions: 'play none none reverse',
            },
            scale: 0,
            opacity: 0,
            duration: 0.6,
            delay: 0.6,
            ease: 'back.out(1.7)',
        });

        // Final section
        gsap.from('.final-title', {
            scrollTrigger: {
                trigger: '#final',
                start: 'top 70%',
                toggleActions: 'play none none reverse',
            },
            y: 60,
            opacity: 0,
            duration: 1.2,
            ease: 'power3.out',
        });

        gsap.from('.floating-heart', {
            scrollTrigger: {
                trigger: '#final',
                start: 'top 75%',
                toggleActions: 'play none none reverse',
            },
            scale: 0,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'back.out(1.7)',
        });

        gsap.from('.final-date', {
            scrollTrigger: {
                trigger: '#final',
                start: 'top 60%',
                toggleActions: 'play none none reverse',
            },
            y: 30,
            opacity: 0,
            duration: 0.8,
            delay: 0.4,
            ease: 'power2.out',
        });

        gsap.from('.final-emoji', {
            scrollTrigger: {
                trigger: '#final',
                start: 'top 55%',
                toggleActions: 'play none none reverse',
            },
            scale: 0,
            rotation: 180,
            opacity: 0,
            duration: 1,
            delay: 0.6,
            ease: 'back.out(2)',
        });

        // Hero parallax
        gsap.to('.hero-content', {
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
            },
            y: -100,
            opacity: 0,
        });
    }

    // ─── Ambient Cursor Glow ───────────────────────────────
    function initCursorGlow() {
        if (isMobile) return;

        const glow = document.createElement('div');
        glow.style.cssText = `
            position: fixed;
            width: 300px;
            height: 300px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 235, 59, 0.08) 0%, transparent 70%);
            pointer-events: none;
            z-index: 1;
            transition: transform 0.1s linear;
            will-change: transform;
        `;
        document.body.appendChild(glow);

        document.addEventListener('mousemove', (e) => {
            glow.style.transform = `translate(${e.clientX - 150}px, ${e.clientY - 150}px)`;
        });
    }

    // ─── Initialization ────────────────────────────────────
    function init() {
        hideLoader();
        initMusic();
        initMouseTracking();
        initScrollTracking();
        initThreeJS();
        initPetals();
        initGardenInteraction();
        initCursorGlow();

        // Wait for GSAP to be available then init scroll anims
        if (window.gsap && window.ScrollTrigger) {
            initScrollAnimations();
        } else {
            // Retry after a short delay for CDN loading
            setTimeout(() => {
                if (window.gsap && window.ScrollTrigger) {
                    initScrollAnimations();
                }
            }, 500);
        }
    }

    // Start everything
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
