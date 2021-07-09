(function () {
	var cssFa = document.createElement("link");
	cssFa.href =
		"https://kit-pro.fontawesome.com/releases/v5.12.1/css/pro.min.css";
	cssFa.rel = "stylesheet";
	cssFa.type = "text/css";
	document.getElementsByTagName("head")[0].appendChild(cssFa);

	var cssMain = document.createElement("link");
	cssMain.href = "/css/main.css";
	cssMain.rel = "stylesheet";
	cssMain.type = "text/css";
	document.getElementById("maincss").disabled = true;
	document.getElementsByTagName("head")[0].appendChild(cssMain);
})();