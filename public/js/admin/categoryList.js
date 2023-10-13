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
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            }

        });

        if (response) {

            const res = await response.json();

            console.log(res);

            if (res.success) {

                window.alert("Category deleted");

                const row = document.querySelector(`[row-id="${data}"]`);

                row.remove();


            } else {
                window.alert("failed to  delete")
            }
        } else {
            window.alert("failed to  delete")
        }


    } catch (error) {
        window.alert("Failed to delete");
        console.error(error);
    }
}