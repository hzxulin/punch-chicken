const app = getApp()

const CONFIG = require('../../config')
const bmap = require('../../libs/bmap-wx.min.js')
const util = require('../../utils/util.js')
const authErr = require('../../utils/authErr.js')

const systemInfo = wx.getSystemInfoSync()
const titleBarHeight = /ios/i.test(systemInfo.system) ? 42 : 48

Page({
  data: {
    openid: '',
    longitude: '',
    latitude: '',
    location: [],
    markers: [],
    delay: 0,
    navBarHeight: systemInfo.statusBarHeight + titleBarHeight + 10,
    backBtnVisible: false,
  },
  gotorank() {
    wx.navigateTo({
      url: `../rank/index`
    })
  },
  markertap(_marker) {
    let _cur = {}
    this.data.markers.forEach(_v => {
      if (_v.id == _marker.markerId) {
        _cur = _v
      }
    })
    wx.showModal({
      title: `${util.formatDateTime(_cur.date)}`,
      content: `打卡地点: ${_cur.address}`,
      showCancel: false,
      success: (res) => {
        //
      }
    })
  },
  backtap() {
    const map = wx.createMapContext('map')
    map.moveToLocation({
      longitude: this.data.longitude,
      latitude: this.data.latitude,
    })
  },
  regionchange(e) {
    if (e.type == 'end') {
      const map = wx.createMapContext('map')
      map.getRegion({
        success: (res) => {
          const leftLon = res.southwest.longitude
          const rightLon = res.northeast.longitude
          const bottomLat = res.southwest.latitude
          const topLat = res.northeast.latitude

          const centerLon = this.data.longitude
          const centerLat = this.data.latitude

          if (leftLon < centerLon && rightLon > centerLon && bottomLat < centerLat && topLat > centerLat) {
            this.setData({
              backBtnVisible: false
            })
          } else {
            this.setData({
              backBtnVisible: true
            })
          }
        }
      })
    }
  },
  loadData() {
    wx.cloud.callFunction({
      name: 'queryMapByQuery',
      data: {
        query: {},
      },
    }).then(res => {
      if (Array.isArray(res.result.data) && res.result.data.length) {
        let _markers = res.result.data.map(_v => {
          let markerConfig = Object.assign({}, CONFIG.MAEKERS_CONFIG)
          if (_v._openid == app.globalData.openid) {
            //
          } else {
            markerConfig.iconPath = markerConfig.iconPathOther
          }
          return Object.assign(_v, markerConfig, {
            id: _v._id,
            openid: _v.openid,
          })
        })
        this.setData({
          location: res.result.data,
          markers: _markers,
        })
      } else {
        //
      }
    }).catch((err) => {
      //
    })
  },
  getCurLocation() {
    setTimeout(() => {
      this.BMAP = new bmap.BMapWX({
        ak: CONFIG.BMAP_AK,
      })
      this.BMAP.regeocoding({
        success: (data) => {
          this.setData({
            latitude: data.wxMarkerData[0].latitude,
            longitude: data.wxMarkerData[0].longitude,
            address: data.wxMarkerData[0].address, //test
            loading: false,
          })
        },
        fail: () => {
          authErr.show({
            title: '位置信息授权',
            content: '位置授权暂未开启，无法完成打卡',
            page: this,
          })
        }
      })
    }, this.data.delay)
  },
  onLoad() {
    
  },
  onShow() {
    if (app.globalData.openid) {
      this.setData({
        openid: app.globalData.openid,
      })
      this.loadData()
      this.getCurLocation()
    } else {
      app.wxLoginReadyCallback = res => {
        this.setData({
          openid: res.result.openid,
        })
        this.loadData()
        this.getCurLocation()
      }
    }
  }
})