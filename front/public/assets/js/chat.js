var $sendButton = document.querySelector('#send')
var $status = document.querySelector('#status')
var $messageBox = document.querySelector('#messageBox')
var $messageContent = document.querySelector('#message')
var $chatRoom = document.querySelector('#chatRoom')
var receiver = window.location.pathname.split('/')[3]

function addZero(i) {
    if (i < 10) {
      i = "0" + i;
    }
    return i;
}
function scrollDown(){
  $chatRoom.scrollTo(0,  $chatRoom.scrollHeight)
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
        $status.innerHTML = "\
        <div class=\"card-body text-center white-text\">\
        <a class=\" white-text \" href=\""+window.location.origin+"/users/view/"+response.data.userinfo[0].uuid+"\">\
        <h5 class=\"card-title animated fadeInLeft\"><strong>"+response.data.userinfo[0].username+"</strong></h5>\
        </a>\
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
        msgdiv.innerHTML = "<li class=\"d-flex justify-content-between mb-4\">\
        <div class=\"mr-2 ml-0 z-depth-1\"></div>\
        <div class=\"chat-body white p-3 ml-2 z-depth-1\">\
          <div class=\"header\">\
            <small class=\"pull-right text-muted\"><i class=\"far fa-clock\"></i> on "+message.date.day+"/"+message.date.month+" at "+message.time.hour+":"+message.time.minute +"</small>\
          </div>\
          <hr class=\"w-100\">\
          <p class=\"mb-0\">\
          "+ message.body + "\
          </p>\
        </div>\
        </li>"
        $messageBox.appendChild(msgdiv)
      }
      else{
        msgdiv = document.createElement('div')
        msgdiv.innerHTML = "<li class=\"d-flex justify-content-between mb-4\">\
        <div class=\"chat-body white p-3 z-depth-1\">\
        <div class=\"header\">\
        <small class=\"pull-right text-muted\"><i class=\"far fa-clock\"></i>  on "+message.date.day+"/"+message.date.month+" at "+message.time.hour+":"+message.time.minute +"</small>\
        </div>\
        <hr class=\"w-100\">\
        <p class=\"mb-0\">\
        "+message.body +"\
        </p>\
        </div>\
        <div class=\"avatar rounded mr-0 ml-3 z-depth-1\"></div>\
        </li>"
        $messageBox.appendChild(msgdiv)
      }
    })
    scrollDown()
    }
})

/// checks user online status
socket.on('users', function(users){
  online = users.connectedUsers.indexOf(receiver)
  badge = (online === -1) ? "card ripe-malinka-gradient z-depth-0" : "card dusty-grass-gradient z-depth-0"
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
      msgdiv.innerHTML = "<li class=\"d-flex animated fadeInLeft justify-content-between mb-4\">\
      <div class=\"chat-body white p-3 z-depth-1\">\
      <div class=\"header\">\
      <small class=\"pull-right text-muted\"><i class=\"far fa-clock\"></i>"+time+"</small>\
      </div>\
      <hr class=\"w-100\">\
      <p class=\"mb-0 \">\
      "+data.message +"\
      </p>\
      </div>\
      <div class=\"avatar rounded mr-0 ml-3 z-depth-1\"></div>\
      </li>"
      $messageBox.appendChild(msgdiv)
      scrollDown()
    }
})

$sendButton.addEventListener('click', (e) => {
    e.preventDefault()
    var today = new Date();
    var time = today.getHours() + ":" + addZero(today.getMinutes())
    data = {message: $messageContent.value, user: receiver}
    msgdiv = document.createElement('div')
    msgdiv.innerHTML = "<li class=\"d-flex animated fadeInRight justify-content-between mb-4\">\
    <div class=\"mr-2 ml-0 z-depth-1\"></div>\
    <div class=\"chat-body white p-3 ml-2 z-depth-1\">\
      <div class=\"header\">\
        <small class=\"pull-right text-muted\"><i class=\"far fa-clock\"></i>"+ time +"</small>\
      </div>\
      <hr class=\"w-100\">\
      <p class=\"mb-0\">\
      "+$messageContent.value +"\
      </p>\
    </div>\
    </li>"
    $messageBox.appendChild(msgdiv)
    scrollDown()
    $messageContent.value= ''
    axios.post(`http://localhost:8080/users/chat`,data)
})

