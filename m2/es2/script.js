const jobTitle = document.querySelectorAll(".jobTitle");

jobTitle.forEach(item => item.addEventListener("mouseover", event => document.body.style.cursor = "pointer"));
jobTitle.forEach(item => item.addEventListener("mouseout", event => document.body.style.cursor = "auto"));
jobTitle.forEach(item => item.addEventListener("click", event => event.target.nextElementSibling.classList.toggle("hide")));