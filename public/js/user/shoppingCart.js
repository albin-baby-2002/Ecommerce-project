function removeFromCart(id) {
    const cartItemID = id;

    const dataForDeletion = { cartItemID };

    fetch('http://localhost:2500/user/cart', {

        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(dataForDeletion),
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
};

function addToCart(id, cartItemID) {

    const quantity = "1";

    const productID = id;

    let cartData = { productID, quantity };

    const addButton = document.querySelector(`[addBtn-id="${cartItemID}"]`);

    addButton.disabled = true;

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

                console.log('success');

                const quantityDiv = document.querySelector(`[quantity-id="${cartItemID}"]`);

                const quantity = Number(quantityDiv.textContent);

                quantityDiv.textContent = (quantity + 1);

                if (quantity === 1) {

                    const reduceButton = document.querySelector(`[reduceBtn-id="${cartItemID}"]`);

                    reduceButton.disabled = false;

                }


                fetch('http://localhost:2500/user/cartTotal', {

                    method: 'GET'

                })
                    .then(response => response.json())
                    .then(data => {

                        if (data.success) {

                            const gt = document.getElementById('grandTotal');

                            gt.innerText = data.message;



                        } else {

                            location.reload();

                        }
                    })
                    .catch(error => {

                        location.reload()

                    });





                window.alert(data.message);

                addButton.disabled = false;

            } else {

                const errorMessage = data.message;
                alert(`Error: ${errorMessage}`);

                addButton.disabled = false;
            }
        })
        .catch(error => {

            alert('Failed to add to cart  due to local / network issues' + error);


            // Handle network or other errors here
            console.error('Error:', error);

            addButton.disabled = false;
        });



}


function reduceOneFromCart(id) {


    const cartItemID = id;

    let cartData = { cartItemID };

    const reduceButton = document.querySelector(`[reduceBtn-id="${cartItemID}"]`)

    reduceButton.disabled = true;

    console.log(cartData)

    fetch('http://localhost:2500/user/cart', {

        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartData)
    })
        .then(response => response.json())
        .then(data => {

            if (data.success) {

                console.log('success');

                const quantityDiv = document.querySelector(`[quantity-id="${cartItemID}"]`);

                const quantity = Number(quantityDiv.textContent);

                quantityDiv.textContent = (quantity - 1);

                fetch('http://localhost:2500/user/cartTotal', {

                    method: 'GET'

                })
                    .then(response => response.json())
                    .then(data => {

                        if (data.success) {

                            const gt = document.getElementById('grandTotal');

                            gt.innerText = data.message;



                        } else {

                            location.reload();

                        }
                    })
                    .catch(error => {

                        location.reload()

                    });


                if (quantity === 2) {
                    window.alert(data.message);
                    return;

                }

                window.alert(data.message);

                reduceButton.disabled = false;

            } else {

                const errorMessage = data.message;
                alert(`Error: ${errorMessage}`);

                reduceButton.disabled = false;
            }
        })
        .catch(error => {

            alert('Failed to add to cart  due to local / network issues' + error);


            // Handle network or other errors here
            console.error('Error:', error);

            reduceButton.disabled = false;
        });



}




