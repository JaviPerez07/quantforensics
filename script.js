/* Quant Forensics — JS mínimo: solo el año del footer */
(function () {
  "use strict";
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
