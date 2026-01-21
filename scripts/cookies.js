document.addEventListener("DOMContentLoaded", function() {
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('btn-cookie-accept');
    const rejectBtn = document.getElementById('btn-cookie-reject');

    const savedConsent = localStorage.getItem('cookieConsent');

    if (!savedConsent) {
        setTimeout(() => {
            cookieBanner.classList.add('show');
        }, 500);
    } else if (savedConsent === 'accepted') {
        loadMarketingPixels();
    }

    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        cookieBanner.classList.remove('show');
        loadMarketingPixels();
    });

    rejectBtn.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'rejected');
        cookieBanner.classList.remove('show');
    });

    function loadMarketingPixels() {
        
        // 1. TIKTOK PIXEL
        (function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
            var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};

            n=document.createElement("script");
            n.type="text/javascript";
            n.async=true;
            n.src=r+"?sdkid="+e+"&lib="+t;

            document.head.appendChild(n);
            };

            ttq.load('D5IJKG3C77U2KB72HKSG');
            ttq.page();
        }(window, document, 'ttq'));


        // 2. META / FACEBOOK PIXEL
        (function(f,b,e,v,n,t,s) {
            if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];

            t=document.createElement(e);
            t.async=true;
            t.src=v;
            
            document.head.appendChild(t);
            
        }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js'));
        
        fbq('init', '891606847169072');
        fbq('track', 'PageView');
    }
});