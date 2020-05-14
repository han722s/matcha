// range age
$( function() {
    $( "#age-range" ).slider({
      range: true,
      min: 18,
      max: 100,
      values: [ 18, 30 ],
      slide: function( event, ui ) {
        $( "#rangeAge" ).val(ui.values[ 0 ] + "-" + ui.values[ 1 ]);
      }
    });
  } );
//range fame
  $( function() {
    $( "#fame-range" ).slider({
      range: true,
      min: 0,
      max: 5,
      values: [ 0, 5 ],
      slide: function( event, ui ) {
        $( "#rangeFame" ).val(ui.values[ 0 ] +  "-" + ui.values[ 1 ]);
      }
    });
  } );


// current location 
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


var $likeError = document.querySelector("#likeError")
var $likeStatus = document.querySelector("#likeStatus")

var $dislikeError = document.querySelector("#dislikeError")
var $dislikeStatus= document.querySelector("#dislikeStatus")

var $reportError= document.querySelector("#reportError")
var $reportStatus = document.querySelector("#reportStatus")


function userLike(uuid){
   
	axios.post(window.location.origin+'/users/like',{uuid},{headers: {'Content-Type': 'application/json'}})
    .then(function(response){
        if(response.status == 200){
            if(response.data.Code == 200){
                $likeError.innerHTML = ''
                $likeStatus.innerHTML = response.data.success
                return $("#like").modal()
            }
            else if(response.data.Code == 400){
                $likeStatus.innerHTML =''
                $likeError.innerHTML = response.data.error
                return $("#like").modal()
            }
        }
    })
}

function userReport(uuid){
    axios.post(window.location.origin+'/users/report',{uuid},{headers: {'Content-Type': 'application/json'}})
    .then(function(response){
        if(response.status == 200){
            if(response.data.Code == 200){
                $reportError.innerHTML = ''
                $reportStatus.innerHTML = response.data.success
                return $("#report").modal()
            }
            else if(response.data.Code == 400){
                $reportStatus.innerHTML = ''
                $reportError.innerHTML = response.data.error
                return $("#report").modal()
            }
        }
    })
}

function userDislike(uuid){
    axios.post(window.location.origin+'/users/dislike',{uuid},{headers: {'Content-Type': 'application/json'}})
    .then(function(response){
        if(response.status == 200){
            if(response.data.Code == 200){
                $dislikeError.innerHTML = ''
                $dislikeStatus.innerHTML = response.data.success
                return $("#dislike").modal()
            }
            else if(response.data.Code == 400){
                $dislikeStatus.innerHTML = ''
                $dislikeError.innerHTML = response.data.error
                return $("#dislike").modal()
            }
        }
    })
}