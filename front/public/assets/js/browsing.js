
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





  

  





  