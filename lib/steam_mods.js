var events = require('events')
var ArmaSteamWorkshop = require('arma-steam-workshop')

var DUMMY_PROGRESS = 50

var SteamMods = function (config) {
  this.config = config
  this.armaSteamWorkshop = new ArmaSteamWorkshop(this.config.steam)
  this.mods = []
}

SteamMods.prototype = new events.EventEmitter()

SteamMods.prototype.delete = function (mod, cb) {
  var self = this
  this.armaSteamWorkshop.deleteMod(mod, function (err) {
    if (!err) {
      self.updateMods()
    }

    if (cb) {
      cb(err)
    }
  })
}

SteamMods.prototype.find = function (id) {
  return this.mods.find(function (mod) {
    return mod.id === id
  })
}

SteamMods.prototype.download = function (workshopId, cb) {
  var self = this
  this.setDownloadProgress(workshopId, DUMMY_PROGRESS)
  this.armaSteamWorkshop.downloadMod(workshopId, function (err) {
    self.setDownloadProgress(workshopId, null)
    self.updateMods()

    if (cb) {
      cb(err)
    }
  })
  this.addDummyModsForCurrentDowloads()
  self.emit('mods', this.mods)
}

SteamMods.prototype.resolveMods = function (mods, cb) {
  cb(null, mods)
}

SteamMods.prototype.search = function (query, cb) {
  this.armaSteamWorkshop.search(query, cb)
}

SteamMods.prototype.updateMods = function () {
  var self = this
  this.armaSteamWorkshop.mods(function (err, mods) {
    if (!err) {
      mods.forEach(function (mod) {
        mod.outdated = false
        mod.playWithSix = null
        mod.progress = self.isModDownloading(mod.id) ? DUMMY_PROGRESS : null
      })

      self.mods = mods
      self.addDummyModsForCurrentDowloads()
      self.emit('mods', mods)
    }
  })
}

SteamMods.prototype.setDownloadProgress = function (workshopId, progress) {
  this.mods.forEach(function (mod) {
    if (mod.id === workshopId) {
      mod.progress = progress
    }
  })
}

SteamMods.prototype.isModDownloading = function (workshopId) {
  return this.armaSteamWorkshop.currentDownloads.indexOf(workshopId) >= 0
}

SteamMods.prototype.addDummyModsForCurrentDowloads = function () {
  var self = this
  var newDownloads = this.armaSteamWorkshop.currentDownloads.filter(function (workshopId) {
    return !self.mods.find(function (mod) {
      return mod.id === workshopId
    })
  })

  newDownloads.forEach(function (modId) {
    self.mods.push({
      id: modId,
      name: modId,
      outdated: false,
      path: null,
      playWithSix: null,
      progress: DUMMY_PROGRESS
    })
  })
}

module.exports = SteamMods
