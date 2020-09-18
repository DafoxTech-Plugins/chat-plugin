'use strict'
var { sessions_manager } = require("../../core")

exports.data = {}
exports.get = (device_id)=>{
  if(!exports.data[device_id]) return
  return exports.data[device_id].splice(0, 1)
}

exports.add = (device_id, notif)=>{
  exports.data[device_id] = exports.data[device_id] || []
  exports.data[device_id].push(notif)
}

exports.subscribed_devices = []
exports.subscribe = async(device)=>{
  var device_id = device.db_instance.id
  if(exports.subscribed_devices.includes(device_id)) return
  if(!(await sessions_manager.hasRunningSession(device))) return
  exports.subscribed_devices.push(device_id)

  var notified, interval;
  function disconnected(){
    clearInterval(interval)
    exports.subscribed_devices = exports.subscribed_devices.filter(i=> i != device_id )
    // exports.add(device_id, {
    //   title: "DISCONNECTED",
    //   content: "Click here to add time or data."
    // })
  }
  var sessions = await sessions_manager.getDeviceSessions(device)
  interval = setInterval(()=>{
    var s = sessions.map(i=> i.toJSON() )
    var running_session = s.find(i => i.status == 'running' )
    if(!running_session) return disconnected();

    var seconds = s.filter(i => ['subscription', 'time', 'time_or_data'].includes(i.type))
    .reduce((t, _s, i) => {
      return t + _s.remaining_time_seconds
    }, 0)

    var standalone_time = s.filter(i=> i.type == 'time').reduce((t, _s, i)=>{
      return t + _s.remaining_time_seconds
    }, 0)

    var megabytes = s.filter(i => ['time_or_data', 'data'].includes(i.type))
    .reduce((t, _s, i) => {
      return t + (_s.data_mb - _s.data_consumption_mb)
    }, 0)

    var warn = (megabytes <= 20 && megabytes >= 10 || (megabytes <= 5 && megabytes > 0))
    warn = warn || (seconds <= 300 && seconds >= 290 || (seconds <= 60 && seconds > 0))
    warn = warn && standalone_time <= 300

    if(warn){
      if (!notified){
        exports.add(device_id, {
          title: "LOW CREDITS",
          content: "You are running out of credits. Insert coin now to avoid interruption"
        })
        notified = true
      }
    }else{
      notified = false
    }

  }, 3000)
}
