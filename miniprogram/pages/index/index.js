const app = getApp()
const CONFIG = require('../../config')

const bmap = require('../../libs/bmap-wx.min.js')
const util = require('../../utils/util.js')
const authErr = require('../../utils/authErr.js')

const systemInfo = wx.getSystemInfoSync()
const titleBarHeight = /ios/i.test(systemInfo.system) ? 42 : 48

const imgPromise = (imgSrc) => {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url: imgSrc,
      success: (res) => {
        resolve(res)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

Page({
  data: {
    openid: '',
    latitude: '',
    longitude: '',
    address: '',
    punchDate: '',
    date: '',
    punchAddress: '',
    loading: true,
    location: [],
    polyline: [],
    markers: [],
    userInfo: {},
    isShowPop: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    delay: 0,
    isShowPoster: false,
    posterSrc: '',
    posterSaveFlag: true,
    timer: null,
    timerEndFlag: false,
    navBarHeight: systemInfo.statusBarHeight + titleBarHeight + 10,
    backBtnVisible: false,
  },
  onShareAppMessage() {
    return {
      title: '打卡鸡，记录你每一个足迹👣',
    }
  },
  userInfoAuthErr() {
    authErr.show({
      title: '头像昵称信息授权',
      content: '头像昵称授权暂未开启，部分功能受限',
      page: this,
      errCb: () => {
        this.getCurLocation()
      }
    })
  },
  checkAuth() {
    wx.getSetting({
      success: res => {
        let _userInfoSetting = res.authSetting['scope.userInfo']
        if (_userInfoSetting === undefined) {
          this.setData({
            isShowPop: true,
          })
        } else if (_userInfoSetting === false) {
          this.userInfoAuthErr()
        } else {
          this.setData({
            isShowPop: false,
          })
          wx.getUserInfo({
            success: res => {
              this.setData({
                userInfo: res.userInfo,
              })
              this.saveUserInfo()
            }
          })
          this.getCurLocation()
        }
      }
    })
  },
  saveUserInfo() {
    wx.cloud.callFunction({
      name: 'saveUser',
      data: {
        req: this.data.userInfo,
      },
    }).then(res => {
      // 
    }).catch(e => {
      // 
    })
  },
  hideWelcome() {
    this.setData({
      isShowPop: false,
    })
  },
  getUserInfo(e) {
    let userInfo = e.detail.userInfo

    if (userInfo) {
      this.setData({
        userInfo,
      })
      this.getCurLocation()
    } else {
      this.userInfoAuthErr()
    }
  },
  toPx(x) {
    return x
  },
  drawRadiusRect(ctx, x, y, w, h, r) {
    let br = r / 2
    ctx.beginPath()
    ctx.moveTo(this.toPx(x + br), this.toPx(y))            // 移动到左上角的点
    ctx.lineTo(this.toPx(x + w - br), this.toPx(y))        // 画上边的线
    ctx.arcTo(this.toPx(x + w), this.toPx(y), this.toPx(x + w), this.toPx(y + br), this.toPx(br))                                                    // 画右上角的弧        
    ctx.lineTo(this.toPx(x + w), this.toPx(y + h - br))    // 画右边的线
    ctx.arcTo(this.toPx(x + w), this.toPx(y + h), this.toPx(x + w - br), this.toPx(y + h), this.toPx(br))                                              // 画右下角的弧
    ctx.lineTo(this.toPx(x + br), this.toPx(y + h))        // 画下边的线
    ctx.arcTo(this.toPx(x), this.toPx(y + h), this.toPx(x), this.toPx(y + h - br), this.toPx(br))                                                    // 画左下角的弧
    ctx.lineTo(this.toPx(x), this.toPx(y + br))            // 画左边的线
    ctx.arcTo(this.toPx(x), this.toPx(y), this.toPx(x + br), this.toPx(y), this.toPx(br))  
  },
  calTxtWidth(times) {
    return String(times).length * CONFIG.CANVAS_CONFIG.TIMES.size
  },
  formatCoordinate(coordinate) {
    let { latitude, longitude } = coordinate
    let latitudeValue = util.calCoordinate(latitude)
    let longitudeValue = util.calCoordinate(longitude)
    if (latitude > 0) {
      latitudeValue = '北纬N' + latitudeValue
    } else {
      latitudeValue = '南纬S' + latitudeValue
    }

    if (longitude > 0) {
      longitudeValue = '东经E' + longitudeValue
    } else {
      longitudeValue = '西经W' + longitudeValue
    }

    return `(${latitudeValue}, ${longitudeValue})`
  },
  backtap() {
    const map = wx.createMapContext('indexMap')
    map.moveToLocation({
      longitude: this.data.longitude,
      latitude: this.data.latitude,
    })
  },
  regionchange(e) {
    if (e.type == 'end') {
      const map = wx.createMapContext('indexMap')
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
  hidePoster() {
    this.setData({
      isShowPoster: false,
    })
  },
  savePoster() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterSrc,
      success: () => {
        this.setData({
          posterSaveFlag: false,
        })
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1500,
        })
        setTimeout(() => {
          this.setData({
            isShowPoster: false,
          })
        }, 2000)
      },
      fail: () => {
        authErr.show({
          title: '保存照片授权',
          content: '照片授权暂未开启，部分功能受限',
          page: this,
          errCb: () => {
            this.savePoster()
          }
        })
      }
    })
  },
  createPoster(bannerSrc) {
    let ctx = wx.createCanvasContext('popCanvas')
    Promise.all([
      imgPromise('https://mimg.127.net/hz/uploader/20200807/15968014419682885.jpg'),
      imgPromise(bannerSrc),
      imgPromise(CONFIG.CANVAS_CONFIG.CALENDAR.src),
      imgPromise(this.data.userInfo.avatarUrl),  
      imgPromise(CONFIG.CANVAS_CONFIG.ADDRESSICON.src),  
      imgPromise(CONFIG.CANVAS_CONFIG.TIMEICON.src),  
      imgPromise(CONFIG.CANVAS_CONFIG.MINICODE.src),  
    ]).then(res => {
      // 绘制白色背景，和clip冲突，使用图片
      ctx.drawImage(res[0].tempFilePath, CONFIG.CANVAS_CONFIG.CANVAS.x, CONFIG.CANVAS_CONFIG.CANVAS.y, CONFIG.CANVAS_CONFIG.CANVAS.w, CONFIG.CANVAS_CONFIG.CANVAS.h)

      // 绘制banner
      ctx.drawImage(res[1].tempFilePath, CONFIG.CANVAS_CONFIG.BANNER.x, CONFIG.CANVAS_CONFIG.BANNER.y, CONFIG.CANVAS_CONFIG.BANNER.w, CONFIG.CANVAS_CONFIG.BANNER.h)

      // 绘制icon calendar
      ctx.drawImage(res[2].tempFilePath, CONFIG.CANVAS_CONFIG.CALENDAR.x, CONFIG.CANVAS_CONFIG.CALENDAR.y, CONFIG.CANVAS_CONFIG.CALENDAR.w, CONFIG.CANVAS_CONFIG.CALENDAR.h)

      // 绘制日期文字
      ctx.setTextAlign('left')
      ctx.setFillStyle(CONFIG.CANVAS_CONFIG.DATE.color)
      ctx.setFontSize(CONFIG.CANVAS_CONFIG.DATE.size)
      ctx.fillText(util.formatDate(this.data.date), CONFIG.CANVAS_CONFIG.CALENDAR.x + CONFIG.CANVAS_CONFIG.CALENDAR.w + CONFIG.CANVAS_CONFIG.CALENDAR.m, CONFIG.CANVAS_CONFIG.DATE.y)

      // 绘制次数 - 次
      ctx.setTextAlign('right')
      ctx.setFillStyle(CONFIG.CANVAS_CONFIG.TIMESUNIT.color)
      ctx.setFontSize(CONFIG.CANVAS_CONFIG.TIMESUNIT.size)
      ctx.fillText(CONFIG.CANVAS_CONFIG.TIMESUNIT.txt, CONFIG.CANVAS_CONFIG.TIMESUNIT.x, CONFIG.CANVAS_CONFIG.TIMESUNIT.y)

      // 绘制次数 - 具体次数
      let timesRight = CONFIG.CANVAS_CONFIG.TIMESUNIT.x - CONFIG.CANVAS_CONFIG.TIMESUNIT.txt.length * CONFIG.CANVAS_CONFIG.TIMESUNIT.size - CONFIG.CANVAS_CONFIG.TIMES.m
      ctx.setTextAlign('right')
      ctx.setFillStyle(CONFIG.CANVAS_CONFIG.TIMES.color)
      ctx.setFontSize(CONFIG.CANVAS_CONFIG.TIMES.size)
      ctx.fillText(String(this.data.location.length), timesRight, CONFIG.CANVAS_CONFIG.TIMES.y)

      // 绘制次数 - 共打卡
      let timesTltRight = timesRight - CONFIG.CANVAS_CONFIG.TIMES.m - this.calTxtWidth(this.data.location.length) / 2
      ctx.setTextAlign('right')
      ctx.setFillStyle(CONFIG.CANVAS_CONFIG.TIMESTLT.color)
      ctx.setFontSize(CONFIG.CANVAS_CONFIG.TIMESTLT.size)
      ctx.fillText(CONFIG.CANVAS_CONFIG.TIMESTLT.txt, timesTltRight, CONFIG.CANVAS_CONFIG.TIMESTLT.y)

      // 绘制头像
      if (res[3].tempFilePath) {
        let avatarRight = timesTltRight - CONFIG.CANVAS_CONFIG.TIMESTLT.txt.length * CONFIG.CANVAS_CONFIG.TIMESTLT.size - CONFIG.CANVAS_CONFIG.AVATAR.w - CONFIG.CANVAS_CONFIG.AVATAR.m
        ctx.save()
        this.drawRadiusRect(ctx, avatarRight, CONFIG.CANVAS_CONFIG.AVATAR.y, CONFIG.CANVAS_CONFIG.AVATAR.w, CONFIG.CANVAS_CONFIG.AVATAR.h, 2 * CONFIG.CANVAS_CONFIG.AVATAR.r)
        ctx.clip()
        ctx.drawImage(res[3].tempFilePath, avatarRight, CONFIG.CANVAS_CONFIG.AVATAR.y, CONFIG.CANVAS_CONFIG.AVATAR.w, CONFIG.CANVAS_CONFIG.AVATAR.h)
        ctx.restore()
      }

      // 绘制线
      ctx.moveTo(CONFIG.CANVAS_CONFIG.LINE.x, CONFIG.CANVAS_CONFIG.LINE.y)
      ctx.setStrokeStyle('#efefef')
      ctx.setLineWidth(CONFIG.CANVAS_CONFIG.LINE.h)
      ctx.lineTo(CONFIG.CANVAS_CONFIG.LINE.x + CONFIG.CANVAS_CONFIG.LINE.w, CONFIG.CANVAS_CONFIG.LINE.y)
      ctx.stroke()

      // 绘制地址icon
      ctx.drawImage(res[4].tempFilePath, CONFIG.CANVAS_CONFIG.ADDRESSICON.x, CONFIG.CANVAS_CONFIG.ADDRESSICON.y, CONFIG.CANVAS_CONFIG.ADDRESSICON.w, CONFIG.CANVAS_CONFIG.ADDRESSICON.h)

      // 绘制地址
      let addressArr = util.getTextLine({
        ctx: ctx,
        text: this.data.address,
        size: CONFIG.CANVAS_CONFIG.ADDRESS.size,
        width: CONFIG.CANVAS_CONFIG.ADDRESS.w,
      })
      ctx.setTextAlign('left')
      ctx.setFillStyle(CONFIG.CANVAS_CONFIG.ADDRESS.color)
      ctx.setFontSize(CONFIG.CANVAS_CONFIG.ADDRESS.size)
      addressArr.forEach((_v, _i) => {
        ctx.fillText(_v, CONFIG.CANVAS_CONFIG.ADDRESSICON.x + CONFIG.CANVAS_CONFIG.ADDRESSICON.w + CONFIG.CANVAS_CONFIG.ADDRESSICON.m, CONFIG.CANVAS_CONFIG.ADDRESSICON.y + CONFIG.CANVAS_CONFIG.ADDRESS.size * (_i + 1))
      })

      // 绘制经纬度
      let coordinateY = CONFIG.CANVAS_CONFIG.ADDRESSICON.y + CONFIG.CANVAS_CONFIG.ADDRESS.size * addressArr.length + CONFIG.CANVAS_CONFIG.ADDRESS.m
      ctx.setTextAlign('left')
      ctx.setFillStyle(CONFIG.CANVAS_CONFIG.COORDINATE.color)
      ctx.setFontSize(CONFIG.CANVAS_CONFIG.COORDINATE.size)
      ctx.fillText(this.formatCoordinate({
        latitude: this.data.latitude,
        longitude: this.data.longitude,
      }), CONFIG.CANVAS_CONFIG.ADDRESSICON.x + CONFIG.CANVAS_CONFIG.ADDRESSICON.w + CONFIG.CANVAS_CONFIG.ADDRESSICON.m, coordinateY)

      // 绘制时间icon
      
      ctx.drawImage(res[5].tempFilePath, CONFIG.CANVAS_CONFIG.TIMEICON.x, coordinateY + CONFIG.CANVAS_CONFIG.COORDINATE.m, CONFIG.CANVAS_CONFIG.TIMEICON.w, CONFIG.CANVAS_CONFIG.TIMEICON.h)

      // 绘制时间
      ctx.setTextAlign('left')
      ctx.setFillStyle(CONFIG.CANVAS_CONFIG.TIME.color)
      ctx.setFontSize(CONFIG.CANVAS_CONFIG.TIME.size)
      ctx.fillText(util.formatTime(this.data.date), CONFIG.CANVAS_CONFIG.TIMEICON.x + CONFIG.CANVAS_CONFIG.TIMEICON.w + CONFIG.CANVAS_CONFIG.TIMEICON.m, coordinateY + CONFIG.CANVAS_CONFIG.COORDINATE.m + CONFIG.CANVAS_CONFIG.TIME.size + CONFIG.CANVAS_CONFIG.TIME.m)

      // 绘制tip
      ctx.setTextAlign('left')
      ctx.setFillStyle(CONFIG.CANVAS_CONFIG.TIP.color)
      ctx.setFontSize(CONFIG.CANVAS_CONFIG.TIP.size)
      ctx.fillText(CONFIG.CANVAS_CONFIG.TIP.txt, CONFIG.CANVAS_CONFIG.TIP.x, CONFIG.CANVAS_CONFIG.TIP.y)

      // 绘制tip line
      ctx.moveTo(CONFIG.CANVAS_CONFIG.TIPLINE.x, CONFIG.CANVAS_CONFIG.TIPLINE.y)
      ctx.setStrokeStyle('#efefef')
      ctx.setLineWidth(CONFIG.CANVAS_CONFIG.TIPLINE.h)
      ctx.lineTo(CONFIG.CANVAS_CONFIG.TIPLINE.x + CONFIG.CANVAS_CONFIG.TIPLINE.w, CONFIG.CANVAS_CONFIG.TIPLINE.y)
      ctx.stroke()

      // 绘制小程序码
      ctx.drawImage(res[6].tempFilePath, CONFIG.CANVAS_CONFIG.MINICODE.x, CONFIG.CANVAS_CONFIG.MINICODE.y, CONFIG.CANVAS_CONFIG.MINICODE.w, CONFIG.CANVAS_CONFIG.MINICODE.h)

      ctx.draw(false, () => {
        wx.canvasToTempFilePath({
          canvasId: 'popCanvas',
          success: (res) => {
            !this.data.timerEndFlag && this.setData({
              posterSrc: res.tempFilePath,
              isShowPoster: true,
              posterSaveFlag: true,
            })
            this.clearTimer()
          },
          fail: (err) => {
            //
          }
        }, this)
      })
    })
  },
  startTimer() {
    this.timer = setTimeout(() => {
      this.setData({
        timerEndFlag: true,
      })
    }, 5000)
  },
  clearTimer() {
    clearTimeout(this.data.timer)
    this.setData({
      timer: null,
      timerEndFlag: false,
    })
  },
  saveLocation() {
    if (this.data.loading) {
      return false
    }
    this.setData({
      loading: true,
    })

    let _latitude = this.data.latitude
    let _longitude = this.data.longitude
    let _length = this.data.location.length
    if (!_length || _length && this.data.location[_length - 1].latitude != _latitude && this.data.location[_length - 1].longitude != _longitude) {
      let _date = new Date().getTime()
      let _newLocation = {
        latitude: _latitude,
        longitude: _longitude,
        date: _date,
        address: this.data.address,
      }

      this.setData({
        date: _date,
      })

      wx.cloud.callFunction({
        name: 'queryBannerByQuery',
      }).then(res => {
        let index = util.random(0, res.result.data.length)
        let bannerSrc = res.result.data[index].src
        this.createPoster(bannerSrc)
      }).catch(() => {
        //
      })

      wx.cloud.callFunction({
        name: 'addMapItem',
        data: {
          req: _newLocation,
        },
      }).then(res => {
        _newLocation = [...this.data.location, Object.assign(_newLocation, {
          _id: res.result._id,
          _openid: this.data.openid,
        })]
        let _markers = _newLocation.map(_v => {
          return Object.assign(_v, CONFIG.MAEKERS_CONFIG, {
            id: _v._id,
          })
        })
        this.setData({
          loading: false,
          location: _newLocation,
          punchDate: util.formatDateTime(_date),
          date: _date,
          punchAddress: this.data.address,
          polyline: [{ ...CONFIG.POLYLINE_CONFIG, points: _newLocation }],
          markers: _markers,
        })
        wx.showToast({
          title: '成功打卡',
          icon: 'success',
          duration: 2000,
        })
      }).catch(() => {
        this.setData({
          loading: false,
        })
        wx.showToast({
          title: '数据写入失败',
          image: '../../img/warn.png',
          duration: 2000,
        })
      })
    } else {
      wx.showModal({
        content: '和上次打卡地点一样哦，换个地方打卡吧',
        showCancel: false,
        success: (res) => {
          this.setData({
            loading: false
          })
        }
      })
    }
  },
  delLocation() {
    wx.showModal({
      content: '该操作将删除最近一次记录，继续删除？',
      cancelColor: '#3CC51F',
      confirmColor: '#ccc',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
            icon: ''
          })
          let temp = this.data.location
          let last = temp.pop()

          wx.cloud.callFunction({
            name: 'delMapByQuery',
            data: {
              req: last._id,
            },
          }).then(res => {
            let _polyline = [{ ...CONFIG.POLYLINE_CONFIG, points: temp }]
            let _lastData = temp.length ? temp[temp.length - 1] : {}
            let _markers = temp.map(_v => {
              return Object.assign(_v, CONFIG.MAEKERS_CONFIG, {
                id: _v._id,
              })
            })
            this.setData({
              location: temp,
              polyline: _polyline,
              markers: _markers,
              punchDate: util.formatDateTime(_lastData.date || ''),
              date: _lastData.date,
              punchAddress: _lastData.address || '',
            })
            wx.hideLoading()
            wx.showToast({
              title: '记录已删除',
              icon: 'success',
              duration: 2000,
            })
          }).catch(() => {
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
  markertap(_marker) {
    let _cur = {}
    this.data.markers.forEach(_v => {
      if (_v.id == _marker.markerId) {
        _cur = _v
      }
    })
    wx.showModal({
      content: `打卡地点: ${_cur.address} \r\n打卡时间: ${util.formatDateTime(_cur.date)}`,
      showCancel: false,
      success: (res) => {
        //
      }
    })
  },
  lookHistory() {
    wx.switchTab({
      url: '../history/index'
    })
  },
  loadData() {
    wx.cloud.callFunction({
      name: 'queryMapByQuery',
      data: {
        query: {
          _openid: this.data.openid,
        },
      },
    }).then(res => {
      if (Array.isArray(res.result.data) && res.result.data.length) {
        let _polyline = [{ ...CONFIG.POLYLINE_CONFIG, points: res.result.data }]
        let _lastData = res.result.data[res.result.data.length - 1]
        let _markers = res.result.data.map(_v => {
          return Object.assign(_v, CONFIG.MAEKERS_CONFIG, {
            id: _v._id,
          })
        })
        this.setData({
          location: res.result.data,
          polyline: _polyline,
          markers: _markers,
          punchDate: util.formatDateTime(_lastData.date),
          date: _lastData.date,
          punchAddress: _lastData.address,
        })
      } else {
        //
      }
    }).catch(() => {
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
            latitude: data.originalData.result.location.lat,
            longitude: data.originalData.result.location.lng,
            address: data.originalData.result.formatted_address + data.originalData.result.sematic_description, //test
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
  onLoad(options) {
    wx.showShareMenu({
      withShareTicket: true
    })
    wx.hideShareMenu({
    })
    if (options.hat == 1) {
      wx.navigateTo({
        url: `../avatar/index`
      })
    }
  },
  onShow() {
    this.checkAuth()
    if (app.globalData.openid) {
      this.setData({
        openid: app.globalData.openid,
      })
      this.loadData()
    } else {
      app.wxLoginReadyCallback = res => {
        this.setData({
          openid: res.result.openid,
        })
        this.loadData()
      }
    }
  }
})