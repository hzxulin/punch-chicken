const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
    try {
        return await db.collection('mapList').add({
            data: {
                ...event.req,
                ...event.userInfo,
                _openid: event.userInfo.openId,
                __timestamp: db.serverDate(),
            },
        })
    } catch (e) {
        console.error(e)
    }
}