var chats_api_url = "/chat-plugin/portal/chats";
var send_api_url = "/chat-plugin/portal/chat";
var device_api_url = "/client/device";
var settings_api_url = "/chat-plugin/setting";
var apk_download_prompt = "We have an Android App for you to conveniently open the captive portal and to receive notifications. Click the download button below to install it. Disregard this message if you already installed it.";
var apk_link = "/public/plugins/chat-plugin/assets/captive-portal.apk";
var mark_read_api_url = "/chat-plugin/portal/mark-read"
var chatBoxOpened = false
var device
var os;
var hide_portal_button = false;

function httpGet(url, cb){
  var xmlhttp
  if (window.XMLHttpRequest)
  {// code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
  }
  else
  {// code for IE6, IE5
    xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
  }
  xmlhttp.onreadystatechange=function()
  {
    if (xmlhttp.readyState==4 && xmlhttp.status==200)
    {
      if(cb) cb(xmlhttp.responseText);
    }
  }
  xmlhttp.open("GET", url, true );
  xmlhttp.send();
}

function httpPost(url, params, cb){
  var xmlhttp
  if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
  } else {// code for IE6, IE5
    xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
  }
  xmlhttp.onload = function() {
    var data = xmlhttp.responseText
    try{
      data = JSON.parse(xmlhttp.responseText);
    }catch(e){}

    if(cb) cb(data);
  }
  xmlhttp.open("POST", url, true );
  xmlhttp.setRequestHeader('Content-Type', 'application/json');
  xmlhttp.send(JSON.stringify(params||{}));
}

function disconnected(){
  if(document.querySelector("li#disconnected")) return;
  var ul = document.querySelector(".conversation ul.list")
  var li = document.createElement('li')
  li.id = 'disconnected'
  li.style.textAlign = 'center';
  li.style.padding = "20px";
  li.innerHTML = "<a href='javascript:window.location.reload()'>Something went wrong? Click here to reload the page</a>";
  ul.append(li)
  scrollToBottom()
}

function reconnected(){
  var el = document.querySelector('li#disconnected')
  if(el)
    el.remove();
}

function hasUnread(){
  var el = document.querySelector(".unread-indicator")
  el.style.display = "";
}
function hasRead(){
  var el = document.querySelector(".unread-indicator")
  el.style.display = "none";
  return httpGet(mark_read_api_url)
}

function initChatBox(){
  var el = document.querySelector('.chat-box')
  if(!el) return
  var width = Math.min(450, window.innerWidth-20)
  var height = Math.min(650, window.innerHeight-20)
  el.style.width = width+"px"
  el.style.height = height+"px"

  var textarea = document.querySelector(".chat-plugin .send-msg-con textarea")
  var twidth = width - 58
  textarea.style.width = twidth+'px'
  textarea.style.maxWidth = twidth+'px'
  textarea.style.minWidth = twidth+'px'
}

function resizeConversationCon(){
  document.querySelector(".chat-plugin .conversation").style.height = "100%"
  var conv_con = document.querySelector(".chat-plugin .conversation")
  var send_msg_con = document.querySelector(".chat-plugin .send-msg-con")
  conv_con.style.height = (conv_con.offsetHeight - (send_msg_con.offsetHeight + 4))+"px"
}

var audio_url = "/plugins/chat-plugin/assets/sounds/msg.mp3";
var audio = new Howl({
  src: [audio_url],
  loop: false,
  buffer: false,
  preload: true
})

function openChatBox(){
  if(!audio)
    audio = new Howl({
      src: [audio_url],
      loop: false,
      buffer: false,
      preload: true
    })
  var icon = document.querySelector('.main-icon')
  icon.style.display = 'none'
  var el = document.querySelector('.chat-box')
  el.style.display = ''
  resizeConversationCon()
  scrollToBottom()
  chatBoxOpened = true
  hasRead()
  
  var msgr = document.getElementById("wh-widget-send-button")
  if(msgr)
    msgr.style.display = "none";
}

function closeChatBox(){
  var icon = document.querySelector('.main-icon')
  icon.style.display = ''
  animateIcon()
  var el = document.querySelector('.chat-box')
  el.style.display = 'none'
  chatBoxOpened = false
  
  var msgr = document.getElementById("wh-widget-send-button")
  if(msgr)
    msgr.style.display = "";
}

