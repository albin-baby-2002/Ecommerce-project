const customSelects = document.querySelectorAll(".custom-selected");


customSelects.forEach((customSelect) => {
    customSelect.addEventListener('click', function (e) {

        e.preventDefault()

        console.log('yes')

        const selectOptions = customSelect.parentElement.querySelector(".select-options");

        const selectButton = customSelect.querySelector(".select-button");

        if (e.target === selectButton) {
            // Toggle visibility of options when the button is clicked
            selectOptions.style.display = selectOptions.style.display === "block" ? "none" : "block";
        }
    })
})




const addressForm = document.getElementById("newAddressForm");
// const formSubmitBtn = document.getElementById("newAddressSubmitBtn");

addressForm.addEventListener("submit", function (event) {
    event.preventDefault();

    console.log('yes from client')

    const formData = new FormData(addressForm);

    const formDataJSON = {};

    formData.forEach((value, key) => {
        formDataJSON[key] = value;
    });



    const currentURL = window.location.origin;
    fetch(currentURL + '/user/addNewAddress', {

        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(formDataJSON),
    })
        .then(response => response.json())
        .catch(error => {

            notificationMessage.hidden = false;

            messageLine.classList.add('red');

            messageLine.innerText = 'Failed to add to wish list due to network/serverError';

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




                setTimeout(function () {

                    window.location.reload();
                }, 2000);

            } else {



                notificationMessage.hidden = false;

                messageLine.classList.add('red');

                messageLine.innerText = data.message;

                window.scrollTo(0, 0)


                setTimeout(() => {

                    notificationMessage.hidden = true;
                    messageLine.classList.remove('red');
                }, 3000)
            }
        })
        .catch(error => {

            // Handle network or other errors here
            console.error('Error:', error);
        });


});





const couponValidityForm = document.getElementById("couponValidityChecker");


couponValidityForm.addEventListener("submit", function (event) {
    event.preventDefault();

    console.log('yes from client')

    const formData = new FormData(couponValidityForm);

    const formDataJSON = {};

    formData.forEach((value, key) => {
        formDataJSON[key] = value;
    });



    const currentURL = window.location.origin;
    fetch(currentURL + '/user/coupon/verify', {

        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(formDataJSON),
    })
        .then(response => response.json())
        .catch(error => {

            notificationMessage.hidden = false;

            messageLine.classList.add('red');

            messageLine.innerText = 'Failed to add to wish list due to network/serverError';

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




                setTimeout(function () {

                    window.location.reload();
                }, 2000);

            } else {



                notificationMessage.hidden = false;

                messageLine.classList.add('red');

                messageLine.innerText = data.message;

                window.scrollTo(0, 0)


                setTimeout(() => {

                    notificationMessage.hidden = true;
                    messageLine.classList.remove('red');
                }, 3000)
            }
        })
        .catch(error => {

            // Handle network or other errors here
            console.error('Error:', error);
        });


});

const addressRadios = document.querySelectorAll('.addressRadio');

const paymentMethodRadios = document.querySelectorAll('.paymentMethod');

const couponApplied = document.getElementById('couponApplied');

const proceedToPayment = document.getElementById('proceedToPaymentBtn');

proceedToPayment.addEventListener('click', (e) => {

    let deliveryAddressID;

    let paymentMethod;

    if (addressRadios.length === 0) {

        notificationMessage.hidden = false;

        messageLine.classList.add('red');

        messageLine.innerText = ' Add a delivery address ';

        window.scrollTo(0, 0)


        setTimeout(() => {

            notificationMessage.hidden = true;
            messageLine.classList.remove('red');
        }, 3000);

        return;

    }

    addressRadios.forEach((radio) => {

        if (radio.checked) {

            deliveryAddressID = radio.value;
        }
    })

    console.log(deliveryAddressID);

    if (!deliveryAddressID) {
        notificationMessage.hidden = false;

        messageLine.classList.add('red');

        messageLine.innerText = 'Select Your Delivery Address ';

        window.scrollTo(0, 0)


        setTimeout(() => {

            notificationMessage.hidden = true;
            messageLine.classList.remove('red');
        }, 3000);

        return
    };


    paymentMethodRadios.forEach((radio) => {

        if (radio.checked) {

            paymentMethod = radio.value;
        }
    })


    if (!paymentMethod) {
        notificationMessage.hidden = false;

        messageLine.classList.add('red');

        messageLine.innerText = 'Select Your Payment Method ';

        window.scrollTo(0, 0)


        setTimeout(() => {

            notificationMessage.hidden = true;
            messageLine.classList.remove('red');
        }, 3000);

        return
    };



    let couponCodeApplied = couponApplied.value.trim();

    const orderData = { deliveryAddressID, couponCodeApplied, paymentMethod };

    console.log(orderData);
    const currentURL = window.location.origin;
    fetch(currentURL + '/user/checkout/addressCouponAndItems', {

        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(orderData),
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

                window.location.href = data.url;

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
                }, 3000)
            }
        })
        .catch(error => {

            // Handle network or other errors here
            console.error('Error:', error);
        });





})

