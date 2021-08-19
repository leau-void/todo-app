// rn selected todo stays in each project and will auto be selected when this project is selected, decide if this behavior is good or if reset selected of todos when project change
// think i like it

//setup the edit function and addchecklist element in form function and 
//check function that builds select options and 
//check the forms gives the value of the project and 
//test the form

import { lightFormat, formatDistanceToNow } from 'date-fns'


function buildElementsTree (obj) {
const element = document.createElement(obj.tag)
for (let prop in obj) {
  switch (prop) {
    case "tag":
      break
    case "classes":
      obj.classes.forEach(cssClass => element.classList.add(cssClass))
      break
    case "text":
      element.textContent = obj.text
      break
    case "attributes":
      obj.attributes.forEach(attribute => element.setAttribute(attribute[0], attribute[1]))
      break
    case "children":
      obj.children.forEach(child => {
        element.appendChild(buildElementsTree(child))
      })
  }

}

return element
}

function displayConverter (inputObj = {}, indexes = []) {
	
	let _path = indexes.toString()

	const outputObj = {
		"tag": "div",
		"classes": ["content-div"],
		"attributes": [["data-path", _path], ["data-handler", "setSelectAttribute"]],
    "children": []
	}
	

  const isSelected = inputObj.selected
  let whenActive

	if (isSelected) {
	whenActive = {
			"tag": "div",
			"classes": ["when-active"],
		 "children": []
		}
		
		whenActive["children"].push({
			"tag": "button",
			"classes": ["delete-button"],
			"attributes": [["data-handler", "deleteObj"]],
			"text": "X"
		})
		whenActive["children"].push({
			"tag": "button",
			"classes": ["edit-button"],
			"attributes": [["data-handler", "editObj"]],
			"text": "EDIT"
			//maybe trash and pen icons??
		})
		}
	
	for (let prop in inputObj) {
		if (!inputObj.hasOwnProperty(prop))
		 continue
		let newElem
    if (isSelected) {
      if (prop === "notes" || prop === "description") {
				newElem = {
					"tag": "label",
					"classes": ["labels"],
					"text": (prop === "notes") ? "Notes :" : "Description :",
					"children": [
					{
						"tag": "div",
						"classes": ['${prop}-text'],
						"text": inputObj[prop]
					}
					]
				}
		
        whenActive["children"].push(newElem)
				
			} else if (prop === "checklist") {
        const	newChecklist = {
          "tag": "div",
          "classes": ["checklist-display"],
          "children": []
        }
        inputObj.checklist.forEach((element, index) => {
            newElem = {
              "tag": "label",
              "classes": ["checklist-element"],
              "attributes": [["data-handler", "toggleDone"], ["data-path", _path + "," + index ]],
              "text": element.name,
              "children": [
              {
                "tag": "input",
                "classes": ["checkbox"],
                "attributes": [["type", "checkbox"]]
              }
              ]
            }
            newChecklist["children"].push(newElem)
          })
          whenActive["children"].push(newChecklist)
        }
    }

		if (prop === "dueDate") {
				newElem = {
					"tag": "div",
					"classes": ["date", "labels"],
					"text": lightFormat(new Date(inputObj.dueDate), "yyyy-MM-dd"),
					"children": [
					{
						"tag": "div",
						"classes": ["date-relative"],
						"text": formatDistanceToNow(new Date(inputObj.dueDate))
					}
					]
				}
				outputObj["children"].push(newElem)
			} else if (prop === "priority") {
				newElem = {
					"tag": "label",
					"classes": ["labels", inputObj.priority],
					// have to use css selector .high > .toggle-button
					"attributes": [["data-handler", "togglePriority"]],
					"text": "Priority :",
					"children": [
					{
						"tag": "button",
						"classes": ["toggle-button"],
						"text": inputObj.priority
					}
					]
				}
				outputObj["children"].push(newElem)
			} else if (prop === "isDone") {
				newElem = {
					"tag": "label",
					"classes": ["labels", 'done-${inputObj.isDone}'],
					"attributes": [["data-handler", "toggleDone"]],
					"text": "Done ?",
					"children": [
					{
						"tag": "button",
						"classes": ["toggle-button"],
						"text": (inputObj.isDone) ? "Yes" : "No"
					}
					]
				}
				outputObj["children"].push(newElem)
			} else if (prop === "name") {
				newElem = {
					"tag": "div",
					"classes": ["name"],
					"text": inputObj.name
				}
				outputObj["children"].push(newElem)
			} 
	}

	if (inputObj.checkToday()) { 
		outputObj["classes"].push("today")
	} else if (inputObj.checkPast()) {
			outputObj["classes"].push("past")
	}
		
	if (isSelected) {
		outputObj["children"].push(whenActive)
		outputObj["classes"].push("selected")
		}
	
	return outputObj
}



const displayAll = function (mainList) {
		const projectContainer = document.querySelector("#project-container")
    Array.from(projectContainer.children).forEach(child => projectContainer.removeChild(child))
		mainList.forEach((project, index) => {
			projectContainer.appendChild(buildElementsTree(displayConverter(project, [index])))
				
      if (project.selected) {
					const todoContainer = document.querySelector("#todo-container")
          Array.from(todoContainer.children).forEach(child => todoContainer.removeChild(child))
					project.todoList.forEach((todo, indexTodo) => {
            const newElem = buildElementsTree(displayConverter(todo, [index, indexTodo]))
            newElem.querySelectorAll(".checkbox").forEach((checkbox, index) => {
              checkbox.checked = todo.checklist[index].isChecked
            })

						todoContainer.appendChild(newElem)
            
					})
				}
		})
	}
	
	
	export { displayAll }
