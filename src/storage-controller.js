function updateStorage(array, whichApp) {
  localStorage[whichApp] = JSON.stringify(array)
}

function retrieveStorage(whichApp) {
  return JSON.parse(localStorage[whichApp])
}

export { updateStorage, retrieveStorage }
