
const form = document.getElementById('addCategoryForm');

form.addEventListener('submit', function (event) {

    event.preventDefault();

    const formData = new FormData(form);


    const formDataJSON = {};

    formData.forEach((value, key) => {
        formDataJSON[key] = value;
    });



    fetch('http://localhost:2500/admin/addCategory', {

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
});
