document.addEventListener("click", function(e) {
    const question = e.target.closest('.faq-question');
    if (!question) return;

    const parent = question.parentElement;
    const answer = parent.querySelector('.faq-answer');

    const activeElements = document.querySelectorAll('.faq-element.active');

    activeElements.forEach(element => {
        if (element !== parent) {
            element.classList.remove('active');
            const openAnswer = element.querySelector('.faq-answer');
            if (openAnswer) {
                openAnswer.style.maxHeight = null;
            }
        }
    });

    parent.classList.toggle('active');

    if (parent.classList.contains('active')) {
        answer.style.maxHeight = answer.scrollHeight + "px";
    } else {
        answer.style.maxHeight = null;
    }
});