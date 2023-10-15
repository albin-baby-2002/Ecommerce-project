const categoryRadios = document.querySelectorAll('.category-radio');
const sortSelect = document.getElementById('sortby');
const searchProduct = document.getElementById('search');
const wishListButtons = document.querySelectorAll('.wishListBtn');


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


categoryRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
        const categoryID = radio.value;
        const sortValue = sortSelect.value;
        const searchValue = searchProduct.value;
        const url = `/?category=${categoryID || ''}&sortBy=${sortValue}&search=${searchValue}`;
        searchProduct.value = ''; // clear search input
        window.location.href = url;
    });
});

sortSelect.addEventListener('change', () => {
    const categoryId = new URLSearchParams(window.location.search).get('category');
    const sortValue = sortSelect.value;
    const searchValue = searchProduct.value;
    const url = `/?category=${categoryId || ''}&sortBy=${sortValue}&search=${searchValue}`;
    window.location.href = url;
});


const form = document.getElementById('searchBar');

form.addEventListener('submit', function (event) {

    event.preventDefault();

    const categoryID = new URLSearchParams(window.location.search).get('category');

    const sortValue = sortSelect.value;
    const searchValue = searchProduct.value;
    const url = `/?category=${categoryID || ''}&sortBy=${sortValue}&search=${searchValue}`;
    searchProduct.value = ''; // clear search input
    window.location.href = url;





});


wishListButtons.forEach((btn) => {
    btn.addEventListener('click', (event) => {

        event.preventDefault();

        event.stopPropagation();

        let id = btn.getAttribute('data-id');

        console.log(id);

        addToWishList(id);
    })
})


function addToWishList(id) {



    let productDetails = document.querySelector('.product__details__text');

    let productID;

    if (!id) {
        productID = productDetails.getAttribute('data-id');
    } else {
        productID = id;
    }


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
        .catch(error => {

            notificationMessage.hidden = false;

            messageLine.classList.add('red');

            messageLine.innerText = 'Failed to add to wish list due to network/serverError';

            window.scrollTo(0, 0)


            setTimeout(() => {

                notificationMessage.hidden = true;
                messageLine.classList.remove('red');
            }, 7000)

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
                }, 7000)

            } else {


                notificationMessage.hidden = false;

                messageLine.classList.add('red');

                messageLine.innerText = data.message;

                window.scrollTo(0, 0)


                setTimeout(() => {

                    notificationMessage.hidden = true;
                    messageLine.classList.remove('red');
                }, 7000)

            }
        })

        .catch((err) => {
            console.log(err);
        })





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

        .catch(error => {

            notificationMessage.hidden = false;

            messageLine.classList.add('red');

            messageLine.innerText = 'Failed to add to cart due to network/serverError';

            window.scrollTo(0, 0)


            setTimeout(() => {

                notificationMessage.hidden = true;
                messageLine.classList.remove('red');
            }, 7000)

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
                }, 7000)

            } else {


                notificationMessage.hidden = false;

                messageLine.classList.add('red');

                messageLine.innerText = data.message;

                window.scrollTo(0, 0)


                setTimeout(() => {

                    notificationMessage.hidden = true;
                    messageLine.classList.remove('red');
                }, 7000)
            }
        })
        .catch(error => {


            console.error('Error:', error);
        });



}