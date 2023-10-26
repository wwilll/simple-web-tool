import Watermark from './watermark.js'

window.onload = () => {
  window.wm = Watermark.getInstance()
  window.wm.paint('test')
}
