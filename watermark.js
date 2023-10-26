export default class Watermark {
  static _instance = null
  mo = null
  bodyMo = null
  watermarkDiv = null
  defaultClass = `__wm_` + Math.random().toString(36).slice(-6)
  divAttrs = {
    allAttr: '',
    styleAttr: '',
    classAttr: '',
  }
  options = {
    container: null,
    width: 300,
    height: 200,
    font: '16px Microsoft Yahei',
    fillStyle: 'rgba(184, 184, 184, 0.3)',
    content: 'Watermark',
    rotate: -15,
    zIndex: 1000,
    targetClass: null,
  }
  constructor(_opts) {
    if (Watermark._instance) return Watermark._instance
    this.options = { ...this.options, ..._opts }
    this.options.targetClass = this.options.targetClass || this.defaultClass
    this.options.container = this.options.container || document.body
    const targets = document.querySelectorAll('.' + this.options.targetClass)
    if (targets.length) {
      throw new Error('There is a watermark node class. Please delete or replace it and try again.')
    }
  }
  _getNumber(n) {
    return Number(Number(n).toFixed())
  }
  _removeMo() {
    this.mo?.disconnect()
    this.bodyMo?.disconnect()
    this.mo = null
    this.bodyMo = null
  }
  _rebuild() {
    this._watermark()
  }
  _addMo() {
    const MutationObserver = window.MutationObserver
    if (MutationObserver) {
      this.mo = new MutationObserver(() => {
        const { allAttr, styleAttr, classAttr } = this.divAttrs
        // console.log('水印元素变动==>')
        // 获取当前style属性
        const _styleAttr = this.watermarkDiv.getAttribute('style')
        // 获取当前class属性
        const _classAttr = this.watermarkDiv.getAttribute('class')
        // 获取当前内容
        const text = this.watermarkDiv.innerHTML
        // 获取当前属性
        const _attrs = [...this.watermarkDiv.attributes].map((i) => i.name).join(',')

        if (allAttr !== _attrs || styleAttr !== _styleAttr || classAttr !== _classAttr || !!text) {
          // console.log('styleAttr==>', attrs, _attrs, classAttr, text)
          // 只在__wm元素变动才重新调用 __canvasWM,防止别人手动修改水印节点
          this._rebuild()
        }
      })
      this.mo.observe(this.watermarkDiv, {
        attributes: true,
        // attributeFilter: ['class', 'style'],
        subtree: true,
        childList: true,
      })
      this.bodyMo = new MutationObserver((mutationsList, observer) => {
        // console.log('body变动==>', mutationsList, observer)
        // 监听元素 container, 移除节点集合
        const removedNodes = mutationsList[0]?.removedNodes || []
        // 判断是否为水印移除
        const isWatermark = [...removedNodes].some((i) => i.getAttribute('class') === this.options.targetClass)
        // console.log('isWatermark==>', isWatermark)
        isWatermark && this._rebuild()
      })
      this.bodyMo.observe(this.options.container, {
        childList: true,
      })
    }
  }
  _caculateCanvasUrl(opts) {
    const { width, height, font, fillStyle, content, rotate } = opts || this.options
    const canvas = document.createElement('canvas')

    canvas.setAttribute('width', width)
    canvas.setAttribute('height', height)
    // canvas.setAttribute('style', 'border:1px solid red;');

    const ctx = canvas.getContext('2d')
    if (ctx) {
      // canvas测试边框
      ctx.strokeRect(0, 0, canvas.width, canvas.height)
      // 缓存已画内容
      ctx.save()
      ctx.fillStyle = fillStyle // 字体颜色及透明度
      ctx.font = font
      var textMetrics = ctx.measureText(content)
      // 获取文字宽高
      var textWidth = this._getNumber(textMetrics.width)
      var textHeight = this._getNumber(textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent)

      // 计算角度(使所有角度落在【-90，90】之间)
      const ang = ((rotate + 90) % 180) - 90
      const angle = (ang * Math.PI) / 180
      // 计算文字旋转后所占宽度
      const tw = this._getNumber(Math.abs(textWidth * Math.cos(angle)) + Math.abs(textHeight * Math.sin(angle)))
      // const th = this._getNumber(Math.abs(textWidth * Math.sin(angle)) + Math.abs(textHeight * Math.cos(angle)))
      // 对不同文字长度设置合适的间距（太长的显示可能导致显示效果变差）
      if (tw > 200) {
        canvas.width = this._getNumber(Math.max(tw * 2.4, 400))
        canvas.height = this._getNumber(canvas.width * 0.3)
      } else if (tw > 100) {
        canvas.width = 400
        canvas.height = 300
      } else {
        canvas.width = 300
        canvas.height = 200
      }
      // 计算所单元画布的对角线长度，以供后续位置计算
      const xiebian = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height)
      // 计算较小的那个角的弧度值
      const xiejiao = Math.atan(canvas.height / canvas.width)
      // 计算第二个文字位置时所需的目标角度，需要画图才直观一点儿
      const targetAngle = Math.abs(xiejiao) + Math.abs(angle)

      ctx.rotate(angle)
      // 画布清空后，需要重设字体样式
      ctx.fillStyle = fillStyle
      ctx.font = font
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      if (ang < 0 && ang >= -90) {
        const [w, h] = [textWidth, textHeight]
        const x = this._getNumber(-w * Math.sin(angle) * Math.sin(angle))
        const y = this._getNumber(-w * Math.sin(angle) * Math.cos(angle))
        ctx.fillText(content, x, y)
        const xx = this._getNumber(x + (Math.abs(Math.cos(targetAngle)) * xiebian) / 2)
        const yy = this._getNumber(y + (Math.abs(Math.sin(targetAngle)) * xiebian) / 2)
        ctx.fillText(content, xx, yy)
      }
      if (ang >= 0 && ang <= 90) {
        const [w, h] = [textWidth, textHeight]
        const x = h * Math.sin(angle) * Math.cos(angle)
        const y = -h * Math.sin(angle) * Math.cos(angle) * Math.tan(angle)
        ctx.strokeRect(x, y, w, h)
        ctx.fillText(content, x, y)
        const xx = this._getNumber(x + (Math.abs(Math.cos(targetAngle)) * xiebian) / 2)
        const yy = this._getNumber(y + (Math.abs(Math.sin(targetAngle)) * xiebian) / 2)
        ctx.fillText(content, xx, yy)
      }
      ctx.font = '50px Microsoft Yahei'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      // ctx.fillText(content, -w * Math.sin(angle1) * Math.sin(angle1), -w * Math.sin(angle1) * Math.cos(angle1))
      // ctx.strokeRect(25, -25, 100, 50)
      // console.log(-w * Math.sin(angle1) * Math.sin(angle1), w * Math.sin(angle1) * Math.cos(angle1))
      ctx.restore()
    }
    // document.body.appendChild(canvas)
    return canvas.toDataURL()
  }
  _updataWatermarkDiv(imgUrl) {
    this.watermarkDiv?.remove()
    const { zIndex, targetClass, container } = this.options
    this.watermarkDiv = document.createElement('div')
    const styleStr =
      'position:absolute; top:0; left:0; width:100%; height:100%; z-index:' +
      zIndex +
      "; pointer-events:none; background-repeat:repeat; background-image:url('" +
      imgUrl +
      "')"
    this.watermarkDiv.setAttribute('style', styleStr)
    this.watermarkDiv.classList.add(targetClass)
    this.divAttrs = {
      allAttr: [...this.watermarkDiv.attributes].map((i) => i.name).join(','),
      styleAttr: styleStr,
      classAttr: targetClass,
    }

    // window.getComputedStyle(document.body).getPropertyValue('position') === 'static'
    // container.style.position = 'relative'
    container.insertBefore(this.watermarkDiv, container.firstChild)
  }
  _watermark(opts) {
    this.options = { ...this.options, ...opts }
    this._removeMo()
    const base64Url = this._caculateCanvasUrl()
    this._updataWatermarkDiv(base64Url)
    this._addMo()
  }
  paint(opts) {
    const _opts = typeof opts === 'string' ? { content: opts } : opts
    this._watermark(_opts)
  }
  destroy() {
    this._removeMo()
    this.watermarkDiv?.remove()
    Watermark._instance = null
  }
  static getInstance(opts) {
    if (!Watermark._instance) {
      Watermark._instance = new Watermark(opts)
    }
    return Watermark._instance
  }
}
