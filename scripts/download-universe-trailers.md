# Téléchargement des génériques d'univers

Ce guide explique comment télécharger les génériques officiels pour chaque univers de streaming.

## Prérequis

Installez youtube-dl ou yt-dlp :
```bash
# Pour youtube-dl
pip install youtube-dl

# Pour yt-dlp (version plus récente et mieux maintenue)
pip install yt-dlp
```

## URLs des génériques

Voici les URLs YouTube des génériques officiels :

- **Netflix**: https://www.youtube.com/watch?v=RXJo86FGYAM
- **Disney+**: https://www.youtube.com/watch?v=r43_WLqNcZo
- **Prime Video**: https://www.youtube.com/watch?v=dtUJvOj3GLc
- **Paramount+**: https://www.youtube.com/watch?v=bUHK7DoQ340
- **Apple TV+**: https://www.youtube.com/watch?v=3517fJ4bbMI
- **Marvel**: https://www.youtube.com/watch?v=LBZJLJqQFwM
- **DC**: https://www.youtube.com/watch?v=OQfj58Pbzwk

## Téléchargement des vidéos

Utilisez la commande suivante pour télécharger chaque générique :

```bash
# Avec youtube-dl
youtube-dl -o "client/public/trailers/netflix.mp4" "https://www.youtube.com/watch?v=RXJo86FGYAM"

# Avec yt-dlp (recommandé)
yt-dlp -o "client/public/trailers/netflix.mp4" "https://www.youtube.com/watch?v=RXJo86FGYAM"
```

## Téléchargement automatique

Vous pouvez créer un script batch pour télécharger toutes les vidéos :

```bash
#!/bin/bash
# download-all-trailers.sh

trailers=(
  "netflix:RXJo86FGYAM"
  "disney:r43_WLqNcZo"
  "prime:dtUJvOj3GLc"
  "paramount:bUHK7DoQ340"
  "apple:3517fJ4bbMI"
  "marvel:LBZJLJqQFwM"
  "dc:OQfj58Pbzwk"
)

for trailer in "${trailers[@]}"; do
  IFS=':' read -r name id <<< "$trailer"
  echo "Téléchargement du générique $name..."
  yt-dlp -o "client/public/trailers/$name.mp4" "https://www.youtube.com/watch?v=$id"
done

echo "Tous les génériques ont été téléchargés !"
```

## Conversion et optimisation

Pour optimiser les vidéos pour le web, vous pouvez utiliser ffmpeg :

```bash
# Convertir en format webm pour une meilleure compatibilité
ffmpeg -i client/public/trailers/netflix.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -b:a 128k -c:a libopus client/public/trailers/netflix.webm

# Réduire la durée à 15 secondes
ffmpeg -i client/public/trailers/netflix.mp4 -ss 00:00:00 -t 00:00:15 -c copy client/public/trailers/netflix-short.mp4
```

## Intégration dans l'application

Une fois les vidéos téléchargées, elles seront automatiquement utilisées par l'application dans la section "Univers" de la page d'accueil.