document.addEventListener("DOMContentLoaded", () => {
    loadData();
    videoObserver();
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
        document.body.classList.add('is-safari');
}
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
            <div class="counter-box">
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

    const videosHTML = videos.map(video => {
        let posterUrl = video.src.replace(/\.[^/.]+$/, ".jpg");
    
        return `
        <div class="video-item">
            <div class="video-logo-and-name">
                <img class="video-logo" src="${video.logo}" alt="Partner logo">
                <span class="video-partner">${video.title}</span>
            </div>
            <video 
                src="${video.src}" 
                poster="${posterUrl}"
                title="${video.title}" 
                class="video-element" 
                controls
                preload="metadata" 
                playsinline 
                loading="lazy">
            </video>
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
                <button type="button" class="faq-question">${f.question}</button>
                <div class="faq-answer">
                    <p>${f.answer}</p>
                </div>
            </div>
        `
    }).join("");

    faqContainer.innerHTML = faqContent;
}