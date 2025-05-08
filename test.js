for (let i = 0; i < 101; i++) {
  fetch('http://localhost:3000')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error("Error", error));
}