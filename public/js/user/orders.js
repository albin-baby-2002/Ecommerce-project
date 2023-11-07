const cancelOrderBtns = document.querySelectorAll('.cancelOrderBtn');

cancelOrderBtns.forEach((cancelOrderBtn) => {

    cancelOrderBtn.addEventListener('click', (e) => {

        const data = cancelOrderBtn.getAttribute('order-id');

        console.log(data);

        const confirmed = confirm("Are you sure you want to cancel this order?");

        if (confirmed) {

            cancelTheOrder(data);
        }

    })
})



async function cancelTheOrder(idData) {
    const currentURL = window.location.origin;
    await fetch(currentURL + "/user/order/cancel/" + idData, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        }

    }).then(response => response.json())

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

                const row = document.querySelector(`[data-id="${idData}"]`);

                row.remove();



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
                }, 3000)
            }
        })
        .catch(error => {

            // Handle network or other errors here
            console.error('Error:', error);
        });


}

