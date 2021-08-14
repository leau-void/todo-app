import './style.css'
import { updateStorage, retrieveStorage } from './storage-controller.js'
import displayController from './display-controller.js'
import { formatDistanceToNow, add, lightFormat, compareAsc, parseISO, isPast, isEqual } from 'date-fns'

console.log(formatDistanceToNow((new Date()), { addSuffix: true }))

;(() => {
  const projectList = []

  const proto = {
    toggleBoolean (prop) {
      return (this[prop]) ? false : true
    },

    toggleDone () {
      const prop = ('isDone' in this) ? 'isDone' : ('isChecked' in this) ? 'isChecked' : null
  
      return this.editProp(prop, this.toggleBoolean(prop))
    },

    editProp (prop, newValue) {
      return this[prop] = newValue
    },

    deleteObj (array) {
      const objIndex = array.indexOf(this)
      if (objIndex > -1) return array.splice(objIndex, 1)
    },

    checkToday () {
      const objDateFormat = lightFormat(new Date(this.dueDate), 'yyyy-MM-dd')
      const today = lightFormat(new Date(), 'yyyy-MM-dd')
  
      return (objDateFormat === today) ? true : false
    },

    checkPast () {
      return isPast(parseISO(this.dueDate))
    },

    orderSelfArrays () {
      for (let key in this) {
        if (this[key] instanceof Array) orderArray(this[key])
      }
    },

    setPrototypeOfChildren () {
      for (let key in this) {
        if (this[key] instanceof Array) this[key].forEach(item => Object.setPrototypeOf(item, proto))
      }
    }

  }

  const todoFactory = (args = {}) => {
  // template {name, description, dueDate, priority, notes, checklist, isDone}

    if (args.checklist instanceof Array) args.checklist.forEach(item => Object.setPrototypeOf(item, proto))

    return Object.assign(Object.create(proto), args)
  }

  const projectFactory = (args = {}) => {
  // template {name,dueDate, isDone}
    return Object.assign(Object.create(proto), args, {todoList: []})
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
    projectList.forEach(project => project.orderSelfArrays())
    projectList.forEach(project => project.todoList.forEach(todo => todo.orderSelfArrays()))
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
      newObj.orderSelfArrays()
      targetList = findProjectTodoList(newObj, nameProject)
    }

    targetList.push(newObj)
  }


// method has to be called in string
  const updateWrap = (obj, objMethod, ...args) => {
    if (obj && obj[objMethod] instanceof Function) obj[objMethod].call(obj, ...args) 

    orderAllArrays()
    updateStorage(projectList)
  }

  const init = () => {
    if(!localStorage.length) {
      const dueDate = add(new Date(), {weeks: 1})
      addToList(todoFactory({name: "Fill Todo App", description: "Fill this Todo App so it can assist me in my busy life.", dueDate, priority: "high", notes: "Very Important.", checklist: [{name:"first todo", isChecked: true}, {name: "second todo", isChecked: false}, {name: "third todo", isChecked: true}, {name: "fourth todo", isChecked: false}], isDone: false}), "default")  
    } else {
      retrieveStorage().forEach(item => projectList.push(item))
      projectList.forEach(project => Object.setPrototypeOf(project, proto))
      projectList.forEach(project => project.setPrototypeOfChildren())
      projectList.forEach(project => project.todoList.forEach(todo => todo.setPrototypeOfChildren()))
    }
    updateWrap()
  }

  init()

  console.log(projectList)


  // return init()

})()

  // const toggleBoolean = (obj, prop) => {
  //   return (obj[prop]) ? false : true
  // }

  // const toggleDone = (obj) => {
  //   const prop = ('isDone' in obj) ? 'isDone' : ('isChecked' in obj) ? 'isChecked' : null

  //   return editProp(obj, prop, toggleBoolean(obj, prop))
  // }

  // const editProp = (obj, prop, newValue)  => {
  //   return obj[prop] = newValue
  // }

  // const deleteObj = (obj, array) => {
  //   const objIndex = array.indexOf(obj)
  //   if (objIndex > -1) return array.splice(objIndex, 1)
  // }

    // const checkAllDates = () => {
  //   //today
  //   projectList.forEach(project => project.isToday = checkToday(project.dueDate))
  //   projectList.forEach(project => project.todoList.forEach(todo => todo.isToday = checkToday(todo.dueDate)))

  //   //past
  //   projectList.forEach(project => project.isPast = isPast(parseISO(project.dueDate)))
  //   projectList.forEach(project => project.todoList.forEach(todo => todo.isPast = isPast(parseISO(todo.dueDate))))

  //   //give time readable
  // }