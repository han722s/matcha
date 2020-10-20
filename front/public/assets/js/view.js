//Like modal
var $likeError = document.querySelector("#likeError")
var $likeStatus = document.querySelector("#likeStatus")

//dislike modal
var $dislikeError = document.querySelector("#dislikeError")
var $dislikeStatus= document.querySelector("#dislikeStatus")

// report modal
var $reportError= document.querySelector("#reportError")
var $reportStatus = document.querySelector("#reportStatus")

//block modal
var $blockError = document.querySelector("#blockError")
var $blockStatus = document.querySelector("#blockStatus")

//unblock modal
var $unblockError = document.querySelector("#unblockError")
var $unblockStatus = document.querySelector("#unblockStatus")


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

function userBlock(uuid){
    axios.post(window.location.origin+'/users/block',{uuid},{headers: {'Content-Type': 'application/json'}})
    .then(function(response){
        if(response.status == 200){
            if(response.data.Code == 200){
                $blockError.innerHTML = ''
                $blockStatus.innerHTML = response.data.success
                return $("#block").modal()
            }
            else if(response.data.Code == 400){
                $blockStatus.innerHTML = ''
                $blockError.innerHTML = response.data.error
                return $("#block").modal()
            }
        }
    })
}

function userUnblock(uuid){
    axios.post(window.location.origin+'/users/unblock',{uuid},{headers: {'Content-Type': 'application/json'}})
    .then(function(response){
        if(response.status == 200){
            if(response.data.Code == 200){
                $unblockError.innerHTML = ''
                $unblockStatus.innerHTML = response.data.success
                return $("#unblock").modal()
            }
            else if(response.data.Code == 400){
                $unblockStatus.innerHTML = ''
                $unblockError.innerHTML = response.data.error
                return $("#unblock").modal()
            }
        }
    })
}

var $status = document.querySelector('#status')
var $user = document.querySelector("#username").innerHTML
var last = $status.innerHTML
socket.on('users', function(users){
    online = users.connectedUsers.indexOf($user)
    badge = (online === -1) ? "badge badge-danger" : "badge badge-success"
    onoff = (online === -1) ? last : "active now"
    $status.innerHTML = onoff
    $status.className = badge
  })
socket.emit('check')
  