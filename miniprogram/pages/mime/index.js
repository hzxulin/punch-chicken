const CONFIG = require('../../config')

const bmap = require('../../libs/bmap-wx.min.js')
const authErr = require('../../utils/authErr.js')

const systemInfo = wx.getSystemInfoSync()
const titleBarHeight = /ios/i.test(systemInfo.system) ? 42 : 48

Page({
  data: {
    weatherData: {},
    mapData: {},
    userInfo: {},
    latitude: '',
    longitude: '',
    delay: 0,
    navBarHeight: systemInfo.statusBarHeight + titleBarHeight
  },
  handleAvatar() {
    wx.navigateTo({
      url: `../avatar/index`
    })
  },
  onLoad() {
    //
  },
  onShow() {
    setTimeout(this.loadMap, this.data.delay ? 200 : 0)
  },
  loadMap() {
    let BMAP = new bmap.BMapWX({
      ak: CONFIG.BMAP_AK,
    })
    BMAP.weather({
      success: (data) => {
        let weatherData = data.currentWeather[0]
        this.setData({
          weatherData: weatherData,
        })
      },
      fail: () => {
        authErr.show({
          title: '位置信息授权',
          content: '位置授权暂未开启，无法完成打卡',
        })
      }
    })
    BMAP.regeocoding({
      success: (data) => {
        this.setData({
          latitude: data.originalData.result.location.lat,
          longitude: data.originalData.result.location.lng,
          mapData: {
            address: data.originalData.result.formatted_address,
            desc: data.originalData.result.sematic_description,
          }
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
  }
})
