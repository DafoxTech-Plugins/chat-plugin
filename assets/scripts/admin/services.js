(function () {
  'use strict';

  var App = angular.module('Plugins')

  App.service('ChatService', [
    '$http',
    'toastr',
    'CatchHttpError',
    '$q',
    function($http, toastr, CatchHttpError, $q) {

      this.getClientMessages = function (mobile_device_id, opts) {
        var query = !!opts? jQuery.param(opts) : ""
        return $http.get('/chat-plugin/chats/'+mobile_device_id+'?'+query).catch(CatchHttpError);
      }

      this.sendToClient = function(mobile_device_id, opts){
        return $http.post('/chat-plugin/chats/'+mobile_device_id, opts).catch(CatchHttpError);
      }

      this.bulkSendToClients = function(message){
        return $http.post('/chat-plugin/chats/bulk-send', { message: message }).catch(CatchHttpError);
      }

      this.deleteConversation = function(mobile_device_id){
        return $http.delete('/chat-plugin/chats/'+mobile_device_id).catch(CatchHttpError);
      }

      this.markMessagesRead = function(mobile_device_id){
        return $http.post('/chat-plugin/chats/'+mobile_device_id+'/mark-read').catch(CatchHttpError);
      }
      
      this.getSettings = function(){
        return $http.get('/chat-plugin/setting').catch(CatchHttpError)
      }
      
      this.updateSettings = function(params){
        return $http.post('/chat-plugin/setting', params).catch(CatchHttpError)
      }
    }
  ])
  .service('DevicesService', [
    '$http',
    'toastr',
    'CatchHttpError',
    '$q',
    function($http, toastr, CatchHttpError, $q) {

      this.get = function (opts) {
        var query = !!opts? jQuery.param(opts) : ""
        return $http.get('/chat-plugin/devices?'+query).catch(CatchHttpError);
      }

      this.getDeviceData = function(mobile_device_id){
        return $http.get('/chat-plugin/device/'+mobile_device_id).catch(CatchHttpError);
      }

      this.muteDevice = function(mobile_device_id){
        return $http.post('/chat-plugin/chats/'+ mobile_device_id +'/mute').catch(CatchHttpError);
      }

      this.unmuteDevice = function(mobile_device_id){
        return $http.post('/chat-plugin/chats/'+ mobile_device_id +'/unmute').catch(CatchHttpError);
      }
    }
  ]);

})();
