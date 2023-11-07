

const form = document.getElementById('myForm');

const categoryID = form.getAttribute('data');

form.addEventListener('submit', function (event) {

    event.preventDefault();

    const formData = new FormData(form);

    console.log(formData);

    const formDataJSON = {};

    formData.forEach((value, key) => {
        formDataJSON[key] = value;
    });
    const currentURL = window.location.origin;
    fetch(currentURL + '/admin/editCategory/' + categoryID, {

        method: 'PATCH',

        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(formDataJSON),
    })
        .then(response => response.json())
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
            alert('Failed to add category data due to local / network issues');
            console.error('Error:', error);
        });
});
