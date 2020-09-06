const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command
const MAX_LIMIT = 100
const RANK_LIMIT = 20

const getMapList = async (event, context) => {
  // 先取出集合记录总数
  const countResult = await db.collection('mapList').where({
    ...event.query,
  }).count()
  const total = countResult.total
  // 计算需分几次取
  const batchTimes = Math.ceil(total / 100)
  // 承载所有读操作的 promise 的数组
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    let promise
    promise = db.collection('mapList').orderBy('date', 'asc').where({
      ...event.query,
    }).field({
      _openid: true,
    }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
    tasks.push(promise)
  }
  // 等待所有
  return (await Promise.all(tasks)).reduce((acc, cur) => {
    return {
      data: acc.data.concat(cur.data),
    }
  })
}

const getUserList = async (event, context) => {
  // 先取出集合记录总数
  const countResult = await db.collection('userList').where({
    ...event.query,
  }).count()
  const total = countResult.total
  // 计算需分几次取
  const batchTimes = Math.ceil(total / 100)
  // 承载所有读操作的 promise 的数组
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    let promise
    promise = db.collection('userList').orderBy('date', 'asc').where({
      ...event.query,
    }).field({
      avatarUrl: true,
      nickName: true,
      gender: true,
      openId: true,
    }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
    tasks.push(promise)
  }
  // 等待所有
  return (await Promise.all(tasks)).reduce((acc, cur) => {
    return {
      data: acc.data.concat(cur.data),
    }
  })
}

const emptyRankCollection = async () => {
  return await db.collection('rankList').where({
    times: _.gt(0)
  }).remove()
}

const addRankCollection = async (data) => {
  const tasks = []
  const timestamp = db.serverDate()
  for (let i = 0; i < data.length; i++) {
    let promise
    promise = db.collection('rankList').add({
      data: {
        ...data[i],
        __timestamp: timestamp,
      },
    })
    tasks.push(promise)
  }
  
  return await Promise.all(tasks)
}

exports.main = async (event, context) => {
  try {

    const mapList = await getMapList(event, context)
    const userList = await getUserList(event, context)

    const tempUserObj = {}
    userList.data.forEach((item, index) => {
      tempUserObj[item.openId] = {
        avatarUrl: item.avatarUrl,
        nickName: item.nickName,
        gender: item.gender,
      }
    })

    const tempMapObj = {}
    mapList.data.forEach((item, index) => {
      if (tempMapObj[item._openid]) {
        tempMapObj[item._openid]++
      } else {
        tempMapObj[item._openid] = 1
      }
    })

    const resultList = Object.entries(tempMapObj).sort((a, b) => {
      return b[1] - a[1]
    }).slice(0, RANK_LIMIT).map((item, index) => {
      return {
        _openid: item[0],
        times: item[1],
        ...tempUserObj[item[0]],
      }
    })

    await emptyRankCollection()
    await addRankCollection(resultList)
    console.log('success')

  } catch (e) {
    console.error(e)
  }
}