const backendStatus = document.getElementById("backendStatus");

async function checkBackend() {

    try {

        const response = await fetch("http://127.0.0.1:8000/");

        const data = await response.json();

        if (response.ok) {

            backendStatus.textContent =
                "OK Backend connected - " + data.message;

            backendStatus.style.color = "green";

        } else {

            backendStatus.textContent =
                "Backend responded with an error.";

        }

    } catch (error) {

        backendStatus.textContent =
            "X Backend is not connected.";

        backendStatus.style.color = "red";

    }
}


checkBackend();
