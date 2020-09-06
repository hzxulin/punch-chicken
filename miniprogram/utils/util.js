/* 获取日期+时间 */
const formatDateTime = (date) => {
  date = date ? new Date(date) : new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

/* 获取时间 */
const formatTime = (date) => {
  date = date ? new Date(date) : new Date()

  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [hour, minute, second].map(formatNumber).join(':')
}

/* 获取日期 */
const formatDate = (date) => {
  date = date ? new Date(date) : new Date()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${month >= 10 ? month : `0${month}`}月${day >= 10 ? day : `0${day}`}日`
}

/* 数字补0 */
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

/* 获取经纬度的坐标 */
const calCoordinate = (value) => {
  value = Math.abs(value)

  let x = Math.floor(value)
  let y = Math.floor((value - x) * 60)
  let z = ((value - x) * 60 - y).toFixed(2)

  return `${x}°${y}'${z}"`
}

/* 随机获取整数 */
const random = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min
}

/* 获取当前页url */
const getCurrentPageUrl = () => {
  let pages = getCurrentPages()    //获取加载的页面
  let currentPage = pages[pages.length - 1]    //获取当前页面的对象
  let url = currentPage.route    //当前页面url
  return url
}

/* 获取当前页options */
const getCurrentPageOptions = () => {
  let pages = getCurrentPages()    //获取加载的页面
  let currentPage = pages[pages.length - 1]    //获取当前页面的对象
  let options = currentPage.options    //当前页面url
  return options
}

/* 获取当前页带参数的url */
const getCurrentPageUrlWithArgs = () => {
  let pages = getCurrentPages()    //获取加载的页面
  let currentPage = pages[pages.length - 1]    //获取当前页面的对象
  let url = currentPage.route    //当前页面url
  let options = currentPage.options    //如果要获取url中所带的参数可以查看options

  //拼接url的参数
  let urlWithArgs = []
  Object.keys(options).forEach(key => {
    urlWithArgs.push(key + '=' + options.key)
  })
  urlWithArgs = `${url}${urlWithArgs.length ? '?' : ''}${urlWithArgs.join('&')}`

  return urlWithArgs
}

/* 获取 */
const getTextLine = (obj = {}) => {
  let splitStr = /[\u4e00-\u9fa5]/.test(obj.text) ? '' : ' '
  let arrText = obj.text.split(splitStr)
  let line = ''
  let arrTr = []

  obj.ctx.setFontSize(obj.size)
  for (let i = 0; i < arrText.length; i++) {
    let testLine = line + (i == 0 ? '' : splitStr) + arrText[i]
    let metrics = obj.ctx.measureText(testLine)
    let width = metrics.width
    if (width > obj.width && i > 0) {
      arrTr.push(line)
      line = arrText[i]
    } else {
      line = testLine
    }
    if (i == arrText.length - 1) {
      arrTr.push(line)
    }
  }
  return arrTr
}

module.exports = {
  formatDateTime,
  formatTime,
  formatDate,
  calCoordinate,
  random,
  getCurrentPageUrl,
  getCurrentPageOptions,
  getCurrentPageUrlWithArgs,
  getTextLine,
}
