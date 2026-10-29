(function () {
  "use strict";

  const navbar = document.querySelector(".ff-navbar");
  const navCollapseEl = document.getElementById("mainNav");
  const navLinks = document.querySelectorAll(".ff-navbar .nav-link");
  const navHeight = () => (navbar ? navbar.offsetHeight : 0);

  // Smooth scrolling for in-page links (offset for sticky navbar)
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      const id = link.getAttribute("href");
      if (id.length < 2) { e.preventDefault(); return; } // placeholder links such as Login
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight() + 1;
      window.scrollTo({ top: top, behavior: "smooth" });
      // Close the mobile menu after choosing a link
      if (navCollapseEl && navCollapseEl.classList.contains("show") && window.bootstrap) {
        window.bootstrap.Collapse.getOrCreateInstance(navCollapseEl).hide();
      }
    });
  });

  // Navbar shadow + active link highlighting on scroll
  const sections = ["home", "vegetables", "about", "contact"]
    .map(function (id) { return document.getElementById(id); }).filter(Boolean);

  function onScroll() {
    navbar.classList.toggle("scrolled", window.scrollY > 10);
    const pos = window.scrollY + navHeight() + 120;
    let current = "home";
    sections.forEach(function (s) { if (s.offsetTop <= pos) current = s.id; });
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) current = "contact";
    navLinks.forEach(function (l) { l.classList.toggle("active", l.getAttribute("href") === "#" + current); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Graceful fallback if a remote photo fails to load
  document.querySelectorAll(".ff-card-img img, .ff-about-img img").forEach(function (img) {
    img.addEventListener("error", function () {
      img.style.display = "none";
      img.parentElement.classList.add("img-missing");
    });
  });

  // Footer year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();

