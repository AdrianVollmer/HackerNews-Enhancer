(function () {
  if (localStorage.getItem('hn-dark') === '1') {
    document.documentElement.classList.add('hn-dark');
  }
}());
