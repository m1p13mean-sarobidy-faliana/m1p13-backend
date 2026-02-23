# mean-stack
## Préparation de l'environnement :
## 1. Installations :
## 1.1 MongoDb
- On peut avoir une instance de MongoDb sur [Mongo Alas](https://cloud.mongodb.com/)
- Ou installer une version spécifique avec l'image docker sur [Docker Hub](https://hub.docker.com/hardened-images/catalog/dhi/mongodb)

## 1.2 Node Js
[Install](https://nodejs.org/fr)

## Test
## 1. Commande pour demarrer le serveur
```bash
npm install && npm run dev
```

## 2. Tester les endpoints :
Quand l'environnement est prêt, on peut commencer les tests.  

## 2.1. Créer un utilisateur :
- POST /api/auth/register
