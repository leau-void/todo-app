import './style.css'
import { updateStorage, retrieveStorage } from './storage-controller.js'
import displayController from './display-controller.js'
import { formatDistanceToNow, add, lightFormat, compareAsc, parseISO, isPast, isEqual } from 'date-fns'

console.log(formatDistanceToNow((new Date()), { addSuffix: true }))

;(() => {
  const projectList = []

  const todoFactory = (args = {}) => {
  // template {name, description, dueDate, priority, notes, checklist, isDone}
    return Object.assign({}, args)
  }

  const projectFactory = (args = {}) => {
  // template {name,dueDate, isDone}
    return Object.assign({}, args, {todoList: []})
  }

  const toggleBoolean = (obj, prop) => {
    return (obj[prop]) ? false : true
  }

  const toggleDone = (obj) => {
    const prop = ('isDone' in obj) ? 'isDone' : ('isChecked' in obj) ? 'isChecked' : null

    return editProp(obj, prop, toggleBoolean(obj, prop))
  }

  const editProp = (obj, prop, newValue)  => {
    return obj[prop] = newValue
  }

  const deleteObj = (obj, array) => {
    const objIndex = array.indexOf(obj)
    if (objIndex > -1) return array.splice(objIndex, 1)
  }

  const orderArray = (array) => {
    let orderFunc

    if (array[0].dueDate) { 
      orderFunc = function (lastElem, nextElem) { 
        return compareAsc(new Date(lastElem.dueDate), new Date(nextElem.dueDate))
      }
    } else if ('isChecked' in array[0]) {
      orderFunc = function (lastElem, nextElem) {
        return (nextElem.isChecked == false && lastElem.isChecked == true) ? -1 : 1
      }
    }


    array.sort((lastElem, nextElem) => {
      return orderFunc(lastElem, nextElem)
    }) 
    return array
  }

  const orderAllArrays = () => {
    orderArray(projectList)
    projectList.forEach(project => orderArray(project.todoList))
    projectList.forEach(project => project.todoList.forEach(todo => orderArray(todo.checklist)))
  }

  const findProjectTodoList = (newObj, nameProject) => {
    const project = projectList.find(x => x.name === nameProject)

    if (!project) {
      addToList(projectFactory({name: nameProject, dueDate: newObj.dueDate, isDone: newObj.isDone}))
      return projectList[projectList.length -1].todoList
    } else {
      return project.todoList
    }
  }

  const addToList = (newObj, nameProject) => {
    let targetList = projectList

    if (nameProject) {
      orderArray(newObj.checklist)
      targetList = findProjectTodoList(newObj, nameProject)
    }

    targetList.push(newObj)
  }

  const checkToday = (objDate) => {
  
    const objDateFormat = lightFormat(new Date(objDate), 'yyyy-MM-dd')
    const today = lightFormat(new Date(), 'yyyy-MM-dd')

    return (objDateFormat === today) ? true : false
  }


  const checkAllDates = () => {
    //today
    projectList.forEach(project => project.isToday = checkToday(project.dueDate))
    projectList.forEach(project => project.todoList.forEach(todo => todo.isToday = checkToday(todo.dueDate)))

    //past
    projectList.forEach(project => project.isPast = isPast(parseISO(project.dueDate)))
    projectList.forEach(project => project.todoList.forEach(todo => todo.isPast = isPast(parseISO(todo.dueDate))))

    //give time readable
  }

  const updateWrap = (func, ...args) => {
    if (func) func(...args)
    orderAllArrays()
    checkAllDates()
    updateStorage(projectList)
  }

  const init = () => {
    if(!localStorage.length) {
      const dueDate = add(new Date(), {weeks: 1})
      addToList(todoFactory({name: "Fill Todo App", description: "Fill this Todo App so it can assist me in my busy life.", dueDate, priority: "high", notes: "Very Important.", checklist: [{name:"first todo", isChecked: true}, {name: "second todo", isChecked: false}, {name: "third todo", isChecked: true}, {name: "fourth todo", isChecked: false}], isDone: false}), "default")  
    } else {
      retrieveStorage().forEach(item => projectList.push(item))
    }
    updateWrap()
  }

  init()

  console.log(projectList)

  // return init()

})()