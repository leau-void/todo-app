import "./normalize.css";
import "./style.css";
import "./auth-page.css";
import { updateStorage, retrieveStorage } from "./storage-controller.js";
import {
  formatDistanceToNow,
  add,
  lightFormat,
  compareAsc,
  parseISO,
  isPast,
  isExists,
} from "date-fns";
import { displayAll } from "./display-controller.js";
import {
  getAuth,
  signOut,
  signInWithPopup,
  signInAnonymously,
  FacebookAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { app, db } from "./firebase-config";

/* global alert localStorage event */

const authPage = document.querySelector(".auth-page");
const projectList = [];
const forms = [];

let unsubSnapshotListener;

onAuthStateChanged(getAuth(), async (user) => {
  if (!user) return signInFlow();
  toggleLoginButton(user);
  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  //unsub from old user
  if (unsubSnapshotListener) unsubSnapshotListener();
  setupSnapshotListener(docRef);

  if (!docSnap.exists()) {
    try {
      await setDoc(docRef, {
        uid: user.uid,
        displayName: user.displayName,
        projectList: [],
      });
    } catch (err) {
      console.error("error creating doc", err);
    }
  }
});

function setupSnapshotListener(docRef) {
  unsubSnapshotListener = onSnapshot(docRef, (newDoc) => {
    const newProjectList = newDoc.data().projectList;
    console.log(newProjectList);
  });
}

function isSignedIn() {
  return !!getAuth().currentUser;
}

function toggleLoginButton(user) {
  const button = document.querySelector(".login-button");
  if (user.isAnonymous) button.classList.remove("hidden");
  else button.classList.add("hidden");
}

function updateDB(ref) {
  console.log(projectList);
  // updateDoc(ref, {});
}

async function signInUser(loginType) {
  const auth = getAuth();
  if (loginType === "anon") {
    await signInAnonymously(auth);
  } else {
    const provider = new (
      loginType === "fb" ? FacebookAuthProvider : GoogleAuthProvider
    )();
    await signInWithPopup(auth, provider);
  }
  return isSignedIn();
}

async function handleSignInButton(e) {
  const login = e.target.dataset.login;
  if (!login) return;
  if (await signInUser(login)) {
    authPage.classList.add("hidden");
    authPage.removeEventListener("click", handleSignInButton);
  }
}

async function signInFlow() {
  authPage.classList.remove("hidden");
  authPage.addEventListener("click", handleSignInButton);
}

window.signOutUser = () => {
  console.log("signout");
  signOut(getAuth());
};

const proto = {
  toggleBoolean(prop) {
    return !this[prop];
  },

  toggleDone() {
    const prop =
      "isDone" in this ? "isDone" : "isChecked" in this ? "isChecked" : null;

    return this.editProp(prop, this.toggleBoolean(prop));
  },

  togglePriority() {
    const prio = ["low", "medium", "high"];
    const whichCurrent = prio.findIndex(
      (possibility) => possibility === this.priority
    );
    const newPrio = whichCurrent === 2 ? prio[0] : prio[whichCurrent + 1];
    return this.editProp("priority", newPrio);
  },

  editProp(prop, newValue) {
    this[prop] = newValue;
  },

  editObj(args = {}) {
    const form = args.parent === projectList ? forms[0] : forms[1];
    form.show();
    form.setSubmit("edit");
    const has = Object.prototype.hasOwnProperty;
    for (const prop in args.self) {
      if (!has.call(args.self, prop)) continue;
      if (prop === "name" || prop === "notes" || prop === "description") {
        form[prop].value = args.self[prop];
      } else if (prop === "isDone" || prop === "priority") {
        form[prop].find(
          (input) => input.value === args.self[prop].toString()
        ).checked = true;
      } else if (prop === "dueDate") {
        const objDate = new Date(args.self.dueDate);
        form.date.value = lightFormat(objDate, "yyyy-MM-dd");
        form.time.value = lightFormat(objDate, "HH:mm");
      } else if (prop === "checklist") {
        args.self.checklist.forEach((checklistItem) =>
          form.addChecklist(checklistItem)
        );
      }
    }
  },

  deleteObj(args) {
    const objIndex = args.parent.indexOf(this);
    if (objIndex > -1) return args.parent.splice(objIndex, 1);
  },

  checkToday() {
    const objDateFormat = lightFormat(new Date(this.dueDate), "yyyy-MM-dd");
    const today = lightFormat(new Date(), "yyyy-MM-dd");

    return objDateFormat === today;
  },

  checkPast() {
    return isPast(parseISO(this.dueDate));
  },

  getFormattedTime() {
    return formatDistanceToNow(new Date(this.dueDate), { addSuffix: true });
  },

  orderSelfArrays() {
    for (const key in this) {
      if (this[key] instanceof Array) orderArray(this[key]);
    }
  },

  setPrototypeOfChildren() {
    for (const key in this) {
      if (this[key] instanceof Array)
        this[key].forEach((item) => Object.setPrototypeOf(item, proto));
    }
  },

  setSelectAttribute(args) {
    args.parent.forEach((obj) => delete obj.selected);
    this.selected = true;
  },
};

const todoFactory = (args = {}) => {
  // template {name, description, dueDate, priority, notes, checklist, isDone}

  if (args.checklist instanceof Array)
    args.checklist.forEach((item) => Object.setPrototypeOf(item, proto));

  return Object.assign(Object.create(proto), args);
};

const projectFactory = (args = {}) => {
  // template {name,dueDate, isDone}
  return Object.assign(Object.create(proto), args, { todoList: [] });
};

const protoForm = {
  addToList(args = {}) {
    let targetList = projectList;

    if (args.project) {
      targetList = findProjectTodoList(args.newObj, args.project);
    }

    targetList.push(args.newObj);
  },
  show() {
    this.resetSelf();
    this.self.classList.remove("visually-hidden");
    this.background.classList.remove("visually-hidden");
    if (this.index === 1) this.setSelectOption();
  },
  close() {
    this.resetSelf();
    this.self.classList.add("visually-hidden");
    this.background.classList.add("visually-hidden");
  },
  resetSelf() {
    this.self.reset();
    this.setSubmit();
    if (this.index === 1)
      Array.from(this.checklist.children).forEach((label) =>
        this.checklist.removeChild(label)
      );
  },
  submit(args = {}) {
    args.event.preventDefault();
    if (!this.checkValidInput()) return this.notValidHandler();
    const argsAddToList = {};

    argsAddToList.newObj =
      this.index === 0
        ? projectFactory(this.getValues())
        : todoFactory(this.getValues());

    if ("project" in argsAddToList.newObj) {
      argsAddToList.project = argsAddToList.newObj.project;
      delete argsAddToList.newObj.project;
    }

    if (args.oldTodoList) argsAddToList.newObj.todoList = args.oldTodoList;

    argsAddToList.newObj.selected = true;

    this.addToList(argsAddToList);

    if (args.oldObjParent) {
      const oldObjIndex = args.oldObjParent.findIndex(
        (element) => element === args.oldObj
      );
      args.oldObjParent.splice(oldObjIndex, 1);
    }

    this.close();
  },
  setSubmit(action) {
    const submitBtn = this.self.submit;
    const isEdit = action && action === "edit";

    submitBtn.value = isEdit ? "Save" : "Add";
    submitBtn.dataset.handler = isEdit ? "saveEdit" : "submit";
  },
  saveEdit(args = {}) {
    if (args.event) args.event.preventDefault();
    const oldObjParent =
      this.index === 0
        ? projectList
        : projectList.find((project) => project.selected).todoList;
    const oldObj = oldObjParent.find((obj) => obj.selected);
    if (oldObjParent === projectList)
      args = Object.assign(args, { oldTodoList: oldObj.todoList });
    const newArgs = Object.assign(args, { oldObjParent, oldObj });

    this.submit(newArgs);
  },
  checkValidInput() {
    const requiredInputs = ["name", "date", "time"];

    return requiredInputs.every((inputName) => {
      const dateArray = this.date.value
        .split("-")
        .map((numberAsString) => Number(numberAsString));
      if (
        inputName === "date" &&
        dateArray.length === 3 &&
        !isExists(...dateArray)
      )
        return false;
      return this[inputName].checkValidity();
    });
  },
  notValidHandler() {
    alert(
      "Name, Date and Time must have a value.\n" + "Date must be a valid date."
    );
  },
  getValues() {
    const valuesObj = {};
    const has = Object.prototype.hasOwnProperty;
    for (const prop in this) {
      if (
        has.call(this, prop) &&
        prop !== "date" &&
        prop !== "time" &&
        prop !== "background" &&
        prop !== "self" &&
        prop !== "index"
      )
        valuesObj[prop] = this[prop].value || this.undefHandler(prop);
    }

    for (const prop in valuesObj) {
      if (valuesObj[prop] === null || valuesObj[prop] === undefined)
        delete valuesObj[prop];
    }

    const date = [this.date.value, this.time.value].join("T");
    valuesObj.dueDate = new Date(parseISO(date));

    return valuesObj;
  },
  undefHandler(prop) {
    let selected;
    const arrayCheckListObj = [];

    switch (prop) {
      case "isDone":
        selected = this[prop].find((element) => element.checked);
        return JSON.parse(selected.value);
      case "priority":
        selected = this[prop].find((element) => element.checked);
        return selected.value;
      case "checklist":
        Array.from(this.checklist.children).forEach((checkboxLabel) => {
          const checklistObj = {};
          checklistObj.name = checkboxLabel.textContent;
          // Now they take X of child node into the textContent with add todo or edit, but will fix when changed to an image
          checklistObj.isChecked = checkboxLabel.children[0].checked;

          arrayCheckListObj.push(checklistObj);
        });

        return arrayCheckListObj;
    }
  },
  addChecklist(args = {}) {
    if (args.event) args.event.preventDefault();

    const label = document.createElement("label");
    label.textContent = args.name || this.self.inputChecklist.value;
    label.classList.add("checkbox-label-form");
    label.dataset.checklist = "";
    const checkbox = document.createElement("input");
    checkbox.setAttribute("type", "checkbox");
    checkbox.checked = args.isChecked || false;
    checkbox.classList.add("checkbox-form");
    label.appendChild(checkbox);
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-button");
    deleteBtn.setAttribute("data-handler", "deleteChecklist");
    label.appendChild(deleteBtn);
    this.checklist.appendChild(label);

    this.self.inputChecklist.value = "";
  },
  deleteChecklist(args = {}) {
    const closestLabel = args.event.target.closest("[data-checklist]");
    this.checklist.removeChild(closestLabel);
  },
  setSelectOption() {
    Array.from(this.project.children).forEach((oldOption) =>
      this.project.removeChild(oldOption)
    );

    for (let i = 0; i < projectList.length; i++) {
      const newOption = document.createElement("option");
      newOption.textContent = projectList[i].name;

      if (projectList[i].selected) newOption.setAttribute("selected", true);

      this.project.appendChild(newOption);
    }
  },
};

const formFactory = function (index) {
  // this refers to object representing form, this.self refers to DOM element of form

  function _setProp(element) {
    if (element.name in obj) {
      if (obj[element.name] instanceof Array) {
        obj[element.name].push(element);
      } else {
        obj[element.name] = [obj[element.name], element];
      }
    } else if (!element.classList.contains("no-form")) {
      obj[element.name] = element;
    }
  }

  const obj = {};
  obj.index = index;
  obj.self = document.forms[index];
  obj.background = document.querySelector(
    `.background-form[data-path='forms,${index}']`
  );
  Array.from(obj.self.elements).forEach((element) => _setProp(element));

  if (index === 1) {
    obj.checklist = document.getElementById("checklist-form-div");
    obj.self.inputChecklist = document.getElementById("checklist-input-form");
  }

  return Object.assign(Object.create(protoForm), obj);
};

const orderArray = (array) => {
  let orderFunc;

  if (array[0] && array[0].dueDate) {
    orderFunc = function (lastElem, nextElem) {
      return compareAsc(new Date(lastElem.dueDate), new Date(nextElem.dueDate));
    };
  }

  array.sort((lastElem, nextElem) => {
    return orderFunc(lastElem, nextElem);
  });
  return array;
};

const orderAllArrays = () => {
  orderArray(projectList);
  projectList.forEach((project) => project.orderSelfArrays());
};

const findProjectTodoList = (newObj, nameProject) => {
  const project = projectList.find((x) => x.name === nameProject);

  if (!project) {
    forms[0].addToList({
      newObj: projectFactory({
        name: nameProject,
        dueDate: newObj.dueDate,
        isDone: newObj.isDone,
      }),
    });
    return projectList[projectList.length - 1].todoList;
  } else {
    return project.todoList;
  }
};

// method has to be called in string
const updateWrap = (obj, objMethod, ...args) => {
  if (obj && obj[objMethod] instanceof Function) obj[objMethod](...args);

  orderAllArrays();
  updateStorage(projectList, "todoApp");
  displayAll(projectList);
};

const clickHandler = (event) => {
  const target = event.target;
  let closestHandler = target.closest("[data-handler]");
  if (closestHandler) closestHandler = closestHandler.dataset.handler;
  let _path = target.closest("[data-path]");

  if (_path) {
    _path = _path.dataset.path.split(",");
    const element = findPath(..._path);

    const args = {
      event,
      parent: element.parent,
      self: element.self,
    };

    if (element.self[closestHandler])
      return updateWrap(element.self, closestHandler, args);
  }
};

function findPath(project, todo, check) {
  let parent;
  let self;

  if (project === "forms") {
    parent = forms;
    self = parent[todo];

    return { self, parent };
  }
  switch (arguments.length) {
    case 1:
      parent = projectList;
      break;
    case 2:
      parent = projectList[project].todoList;
      break;
    case 3:
      parent = projectList[project].todoList[todo].checklist;
      break;
  }
  self = parent[arguments[arguments.length - 1]];

  return { self, parent };
}

const init = () => {
  forms.push(formFactory(0));
  forms.push(formFactory(1));

  if (!("todoApp" in localStorage)) {
    const dueDate = new Date(add(new Date(), { weeks: 1 }));
    forms[1].addToList({
      newObj: todoFactory({
        name: "Fill Todo App",
        description: "Fill this Todo App so it can assist me in my busy life.",
        dueDate,
        priority: "medium",
        notes: "Very Important.",
        checklist: [
          { name: "first item", isChecked: true },
          { name: "second item", isChecked: false },
          { name: "third item", isChecked: true },
          { name: "fourth item", isChecked: false },
        ],
        isDone: false,
      }),
      project: "default",
    });
    forms[1].addToList({
      newObj: todoFactory({
        name: "Past Todo",
        description: "Todos look like this when their due date is in the past.",
        dueDate: new Date(1999, 12, 31),
        priority: "low",
        isDone: false,
      }),
      project: "default",
    });
    forms[1].addToList({
      newObj: todoFactory({
        name: "Today Todo",
        description:
          "Todos look like this when their due date is the present day.",
        dueDate: new Date(),
        priority: "high",
        isDone: false,
      }),
      project: "default",
    });
  } else {
    retrieveStorage("todoApp").forEach((item) => projectList.push(item));
    projectList.forEach((project) => Object.setPrototypeOf(project, proto));
    projectList.forEach((project) => project.setPrototypeOfChildren());
    projectList.forEach((project) =>
      project.todoList.forEach((todo) => todo.setPrototypeOfChildren())
    );
  }
  updateWrap();
  document.addEventListener("click", () => clickHandler(event));
};

init();
