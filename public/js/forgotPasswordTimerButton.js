const verificationButton = document.querySelector('[data-id="forgotPasswordBtn"]');

verificationButton.addEventListener('click', () => {
    localStorage.removeItem('timerMinutes');
    localStorage.removeItem('timerSeconds');

    console.log('deleted');
})