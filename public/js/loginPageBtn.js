const verificationButton = document.querySelector('[data-id="emailVerificationBtn"]');

verificationButton.addEventListener('click', () => {
    localStorage.removeItem('timerMinutes');
    localStorage.removeItem('timerSeconds');

    console.log('deleted');
})