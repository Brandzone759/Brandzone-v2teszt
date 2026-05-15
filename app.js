document.addEventListener("DOMContentLoaded", () => {
    loadData();
    videoObserver();
    ServicesCarousel();

    const logoContainer = document.querySelector('.logo-track');
    const showMoreLogosBtn = document.getElementById('show-more-logos-btn');

    showMoreLogosBtn.addEventListener('click', () => {
        logoContainer.classList.toggle('show-all');
        if (logoContainer.classList.contains('show-all')) {
            showMoreLogosBtn.innerHTML = '<span class="material-symbols-outlined">stat_1</span>'
        } else {
            showMoreLogosBtn.innerHTML = '<span class="material-symbols-outlined">stat_minus_1</span>'
        }
    })

    const heroVideo = document.querySelector('.hero-video');
    if (!heroVideo) return; 

    let playPromise = heroVideo.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
        }).catch(error => {
            heroVideo.style.display = 'none';
        });
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (heroVideo.style.display !== 'none') {
                    heroVideo.play().catch(e => console.log("Autoplay hiba görgetéskor"));
                }
            } else {
                heroVideo.pause();
            }
        });
    }, { 
        threshold: 0.0
    });
    observer.observe(heroVideo);
});

async function loadData() {
    try {
        const response = await fetch("./data.json");
        const data = await response.json();

        const currentLang = document.documentElement.lang.split('-')[0] || "hu";
        const sharedData = data.shared;
        const languageData = data.languages[currentLang];

        if (sharedData) {
            const labels = languageData && languageData.counterTexts ? languageData.counterTexts : {};
            displayCounters(sharedData.counters, labels);
        }

        if (languageData) {
            displayPartners(languageData.partners);
            displayVideos(languageData.videos);
            displayFAQ(languageData.faq);
        }
    }
    catch (error) {
        console.error("Hiba az adatok betöltésekor: ", error);
    }
}

function displayPartners(partners) {
    const container = document.getElementById("logoTrack");
    if (!container) return;

    const partnersHTML = partners.map(partner => `
        <a href="${partner.url}" target="_blank" class="partner-link">
            <img src="${partner.img}" alt="${partner.alt}">
        </a>
    `).join('');

    container.innerHTML = partnersHTML;
}

function displayCounters(counters, labels) {
    const container = document.getElementById("counter-holder")
    if (!container) return;

    const countersHTML = counters.map(counter => {
        const labelText = labels[counter.id] || counter.id.toUpperCase();

        return `
            <div class="counter-box card-effects">
                <img src="${counter.icon}" alt="Icon">
                <h2>
                    <span class="counter" data-target="${counter.count}">${counter.display}</span> +
                </h2>
                <p>${labelText}</p>
            </div>
        `;
    }).join('');
    container.innerHTML = countersHTML;

    if (typeof window.initCounters === 'function') {
        window.initCounters();
    }
}

function displayVideos(videos) {
    const container = document.getElementById("video-holder");
    if (!container) return;
    if (!videos) return;

    const bunnyLibraryId = "585259";
    const videosHTML = videos.map(video => {
    
        return `
        <div class="video-item card-effects">
            <div class="video-logo-and-name">
                <img class="video-logo" src="${video.logo}" alt="Partner logo">
                <span class="video-partner">${video.title}</span>
            </div>
            <div class="iframe-wrapper" style="position:relative; padding-top:56.25%;">
                <iframe 
                    src="https://iframe.mediadelivery.net/embed/${bunnyLibraryId}/${video.bunnyVideoId}?autoplay=false&preload=false" 
                    loading="lazy" 
                    style="border:0; position:absolute; top:0; height:100%; width:100%;" 
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" 
                    allowfullscreen="true">
                </iframe>
            </div>
        </div>
    `;
    }).join('');
    
    container.innerHTML = videosHTML;
}

function videoObserver() {

    document.addEventListener('play', function(e) {
        if (e.target.matches('.video-element')) {
            const container = e.target.closest('.video-item');
            if (container) container.classList.add('playing');
        }
    }, true);

    document.addEventListener('pause', function(e) {
        if (e.target.matches('.video-element')) {
            const container = e.target.closest('.video-item');
            if (container) container.classList.remove('playing');
        }
    }, true);

    document.addEventListener('ended', function(e) {
        if (e.target.matches('.video-element')) {
            const container = e.target.closest('.video-item');
            if (container) container.classList.remove('playing');
        }
    }, true);
}

function displayFAQ(faqData) {
    if (!faqData) return;

    const faqContainer = document.getElementById("faq-container");
    if (!faqContainer) return;
    
    const faqContent = faqData.map(f => {
        return `
            <div class="faq-element">
                <button type="button" class="faq-question card-effects">${f.question}</button>
                <div class="faq-answer">
                    <p>${f.answer}</p>
                </div>
            </div>
        `
    }).join("");

    faqContainer.innerHTML = faqContent;
}

function scrollCarousel(direction) {
    const container = document.getElementById('teamGrid');
    const cards = container.querySelectorAll('.team-member');
    
    if (!container || cards.length === 0) return;

    const currentScroll = container.scrollLeft;
    const cardPositions = Array.from(cards).map(card => card.offsetLeft - cards[0].offsetLeft);
    
    let currentIndex = cardPositions.findIndex(pos => pos >= currentScroll - 10);
    if (currentIndex === -1) currentIndex = 0;

    let targetIndex = currentIndex + direction;
    
    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex >= cards.length) targetIndex = cards.length - 1;

    const targetOffset = cardPositions[targetIndex];

    container.scrollTo({
        left: targetOffset,
        behavior: 'smooth'
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const splide = new Splide('#team-carousel', {
        type   : 'slide',
        perPage: 4,
        perMove: 1,
        gap    : '2rem',      
        arrows : false,       
        pagination: false,    
        trimSpace: true,     
        speed: 600, 
        drag: true,
        snap: true,       

        breakpoints: {
            1200: {
                perPage: 4,
            },
            900: {
                perPage: 2,
            },
            500: {
                perPage: 1.5,
                focus: 0,
                gap: '1rem',
                trimSpace: true,
            }
        }
    });

    splide.mount();

    const nextBtn = document.querySelector('.next');
    const prevBtn = document.querySelector('.prev');

    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', () => splide.go('>'));
        prevBtn.addEventListener('click', () => splide.go('<'));
    }

    const expandButtons = document.querySelectorAll('.expand-btn');
    expandButtons.forEach((el) => el.addEventListener('click', () => {
        const carousel = document.getElementById('team-carousel');
        carousel.classList.toggle('hidden');
        if (el.style.rotate === '180deg') {
            el.style.rotate = '0deg';
        } else {
            el.style.rotate = '180deg';
        }
        setTimeout(() => {
            splide.refresh();
        }, 100);
    }));
});


function ServicesCarousel() {
    const splide = new Splide('#servicesCarousel', {
        type: 'slide',
        perPage: 1,
        gap: '1.5rem',
        pagination: true,
        mediaQuery: 'min',
        arrows: true,
        breakpoints: {
            768: {
                destroy: true
            }
        }
    });
    splide.mount();
}
// MOTION ANIMATIONS

