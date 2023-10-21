const getBtn = document.getElementById('getReport');

const getExcelBtn = document.getElementById('getExcelBtn')

const startingDateInput = document.getElementById('startingDate');
const endingDateInput = document.getElementById('endingDate');

getBtn.addEventListener('click', (e) => {

    const startingDate = startingDateInput.value;
    const endingDate = endingDateInput.value;


    console.log(startingDate, endingDate);

    url = window.location.pathname;

    window.location.href = url + `?startingDate=${startingDate}&endingDate=${endingDate}`;
});


getExcelBtn.addEventListener('click', (e) => {

    const startingDate = startingDateInput.value;
    const endingDate = endingDateInput.value;


    console.log(startingDate, endingDate);

    url = window.location.pathname;

    window.location.href = url + `/excel?startingDate=${startingDate}&endingDate=${endingDate}`;
})