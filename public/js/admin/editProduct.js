

const fileInputs = document.querySelectorAll('.addProductImg')

const cropImg = document.getElementById('cropImg');

const cropModal = document.getElementById('modal');

const cropBtn = document.getElementById('cropBtn');

let cropper;

let croppedDataUrls = {};

fileInputs.forEach((fileInput) => {


    fileInput.addEventListener('change', (e) => {



        const reader = new FileReader();

        reader.onload = (e) => {

            if (e.target.result) {

                cropImg.src = e.target.result;

                cropModal.classList.remove('d-none');

                const imgName = fileInput.getAttribute('name');

                let newCropper = new Cropper(cropImg, {

                    viewMode: 1,
                });

                window.scrollTo(0, 0)

                cropper = { [imgName]: newCropper }






            }
        }

        reader.readAsDataURL(e.target.files[0])
    })

})



cropBtn.addEventListener('click', function () {

    console.log(cropper);


    if (cropper) {

        for (const key in cropper) {

            let span = document.querySelector(`[span-id="${key}"]`);

            console.log(span);

            span.style.backgroundColor = '#4d5154';

            span.style.color = 'white'

            croppedDataUrls[key] = cropper[key].getCroppedCanvas().toDataURL('image/jpeg');

            cropper[key].destroy();

            cropper = {};


            break;


        }

        console.log(croppedDataUrls);


        cropModal.classList.toggle('d-none')


    }
});



const form = document.getElementById('myForm');

const productID = form.getAttribute('product-id');

form.addEventListener('submit', function (event) {

    event.preventDefault();

    const formData = new FormData(form);

    console.log(formData);

    for (const key in croppedDataUrls) {

        let keyVal = key;

        formData.delete(keyVal);

        const blob = dataURLtoBlob(croppedDataUrls[keyVal]);

        formData.append(keyVal, blob, 'productImg.jpg');



    }

    console.log(formData);

    const currentURL = window.location.origin;

    fetch(currentURL + '/admin/editProduct/' + productID, {
        method: 'POST',

        body: formData,
    })
        .then(response => response.json())
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
            alert('Failed to add category data due to local / network issues');
            console.error('Error:', error);
        });
});



function dataURLtoBlob(dataURL) {
    // Split the Data URL to obtain the data part
    const parts = dataURL.split(',');
    const data = parts[1];

    // Get the MIME type from the first part of the Data URL
    const mimeString = parts[0].split(':')[1].split(';')[0];

    // Convert the base64-encoded data to a Blob
    const byteString = atob(data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
}