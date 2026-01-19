window.initCounters = function() {
    const formatNumber = (num) => {return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");}
    const counters = document.querySelectorAll(".counter");

    const observer = new IntersectionObserver( (entries, observer) => {
        entries.forEach( entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                let current = 0;
                counter.innerHTML = '0';

                function updateCounter() {
                    const target = +counter.getAttribute("data-target");
                    const c = current;

                    const increment = target / 100;

                    if ( c < target ) {
                        current += increment;
                        counter.innerHTML = formatNumber(Math.ceil(c + increment));
                        setTimeout(updateCounter, 7 );
                    } 
                    else {
                        counter.innerHTML = formatNumber(target);
                    }
                }
                updateCounter();
                observer.unobserve(counter);
            }
        });
    })
    counters.forEach( counter => {
        observer.observe(counter); 
    })
}


