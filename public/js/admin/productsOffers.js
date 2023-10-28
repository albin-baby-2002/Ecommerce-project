


const btn = document.getElementById('btnForSubmit');

btn.addEventListener('click', function (event) {

    event.preventDefault();



    const productID = document.getElementById("productID").value.trim();

    console.log(typeof productID)


    const rateOfDiscount = document.getElementById('rateOfDiscount').value.trim();

    const formDataJSON = { rateOfDiscount };

    console.log(JSON.stringify(formDataJSON));





    fetch('http://localhost:2500/admin/productsOffers/' + productID, {

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
                }, 2000)

            }
        })
        .catch(error => {


            // Handle network or other errors here
            console.error('Error:', error);
        });
});
