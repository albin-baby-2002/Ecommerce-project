let minutes;
let seconds;

const resendButton = document.querySelector('[data-id="resendOtpButton"]');




switch (performance.navigation.type) {
    case 0:



        console.log('Page is initially loaded');

        minutes = parseInt(localStorage.getItem('timerMinutes'), 10) === 0 ? 0 : parseInt(localStorage.getItem('timerMinutes'), 10) || 2;

        seconds = parseInt(localStorage.getItem('timerSeconds'), 10) === 0 ? 0 : parseInt(localStorage.getItem('timerSeconds'), 10) || 0;





        if ((minutes >= 0 && seconds > 0) || minutes > 0) {
            resendButton.disabled = true;
            updateTimer();
        }

        break;
    case 1:
        console.log('Page is reloaded');

        minutes = parseInt(localStorage.getItem('timerMinutes'), 10);
        seconds = parseInt(localStorage.getItem('timerSeconds'), 10);

        if ((minutes >= 0 && seconds > 0) || minutes > 0) {


            resendButton.disabled = true;

            updateTimer("update timer called from reload");

            console.log('update timer called ');


        }




        break;
    case 2:
        console.log('Page is accessed via forward/backward button');
        minutes = parseInt(localStorage.getItem('timerMinutes'), 10);
        seconds = parseInt(localStorage.getItem('timerSeconds'), 10);

        if ((minutes >= 0 && seconds > 0) || minutes > 0) {
            resendButton.disabled = true;
            updateTimer();
        }

        break;
}


const currentURL = window.location.origin;

async function resendOTP() {
    try {
        const response = await fetch(currentURL + "/user/resendOTP/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }

        });

        if (response.ok) {
            console.log(response);

            const res = await response.json();

            console.log(res);

            if (res.success) {

                minutes = 2;
                seconds = 0;

                localStorage.setItem('timerMinutes', minutes);


                localStorage.setItem('timerSeconds', seconds);


                notificationMessage.hidden = false;

                messageLine.classList.add('green');

                messageLine.innerText = 'New OTP send ';

                window.scrollTo(0, 0)


                setTimeout(() => {

                    notificationMessage.hidden = true;
                    messageLine.classList.remove('green');
                }, 3000)


                setTimeout(() => {
                    location.reload()

                }, 2000);





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
        } else {

            notificationMessage.hidden = false;

            messageLine.classList.add('red');

            messageLine.innerText = 'Failed to send otp';

            window.scrollTo(0, 0)


            setTimeout(() => {

                notificationMessage.hidden = true;
                messageLine.classList.remove('red');
            }, 3000)

        }


    } catch (error) {

        console.error(error);
    }
};





function updateTimer(val) {

    if (val) {
        console.log(val);

    }
    console.log(typeof minutes + " " + typeof seconds)


    const timer_minutes = document.getElementById('timer-minutes');
    const timer_seconds = document.getElementById('timer-seconds');

    let m = minutes.toString();
    let s = seconds.toString();

    console.log(s.length);

    timer_minutes.textContent = m.length >= 2 ? m : '0' + m;
    timer_seconds.textContent = s.length >= 2 ? s : '0' + s;

    if (minutes === 0 && seconds === 0) {

        resendButton.disabled = false;


    }
    else if (seconds === 0 && minutes >= 1) {



        seconds += 59;
        minutes--;
        localStorage.setItem('timerMinutes', minutes);
        localStorage.setItem('timerSeconds', seconds);

        setTimeout(updateTimer, 1000);

    }

    else if (seconds > 0 && minutes >= 0) {
        seconds--;
        localStorage.setItem('timerSeconds', seconds);
        setTimeout(updateTimer, 1000);
    }
}


