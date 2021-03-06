const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
    try {
        return await db.collection('userList').add({
            data: {
                ...event.req,
                ...event.userInfo,
                __timestamp: db.serverDate(),
            },
        })
    } catch (e) {
        console.error(e)
    }
}