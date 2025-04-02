# Résolution de l'erreur "Duplicate column name 'UserId'"

## Problème
L'erreur "Duplicate column name 'UserId'" se produisait car il y avait une tentative de créer deux colonnes avec le même nom dans la table des commandes (Orders):
1. Une colonne `userId` définie manuellement dans le modèle
2. Une colonne `UserId` créée automatiquement par Sequelize pour la relation avec le modèle User

## Solution
Nous avons résolu ce problème en modifiant le nom de la colonne dans le modèle Order de `userId` à `UserId` pour suivre la convention de nommage de Sequelize. 

## Explication technique
Sequelize utilise par convention une majuscule pour les clés étrangères générées automatiquement (exemple: `UserId`). En définissant manuellement la colonne avec le nom `UserId`, nous évitons la duplication et nous alignons avec les conventions de Sequelize.

## Fichier modifié
- `backend/models/order.js`: Renommage de la colonne `userId` en `UserId`

Cette modification permet maintenant à la base de données de se créer correctement sans erreur de duplication de colonne.