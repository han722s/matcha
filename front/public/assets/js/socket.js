var socket = io.connect()
var $chatDropdown = document.querySelector("#chat")
var $notifDropdown = document.querySelector("#notification")
var $notifCounter =  document.querySelector("#notifCounter")
var $notifLink = document.querySelector('#notifLink')

if(document.cookie){
    var username = document.cookie.split('=')[1].split('%2F')[0]
    var uuid = document.cookie.split('=')[1].split('%2F')[1]
}


function delay(t, v) {
    return new Promise(function(resolve) { 
        setTimeout(resolve.bind(null, v), t)
    });
 }

function readNotification(){
    axios.post(`http://localhost:8080/users/read`)
    .then(function(response){
      if(response.data.Code === 200)
        return delay(3000).then(function(){
            loadNotifications()
        })
    })
}
$notifLink.addEventListener('click', function(e){
    readNotification()
})


function loadNotifications(){
    axios.post(`http://localhost:8080/users/notifications`)
    .then(function(response){
    $notifDropdown.innerHTML =''
    counter = 0
    if(!response.data)
        $notifDropdown.innerHTML = "<p class=\"text-danger\">Try again later</p>"
    if(response.data.Code == 400 || response.data.Code == 404)
        $notifDropdown.innerHTML = "<p class=\"text-muted\">"+response.data.error+"</p>"
    else{
        response.data.result.forEach(function (element){
            if(element.notfication && element.date && element.time && element.isread != undefined){
                if(element.isread == true)
                        $notifDropdown.innerHTML += "<a href=\"/history\" class=\"dropdown-item \"><h6>"+element.notfication+"</h6><small class=\"light-blue-text\">on "+element.date.day+"/"+element.date.month+", "+element.time.hour+":"+element.time.minute+"</small></a>"
                else{
                        $notifDropdown.innerHTML += "<a href=\"/history\" class=\"dropdown-item rgba-green-light\"><h6 class=\"text-green\">"+element.notfication+"</h6><small class=\"text-warning\">on "+element.date.day+"/"+element.date.month+", "+element.time.hour+":"+element.time.minute+"</small></a>"
                        counter++
                }
            }
        })
        $notifCounter.innerHTML = counter
    }
    })
}

axios.post(`http://localhost:8080/users/conversations`)
.then(function(response){
    if(!response.data)
        $chatDropdown.innerHTML = "<p class=\"text-danger\">Try again later</p>"
    if(response.data.Code == 400 || response.data.Code == 404)
        $chatDropdown.innerHTML = "<p class=\"text-muted\">"+response.data.error+"</p>"
    else{
          response.data.result.forEach(function(element){
              if(element.username && element.time && element.date)
                 $chatDropdown.innerHTML += "<a class=\"dropdown-item\" href=\"/users/chat/"+element.username+"\" ><h6>"+element.username+"</h6>\
                                    <small class=\"text-warning\">on "+element.date.day+"/"+element.date.month+", "+element.time.hour+":"+element.time.minute+"</small>\
                                    </a>"
            })
    }
})

loadNotifications()

socket.on('incomingMessage', (data) => {
      if( username === data.receiver){
        loadNotifications()
      }
  })

socket.on('viewed', (data)=> {
    if(username === data.username){
        loadNotifications()
      }
})

socket.on('interact', (data)=> {
    if(uuid === data.uuid){
        loadNotifications()
      }
})


