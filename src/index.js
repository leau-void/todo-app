import './style.css'
import storageController from './storage-controller.js'
import displayController from './display-controller.js'
import { formatDistanceToNow, add, lightFormat, compareAsc, parseISO } from 'date-fns'

console.log(formatDistanceToNow((new Date()), { addSuffix: true }))

const logicWrapper = (() => {
  const projectList = []

  const todoFactory = (args = {}) => {
  // template {name, description, dueDate, priority, notes, checklist}
    return Object.assign({}, args)
  }

  const projectFactory = (args = {}) => {
  // template {name,dueDate}
    return Object.assign({}, args, {todoList: []})
  }

  const orderArray = (array) => {
    let orderFunc

    if (array[0].dueDate) { 
      orderFunc = function (lastElem, nextElem) { 
        return compareAsc(parseISO(lastElem.dueDate), parseISO(nextElem.dueDate))
      }
    } else if ('isDone' in array[0]) {
      orderFunc = function (lastElem, nextElem) {
        return (nextElem.isDone == false && lastElem.isDone == true) ? -1 : 1
      }
    }


    array.sort((lastElem, nextElem) => {
      return orderFunc(lastElem, nextElem)
    }) 
    return array
  }

  const addToList = (newObj, nameProject) => {
    if (nameProject) {
      const project = projectList.find(x => x.name === nameProject)

      if (!project) {
        addToList(projectFactory({name: nameProject, dueDate: newObj.dueDate}))
        addToList(newObj, projectList[projectList.length - 1].name)
        return orderArray(projectList)
      }

      orderArray(newObj.checklist)
      project.todoList.push(newObj)
      return orderArray(project.todoList)
    } else {
      projectList.push(newObj)
      return orderArray(projectList)
    }
  }

  const init = () => {
    const dueDate = lightFormat(add(new Date(), {weeks: 1}), 'yyyy-MM-dd')
    addToList(todoFactory({name: "Fill Todo App", description: "Fill this Todo App so it can assist me in my busy life.", dueDate, priority: "high", notes: "Very Important.", checklist: [{name:"first todo", isDone: true}, {name: "second todo", isDone: false}, {name: "third todo", isDone: true}, {name: "fourth todo", isDone: false}]}), "default")
  }

  init()

  console.log(projectList)

})()