const app = getApp()
const CONFIG = require('../../config')

const authErr = require('../../utils/authErr.js')

const rate = wx.getSystemInfoSync().windowWidth / 750 / 2

Page({
    data: {
        avatarTimes: 0,
        avatar: '',
        icon: '',
        userInfo: {},
        recommendHeight: 0,
        recommendList: [],
        currentId: '',
        actionSheetVisible: false,

        iconCenterX: CONFIG.AVATAR_CONFIG.size * rate / 2,
        iconCenterY: CONFIG.AVATAR_CONFIG.size * rate / 2,
        cancelCenterX: 0,
        cancelCenterY: 0,
        handleCenterX: CONFIG.AVATAR_CONFIG.size * rate,
        handleCenterY: CONFIG.AVATAR_CONFIG.size * rate,

        iconSize: CONFIG.AVATAR_CONFIG.size * rate,

        scale: 1,
        rotate: 0,
    },
    onShareAppMessage() {
        return {
            title: '头像用了很久了，来~ 换个头像吧',
            path: '/pages/index/index?hat=1',
            imageUrl: '../../img/logo.png'
        }
    },
    formatHeadimgHD (imageUrl) {
        imageUrl = imageUrl.split('/') //把头像的路径切成数组
        if (imageUrl[imageUrl.length - 1] && (imageUrl[imageUrl.length - 1] == 46 || imageUrl[imageUrl.length - 1] == 64 || imageUrl[imageUrl.length - 1] == 96 || imageUrl[imageUrl.length - 1] == 132)) {
            imageUrl[imageUrl.length - 1] = 0
        }
        imageUrl = imageUrl.join('/') //重新拼接为字符串
        return imageUrl
    },
    imgPromise(imgSrc) {
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
    },
    imgSizePromise(imgSrc) {
        return new Promise((resolve, reject) => {
            wx.getImageInfo({
                src: imgSrc,
                success: (res) => {
                    resolve(res)
                },
                fail: (err) => {
                    reject(err)
                }
            })
        })
    },
    drawCanvas() {
        wx.showLoading()
        let ctx = wx.createCanvasContext('avatarCanvas')
        Promise.all([
            this.imgSizePromise(this.data.avatar),
            this.imgSizePromise(this.data.icon),
        ]).then(res => {
            ctx.drawImage(res[0].path, 0, 0, res[0].width, res[0].height, 0, 0, CONFIG.AVATAR_CONFIG.size, CONFIG.AVATAR_CONFIG.size)
            ctx.translate(this.data.iconCenterX / rate, this.data.iconCenterY / rate)
            console.log(this.data.iconCenterX, rate)
            ctx.rotate(this.data.rotate * Math.PI / 180)
            const iconSize = CONFIG.AVATAR_CONFIG.size * this.data.scale
            ctx.drawImage(res[1].path, -iconSize / 2, -iconSize / 2, iconSize, iconSize)
            ctx.stroke()
            ctx.draw(false, () => {
                wx.canvasToTempFilePath({
                    x: 0,
                    y: 0,
                    width: CONFIG.AVATAR_CONFIG.size,
                    height: CONFIG.AVATAR_CONFIG.size,
                    destWidth: CONFIG.AVATAR_CONFIG.size,
                    destHeight: CONFIG.AVATAR_CONFIG.size,
                    canvasId: 'avatarCanvas',
                    success: (res) => {
                        wx.hideLoading()
                        wx.saveImageToPhotosAlbum({
                            filePath: res.tempFilePath,
                            success: () => {
                                wx.showToast({
                                    title: '已成功保存到相册',
                                    icon: 'success',
                                    duration: 2000,
                                })
                                this.setData({
                                    avatar: res.tempFilePath,
                                })
                                this.handleCancel()
                            },
                            fail: () => {
                                authErr.show({
                                    title: '保存照片授权',
                                    content: '照片授权暂未开启，部分功能受限',
                                    page: this,
                                    errCb: () => {
                                        this.drawCanvas()
                                    }
                                })
                            }
                        })
                    },
                    fail: function (res) {
                        wx.hideLoading()
                        wx.showToast({
                            title: '网络开小差啦，稍后再试',
                            icon: 'none',
                            duration: 2000,
                        })
                    }
                })
            })
        }).catch(err => {
            wx.hideLoading()
            wx.showToast({
                title: JSON.stringify(err) || '网络开小差啦，稍后再试',
                icon: 'none',
                duration: 2000,
            })
        })
    },
    userInfoAuthErr() {
        authErr.show({
            title: '头像昵称信息授权',
            content: '头像昵称授权暂未开启，部分功能受限',
            page: this,
            errCb: () => {
                //
            }
        })
    },
    getUserInfo(e) {
        let userInfo = e.detail.userInfo

        if (userInfo) {
            const headImgHD = this.formatHeadimgHD(userInfo.avatarUrl)
            this.setData({
                avatar: headImgHD,
                userInfo,
            })
        } else {
            this.userInfoAuthErr()
        }
    },
    onReady() {
        this.icon_center_x = this.data.iconCenterX
        this.icon_center_y = this.data.iconCenterY
        this.cancel_center_x = this.data.cancelCenterX
        this.cancel_center_y = this.data.cancelCenterY
        this.handle_center_x = this.data.handleCenterX
        this.handle_center_y = this.data.handleCenterY

        this.scale = this.data.scale
        this.rotate = this.data.rotate

        this.touch_target = ''
        this.start_x = 0
        this.start_y = 0
    },
    handleTouchStart(e) {
        if (e.target.id == 'icon') {
            this.touch_target = 'icon'
        } else if (e.target.id == 'handle') {
            this.touch_target = 'handle'
        } else {
            this.touch_target = ''
        }

        if (this.touch_target != '') {
            this.start_x = e.touches[0].clientX
            this.start_y = e.touches[0].clientY
        }
    },
    handleTouchMove(e) {
        var current_x = e.touches[0].clientX
        var current_y = e.touches[0].clientY
        var moved_x = current_x-this.start_x
        var moved_y = current_y-this.start_y
        if (this.touch_target == 'icon') {
            this.setData({
                iconCenterX: this.data.iconCenterX + moved_x,
                iconCenterY: this.data.iconCenterY + moved_y,
                cancelCenterX: this.data.cancelCenterX + moved_x,
                cancelCenterY: this.data.cancelCenterY + moved_y,
                handleCenterX: this.data.handleCenterX + moved_x,
                handleCenterY: this.data.handleCenterY + moved_y,
            })
        }
        if (this.touch_target == 'handle') {
            this.setData({
                handleCenterX: this.data.handleCenterX + moved_x,
                handleCenterY: this.data.handleCenterY + moved_y,
                cancelCenterX: 2 * this.data.iconCenterX - this.data.handleCenterX,
                cancelCenterY: 2 * this.data.iconCenterY - this.data.handleCenterY,
            })
            let diff_x_before = this.handle_center_x - this.icon_center_x
            let diff_y_before = this.handle_center_y - this.icon_center_y
            let diff_x_after = this.data.handleCenterX - this.icon_center_x
            let diff_y_after = this.data.handleCenterY - this.icon_center_y
            let distance_before = Math.sqrt(diff_x_before * diff_x_before + diff_y_before * diff_y_before)
            let distance_after = Math.sqrt(diff_x_after * diff_x_after + diff_y_after * diff_y_after)
            let angle_before = Math.atan2(diff_y_before, diff_x_before) / Math.PI * 180
            let angle_after = Math.atan2(diff_y_after, diff_x_after) / Math.PI * 180
            this.setData({
                scale: distance_after / distance_before * this.scale,
                rotate: angle_after - angle_before + this.rotate,
            })
      }
      this.start_x = current_x
      this.start_y = current_y
    },
    handleTouchEnd(e) {
        this.icon_center_x = this.data.iconCenterX
        this.icon_center_y = this.data.iconCenterY
        this.cancel_center_x = this.data.cancelCenterX
        this.cancel_center_y = this.data.cancelCenterY
        this.handle_center_x = this.data.handleCenterX
        this.handle_center_y = this.data.handleCenterY
        this.touch_target = ''
        this.scale = this.data.scale
        this.rotate = this.data.rotate
    },
    handleCancel() {
        this.setData({
            currentId: '',
            icon: '',
            iconCenterX: CONFIG.AVATAR_CONFIG.size * rate / 2,
            iconCenterY: CONFIG.AVATAR_CONFIG.size * rate / 2,
            cancelCenterX: 0,
            cancelCenterY: 0,
            handleCenterX: CONFIG.AVATAR_CONFIG.size * rate,
            handleCenterY: CONFIG.AVATAR_CONFIG.size * rate,

            iconSize: CONFIG.AVATAR_CONFIG.size * rate,
            scale: 1,
            rotate: 0,
        })
    },
    handleUpload() {
        this.setData({
            actionSheetVisible: true,
        })
    },
    handlePickPic(e) {
        const {
            sourceType
        } = e.currentTarget.dataset
        wx.chooseImage({
            count: 1, // 默认9
            sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
            sourceType: [sourceType], // 可以指定来源是相册还是相机，默认二者都有
            success: (res) => {
                const src = res.tempFilePaths[0]
                //  获取裁剪图片资源后，给data添加src属性及其值
                wx.navigateTo({
                    url: `../upload/index?src=${src}`
                })
            }
        })
    },
    handleSelectIcon(e) {
        if (!this.data.avatar) {
            return this.handleUpload()
        }
        const {
            id
        } = e.currentTarget.dataset
        const iconArr = this.data.recommendList.filter((item) => {
            return item._id == id
        })
        const icon = iconArr.length ? iconArr[0].src : ''
        this.setData({
            currentId: id,
            icon,
        })
    },
    handleSave() {
        if (!this.data.avatar) {
            return this.handleUpload()
        }
        if (!this.data.icon) {
            return wx.showToast({
                title: '请在下面的列表中选择一个背景吧',
                icon: 'none',
                duration: 2000,
            })
        }
        this.drawCanvas()
    },
    loadIconList() {
        wx.cloud.callFunction({
            name: 'queryIconByQuery',
            data: {
                query: {},
            },
        }).then(res => {
            if (Array.isArray(res.result.data) && res.result.data.length) {
                this.setData({
                    recommendList: res.result.data,
                })
            } else {
                //
            }
        }).catch((err) => {
            //
        })
    },
    loadTimes() {
        wx.cloud.callFunction({
            name: 'queryTimesByQuery',
            data: {
                query: {},
            },
        }).then(res => {
            this.setData({
                avatarTimes: res.result.data || 0,
            })
        }).catch((err) => {
            //
        })
    },
    addViewTime() {
        wx.cloud.callFunction({
            name: 'addTimes',
            data: {
                req: this.data.userInfo,
            },
        }).then(res => {
            // 
        }).catch(e => {
            // 
        })
    },
    onLoad() {
        wx.showShareMenu({
            withShareTicket: true
        })
        wx.hideShareMenu({})
        this.loadIconList()
        this.loadTimes()
    },
    onShow() {
        wx.getSystemInfo({
            success: (res) => {
                const recommendHeight = res.windowHeight - res.windowWidth / 750 * 850
                this.setData({
                    recommendHeight,
                })
            }
        })
        this.addViewTime()
        if (app.globalData.cropperResult) {
            this.setData({
                avatar: app.globalData.cropperResult
            }, () => {
                app.globalData.cropperResult = ''
            })
        }
    }
})