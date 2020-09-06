const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const MAX_LIMIT = 10

exports.main = async (event, context) => {
  try {
    return await db.collection('rankList').orderBy('times', 'desc').orderBy('_openid', 'desc').limit(MAX_LIMIT).get()
  } catch (e) {
    console.error(e)
  }
}
