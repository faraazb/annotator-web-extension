import Overlay from '../lib/overlay'
import { createPopper } from '@popperjs/core'
import ComboboxExample from '../components/combobox/example'
import {render} from 'preact'

let overlay = null
let inspecting = false
const mousePos = { x: 0, y: 0 }


const canIgnore = (target) => {
  const annotateParent = target.closest('[id^="annotator"]');

  if (annotateParent) {
    return true
  } else {
    false
  }
}


const getInspectName = element => {
  return element.tagName.toLowerCase()
}

export const startInspectorMode = () => {
  inspecting = true
  if (!overlay) {
    overlay = new Overlay()
  }

  const element = document.elementFromPoint(mousePos.x, mousePos.y)

  if (element) {
    // highlight the initial point.
    overlay.inspect([element], getInspectName(element))
  }

  window.addEventListener("pointerover", handleElementPointerOver, true)
  window.addEventListener("click", handleElementClick, true)
}

export const exitInspectorMode = () => {
  inspecting = false
  if (overlay) {
    overlay.remove()
    overlay = null
  }
  window.removeEventListener("pointerover", handleElementPointerOver, true)
  window.removeEventListener("click", handleElementClick, true)
}

const handleElementPointerOver = e => {
  const target = e.target
  if (!target || !overlay) return

  if (canIgnore(target)) {
    return
  }

  overlay.inspect([target], getInspectName(target))
}

const handleElementClick = e => {
  e.preventDefault()

  const target = e.target
  if (!target) return


  if (canIgnore(target)) {
    return
  }


  if(localStorage.getItem("annotating") === "true") {
    localStorage.removeItem("annotating");
    window.addEventListener("pointerover", handleElementPointerOver, true)
    document.getElementById("tooltip").remove(); 
    return
  }


  let tooltip = document.createElement('div');
  tooltip.id = "tooltip";
  render(<ComboboxExample />, tooltip)

  let app_container = document.getElementById("annotator-app-container");
  app_container.appendChild(tooltip);

  createPopper(target, tooltip);

  if(!localStorage.getItem("annotating")) {
    localStorage.setItem("annotating", "true");
    window.removeEventListener("pointerover", handleElementPointerOver, true)
  }
}

const handleEscape = e => {
  if (e.key?.toLowerCase() === "escape") {
    e.preventDefault()
    exitInspectorMode()
  }
}

window.addEventListener("keydown", handleEscape)

window.addEventListener("mousemove", e => {
  mousePos.x = e.clientX
  mousePos.y = e.clientY
})