function notify(msg) {
  if(typeof(AndroidFunction) != 'undefined' && AndroidFunction.showNotification){
    AndroidFunction.showNotification(msg)
  }

  if (!window.Notification) {
    return false
  }
  else if (Notification.permission === "granted") {
    var notification = new Notification(msg);
  }
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(function (permission) {
      if (permission === "granted") {
        var notification = new Notification(msg);
      }
    });
  }
}

function animateIcon(with_sound){
  var icon = document.querySelector('.main-icon i.fa')
  var max = 60
  var i = 1
  var interval = setInterval(function(){
    i += 1
    icon.style['font-size'] = i+"px"
    if(i >= max)
      clearInterval(interval);
  }, 3)

  if(with_sound){
    if(audio)
      audio.play();
  }
}

function formatDate(date){
  var date = new Date(date)
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var ampm_str = hours + ':' + minutes + ampm;

  var mm_dd_yy = [
    date.getMonth()+1,
    date.getDate(),
    date.getFullYear()].join('/')

  return mm_dd_yy + ' ' + ampm_str;
}

function capitalize(name){
  return name.substr(0, 1).toUpperCase() + name.substr(1, name.length)
}

function scrollToBottom(el){
  if(!el)
    el = document.querySelector('.conversation');
  el.scrollTop = el.scrollHeight
}

function formatChat(chat){
  var li = document.createElement('li')
  li.id = 'message-'+chat.id
  var innerHTML = '<div class="message '+ (chat.sender_id == device.id ? 'sent' : 'received') + '">'
  innerHTML = innerHTML + '<strong class="sender">'+ (capitalize(chat.sender_id == device.id ? ('You (' + (device.hostname || device.mac_address) +')') : chat.admin_username)) + '</strong><br/>'
  innerHTML = innerHTML + '<pre class="text">'+ chat.message.trim() + '</pre>'
  innerHTML = innerHTML + '<small class="time">' + formatDate(chat.created_at) + '</small></div>'
  li.innerHTML = innerHTML
  return li
}

function formatLoadMore(){
  var li = document.createElement('li')
  li.innerHTML = '<li><a class="message load-more" style="border-radius: 5px; display: inline-block; width: 100%; text-align: center;" onclick="loadMore(this)"><span class="text">Load more ...</span></a></li>'
  return li
}

function mute(){
  var input = document.querySelector('#chat_message')
  input.title = "Muted"
  input.disabled = true
}

function unmute(){
  var input = document.querySelector('#chat_message')
  input.title = ""
  input.disabled = false
}

function initSettings(cb){
  httpGet(settings_api_url, function(data){
    data = JSON.parse(data);
    if(data.apk_download_prompt)
      apk_download_prompt = data.apk_download_prompt;
    if(data.apk_link)
      apk_link = data.apk_link;
    hide_portal_button = data.hide_portal_button;
    if(cb) cb(data);
  })
}

var chats = []
function initChats(){
  var socket = Socket.getInstance()
  if(socket.disconnected)
    disconnected();

  socket.on('connection', function(){
    reconnected()
  });

  socket.on('disconnect', function(){
    disconnected()
  });

  socket.on('chat:mute', function(){
    mute()
    reconnected()
  });

  socket.on('chat:unmute', function(){
    unmute()
    reconnected()
  });

  httpGet(device_api_url, function(device_data){
    device = JSON.parse(device_data)
    httpGet(chats_api_url, function(data){
      var ul = document.querySelector(".conversation ul.list")
      data = JSON.parse(data)
      chats = data.chats
      os = data.os
      if(data.is_muted) mute()
      ul.innerHTML = "";
      for(var i = 0; i < chats.length; i++){
        var chat = chats[i];
        ul.prepend( formatChat(chat) )
      }
      if(chats.length < data.total_count){
        ul.prepend( formatLoadMore() )
      }
      socket.on('chat', function(chat){
        var li = formatChat(chat)
        li.querySelector(".message").style.border = "3px solid #5cb85b";
        li.classList.add('new-message')
        ul.append( li )
        setTimeout(function(){
          li.querySelector(".message").style.border = "";
        }, 1000)
        setTimeout(function(){
          li.classList.remove('new-message')
        }, 3000)
        setTimeout(function(){
          scrollToBottom()
        })

        animateIcon( chat.sender_id != device.id )
        setTimeout(function(){
          animateIcon()
        })

        if(chat.sender_id != device.id){
          notify(capitalize(chat.admin_username)+": "+chat.message);
          if(window.JSInterface){
            window.JSInterface.messageReceived(chat.admin_username, chat.message)
          }
        }

        if(!chatBoxOpened){
          hasUnread();
        }else{
          hasRead()
        }
        reconnected()
      })
      var has_unread = chats.findIndex(function(c){ return !c.is_read_by_user }) >= 0
      if(has_unread) hasUnread();
    })
  })

  // setTimeout(function(){
  //   promptAppInstallation()
  // }, 3000)
  
  setTimeout(function(){
    if(window.warning_sound && window.JSInterface){
      window.warning_sound.subscribe(function(p){
        var seconds = p.seconds || "";
        var standalone_time = p.standalone_time || "";
        var megabytes = p.megabytes || "";
        window.JSInterface.warning(seconds, standalone_time, megabytes)
      })
    }
  }, 5000)
}

