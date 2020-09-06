const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
    try {
        return await cloud.callFunction({
            name: 'queryUserByQuery',
            data: {
                query: {
                    openId: event.userInfo.openId,
                },
            },
        }).then(async res => {
            if (Array.isArray(res.result.data) && res.result.data.length) {
                return await cloud.callFunction({
                    name: 'updateUserByQuery',
                    data: {
                        query: {
                            _id: res.result.data[0]._id,
                        },
                        req: {
                            ...event.req,
                            ...event.userInfo,
                        },
                    },
                })
            } else {
                return await cloud.callFunction({
                    name: 'addUser',
                    data: {
                        req: {
                            ...event.req,
                            ...event.userInfo,
                        }
                    },
                })
            }
        })
    } catch (e) {
        console.error(e)
    }
}