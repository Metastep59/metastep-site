# Comment déposer une démo vidéo

Ce dossier reçoit les vidéos de démo du site. Dès qu'un fichier est déposé
ici avec le bon nom, le site l'affiche automatiquement, sans intervention
technique. Tant qu'il n'y a rien, le site montre l'écran simulé avec la
mention « Démo en cours de tournage » : rien à faire de ce côté-là.

## Les noms de fichiers à respecter

Chaque brique a son propre nom de fichier. Respecte-le exactement (minuscules,
tirets, extension) sinon le site ne trouvera pas la vidéo.

| Brique | Nom du fichier vidéo |
|---|---|
| Tri des mails et réponses prêtes | `tri-des-mails.mp4` |
| Classement des documents | `classement-des-documents.mp4` |
| Compte-rendu du matin | `compte-rendu-du-matin.mp4` |
| Remontée de pannes | `remontee-de-pannes.mp4` |
| Veille prix fournisseurs (plus tard) | `veille-prix-fournisseurs.mp4` |

## Le fichier vidéo lui-même

- Format : **MP4**, encodage H.264.
- Résolution : **1080p maximum** (pas la peine de monter plus haut, ça
  alourdit juste le fichier sans rien apporter à l'écran).
- Tu peux aussi déposer une version **WebM** du même nom (par exemple
  `tri-des-mails.webm`) à côté du MP4. C'est facultatif : si elle est là,
  le site s'en sert en priorité parce qu'elle est plus légère ; sinon il
  utilise le MP4 tout seul, sans problème.

## L'image d'attente (le poster)

Dépose une image nommée comme la vidéo, avec l'extension `.jpg` :
par exemple `tri-des-mails.jpg`. C'est l'image que le visiteur voit avant
de cliquer sur lecture. Si tu ne la déposes pas, la vidéo fonctionne quand
même, elle n'a simplement pas d'image d'attente particulière.

## Les chapitres (facultatif)

Si tu veux que les repères type « 0:00 le mail arrive », « 0:06 classé
devis » s'affichent sous la barre de lecture, dépose un fichier texte
nommé comme la vidéo avec l'extension `.json` : par exemple
`tri-des-mails.json`.

Le contenu est une liste de repères, chacun avec le moment (en secondes)
et le libellé à afficher à ce moment-là. Exemple complet pour la brique
tri des mails :

```json
[
  { "t": 0, "libelle": "LE MAIL ARRIVE" },
  { "t": 6, "libelle": "CLASSÉ « DEVIS »" },
  { "t": 14, "libelle": "RÉPONSE RÉDIGÉE" },
  { "t": 22, "libelle": "RELU, ENVOYÉ" }
]
```

Si tu ne déposes pas ce fichier, la vidéo fonctionne quand même, elle
n'affiche simplement pas de chapitres détaillés.

## Les sous-titres : rien à fournir

Les sous-titres sont incrustés directement dans l'image au moment du
montage. Il n'y a pas de fichier de sous-titres séparé à déposer ici, et
rien à faire de plus de ce côté-là.

## Ce qui se passe automatiquement une fois le fichier déposé

Dès que `<brique>.mp4` est en ligne, le site, pour cette brique :

- remplace l'écran simulé par un vrai lecteur vidéo, avec un bouton de
  lecture (rien ne se joue tout seul, il faut cliquer) ;
- affiche la durée réelle de la vidéo, lue directement dans le fichier
  (jamais une durée inventée à l'avance) ;
- affiche les chapitres si le fichier `.json` est présent ;
- active les boutons « Voir la démo » qui étaient grisés ailleurs sur la
  page, avec la vraie durée dans leur libellé ;
- enlève la mention « Démo en cours de tournage ».

Si tu retires le fichier `.mp4`, tout revient automatiquement à l'écran
simulé et à la mention « Démo en cours de tournage ». Il n'y a rien à
recoder, rien à redéployer : juste déposer ou retirer le fichier au bon
endroit, avec le bon nom.
