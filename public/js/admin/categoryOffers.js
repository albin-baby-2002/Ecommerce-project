
const activateButtons = document.querySelectorAll('.activate');
const deactivateButtons = document.querySelectorAll('.deactivate');


activateButtons.forEach((btn) => {

    const categoryID = btn.getAttribute('data');

    const data = { categoryID };

    btn.addEventListener('click', (e) => {

        const currentURL = window.location.origin;

        fetch(currentURL + '/admin/categoryOffer/activate', {

            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },

            body: JSON.stringify(data),
        })
            .then(response => response.json())
            .catch(error => {

                notificationMessage.hidden = false;

                messageLine.classList.add('red');

                messageLine.innerText = 'Failed  due to network/serverError';

                window.scrollTo(0, 0)


                setTimeout(() => {

                    notificationMessage.hidden = true;
                    messageLine.classList.remove('red');
                }, 3000)

                console.error('Error:', error);
            })
            .then(data => {

                if (data.success) {

                    console.log('success')


                    notificationMessage.hidden = false;

                    messageLine.classList.add('green');

                    messageLine.innerText = data.message;

                    window.scrollTo(0, 0)


                    setTimeout(() => {

                        notificationMessage.hidden = true;
                        messageLine.classList.remove('green');

                        location.reload();
                    }, 2000)


                } else {


                    notificationMessage.hidden = false;

                    messageLine.classList.add('red');

                    messageLine.innerText = data.message;

                    window.scrollTo(0, 0)


                    setTimeout(() => {

                        notificationMessage.hidden = true;
                        messageLine.classList.remove('red');
                    }, 2000)

                }
            })
            .catch(error => {


                // Handle network or other errors here
                console.error('Error:', error);
            });

    })






})



deactivateButtons.forEach((btn) => {

    const categoryID = btn.getAttribute('data');

    const data = { categoryID };

    btn.addEventListener('click', (e) => {


        const currentURL = window.location.origin;
        fetch(currentURL + '/admin/categoryOffer/deactivate', {

            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },

            body: JSON.stringify(data),
        })
            .then(response => response.json())
            .catch(error => {

                notificationMessage.hidden = false;

                messageLine.classList.add('red');

                messageLine.innerText = 'Failed  due to network/serverError';

                window.scrollTo(0, 0)


                setTimeout(() => {

                    notificationMessage.hidden = true;
                    messageLine.classList.remove('red');
                }, 3000)

                console.error('Error:', error);
            })
            .then(data => {

                if (data.success) {

                    console.log('success')


                    notificationMessage.hidden = false;

                    messageLine.classList.add('green');

                    messageLine.innerText = data.message;

                    window.scrollTo(0, 0)


                    setTimeout(() => {

                        notificationMessage.hidden = true;
                        messageLine.classList.remove('green');

                        location.reload();
                    }, 2000)


                } else {


                    notificationMessage.hidden = false;

                    messageLine.classList.add('red');

                    messageLine.innerText = data.message;

                    window.scrollTo(0, 0)


                    setTimeout(() => {

                        notificationMessage.hidden = true;
                        messageLine.classList.remove('red');
                    }, 2000)

                }
            })
            .catch(error => {


                // Handle network or other errors here
                console.error('Error:', error);
            });

    })




})