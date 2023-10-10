
const form = document.getElementById('myForm');

form.addEventListener('submit', function (event) {

    event.preventDefault();

    const formData = new FormData(form);


    fetch('http://localhost:2500/admin/addProduct', {
        method: 'POST',

        body: formData,
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
            // Handle network or other errors here
            alert('Failed to add category data due to local / network issues');
            console.error('Error:', error);
        });
});
