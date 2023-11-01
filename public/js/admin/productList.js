const deleteBtnS = document.querySelectorAll('.deleteButton');

deleteBtnS.forEach((btn) => {

    btn.addEventListener("click", function () {

        const data = btn.getAttribute('data-id').trim();
        const confirmed = confirm("Are you sure you want to delete?");

        if (confirmed) {

            deleteProduct(data);
        } else {

        }
    })

});


async function deleteProduct(data) {
    try {
        const response = await fetch("http://localhost:2500/admin/deleteProduct/" + data, {
            method: "delete",
            headers: {
                "Content-Type": "application/json",
            }

        });

        if (response) {

            const res = await response.json();

            console.log(res);

            if (res.success) {

                notificationMessage.hidden = false;

                messageLine.classList.add('green');

                messageLine.innerText = res.message;

                window.scrollTo(0, 0)


                setTimeout(() => {

                    notificationMessage.hidden = true;
                    messageLine.classList.remove('green');
                }, 2000)


                const row = document.querySelector(`[data-id="${data}"]`);

                row.remove();


            } else {

                notificationMessage.hidden = false;

                messageLine.classList.add('red');

                messageLine.innerText = res.message;

                window.scrollTo(0, 0)


                setTimeout(() => {

                    notificationMessage.hidden = true;
                    messageLine.classList.remove('red');
                }, 2000)

            }
        } else {

            notificationMessage.hidden = false;

            messageLine.classList.add('red');

            messageLine.innerText = "Failed to Delete ";

            window.scrollTo(0, 0)


            setTimeout(() => {

                notificationMessage.hidden = true;
                messageLine.classList.remove('red');
            }, 2000)
        }


    } catch (error) {
        window.alert("network/ local issues Failed to Delete");
        console.error(error);
    }
}