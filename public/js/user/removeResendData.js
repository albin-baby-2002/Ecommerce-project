const verificationButton = document.querySelector('[data-id="signInBtn"]');

verificationButton.addEventListener('click', () => {
    localStorage.removeItem('timerMinutes');
    localStorage.removeItem('timerSeconds');

    console.log('deleted');
})