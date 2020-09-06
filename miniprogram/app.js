App({
    onLaunch: function () {

        this.globalData = {}
        if (!wx.cloud) {
            console.error('请使用 2.2.3 或以上的基础库以使用云能力')
        } else {
            wx.cloud.init({
                traceUser: true,
            })
            wx.cloud.callFunction({
                name: 'login',
                data: {},
                success: res => {
                    this.globalData.openid = res.result.openid
                    if (this.wxLoginReadyCallback) {
                        this.wxLoginReadyCallback(res)
                    }
                },
                fail: () => {
                    wx.showToast({
                        title: '网络开小差啦',
                        icon: 'none',
                        duration: 2000,
                    })
                }
            })
        }
    }
})