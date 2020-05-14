
function getLocation() {
	if (navigator.geolocation) {
	  navigator.geolocation.watchPosition(showPosition);
	} else { 
	   console.log("Geolocation is not supported by this browser.");
	}
  }
  getLocation();

  function showPosition(position) {
	document.getElementById('yourLocation').value= position.coords.latitude+ ',' + position.coords.longitude;
  }




function select() {
	document.querySelector('#profile').click();
}

function displayProfile(e) {
	if (e.files[0]) {
		if (fileExtValidate(e.files[0].name)) {
			if (fileSizeValidate(e.files[0])) {
				var reader = new FileReader();

				reader.onload = function (e) {
					document.querySelector('#pictureProfile').setAttribute('src', e.target.result);
				}
				reader.readAsDataURL(e.files[0]);
			}
		}
	}
}

//other pictures


function triggerClick() {
	document.querySelector('#picturesSelect').click();
}


function displayImage(e) {
	if (e.files[0]) {
		if (fileExtValidate(e.files[0].name)) {
			if (fileSizeValidate(e.files[0])) {
				var reader = new FileReader();

				reader.onload = function (e) {
					document.querySelector('#picture').setAttribute('src', e.target.result);
				}
				reader.readAsDataURL(e.files[0]);
			}
		}
	}
}

// function for  validate file extension
var validExt = ".png, .jpeg,.jpg";
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
var maxSize = '10';
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



//remove picture

function deletePic(picture)
{
	axios.post(window.location.origin+'/users/deletePicture',{picture},{headers: {'Content-Type': 'application/json'}})
    .then(function(response){

		if(response.status == 200)
		{
			$('#deletePicture').modal('hide');
			location.reload();
		}

    })
    .catch(function(error){
        console.log(error.response.status)
        console.log(error)
    })
}

// confirm delete picture
$(document).on("click", ".open-deletePicture", function () {
	var myPictureId = $(this).data('id');
	$(".modal-footer #pictureId").val( myPictureId );
});