window.onload = pageLoad;

function pageLoad() {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	if (urlParams.get("error") == 1) {
		if (window.location.href.split('/').pop() == "login.html") {
			document.getElementById('errordisplay').innerHTML = "Login Error!"
		} else {
			document.getElementById('errordisplay').innerHTML = "Username or password does not match.";
		}

	}
	document.getElementById('regisButton').onclick = () => {
		window.location.href = '/register.html';
	};
}