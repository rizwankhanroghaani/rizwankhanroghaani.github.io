(function () {
    'use strict';

    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('.menu-toggle').forEach(function (toggle) {
        toggle.addEventListener('click', function () {
            document.querySelector('.mobile-menu').classList.toggle('active');
        });
    });

    document.querySelectorAll('.mobile-nav-links .nav-link').forEach(function (link) {
        link.addEventListener('click', function () {
            document.querySelector('.mobile-menu').classList.remove('active');
        });
    });

    /* =========================================================
       2. SCROLL REVEAL
       ========================================================= */
    var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealEls.forEach(function (el) { el.classList.add('is-revealed'); });
    } else {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                var el = entry.target;
                revealObserver.unobserve(el);
                el.classList.add('is-in');

                el.addEventListener('animationend', function (e) {
                    if (e.target !== el) return;      // ignore child animations
                    el.classList.remove('is-in');
                    el.classList.add('is-revealed');
                });
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -8% 0px'
        });

        revealEls.forEach(function (el) { revealObserver.observe(el); });
    }

    /* =========================================================
       3. PROJECT CATEGORY FILTER
       ========================================================= */
    var filterLinks = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
    var cells = Array.prototype.slice.call(document.querySelectorAll('.project-cell'));

    function applyFilter(category) {
        var shownIndex = 0;

        cells.forEach(function (cell) {
            var matches = category === 'all' ||
                cell.getAttribute('data-category') === category;

            if (matches) {
                var wasHidden = cell.getAttribute('data-state') === 'hidden';
                cell.setAttribute('data-state', 'shown');
                clearTimeout(cell._hideTimer);

                if (wasHidden) {
                    cell.style.display = '';
                    void cell.offsetWidth;            // force reflow → transition replays
                }

                cell.style.transitionDelay = (shownIndex * 70) + 'ms';
                cell.classList.remove('is-out');
                shownIndex++;
            } else {
                if (cell.getAttribute('data-state') === 'hidden') return;

                cell.setAttribute('data-state', 'hidden');
                cell.style.transitionDelay = '0ms';
                cell.classList.add('is-out');

                clearTimeout(cell._hideTimer);
                cell._hideTimer = setTimeout(function () {
                    if (cell.getAttribute('data-state') === 'hidden') {
                        cell.style.display = 'none';
                    }
                }, 430);
            }
        });
    }

    filterLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            if (link.classList.contains('is-active')) return;

            filterLinks.forEach(function (l) { l.classList.remove('is-active'); });
            link.classList.add('is-active');

            applyFilter(link.getAttribute('data-filter'));
        });
    });

    /* =========================================================
       4. HERO PARALLAX  (title drifts + fades on scroll)
       ========================================================= */
    var heroTitle = document.querySelector('.hero-title');

    if (heroTitle && !reduceMotion) {
        var ticking = false;

        var updateHero = function () {
            var y = window.pageYOffset || document.documentElement.scrollTop;
            var shift = Math.min(y * 0.22, 170);
            var fade = Math.max(1 - y / 620, 0);

            heroTitle.style.setProperty('--hero-shift', shift.toFixed(1) + 'px');
            heroTitle.style.setProperty('--hero-opacity', fade.toFixed(3));

            ticking = false;
        };

        window.addEventListener('scroll', function () {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(updateHero);
            }
        }, { passive: true });

        updateHero();
    }

    /* =========================================================
       5. SUBTLE PARALLAX ON EXPERIENCE IMAGES
       ========================================================= */
    if (!reduceMotion && window.matchMedia('(min-width: 993px)').matches) {
        var parallaxItems = Array.prototype.slice.call(
            document.querySelectorAll('.exp-image img')
        );

        if (parallaxItems.length) {
            var pTick = false;

            var runParallax = function () {
                var vh = window.innerHeight;

                parallaxItems.forEach(function (img) {
                    var rect = img.getBoundingClientRect();
                    if (rect.bottom < 0 || rect.top > vh) return;

                    var progress = (rect.top + rect.height / 2 - vh / 2) / vh;
                    img.style.transform =
                        'translate3d(0,' + (progress * -18).toFixed(2) + 'px,0) scale(1.04)';
                });

                pTick = false;
            };

            window.addEventListener('scroll', function () {
                if (!pTick) {
                    pTick = true;
                    window.requestAnimationFrame(runParallax);
                }
            }, { passive: true });

            runParallax();
        }
    }

    /* =========================================================
       6. PORTRAIT COLOUR SPOTLIGHT
       Grayscale base image + a colour copy revealed only inside
       a soft circular mask that follows the cursor.
       ========================================================= */
    var portrait = document.getElementById('portrait');

    if (portrait && !reduceMotion) {
        var colourLayer = portrait.querySelector('.portrait-color');

        if (colourLayer) {
            var targetX = 0, targetY = 0;   // cursor position (px, relative to portrait)
            var currentX = 0, currentY = 0; // eased position
            var rafId = null;
            var isActive = false;
            var EASE = 0.18;                // 0 = frozen, 1 = instant

            var paint = function () {
                colourLayer.style.setProperty('--spot-x', currentX.toFixed(1) + 'px');
                colourLayer.style.setProperty('--spot-y', currentY.toFixed(1) + 'px');
            };

            var loop = function () {
                currentX += (targetX - currentX) * EASE;
                currentY += (targetY - currentY) * EASE;

                var settled = Math.abs(targetX - currentX) < 0.4 &&
                    Math.abs(targetY - currentY) < 0.4;

                if (settled) {
                    currentX = targetX;
                    currentY = targetY;
                }

                paint();

                if (settled) {
                    rafId = null;
                    return;
                }

                rafId = window.requestAnimationFrame(loop);
            };

            var startLoop = function () {
                if (rafId === null) {
                    rafId = window.requestAnimationFrame(loop);
                }
            };

            var moveSpot = function (clientX, clientY) {
                var rect = portrait.getBoundingClientRect();
                targetX = clientX - rect.left;
                targetY = clientY - rect.top;

                if (!isActive) {
                    // enter at the cursor — no flying across the image
                    isActive = true;
                    currentX = targetX;
                    currentY = targetY;
                    paint();
                    portrait.classList.add('is-spotting');
                }

                startLoop();
            };

            var hideSpot = function () {
                if (!isActive) return;
                isActive = false;
                portrait.classList.remove('is-spotting');
                if (rafId !== null) {
                    window.cancelAnimationFrame(rafId);
                    rafId = null;
                }
            };

            portrait.addEventListener('pointermove', function (e) {
                moveSpot(e.clientX, e.clientY);
            }, { passive: true });

            portrait.addEventListener('pointerdown', function (e) {
                moveSpot(e.clientX, e.clientY);
            }, { passive: true });

            portrait.addEventListener('pointerleave', hideSpot);
            portrait.addEventListener('pointercancel', hideSpot);
            portrait.addEventListener('pointerup', function (e) {
                if (e.pointerType === 'touch') hideSpot();
            });
        }
    }
    /* =========================================================
7. AUTO-UPDATE NAV COUNTERS
Counts items in each section and updates the [n] badges
in both the desktop and mobile navigation.
========================================================= */
    function updateNavCounters() {
        var workCount = document.querySelectorAll('#work .project-cell').length;
        var servicesCount = document.querySelectorAll('#services .service').length;
        var experienceCount = document.querySelectorAll('#experience .exp-item').length;

        document.querySelectorAll('.nav-link[href="#work"] .stat').forEach(function (el) {
            el.textContent = '[' + workCount + ']';
        });

        document.querySelectorAll('.nav-link[href="#services"] .stat').forEach(function (el) {
            el.textContent = '[' + servicesCount + ']';
        });

        document.querySelectorAll('.nav-link[href="#experience"] .stat').forEach(function (el) {
            el.textContent = '[' + experienceCount + ']';
        });
    }

    updateNavCounters();

})();