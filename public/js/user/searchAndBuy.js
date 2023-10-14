const categoryRadios = document.querySelectorAll('.category-radio');
const sortSelect = document.getElementById('sortby');
const searchProduct = document.getElementById('search');
const wishListButtons = document.querySelectorAll('.wishListBtn');



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