const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  try {

    // 先取出集合记录总数
    const countResult = await db.collection('timeList').where({
      ...event.query,
    }).count()
    const total = countResult.total

    return {
      data: total,
    }
  } catch (e) {
    console.error(e)
  }
}