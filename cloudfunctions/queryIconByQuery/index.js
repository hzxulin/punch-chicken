const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const MAX_LIMIT = 100

exports.main = async (event, context) => {
  try {

    // 先取出集合记录总数
    const countResult = await db.collection('iconList').where({
      ...event.query,
    }).count()
    const total = countResult.total
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
      let promise
      if (!!event.query.openid) {
        promise = db.collection('iconList').where({
          ...event.query,
        }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
      } else {
        promise = db.collection('iconList').where({
          ...event.query,
        }).field({
          _id: true,
          name: true,
          src: true,
        }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
      }
      tasks.push(promise)
    }
    // 等待所有
    return (await Promise.all(tasks)).reduce((acc, cur) => {
      return {
        data: acc.data.concat(cur.data),
      }
    })
  } catch (e) {
    console.error(e)
  }
}