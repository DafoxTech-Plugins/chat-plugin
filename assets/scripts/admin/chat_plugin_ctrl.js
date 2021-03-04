(function () {
  'use strict';
  $(document).on('keypress', 'textarea', function (e) {
    if(e.which == 13 && !e.shiftKey) {
      e.preventDefault();
      $(this).closest("form").submit()
    }
  });

  var chat_plugin = `<div id='chat-plugin' ng-controller='ChatPluginCtrl'>
      <a href='javascript:void(0)' ng-click='toggleContacts()' class="main-icon fa {{showContacts ? 'fa-close' : 'fa-envelope-o'}}">
        <span class='fa fa-asterisk' ng-show='has_unread'></span>
      </a>
      <contacts ng-show="showContacts"></contacts>
      <chats ng-if="!!active_contact" contact="active_contact"></chats>
    </div>`

  if($('#chat-plugin').length <= 0)
    $('body').append(chat_plugin)

  var App = angular.module('Plugins')
  App.controller('ChatPluginCtrl', function($scope, toastr, CatchHttpError, $timeout) {
    $scope.toggleContacts = function(){
      $scope.showContacts = !$scope.showContacts
    }

    $scope.focusChat = function(contact){
      $scope.active_contact = contact
      $(".device-"+contact.id+" .unread-indicator").hide()
    }

    $scope.closeChat = function(){
      $scope.active_contact = null
    }
  });

  function renderChatButtons(){
    var list = $("all-devices table tbody tr")
    if(!list.length) return
    var contactScope = angular.element(".contacts-bar").scope()

    $.get("/chat-plugin/unread-device-ids").then(function(data){
      for(var i=0; i<list.length; i++){
        let tr = $(list[i])
        let td = tr.children().last()
        if(!td.children(".init-chat").length){
          let scope = angular.element(tr).scope()
          let device = scope.c
          let chatBtn = '<button class="btn btn-info btn-xs init-chat device-'+device.id+'" title="Chat"><i class="fa fa-envelope-o"></i>'
          let hasUnread = data.includes(device.id)
          chatBtn += '<i class="unread-indicator" style="display:'+(hasUnread?'inline':'none')+';position:absolute;color:red;font-size:30px;margin-top:-14px;">*</i>';
          
          chatBtn += '</button>';
          chatBtn = $(chatBtn);

          td.append(chatBtn)
          chatBtn.on("click", function(){
            $(this).children(".unread-indicator").hide()
            var _device = contactScope.devices.find(function(d){
              return d.id == device.id
            })

            if(!_device) _device = device

            contactScope.focusChat(_device)
          })
        }
      }
    })
  }

  var MainApp = angular.module("adopisoft")
  MainApp.config(function ($httpProvider) {
    $httpProvider.interceptors.push("clientsLoadFilter");
  })
  .factory("clientsLoadFilter", function($q, $rootScope){
    var service = {
      request: function(d){
        return d
      },
      response: function(d) {
        var url = ((d||{}).config||{}).url || ""
        if(!d.data) return d
        if(!url.includes('/settings/clients')) return d;

        setTimeout(function(){
          renderChatButtons()
        })
        return d;
      },
      responseError: function(rejection) {
        return $q.reject(rejection);
      }
    };
    return service;

  });

  

})();
