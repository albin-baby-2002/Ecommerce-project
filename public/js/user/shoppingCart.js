function removeFromCart(id) {
    const cartItemID = id;

    const dataForDeletion = { cartItemID };

    const currentURL = window.location.origin;

    fetch(currentURL + '/user/cart', {

        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(dataForDeletion),
    })
        .then(response => response.json())

        .catch(error => {

            notificationMessage.hidden = false;

            messageLine.classList.add('red');

            messageLine.innerText = 'Failed to add to delete due to network/serverError';

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


                const row = document.querySelector(`[data-id="${id}"]`);

                row.remove();



                const currentURL = window.location.origin;

                fetch(currentURL + '/user/cartTotal', {

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

    const currentURL = window.location.origin;

    fetch(currentURL + '/user/addToCart', {

        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartData)
    })
        .then(response => response.json())

        .catch(error => {

            notificationMessage.hidden = false;

            messageLine.classList.add('red');

            messageLine.innerText = 'Failed to add to cart due to network/serverError';

            window.scrollTo(0, 0)


            setTimeout(() => {

                notificationMessage.hidden = true;
                messageLine.classList.remove('red');
            }, 3000)

            console.error('Error:', error);
        })



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


                const currentURL = window.location.origin;

                fetch(currentURL + '/user/cartTotal', {

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





                notificationMessage.hidden = false;

                messageLine.classList.add('green');

                messageLine.innerText = data.message;

                window.scrollTo(0, 0)


                setTimeout(() => {

                    notificationMessage.hidden = true;
                    messageLine.classList.remove('green');
                }, 3000)

                addButton.disabled = false;

            } else {


                notificationMessage.hidden = false;

                messageLine.classList.add('red');

                messageLine.innerText = data.message;

                window.scrollTo(0, 0)


                setTimeout(() => {

                    notificationMessage.hidden = true;
                    messageLine.classList.remove('red');
                }, 3000)

                addButton.disabled = false;
            }
        })
        .catch(error => {


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

    const currentURL = window.location.origin;

    fetch(currentURL + '/user/cart', {

        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartData)
    })
        .then(response => response.json())
        .catch(error => {

            notificationMessage.hidden = false;

            messageLine.classList.add('red');

            messageLine.innerText = 'Failed to add to reduce quantity due to network/serverError';

            window.scrollTo(0, 0)


            setTimeout(() => {

                notificationMessage.hidden = true;
                messageLine.classList.remove('red');
            }, 3000)

            console.error('Error:', error);
        })
        .then(data => {

            if (data.success) {

                console.log('success');

                const quantityDiv = document.querySelector(`[quantity-id="${cartItemID}"]`);

                const quantity = Number(quantityDiv.textContent);

                quantityDiv.textContent = (quantity - 1);

                const currentURL = window.location.origin;

                fetch(currentURL + '/user/cartTotal', {

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

                    notificationMessage.hidden = false;

                    messageLine.classList.add('green');

                    messageLine.innerText = data.message;

                    window.scrollTo(0, 0)


                    setTimeout(() => {

                        notificationMessage.hidden = true;
                        messageLine.classList.remove('green');
                    }, 3000)
                    return;

                }


                notificationMessage.hidden = false;

                messageLine.classList.add('green');

                messageLine.innerText = data.message;

                window.scrollTo(0, 0)


                setTimeout(() => {

                    notificationMessage.hidden = true;
                    messageLine.classList.remove('green');
                }, 3000)

                reduceButton.disabled = false;

            } else {


                notificationMessage.hidden = false;

                messageLine.classList.add('red');

                messageLine.innerText = data.message;

                window.scrollTo(0, 0)


                setTimeout(() => {

                    notificationMessage.hidden = true;
                    messageLine.classList.remove('red');
                }, 3000)

                reduceButton.disabled = false;
            }
        })
        .catch(error => {


            // Handle network or other errors here
            console.error('Error:', error);

            reduceButton.disabled = false;
        });



}




