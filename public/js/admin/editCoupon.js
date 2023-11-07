
const form = document.getElementById('editCouponForm');

const couponID = form.getAttribute('coupon-id');

form.addEventListener('submit', function (event) {

    event.preventDefault();

    const formData = new FormData(form);


    const formDataJSON = {};

    formData.forEach((value, key) => {
        formDataJSON[key] = value;
    });

    console.log(formDataJSON);

    const currentURL = window.location.origin;

    fetch(currentURL + '/admin/editCoupon/' + couponID, {

        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(formDataJSON),
    })
        .then(response => {
            console.log(response);
            return response.json()
        })
        .catch(error => {

            notificationMessage.hidden = false;

            messageLine.classList.add('red');

            messageLine.innerText = 'Failed  due to network/serverError' + error;

            window.scrollTo(0, 0)


            setTimeout(() => {

                notificationMessage.hidden = true;
                messageLine.classList.remove('red');
            }, 3000)

            console.error('Error:', error);
        })
        .then((data) => {

            console.log(data);

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
            console.error('Error:', error);
        });
});
