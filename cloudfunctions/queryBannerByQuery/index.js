const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
    try {
        return await db.collection('bannerList').orderBy('date', 'asc').limit(0).get()
    } catch (e) {
        console.error(e)
    }
}