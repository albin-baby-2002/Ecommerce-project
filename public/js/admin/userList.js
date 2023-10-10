async function block(data) {
    try {
        const response = await fetch("http://localhost:2500/admin/blockUser", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: data,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed with status: ${response.status}`);
        }

        const res = await response.json();

        console.log(data);

        const button = document.querySelector(`button[data-id="${data}"]`);


        if (button) {
            console.log(button)
            if (res.success) {
                const isBlocked = button.classList.contains("btn-outline-danger");
                button.classList.toggle("btn-outline-success", isBlocked);
                button.classList.toggle("btn-outline-danger", !isBlocked);
                button.textContent = isBlocked ? "Unblock" : "Block";
            } else {
                const isBlocked = button.classList.contains("btn-outline-danger");
                const message = isBlocked
                    ? "Failed to unblock user. Try again!"
                    : "Failed to block the user. Try again!";
                window.alert(message);
            }
        }
    } catch (error) {
        window.alert("Failed to block");
        console.error(error);
    }
}
