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

    fetch('http://localhost:2500/user/addToWishList', {

        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(WishListData),
    })
        .then(response => response.json())
        .then(data => {

            if (data.success) {

                console.log('success')

                window.alert(data.message);

            } else {

                const errorMessage = data.message;
                alert(`Error: ${errorMessage}`);
            }
        })
        .catch(error => {

            alert('Failed to add category data due to local / network issues');
            // Handle network or other errors here
            console.error('Error:', error);
        });




}

function addToCart(id) {

    const quantity = quantityInput.value;

    const productID = id;

    let cartData = { productID, quantity };

    console.log(cartData);

    fetch('http://localhost:2500/user/addToCart', {

        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(cartData),
    })
        .then(response => response.json())
        .then(data => {

            if (data.success) {

                console.log('success')

                window.alert(data.message);

            } else {

                const errorMessage = data.message;
                alert(`Error: ${errorMessage}`);
            }
        })
        .catch(error => {

            alert('Failed to add category data due to local / network issues');
            // Handle network or other errors here
            console.error('Error:', error);
        });



}


