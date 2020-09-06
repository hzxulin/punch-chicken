const app = getApp()

const CONFIG = require('../../config')
const util = require('../../utils/util.js')

Page({
  data: {
    openid: '',
    loading: true,
    location: [],
    disableScroll: false,
    swipeOut: {},
    delBtnWidth: 160,
  },
  disableScroll() { 
    //
  },
  createColor() {
    return CONFIG.HISTORY_CONFIG.color
    // return '#' + Math.floor(0x1000000 + Math.random() * 0x1000000).toString(16).slice(1).toUpperCase()
  },
  formatDate(_date) {
    let _distance = new Date().getTime() - _date
    if (_distance < 1000 * 60) {
      return Math.floor(_distance / 1000) + '秒前'
    } else if (_distance <  1000 * 60 * 60) {
      return Math.floor(_distance / 1000 / 60) + '分钟前'
    } else {
      return util.formatDateTime(_date)
    }
  },
  renderBusy() {
    setTimeout(() => {
      wx.hideNavigationBarLoading()
      wx.stopPullDownRefresh()
    }, 100)
    this.setData({
      loading: false,
    })
  },
  loadList() {
    wx.showNavigationBarLoading()

    wx.cloud.callFunction({
      name: 'queryMapByQuery',
      data: {
        query: {
          _openid: this.data.openid,
        },
      },
    }).then(res => {
      if (Array.isArray(res.result.data) && res.result.data.length) {
        res.result.data.forEach(_v => {
          _v.bgColor = this.createColor()
          _v.formatDate = this.formatDate(_v.date)
        })
        this.setData({
          location: res.result.data.reverse(),
        })
      } else {
        //
      }
      this.renderBusy()
    }).catch(() => {
      this.renderBusy()
    })
  },
  onPullDownRefresh() {
    this.loadList()
  },
  touchS(e) {
    let {
      id
    } = e.currentTarget.dataset
    let {
      clientX,
      clientY
    } = e.touches[0]
    let {
      swipeOut
    } = this.data

    if (swipeOut.id != id) {
      swipeOut.x = 0
      swipeOut.delX = 0
    }

    swipeOut = Object.assign(swipeOut, {
      id,
      touched: true,
      clientX,
      clientY
    })

    this.setData({
      swipeOut
    })
  },
  touchM(e) {
    let {
      swipeOut,
    } = this.data
    let {
      clientX,
      clientY,
    } = e.touches[0]
    let {
      x,
      touched,
      scrolling
    } = swipeOut
    let deltaX = clientX - swipeOut.clientX
    let deltaY = clientY - swipeOut.clientY

    if (scrolling === undefined) {
      scrolling = Math.abs(deltaX) < Math.abs(deltaY)
    }

    if (scrolling) {
      return
    }

    x = Math.min(x + deltaX, 60)
    let delX = Math.max(x, -280)

    swipeOut = Object.assign(swipeOut, {
      x,
      delX,
      deltaX,
      clientX,
      clientY
    })

    this.setData({
      swipeOut,
      disableScroll: true
    })
  },
  touchE (e) {
    let {
      swipeOut
    } = this.data
    let {
      x,
      deltaX,
    } = swipeOut

    x = x < (deltaX > 0 ? -140 : -80) ? -160 : 0
    let delX = x

    swipeOut = Object.assign(swipeOut, {
      x,
      touched: false,
      delX
    })

    this.setData({
      swipeOut,
      disableScroll: false
    })
  },
  delLocation(e) {
    wx.showModal({
      content: '确认删除该条数据',
      cancelColor: '#3CC51F',
      confirmColor: '#ccc',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
            icon: ''
          })
          let {
            index
          } = e.currentTarget.dataset

          let editLocation = this.data.location[index]

          wx.cloud.callFunction({
            name: 'delMapByQuery',
            data: {
              req: editLocation._id,
            },
          }).then(res => {
            this.data.location.splice(index, 1)
            this.setData({
              location: this.data.location,
            })
            wx.hideLoading()
            wx.showToast({
              title: '记录已删除',
              icon: 'success',
              duration: 2000,
            })
          }).catch(e => {
            wx.hideLoading()
            wx.showToast({
              title: '网络开小差了',
              image: '../../img/warn.png',
              duration: 2000,
            })
          })
        } else {
          //
        }
      }
    })
  },
  onLoad() {
    // this.loadList()
  },
  onShow() {
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
    wx.setNavigationBarTitle({
      title: '打卡历史',
    })
  },
})