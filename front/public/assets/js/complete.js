
function getLocation() {
	if (navigator.geolocation) {
	  navigator.geolocation.getCurrentPosition(showPosition);
	} else { 
	   console.log("Geolocation is not supported by this browser.");
	}
  }
  getLocation();

  function showPosition(position) {
	document.getElementById('location').value= position.coords.latitude+ ',' + position.coords.longitude;
  }

function triggerClick() {
	document.querySelector('#pictureselect').click();
}

//  var error = document.getElementById("error");
//  error.style.display = "none"; 

function displayImage(e) {
	var error = document.createElement("div");
	error.id = "error"
	error.className = "alert alert-danger"
	if (e.files[0]) {
		if (fileExtValidate(e.files[0].name)) {
			if (fileSizeValidate(e.files[0])) {
				if(document.getElementById("error") !== null)
					document.getElementById("error").remove(); 
				var reader = new FileReader();
				reader.onload = function (e) {
					document.querySelector('#profile').setAttribute('src', e.target.result);
				}
				reader.readAsDataURL(e.files[0]);
			}
			else
			{
				if(document.getElementById("error") !== null)
					document.getElementById("error").remove(); 
				var message = document.createTextNode("file size error "); 
				error.appendChild(message); 
				document.getElementById("info").appendChild(error); 			
			}
				
		}
		else
		{
			if(document.getElementById("error") !== null)
				document.getElementById("error").remove(); 
			var message = document.createTextNode("file extension error , it must be (jpg,jpeg)"); 
			error.appendChild(message); 
			document.getElementById("info").appendChild(error); 
			 

		}
			
	}
}


// function for  validate file extension
var validExt = ".jpeg,.jpg";
function fileExtValidate(fdata) {
	var filePath = fdata;
	var getFileExt = filePath.substring(filePath.lastIndexOf('.') + 1).toLowerCase();
	var pos = validExt.indexOf(getFileExt);
	if (pos < 0) {
		return false;
	} else {
		return true;
	}
}
//function for validate file size 
var maxSize = '5';
function fileSizeValidate(fdata) {
	if (fdata) {
		var fsizek = fdata.size / 1024;
		var fsizem = fsizek / 1024;
		if (fsizem >= maxSize) {
			return false;
		}
		else if (fsizek < 1.2) {
			return false;
		}
		else {
			return true;
		}
	}
}