var page = 1
var loading_more = false
function loadMore(el){
  if(loading_more) return
  if(el && el.remove)
    el.remove()

  page += 1
  loading_more = true
  httpGet(chats_api_url+'?page='+page+"&ref="+(Math.random()), function(data){
    loading_more = false
    data = JSON.parse(data)
    var _chats = data.chats
    if(!_chats || _chats.length <= 0) return
    chats = _chats.concat(chats)
    var ul = document.querySelector(".conversation ul.list")

    for(var i = 0; i < _chats.length; i++){
      var chat = _chats[i]
      ul.prepend( formatChat(chat) )
    }

    if(chats.length < data.total_count){
      ul.prepend( formatLoadMore() )
    }
  })
}

function sendMessage(e){
  e.preventDefault()
  var input = document.querySelector('#chat_message')
  var msg = input.value
  input.value = ""
  if(!msg) return
  httpPost(send_api_url, { message: msg}, function(res){})
  setTimeout(function(){
    if(!document.querySelector('.new-message')){
      disconnected()
    }
  }, 3000)
  return false
}

function promptAppInstallation(){
  if(os != 'android' || window.location.search == '?ad') return
  var ul = document.querySelector(".conversation ul.list")
  var li = document.createElement('li')
  li.id = 'message-0'
  var innerHTML = '<div class="message received">'
  innerHTML = innerHTML + '<strong class="sender">Admin</strong><br/>'
  innerHTML = innerHTML + '<pre class="text" style="padding-bottom: 0;margin-bottom: 0;">'+apk_download_prompt+'</pre>'
  innerHTML = innerHTML + '<p style=" text-align: center; "><a style=" background: #209e91!important; color: white !important; padding: 10px; border-radius: 10px; display: inline-block; width: 210px; text-align: center; margin:10px;" href="'+apk_link+'?ref='+Math.random()+'">Download App</a></p>';
  innerHTML = innerHTML + '<small class="time">' + formatDate(new Date()) + '</small></div>'
  li.innerHTML = innerHTML
  ul.append( li )
  hasUnread();
  animateIcon(true);
}

(function () {
  'use strict';
  setTimeout(function(){
    if(!document.getElementById('chat-plugin')){
      var chat_plugin = document.createElement('div')
      chat_plugin.id = "chat-plugin"
      httpGet("/public/plugins/chat-plugin/views/portal/chat.html?ref="+(new Date()).getMonth(), function(html){
        chat_plugin.innerHTML = html
        var body = document.querySelector("body")
        body.append(chat_plugin)
      })
    }
  }, 1000)

  var i = setInterval(function(){
    var socket = Socket.getInstance()
    if(document.querySelector('.chat-box') && socket){
      initSettings(function(){
        if(hide_portal_button){
          document.getElementById('chat-plugin').style.display = 'none';
          return false;
        }
        initChatBox()
        initChats()
        animateIcon()
      })
      clearInterval(i)
    }
  }, 2000)

  window.addEventListener("resize", function(){
    initChatBox()
    if(chatBoxOpened){
      resizeConversationCon()
      scrollToBottom( document.querySelector('.conversation') )
    }
  });

})();
