import './style.css'
import { updateStorage, retrieveStorage } from './storage-controller.js'
import displayController from './display-controller.js'
import { formatDistanceToNow, add, lightFormat, compareAsc, parseISO, isPast, isEqual, formatISO } from 'date-fns'
import areIntervalsOverlappingWithOptions from 'date-fns/esm/fp/areIntervalsOverlappingWithOptions/index';
import { displayAll } from './todo-from-phone'

console.log(formatDistanceToNow((new Date()), { addSuffix: true }))

;(() => {
  const projectList = []
  const forms = []

  const proto = {
    toggleBoolean (prop) {
      return (this[prop]) ? false : true
    },

    toggleDone () {
      const prop = ('isDone' in this) ? 'isDone' : ('isChecked' in this) ? 'isChecked' : null
  
      return this.editProp(prop, this.toggleBoolean(prop))
    },

    togglePriority () {
      const prio = ["low", "medium", "high"]
      const whichCurrent = prio.findIndex(possibility => possibility === this.priority)
      const newPrio = (whichCurrent === 2) ? prio[0] : prio[whichCurrent + 1]
      return this.editProp("priority", newPrio)
    },

    editProp (prop, newValue) {
      return this[prop] = newValue
    },

    editObj (args = {}) {
      let form = (args.parent === projectList) ? forms[0] : forms[1]
      form.show()
      form.self.name.value = args.self.name
      form.isDone.find(element => element.value === `${args.self.isDone}`).checked = true

      if (form.index === 1) {
        
      }
    },

    deleteObj (args) {
      const objIndex = args.parent.indexOf(this)
      if (objIndex > -1) return args.parent.splice(objIndex, 1)
    },

    checkToday () {
      const objDateFormat = lightFormat(new Date(this.dueDate), 'yyyy-MM-dd')
      const today = lightFormat(new Date(), 'yyyy-MM-dd')
  
      return (objDateFormat === today) ? true : false
    },

    checkPast () {
      return isPast(parseISO(this.dueDate))
    },

    getFormattedTime () {
      return formatDistanceToNow((new Date(this.dueDate)), { addSuffix: true })
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
    },

    setSelectAttribute (args) {
      args.parent.forEach(obj => delete obj.selected)
      this.selected = true
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


  const protoForm = {
    addToList (args = {}) {
        let targetList = projectList
    
        if (args.project) {
          targetList = findProjectTodoList(args.newObj, args.project)
        }
    
        targetList.push(args.newObj)
      
    },
    show () {
      this.self.reset()
      this.self.classList.remove("visually-hidden")
      this.background.classList.remove("visually-hidden")
      if (this.index === 1) this.setSelectOption()
    },
    close () {
      this.self.reset()
      this.self.classList.add("visually-hidden")
      this.background.classList.remove("visually-hidden")
    },
    submit (args = {}) {
      args.event.preventDefault()
      const argsAddToList = {}

      argsAddToList.newObj = (this.index === 0) ? projectFactory(this.getValues()) : todoFactory(this.getValues())

      if ("project" in argsAddToList.newObj) { 
        argsAddToList.project = argsAddToList.newObj.project
        delete argsAddToList.newObj.project
      }

      

      this.addToList(argsAddToList)

      this.close()
    },
    getValues () {
      const valuesObj = {}
      for (let prop in this) {
        if (this.hasOwnProperty(prop) && prop !== "date" && prop !== "time" && prop !== "background" && prop !== "self" && prop !== "index") valuesObj[prop] = this[prop].value || this.undefHandler(prop)
      }

      for (let prop in valuesObj) {
        if (valuesObj[prop] === null || valuesObj[prop] === undefined) delete valuesObj[prop]
      }

      let date = [this.date.value, this.time.value].join("T")
      valuesObj.dueDate = new Date(parseISO(date))

      return valuesObj
    },
    undefHandler (prop) {
      let selected
      switch (prop) {  
        case "isDone" || "priority":
          selected = this[prop].find(element => element.checked)
          return selected.value
          break;
        case "priority":
          selected = this[prop].find(element => element.checked)
          return selected.value 
          break;
        case "checklist":
          const arrayCheckListObj = []
          Array.from(this.checklist.children).forEach(checkboxLabel => {
            const checklistObj = {}
            checklistObj.name = checkboxLabel.textContent
            checklistObj.isChecked = checkboxLabel.children[0].checked

            arrayCheckListObj.push(checklistObj)
          })

          return arrayCheckListObj
          break;
        default:
          null
      }

    },
    addChecklist (args = {}) {
      args.event.preventDefault()
      
      const label = document.createElement("label")
      label.textContent = this.self.inputChecklist.value
      label.classList.add("checkbox-label-form")
      label.dataset.checklist = ""
      const checkbox = document.createElement("input")
      checkbox.setAttribute("type", "checkbox")
      checkbox.checked = false
      checkbox.classList.add("checkbox-form")
      label.appendChild(checkbox)
      const deleteBtn = document.createElement("button")
      deleteBtn.textContent = "X"
      deleteBtn.classList.add("delete-button")
      deleteBtn.setAttribute("data-handler", "deleteChecklist")
      label.appendChild(deleteBtn)
      this.checklist.appendChild(label)

      this.self.inputChecklist.value = ""
    },
    deleteChecklist (args = {}) {
      const closestLabel = event.target.closest("[data-checklist]")
      this.checklist.removeChild(closestLabel)
    },
    setSelectOption () {
      Array.from(this.project.children).forEach(oldOption => this.project.removeChild(oldOption))

      for (let i = 0; i < projectList.length; i++) {
        let newOption = document.createElement("option")
        newOption.textContent = projectList[i].name
        
        if (projectList[i].selected) newOption.setAttribute("selected", true)

        this.project.appendChild(newOption)
      }
    }
  }

  const formFactory = function (index) {
// this refers to object representing form, this.self refers to DOM element of form

    function _setProp (element) {
      if (element.name in obj) {
        if (obj[element.name] instanceof Array) { 
          obj[element.name].push(element)
        } else {
          obj[element.name] = [obj[element.name], element]
        }
      } else if (!element.classList.contains("no-form")) {
        obj[element.name] = element
      }
    }


    const obj = {}
    obj.index = index
    obj.self = document.forms[index]
    obj.background = document.querySelector(`.background-form[data-path="forms,${index}"]`)
    Array.from(obj.self.elements).forEach(element => _setProp(element))
    

    if (index === 1) {
      obj.checklist = document.getElementById("checklist-form-div")
      obj.self.inputChecklist = document.getElementById("checklist-input-form")
    }

    return Object.assign(Object.create(protoForm), obj)
  }


  const orderArray = (array) => {
    let orderFunc

    if (array[0] && array[0].dueDate) { 
      orderFunc = function (lastElem, nextElem) { 
        return compareAsc(new Date(lastElem.dueDate), new Date(nextElem.dueDate))
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
  }

  const findProjectTodoList = (newObj, nameProject) => {
    const project = projectList.find(x => x.name === nameProject)

    if (!project) {
      forms[0].addToList({newObj: projectFactory({name: nameProject, dueDate: newObj.dueDate, isDone: newObj.isDone})})
      return projectList[projectList.length -1].todoList
    } else {
      return project.todoList
    }
  }


// method has to be called in string
  const updateWrap = (obj, objMethod, ...args) => {
    if (obj && obj[objMethod] instanceof Function) obj[objMethod](...args)

    orderAllArrays()
    updateStorage(projectList)
    displayAll(projectList)
  }

  const clickHandler = () => {
    const target = event.target
    let closestHandler = target.closest("[data-handler]")
    if (closestHandler) closestHandler = closestHandler.dataset.handler
    let _path = target.closest("[data-path]")
    
    if (_path) {
      _path = _path.dataset.path.split(",")
      const element = findPath(..._path)

      const args = {
        event,
        parent: element.parent,
        self: element.self
      }

      if (element.self[closestHandler]) return  updateWrap(element.self, closestHandler, args)
    }
  }

  function findPath (project, todo, check) {
    let parent
    let self

    if (project === "forms") {
      parent = forms
      self = parent[todo]

      return { self, parent }
    }
    switch (arguments.length) {
      case 1:
        parent = projectList
        break;
      case 2:
        parent = projectList[project].todoList
        break;
      case 3:
        parent = projectList[project].todoList[todo].checklist
        break;
    }
    self = parent[arguments[arguments.length - 1]]
    
    return { self, parent }
  }

  const init = () => {
    forms.push(formFactory(0))
    forms.push(formFactory(1))

    if(!localStorage.length) {
      const dueDate = new Date(add(new Date(), {weeks: 1}))
      forms[1].addToList({ newObj: todoFactory({name: "Fill Todo App", description: "Fill this Todo App so it can assist me in my busy life.", dueDate, priority: "high", notes: "Very Important.", checklist: [{name:"first todo", isChecked: true}, {name: "second todo", isChecked: false}, {name: "third todo", isChecked: true}, {name: "fourth todo", isChecked: false}], isDone: false}), project: "default"})  
    } else {
      retrieveStorage().forEach(item => projectList.push(item))
      projectList.forEach(project => Object.setPrototypeOf(project, proto))
      projectList.forEach(project => project.setPrototypeOfChildren())
      projectList.forEach(project => project.todoList.forEach(todo => todo.setPrototypeOfChildren()))
    }
    updateWrap()
    document.addEventListener("click", clickHandler)
  }

  init()

  console.log("projectList:")
  console.log(projectList)

  console.log("forms:")
  console.log(forms)


  // return init()

})()