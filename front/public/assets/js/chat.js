var $sendButton = document.querySelector('#send')
var $status = document.querySelector('#status')
var $messageBox = document.querySelector('#messageBox')
var $messageContent = document.querySelector('#message')
var receiver = window.location.pathname.split('/')[3]

function addZero(i) {
    if (i < 10) {
      i = "0" + i;
    }
    return i;
}




axios.post(`http://localhost:8080/users/messages/`+ receiver)
.then(function (response){
  if(response.data.Code == 400){
    $messageBox.classList = "red-text"
    $sendButton.disabled = true
    $messageContent.disabled = true
    return $messageBox.innerHTML = "<p>"+response.data.error+"</p>\
                                    <img class=\"img-fluid\" src=\"/assets/images/400.png\">"
  }
  if(response.data.userinfo)
        $status.innerHTML = "<div class=\"view overlay \">\
                        <img class=\"card-img-top\" style=\"height: 100%; width: 100%;\" src=\"/assets/images/"+response.data.userinfo[0].profilepicture+"\" alt=\"Card image cap\">\
                        <a href=\""+window.location.origin+"/users/view/"+response.data.userinfo[0].uuid+"\">\
                        <div class=\"mask rgba-white-slight\"></div>\
                        </a>\
                        </div>\
                        <div class=\"card-body\">\
                        <p class=\"card-title\"><strong>"+response.data.userinfo[0].username+"</strong></p>\
                        </div>"
    if(response.data.Code === 404){
      msgdiv = document.createElement('div')
      msgdiv.classList = "text-center red-text"
      msgdiv.innerHTML = "<p>"+response.data.Message+"<p>"
      return $messageBox.appendChild(msgdiv)
    }
    if(response.data.Code === 200){
      response.data.result.reverse()
       response.data.result.forEach(function (message){
      if(message.receiver == receiver){
        msgdiv = document.createElement('div')
        msgdiv.innerHTML = "<p class=\"text-right purple-text\">"+message.body +"<br><small class=\"text-right text-muted\"> on "+message.date.day+"/"+message.date.day+" at "+message.time.hour+":"+message.time.minute +"</small></p><hr>"
        $messageBox.appendChild(msgdiv)
      }
      else{
        msgdiv = document.createElement('div')
        msgdiv.innerHTML = "<p class=\"text-left pink-text\">"+message.body +"<br><small class=\"text-muted\"> on "+message.date.day+"/"+message.date.day+" at "+message.time.hour+":"+message.time.minute +"</small></p><hr>"
        $messageBox.appendChild(msgdiv)
      }
    })
    }
})

/// checks user online status
socket.on('users', function(users){
  online = users.connectedUsers.indexOf(receiver)
  badge = (online === -1) ? "card ripe-malinka-gradient " : "card dusty-grass-gradient "
  $status.className = badge
})

socket.on('messageNotSent', function(error){
  if(error.username = username){
    errorDiv = document.createElement('div')
    errorDiv.innerHTML = "<span class=\"badge badge-danger\">"+error.message+"</span>"
    $messageBox.appendChild(errorDiv)
  }
})

socket.on('incomingMessage', (data) => {
  var today = new Date();
  var time = today.getHours() + ":" + addZero(today.getMinutes())
    if( username === data.receiver){
      msgdiv = document.createElement('div')
      msgdiv.innerHTML = "<p class=\"text-left pink-text\">"+data.message +"<br><small class=\"text-muted\">"+time+"</small></p><hr>"
      $messageBox.appendChild(msgdiv)
    }
})

$sendButton.addEventListener('click', (e) => {
    e.preventDefault()
    var today = new Date();
    var time = today.getHours() + ":" + addZero(today.getMinutes())
    data = {message: $messageContent.value, user: receiver}
    msgdiv = document.createElement('div')
    msgdiv.innerHTML = "<p class=\"text-right purple-text\">"+$messageContent.value +"<br><small class=\"text-right text-muted\">"+ time +"</small></p><hr>"
    $messageBox.appendChild(msgdiv)
    axios.post(`http://localhost:8080/users/chat`,data)
})

