'use strict'
var core = require('plugin-core')
var notification = require('../store/notification')
var default_per_page = 20

exports.get = async (req, res, next) => {
  try {
    var { dbi } = core
    var { page, q, per_page } = req.query
    if (!per_page) per_page = default_per_page
    if (!page) page = 1

    var limit = parseInt(per_page)
    var offset = (page - 1) * limit
    var sequelize = dbi.Sequelize
    var { Op } = sequelize

    var search_q = q
    var where = {}
    if (search_q) {
      search_q = search_q.toLowerCase()
      where[Op.or] = [
        sequelize.where(
          sequelize.fn('lower', sequelize.col('hostname')),
          {[Op.like]: `%${search_q}%` }
        ),
        sequelize.where(
          sequelize.fn('lower', sequelize.col('mac_address')),
          {[Op.like]: `%${search_q}%` }
        ),
        sequelize.where(
          sequelize.fn('lower', sequelize.col('ip_address')),
          {[Op.like]: `%${search_q}%`}
        )
      ]
      var statuses = ['connected', 'disconnected']
      if (statuses.includes(search_q)) {
        where[Op.or].push(
          {
            status: {
              [Op.eq]: search_q
            }
          }
        )
      }
    }
    var total_count = await dbi.models.MobileDevice.scope(['default_scope']).count({where})
    var result = await dbi.models.MobileDevice.scope(['default_scope']).findAll({
      distinct: true,
      where,
      limit,
      offset,
      include: [{
        model: dbi.models.Chat,
        order: [['is_read_by_admin', 'ASC']],
        limit: 1,
        required: false
      }],
      order: [
        ['active', 'DESC']
      ]
    })
    var devices = result.map(d => {
      d = d.toJSON()
      d.has_unread = d.Chats.filter(c => !c.is_read_by_admin).length > 0
      return d
    }).sort(d => !d.has_unread)
    res.json({
      devices,
      count: devices.length,
      total_count
    })
  } catch (e) {
    next(e)
  }
}

exports.getDeviceData = async (req, res, next) => {
  try {
    var { mobile_device_id } = req.params
    var is_muted = !!(await core.dbi.models.MutedDevice.findOne({ where: { mobile_device_id } }))
    var device = await core.devices_manager.loadDevice(mobile_device_id)
    res.json(Object.assign(device.toJSON(), { is_muted }))
  } catch (e) {
    next(e)
  }
}

exports.muteDevice = async (req, res, next) => {
  try {
    var { mobile_device_id } = req.params
    var device = await core.devices_manager.loadDevice(mobile_device_id)
    await core.dbi.models.MutedDevice.create({
      machine_id: core.machine_id,
      mobile_device_id,
      muted_at: new Date()
    })
    device.emit('chat:mute')
    res.json({})
  } catch (e) {
    next(e)
  }
}

exports.unmuteDevice = async (req, res, next) => {
  try {
    var { mobile_device_id } = req.params
    var device = await core.devices_manager.loadDevice(mobile_device_id)
    await core.dbi.models.MutedDevice.destroy({
      where: { mobile_device_id }
    })
    device.emit('chat:unmute')
    res.json({})
  } catch (e) {
    next(e)
  }
}

exports.getUnreadDeviceIds = async (req, res, next) => {
  try {
    var result = await core.dbi.models.Chat.findAll({ where: {is_read_by_admin: false}, distinct: true, attributes: ['mobile_device_id'] })
    var mobile_device_ids = result.map(r => r.mobile_device_id)
    res.json(mobile_device_ids)
  } catch (e) {
    next(e)
  }
}

exports.getNotifications = async (req, res, next) => {
  try {
    var { device } = req
    await notification.subscribe(device)
    var [notif] = notification.get(device.db_instance.id) || []
    res.json(notif || {})
  } catch (e) {
    next(e)
  }
}
