'use strict'

var core = require('../core')
var { router, middlewares } = core
var devices_ctrl = require('./controllers/devices_ctrl')
var chats_ctrl = require('./controllers/chats_ctrl')
var { express, bodyParser, fileUpload, ipv4, device_reg } = middlewares

router.get('/chat-plugin/setting', chats_ctrl.getSettings)
router.post('/chat-plugin/setting',
  express.urlencoded({ extended: true }),
  bodyParser.json(),
  core.middlewares.auth,
  chats_ctrl.updateSettings
)

router.post('/chat-plugin/upload-apk',
  express.urlencoded({ extended: true }),
  bodyParser.json(),
  core.middlewares.auth,
  fileUpload(),
  chats_ctrl.uploadApk
)

router.get('/chat-plugin/devices', core.middlewares.auth, devices_ctrl.get)
router.get('/chat-plugin/device/:mobile_device_id', devices_ctrl.getDeviceData)
router.post('/chat-plugin/chats/:mobile_device_id/mute',
  express.urlencoded({ extended: true }),
  bodyParser.json(),
  core.middlewares.auth,
  devices_ctrl.muteDevice
)

router.post('/chat-plugin/chats/:mobile_device_id/unmute',
  express.urlencoded({ extended: true }),
  bodyParser.json(),
  core.middlewares.auth,
  devices_ctrl.unmuteDevice
)

router.get('/chat-plugin/chats/:mobile_device_id', core.middlewares.auth, chats_ctrl.getClientMessages)
router.post('/chat-plugin/chats/bulk-send',
  express.urlencoded({ extended: true }),
  bodyParser.json(),
  core.middlewares.auth,
  chats_ctrl.bulkSendToClients
)

router.post('/chat-plugin/chats/:mobile_device_id',
  express.urlencoded({ extended: true }),
  bodyParser.json(),
  core.middlewares.auth,
  chats_ctrl.sendToClient
)

router.post('/chat-plugin/chats/:mobile_device_id/mark-read',
  express.urlencoded({ extended: true }),
  bodyParser.json(),
  core.middlewares.auth,
  chats_ctrl.readClientMessages
)

router.delete('/chat-plugin/chats/:mobile_device_id', core.middlewares.auth, chats_ctrl.deleteConversation)

router.get('/chat-plugin/portal/chats', ipv4, device_reg, chats_ctrl.getMessages)
router.post('/chat-plugin/portal/chat',
  express.urlencoded({ extended: true }),
  bodyParser.json(),
  ipv4, device_reg,
  chats_ctrl.sendMessage
)

router.get('/chat-plugin/portal/mark-read', ipv4, device_reg, chats_ctrl.readAdminMessages)

router.get('/client/notifications', devices_ctrl.getNotifications)

module.exports = router
