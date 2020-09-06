const app = getApp()

const CONFIG = require('../../config')
const util = require('../../utils/util.js')

const systemInfo = wx.getSystemInfoSync()
const titleBarHeight = /ios/i.test(systemInfo.system) ? 42 : 48

Page({
  data: {
    statusHeight: systemInfo.statusBarHeight + (titleBarHeight - 24) / 2,
    navBarHeight: systemInfo.statusBarHeight + titleBarHeight + 10,
    openid: '',
    rankList: [],
    loading: true,
    myRank: false,
  },
  backhome() {
    wx.switchTab({
      url: '../world/index'
    })
  },
  onLoad() {
    wx.setNavigationBarTitle({
      title: '排行榜',
    })
    if (app.globalData.openid) {
      this.setData({
        openid: app.globalData.openid,
      })
      this.loadList()
    } else {
      app.wxLoginReadyCallback = res => {
        this.setData({
          openid: res.result.openid,
        })
        this.loadList()
      }
    }
  },
  loadList() {
    this.setData({
      loading: true,
    })
    wx.cloud.callFunction({
      name: 'queryRankByQuery',
      data: {
        query: {},
      },
    }).then(res => {
      const rankList = res.result.data
      console.log(rankList)

      rankList.forEach((item) => {
        if (item._openid == this.data.openid) {
          this.setData({
            myRank: true,
          })
          return false
        }
      })

      this.setData({
        rankList,
        loading: false,
      })
    }).catch((err) => {
      this.setData({
        loading: false,
      })
    })
  },
  onShow() {
    
  }
})