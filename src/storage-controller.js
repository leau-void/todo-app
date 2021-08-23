function updateStorage(array, whichApp) {
  delete localStorage[whichApp]

  localStorage[whichApp] = JSON.stringify(array)
}

function retrieveStorage(whichApp) {
  return JSON.parse(localStorage[whichApp])
}


export { updateStorage, retrieveStorage }