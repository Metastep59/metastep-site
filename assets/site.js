/*
 * MetaStep - site.js
 * Composant vidéo des démos + jauge de l'offre de lancement.
 * Aucune dépendance, aucune requête externe (tout reste sur metastep.fr).
 * Chargé sur la page d'accueil uniquement.
 *
 * Règle d'or : si un fichier vidéo n'existe pas encore, on ne touche à
 * rien. L'écran simulé et la mention "Démo en cours de tournage" restent
 * affichés. On n'invente jamais une durée, on ne montre jamais un bouton
 * de lecture qui ne joue rien.
 */
(function () {
  "use strict";

  // On attend la fin du chargement, puis un moment creux : les sondes reseau
  // (une par emplacement video) ne doivent pas concurrencer l'affichage.
  demarrer(function () {
    initVideos();
    initJauge();
  });

  function demarrer(suite) {
    var lancer = function () {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(suite, { timeout: 2000 });
      } else {
        window.setTimeout(suite, 200);
      }
    };
    if (document.readyState === "complete") {
      lancer();
    } else {
      window.addEventListener("load", lancer);
    }
  }

  // =====================================================================
  // Composant vidéo (.ms-video)
  // =====================================================================

  function initVideos() {
    var figures = document.querySelectorAll(".ms-video[data-brique]");
    figures.forEach(function (figure) {
      // Chaque figure est autonome : une erreur sur l'une ne doit jamais
      // empêcher les autres de fonctionner.
      try {
        equiperFigure(figure);
      } catch (erreur) {
        // On ne fait rien : l'écran simulé reste affiché tel quel.
      }
    });
  }

  function equiperFigure(figure) {
    var brique = figure.getAttribute("data-brique");
    if (!brique) return;

    teteHttp("videos/" + brique + ".mp4")
      .then(function (existe) {
        if (!existe) return; // pas de vidéo déposée : rien ne change
        construireLecteur(figure, brique);
      })
      .catch(function () {
        // Erreur réseau : rien ne change.
      });
  }

  // Requête HEAD tolérante : se résout à true/false, ne rejette jamais.
  function teteHttp(url) {
    if (typeof fetch !== "function") return Promise.resolve(false);
    return fetch(url, { method: "HEAD", cache: "no-store" })
      .then(function (reponse) {
        return !!reponse && reponse.status === 200;
      })
      .catch(function () {
        return false;
      });
  }

  // Construit le lecteur réel et remplace l'écran simulé par la vidéo.
  function construireLecteur(figure, brique) {
    var titre = figure.getAttribute("data-titre") || "Démo";
    var ecran = figure.querySelector(".ms-video__ecran");
    var etat = figure.querySelector(".ms-video__etat");

    var conteneur = document.createElement("div");
    conteneur.className = "ms-video__lecteur";

    // La vidéo affichée garde preload="none" (poids de page, cf. brief
    // performance) : on ne télécharge rien avant le clic sur lecture.
    var video = document.createElement("video");
    video.setAttribute("preload", "none");
    video.setAttribute("playsinline", "");
    video.playsInline = true;
    video.controls = true;
    video.muted = true; // son coupé au départ, l'utilisateur le remet lui-même
    video.setAttribute("aria-label", titre);

    // Poster : seulement si l'image répond bien (jamais une image cassée).
    teteHttp("videos/" + brique + ".jpg")
      .then(function (existeImage) {
        if (existeImage) video.poster = "videos/" + brique + ".jpg";
      })
      .catch(function () {});

    // webm si disponible (plus léger), mp4 toujours en repli.
    teteHttp("videos/" + brique + ".webm")
      .then(function (existeWebm) {
        if (existeWebm) {
          var sourceWebm = document.createElement("source");
          sourceWebm.src = "videos/" + brique + ".webm";
          sourceWebm.type = "video/webm";
          video.appendChild(sourceWebm);
        }
        ajouterSourceMp4(video, brique);
      })
      .catch(function () {
        ajouterSourceMp4(video, brique);
      });

    conteneur.appendChild(video);

    var boutonLecture = document.createElement("button");
    boutonLecture.type = "button";
    boutonLecture.className = "ms-video__lecture";
    boutonLecture.setAttribute("aria-label", "Lire la démo : " + titre);

    var duree = document.createElement("span");
    duree.className = "ms-video__duree";

    var barre = document.createElement("div");
    barre.className = "ms-video__barre";

    var chapitresConteneur = document.createElement("div");
    chapitresConteneur.className = "ms-video__chapitres";

    // On remplace l'écran simulé seulement une fois la structure prête,
    // pour ne jamais laisser un état intermédiaire visible.
    if (ecran && ecran.parentNode) {
      ecran.parentNode.replaceChild(conteneur, ecran);
    } else {
      figure.appendChild(conteneur);
    }
    conteneur.appendChild(boutonLecture);
    conteneur.appendChild(duree);
    conteneur.appendChild(barre);
    conteneur.appendChild(chapitresConteneur);

    if (etat && etat.parentNode) etat.parentNode.removeChild(etat);

    figure.classList.add("ms-video--pret");

    // Lecture uniquement au clic, jamais automatique.
    boutonLecture.addEventListener("click", function () {
      video.play().catch(function () {
        // Lecture refusée par le navigateur : les contrôles natifs restent utilisables.
      });
    });

    // Une seule vidéo à la fois : en démarrer une met les autres en pause.
    video.addEventListener("play", function () {
      metttreEnPauseLesAutres(video);
      figure.classList.add("ms-video--en-cours");
    });
    video.addEventListener("pause", function () {
      figure.classList.remove("ms-video--en-cours");
    });

    // La durée doit être celle du fichier, jamais une valeur inventée.
    // Comme la vidéo visible reste en preload="none" (elle ne charge rien
    // avant le clic), on utilise une seconde vidéo invisible, avec
    // preload="metadata", uniquement pour lire la durée réelle tout de
    // suite. Elle est détruite dès que la durée est connue.
    lireDureeReelle(brique, function (dureeTexte) {
      if (!dureeTexte) return;
      duree.textContent = dureeTexte;
      mettreAJourBoutonsExternes(brique, dureeTexte);
    });

    // Chapitres, si le fichier existe.
    chargerChapitres(brique, video, barre, chapitresConteneur);

    // Boutons "Démo en cours de tournage" désactivés ailleurs sur la page.
    activerBoutonsExternes(brique, figure);
  }

  function ajouterSourceMp4(video, brique) {
    var sourceMp4 = document.createElement("source");
    sourceMp4.src = "videos/" + brique + ".mp4";
    sourceMp4.type = "video/mp4";
    video.appendChild(sourceMp4);
  }

  function metttreEnPauseLesAutres(videoActive) {
    var toutes = document.querySelectorAll(".ms-video video");
    toutes.forEach(function (v) {
      if (v !== videoActive && !v.paused) v.pause();
    });
  }

  // Lit la durée réelle du fichier via une vidéo hors écran, sans jamais
  // télécharger la vidéo visible avant le clic de l'utilisateur.
  function lireDureeReelle(brique, quandPrete) {
    var sonde = document.createElement("video");
    sonde.setAttribute("preload", "metadata");
    sonde.muted = true;
    sonde.style.display = "none";

    var nettoyer = function () {
      sonde.removeAttribute("src");
      try { sonde.load(); } catch (e) {}
      if (sonde.parentNode) sonde.parentNode.removeChild(sonde);
    };

    sonde.addEventListener("loadedmetadata", function () {
      var texte = formaterDuree(sonde.duration);
      nettoyer();
      quandPrete(texte);
    });
    sonde.addEventListener("error", function () {
      nettoyer();
      quandPrete("");
    });

    sonde.src = "videos/" + brique + ".mp4";
    document.body.appendChild(sonde);
  }

  // Formate des secondes en "m:ss" (jamais de durée à virgule).
  function formaterDuree(secondes) {
    if (!isFinite(secondes) || secondes < 0) return "";
    var total = Math.round(secondes);
    var min = Math.floor(total / 60);
    var sec = total % 60;
    return min + ":" + (sec < 10 ? "0" : "") + sec;
  }

  // Chapitres depuis videos/<brique>.json : [{ "t": 0, "libelle": "..." }, ...]
  function chargerChapitres(brique, video, barre, chapitresConteneur) {
    if (typeof fetch !== "function") return;
    fetch("videos/" + brique + ".json", { cache: "no-store" })
      .then(function (reponse) {
        if (!reponse || reponse.status !== 200) return null;
        return reponse.json();
      })
      .then(function (liste) {
        if (!Array.isArray(liste) || liste.length === 0) return;
        construireChapitres(liste, video, barre, chapitresConteneur);
      })
      .catch(function () {
        // Pas de fichier de chapitres : la barre reste simple, sans découpage.
      });
  }

  function construireChapitres(liste, video, barre, chapitresConteneur) {
    var segments = [];
    liste.forEach(function (chapitre) {
      var segment = document.createElement("span");
      segment.className = "ms-video__segment";
      barre.appendChild(segment);
      segments.push(segment);

      var libelle = document.createElement("span");
      libelle.className = "ms-video__chapitre";
      libelle.textContent = formaterDuree(chapitre.t) + " " + chapitre.libelle;
      chapitresConteneur.appendChild(libelle);
    });

    // Segment courant en or pendant la lecture.
    video.addEventListener("timeupdate", function () {
      var tempsActuel = video.currentTime;
      var indexCourant = -1;
      for (var i = 0; i < liste.length; i++) {
        if (tempsActuel >= liste[i].t) indexCourant = i;
      }
      segments.forEach(function (segment, i) {
        segment.classList.toggle("ms-video__segment--actif", i === indexCourant);
      });
    });
  }

  // Boutons "Démo en cours de tournage" présents ailleurs sur la page
  // (ex. bouton du hero), reliés à une brique via [data-brique] et
  // désactivés via l'attribut HTML "disabled".
  function activerBoutonsExternes(brique, figure) {
    var boutons = document.querySelectorAll(
      'button[disabled][data-brique="' + brique + '"]'
    );
    boutons.forEach(function (bouton) {
      bouton.disabled = false;
      bouton.addEventListener("click", function () {
        figure.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  // Met à jour le libellé de ces boutons une fois la durée réelle connue.
  function mettreAJourBoutonsExternes(brique, dureeTexte) {
    var boutons = document.querySelectorAll('button[data-brique="' + brique + '"]');
    boutons.forEach(function (bouton) {
      bouton.textContent = "Voir la démo · " + dureeTexte;
    });
  }

  // =====================================================================
  // Jauge de l'offre de lancement (contenu.json)
  // =====================================================================

  function initJauge() {
    if (typeof fetch !== "function") return;
    fetch("contenu.json", { cache: "no-store" })
      .then(function (reponse) {
        if (!reponse || reponse.status !== 200) return null;
        return reponse.json();
      })
      .then(function (donnees) {
        if (!donnees) return;
        remplirJauge(donnees);
      })
      .catch(function () {
        // Fichier manquant ou illisible : on laisse le markup tel quel.
      });
  }

  function remplirJauge(donnees) {
    var prises = Number(donnees.places_lancement_prises);
    var total = Number(donnees.places_lancement_total);
    if (!isFinite(prises) || !isFinite(total) || total <= 0) return;

    var texte = document.querySelector('[data-role="jauge-texte"]');
    if (texte) {
      var motPlace = prises > 1 ? "places prises" : "place prise";
      texte.textContent = prises + " " + motPlace + " sur " + total;
    }

    var segments = document.querySelectorAll('[data-role="jauge-segment"]');
    segments.forEach(function (segment, index) {
      segment.classList.toggle("est-pris", index < prises);
    });
  }
})();
