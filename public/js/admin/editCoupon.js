
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

    console.log('http://localhost:2500/admin/editCoupon/' + couponID);



    fetch('http://localhost:2500/admin/editCoupon/' + couponID, {

        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(formDataJSON),
    })
        .then(response => response.json())
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
            console.error('Error:', error);
        });
});
