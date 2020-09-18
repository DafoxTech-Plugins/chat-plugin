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
    }

    $scope.closeChat = function(){
      $scope.active_contact = null
    }
  });
})();
