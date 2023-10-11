async function removeFromWishList(id) {

    const productData = { productID: id };


    fetch('http://localhost:2500/user/wishList', {

        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(productData),
    })
        .then(response => response.json())
        .then(data => {

            if (data.success) {

                console.log('success')


                const row = document.querySelector(`[data-id="${id}"]`);

                row.remove();

                window.alert(data.message);

            } else {

                const errorMessage = data.message;
                alert(`Error: ${errorMessage}`);
            }
        })
        .catch(error => {

            alert('Failed to remove product due to local / network issues');
            // Handle network or other errors here
            console.error('Error:', error);
        })

}

const quantityInput = document.querySelector('[data-id="quantity"]');

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


function addToCart(id) {

    const quantity = "1";

    const productID = id;

    let cartData = { productID, quantity };

    console.log(cartData)

    fetch('http://localhost:2500/user/addToCart', {

        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartData)
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

            // alert('Failed to add to cart  due to local / network issues' + error);


            // Handle network or other errors here
            console.error('Error:', error);
        });



}


