const colorRadios = document.querySelectorAll('.color-radio');
const sizeRadios = document.querySelectorAll('.size-radio');

const quantityInput = document.querySelector('[data-id="quantity"]');







colorRadios.forEach((radio) => {
    radio.addEventListener('click', (event) => {

        // event.stopPropagation()

        let currentUrl = window.location;

        console.log(radio)

        let baseUrl = currentUrl.pathname;

        const color = radio.value;

        const url = `${baseUrl}?color=${color || ''}`;

        window.location.href = url;

    });
});

sizeRadios.forEach((radio) => {
    radio.addEventListener('click', (event) => {

        event.stopPropagation()

        let currentUrl = window.location;


        let baseUrl = currentUrl.pathname;

        const color = new URLSearchParams(window.location.search).get('color');

        const size = radio.value;

        const url = `${baseUrl}?color=${color || ''}&size=${size}`;

        window.location.href = url;

    });
});


function addToWishList() {



    let productDetails = document.querySelector('.product__details__text');

    let productID = productDetails.getAttribute('data-id');





    let WishListData = { productID };

    console.log(WishListData)
    const currentURL = window.location.origin;

    fetch(currentURL + '/user/addToWishList', {

        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(WishListData),
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
                }, 3000)



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




}

function addToCart(id) {

    const quantity = quantityInput.value;

    const productID = id;

    let cartData = { productID, quantity };

    console.log(cartData);

    const currentURL = window.location.origin;

    fetch(currentURL + '/user/addToCart', {

        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(cartData),
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
                }, 3000)



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



}


