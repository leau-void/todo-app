function updateStorage(array) {
  localStorage.clear();

  array.forEach((element, index) => {
    localStorage.setItem(("element" + index), JSON.stringify(array[index]));
  });
}

function retrieveStorage() {
  const storageLen = localStorage.length;

  const array = []

  for (let i = 0; i < storageLen; i++) {
    array.push(JSON.parse(localStorage.getItem("element" + i)));
  }

  return array
}


export { updateStorage, retrieveStorage }