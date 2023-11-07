async function removeFromWishList(id) {

    const productData = { productID: id };


    const currentURL = window.location.origin;

    fetch(currentURL + '/user/wishList', {

        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(productData),
    })
        .then(response => response.json())
        .catch(error => {

            notificationMessage.hidden = false;

            messageLine.classList.add('red');

            messageLine.innerText = 'Failed to remove from wish list due to network/serverError';

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
        })

}

const quantityInput = document.querySelector('[data-id="quantity"]');

function addToCart(id) {

    console.log('using this');

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


// function addToCart(id) {

//     const quantity = "1";

//     const productID = id;

//     let cartData = { productID, quantity };

//     console.log(cartData)

const currentURL = window.location.origin;

//     fetch( currentURL+'/user/addToCart', {

//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(cartData)
//     })
//         .then(response => response.json())
//         .catch(error => {

//             notificationMessage.hidden = false;

//             messageLine.classList.add('red');

//             messageLine.innerText = 'Failed to add to  cart due to network/serverError';

//             window.scrollTo(0, 0)


//             setTimeout(() => {

//                 notificationMessage.hidden = true;
//                 messageLine.classList.remove('red');
//             }, 3000)

//             console.error('Error:', error);
//         })
//         .then(data => {

//             if (data.success) {

//                 console.log('success')

//                 notificationMessage.hidden = false;

//                 messageLine.classList.add('green');

//                 messageLine.innerText = data.message;

//                 window.scrollTo(0, 0)


//                 setTimeout(() => {

//                     notificationMessage.hidden = true;
//                     messageLine.classList.remove('green');
//                 }, 3000)




//             } else {

//                 notificationMessage.hidden = false;

//                 messageLine.classList.add('red');

//                 messageLine.innerText = data.message;

//                 window.scrollTo(0, 0)


//                 setTimeout(() => {

//                     notificationMessage.hidden = true;
//                     messageLine.classList.remove('red');
//                 }, 3000)

//             }
//         })
//         .catch(error => {


//             console.error('Error:', error);
//         });



// }


