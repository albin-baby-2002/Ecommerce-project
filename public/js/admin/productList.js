
async function deleteProduct(data) {
    try {
        const response = await fetch("http://localhost:2500/admin/deleteProduct/" + data, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            }

        });

        if (response) {

            const res = await response.json();

            console.log(res);

            if (res.success) {

                window.alert("product deleted");

                const row = document.querySelector(`[data-id="${data}"]`);

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