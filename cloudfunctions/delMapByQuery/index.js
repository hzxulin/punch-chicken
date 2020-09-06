const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
    try {
        return await db.collection('mapList').doc(event.req).remove({})
    } catch (e) {
        console.error(e)
    }
}