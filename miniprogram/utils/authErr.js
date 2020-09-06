const err = (errCb) => {
    wx.showModal({
        title: '提示',
        content: '错过授权页面的处理方法：删除小程序->重新搜索高级打卡鸡进入->点击授权按钮',
        showCancel: false,
        success: (res) => {
            errCb && errCb()
        }
    })
}

const show = ({ title, content, page, errCb}) => {
    wx.showModal({
        title: title || '',
        content: content || '',
        confirmText: '开启授权',
        confirmColor: '#22ac19',
        cancelText: '仍然拒绝',
        cancelColor: '#999999',
        success: function (res) {
            if (res.confirm) {
                if (wx.openSetting) {
                    wx.openSetting()
                    page && page.setData({
                        deley: true,
                    })
                } else {
                    err(errCb)
                }
            } else {
                err(errCb)
            }
        }
    })
}

module.exports = {
    show,
}