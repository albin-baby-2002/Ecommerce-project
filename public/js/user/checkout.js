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




const form = document.getElementById("newAddressForm");
// const formSubmitBtn = document.getElementById("newAddressSubmitBtn");

form.addEventListener("submit", function (event) {
    event.preventDefault();

    console.log('yes from client')

    const formData = new FormData(form);

    const formDataJSON = {};

    formData.forEach((value, key) => {
        formDataJSON[key] = value;
    });




    fetch('http://localhost:2500/user/addNewAddress', {

        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(formDataJSON),
    })
        .then(response => response.json())
        .then(data => {

            if (data.success) {

                console.log('success')

                window.alert(data.message);

                location.reload();

            } else {

                const errorMessage = data.message;
                alert(`Error: ${errorMessage}`);
            }
        })
        .catch(error => {

            alert('Failed to add New Address data due to local / network issues');
            // Handle network or other errors here
            console.error('Error:', error);
        });


});


const addressRadios = document.querySelectorAll('.addressRadio');

addressRadios.forEach((radio) => {

    radio.addEventListener('click', (e) => {

        addressRadios.forEach((radio) => {

            if (radio.checked) {
                console.log(radio.value);


            }
        })

    })
})
