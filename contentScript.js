console.log('Content script loaded');

console.log(Math.round(Date.now() / 1000));

var getJoke = new XMLHttpRequest();

getJoke.onreadystatechange = function () {
  if (this.status == 200 && this.readyState == 4) {
    console.log(2);
    console.log(this.response);
  }
};
getJoke.open('GET', 'https://api.chucknorris.io/jokes/random', true);
getJoke.send();
