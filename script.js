
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE.replace(/\/$/, '') : '';
    // --- Slider setup ---
    const slider = document.querySelector('.slider');
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');
    const images = document.querySelectorAll('.slider-image');
    let idx = 0;
    if (slider && images.length) {
        // dynamic sizing: each slide gets an equal portion of the track
        const slidePercent = 100 / images.length;
        images.forEach(img => {
            // ensure each image is a slide-sized flex child
            img.style.flex = `0 0 ${slidePercent}%`;
            img.style.width = `${slidePercent}%`;
        });
        // set the slider track width to n * 100%
        slider.style.width = `${images.length * 100}%`;

        function goTo(i) {
            idx = (i + images.length) % images.length;
            const percent = idx * slidePercent;
            slider.style.transform = `translateX(-${percent}%)`;
            // update dots if present
            const dots = document.querySelectorAll('.slider-dots .dot');
            dots.forEach(d => d.classList.remove('active'));
            if (dots[idx]) dots[idx].classList.add('active');
        }

    // create dots navigation
        let dotsContainer = document.querySelector('.slider-dots');
        if (!dotsContainer) {
            dotsContainer = document.createElement('div');
            dotsContainer.className = 'slider-dots';
            slider.parentNode.appendChild(dotsContainer);
        }
        dotsContainer.innerHTML = '';
        images.forEach((_, i) => {
            const d = document.createElement('button');
            d.className = 'dot';
            d.setAttribute('aria-label', `Go to slide ${i+1}`);
            d.addEventListener('click', () => {
                stopAuto();
                goTo(i);
                startAuto();
            });
            dotsContainer.appendChild(d);
        });
        // mark first active
        const initialDot = dotsContainer.querySelector('.dot');
        if (initialDot) initialDot.classList.add('active');
        // show first slide
        goTo(0);

    prevButton?.addEventListener('click', () => { stopAuto(); goTo(idx - 1); startAuto(); });
    nextButton?.addEventListener('click', () => { stopAuto(); goTo(idx + 1); startAuto(); });

        // auto-advance
    let auto = null;
    const stopAuto = () => { if (auto) { clearInterval(auto); auto = null; } };
    const startAuto = () => { if (!auto) auto = setInterval(() => goTo(idx + 1), 5000); };
    // start auto-advance
    startAuto();
    slider.addEventListener('mouseenter', stopAuto);
    slider.addEventListener('mouseleave', startAuto);
    prevButton?.addEventListener('mouseenter', stopAuto);
    nextButton?.addEventListener('mouseenter', stopAuto);
    prevButton?.addEventListener('mouseleave', startAuto);
    nextButton?.addEventListener('mouseleave', startAuto);

        // keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') goTo(idx - 1);
            if (e.key === 'ArrowRight') goTo(idx + 1);
        });

        // responsive: ensure transform/slide stays correct on resize
        window.addEventListener('resize', () => { goTo(idx); });
    }

    // --- Smooth scrolling for nav links ---
    document.querySelectorAll('nav ul li a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.getAttribute('href')?.substring(1);
            if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // --- Forms: submit to backend endpoints using fetch ---
    const donationForm = document.getElementById('donation-form');
    if (donationForm) {
        donationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('donor-name').value.trim();
            const email = document.getElementById('donor-email').value.trim();
            const amount = document.getElementById('donation-amount').value;

            if (!name || !email || !amount) return alert('Please fill all donation fields.');
            if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return alert('Please enter a valid email.');
            if (Number(amount) <= 0) return alert('Enter a valid donation amount.');

            try {
                const res = await fetch(`${API_BASE}/api/donate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, amount })
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || 'Server error');
                alert(json.message || 'Donation received — thank you!');
                donationForm.reset();
            } catch (err) {
                console.error(err);
                alert('Error sending donation. Please try again later.');
            }
        });
    }

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const message = document.getElementById('contact-message').value.trim();

            if (!name || !email || !message) return alert('Please fill all contact fields.');
            if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return alert('Please enter a valid email.');

            try {
                const res = await fetch(`${API_BASE}/api/contact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message })
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || 'Server error');
                alert(json.message || 'Message received — thank you!');
                contactForm.reset();
            } catch (err) {
                console.error(err);
                alert('Error sending message. Please try again later.');
            }
        });
    }
});