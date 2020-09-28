function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
};

(function () {
  'use strict';

  var App = angular.module('Plugins')

  App.component('contacts', {
    controller: 'ContactsCtrl',
    templateUrl: '/plugins/chat-plugin/views/admin/contacts.html'
  })
  .controller('ContactsCtrl', function($scope, DevicesService, toastr, CatchHttpError, $timeout, ChatService, $ngConfirm, Socket) {
    var socket = Socket.getSocket()
    $scope.page = 1
    $scope.loadContacts = function(opts){
      $scope.page = 1
      $scope.has_more = false
      DevicesService.get(opts).then(function(res){
        var data = res.data || {}
        $scope.devices = data.devices || []
        $scope.$parent.has_unread = _.findIndex($scope.devices, function(d){ return d.has_unread }) >= 0;
        $scope.has_more = data.devices.length > 0 && data.total_count > $scope.devices.length
      })
    }
    $scope.loadMore = function(){
      $scope.page += 1
      var opts = {page: $scope.page, q: $scope.search}
      $scope.has_more = false
      DevicesService.get(opts).then(function(res){
        var data = res.data || {}
        $scope.devices = $scope.devices.concat(data.devices)
        $scope.devices = _.uniq($scope.devices, function(d){
          return d.id
        })
        $scope.has_more = data.devices.length > 0 && data.total_count > $scope.devices.length
      })
    }

    $scope.loadContacts({page: $scope.page})
    $scope.searchContacts = function(){
      $scope.loadContacts({page: $scope.page, q: $scope.search})
    }

    $scope.focusChat = function(contact){
      $scope.$parent.focusChat(contact);
      ChatService.markMessagesRead(contact.id).then(function(){
        contact.has_unread = false;
        $scope.$parent.has_unread = _.findIndex($scope.devices, function(d){ return d.has_unread }) >= 0
      })
    }

    $scope.messageAll = function(e){
      e.preventDefault()
      $ngConfirm({
        title: 'Confirm',
        content: 'Are you sure you want to send this message to all your online customers?',
        escapeKey: 'close',
        buttons: {
          ok: {
            text: 'Yes',
            btnClass: 'btn-danger',
            keys: ['enter'],
            action: function () {
              var msg = angular.copy($scope.msg_all);
              var sent = false
              $scope.sending = true
              ChatService.bulkSendToClients($scope.msg_all).then(function(res){
                sent = true
              })
              .finally(function(){
                if(!sent)
                  $scope.msg_all = msg

                $scope.sending = false
              })
              $scope.msg_all = ""
            }
          },
          close: {
            text: 'Cancel',
            keys: ['escape'],
            btnClass: 'btn-default'
          }
        }
      });
    }

    $scope.loadDevice = function(device_id){
      return DevicesService.getDeviceData(device_id).then(function(res){
        var device = res.data
        var exists = _.findIndex($scope.devices, function(d){
          return d.id == device_id
        }) >= 0
        if(!exists){
          $scope.devices.unshift(device)
        }

        return device
      })
    }

    var audio = new Audio();
    audio.src = "/plugins/chat-plugin/assets/sounds/msg2.mp3";
    audio.load();
    socket.on('chat', function(chat){
      if(!isNaN(chat.sender_id)){
        var dIndex = _.findIndex($scope.devices, function(d){ return d.id == chat.sender_id })
        if(dIndex >= 0){
          var device = $scope.devices[dIndex]
          device.has_unread = true;
          $scope.devices = array_move($scope.devices, dIndex, 0)
        }else{
          $scope.loadDevice(chat.sender_id).then(function(d){
            d.has_unread = true
          })
        }
        $timeout(function(){
          $scope.$parent.has_unread = _.findIndex($scope.devices, function(d){ return d.has_unread }) >= 0;
        }, 500)
        audio.play();
      }
    })
  })
})();
