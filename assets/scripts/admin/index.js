(function () {
  'use strict';
  var App = angular.module('Plugins')
  .config(function($stateProvider) {
    $stateProvider
    .state('plugins.chat_plugin', {
      templateUrl : "/plugins/chat-plugin/views/admin/settings.html",
      controller: 'ChatPluginSettingsCtrl',
      url: '/chat-plugin',
      title: 'Chat Plugin',
      sidebarMeta: {
        order: 2,
      },
    });
  });
})();
