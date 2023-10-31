
const fileInput = document.getElementById('imageInput');

const cropImg = document.getElementById('cropImg');

const cropModal = document.getElementById('modal');

const cropBtn = document.getElementById('cropBtn');

let cropper;

let croppedDataUrl

fileInput.addEventListener('change', (e) => {



    const reader = new FileReader();

    reader.onload = (e) => {

        if (e.target.result) {

            cropImg.src = e.target.result;

            cropModal.classList.remove('d-none');

            cropper = new Cropper(cropImg, {
                aspectRatio: 1,
                viewMode: 1,
            });




        }
    }

    reader.readAsDataURL(e.target.files[0])
})


cropBtn.addEventListener('click', function () {
    if (cropper) {
        // Get the cropped Blob
        croppedDataUrl = cropper.getCroppedCanvas().toDataURL('image/jpeg');


        console.log('yes');

        cropModal.classList.toggle('d-none')


    }
});



const form = document.getElementById("editProfileForm");


form.addEventListener("submit", function (event) {
    event.preventDefault();



    // Convert the data URL to a Blob


    console.log('yes from client');

    let cropper = croppedDataUrl;



    const blob = dataURLtoBlob(cropper);



    const formData = new FormData(form);

    console.log(formData)

    formData.delete('profileImg');

    formData.append('profileImg', blob, 'cropped.jpg');



    console.log(formData)


    fetch('http://localhost:2500/user/profile/edit', {

        method: 'POST',


        body: formData
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
                }, 3000)
            }
        })
        .catch(error => {

            // Handle network or other errors here
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