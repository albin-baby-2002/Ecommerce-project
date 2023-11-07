const deleteBtnS = document.querySelectorAll('.deleteButton');

deleteBtnS.forEach((btn) => {

    btn.addEventListener("click", function () {

        const data = btn.getAttribute('data-id').trim();
        const confirmed = confirm("Are you sure you want to delete?");

        if (confirmed) {

            deleteCategory(data);
        } else {

        }
    })

});






async function deleteCategory(data) {



    try {

        console.log(data);

        const response = await fetch("http://localhost:2500/admin/deleteCategory/" + data, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            }

        });

        if (response) {

            const res = await response.json();

            console.log(res);

            if (res.success) {

                console.log('success')

                notificationMessage.hidden = false;

                messageLine.classList.add('green');

                messageLine.innerText = res.message;

                window.scrollTo(0, 0)


                setTimeout(() => {

                    notificationMessage.hidden = true;
                    messageLine.classList.remove('green');
                }, 2000)



                const row = document.querySelector(`[row-id="${data}"]`);

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

            messageLine.innerText = "failed to delete"

            window.scrollTo(0, 0)


            setTimeout(() => {

                notificationMessage.hidden = true;
                messageLine.classList.remove('red');
            }, 2000)

        }


    } catch (error) {


        notificationMessage.hidden = false;

        messageLine.classList.add('red');

        messageLine.innerText = "Network / local issues deleting category"

        window.scrollTo(0, 0)


        setTimeout(() => {

            notificationMessage.hidden = true;
            messageLine.classList.remove('red');
        }, 2000)

        console.error(error);
    }
}