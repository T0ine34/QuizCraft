# QuizCraft

QuizCraft est une application de quiz en ligne. Ce document fournit toutes les informations nécessaires pour configurer, déployer et utiliser l'application.

## Configuration

1. Clonez le dépôt :
    ```sh
    git clone https://github.com/T0ine34/QuizCraft    
    cd QuizCraft
    ```

2. Installez les dépendances :
    ```sh
    npm install
    ```

3. Configurez les variables d'environnement :
    Créez un fichier `.env` à la racine du projet et ajoutez-y les variables suivantes :
    ```env
    JWT_SECRET="votre_secret_jwt"
    ```

## Déploiement

1. Compilez le projet :
    ```sh
    npm run build
    ```

2. Démarrez le serveur :
    ```sh
    npm start
    ```

## Utilisation

### Endpoints

La documentation des endpoints est disponible dans la documentation

#### Authentification

- **Inscription**
    ```http
    POST /api/register
    ```
    - **Body** :
        ```json
        {
            "username": "string",
            "password": "string"
        }
        ```

- **Connexion**
    ```http
    POST /api/login
    ```
    - **Body** :
        ```json
        {
            "username": "string",
            "password": "string"
        }
        ```

#### Quizzes

- **Créer un quiz**
    ```http
    POST /api/quizzes
    ```
    - **Headers** :
        ```http
        Authorization: Bearer <token>
        ```
    - **Body** :
        ```json
        {
            "title": "string",
            "description": "string",
            "questions": [
                {
                    "question": "string",
                    "options": ["string"],
                    "answer": "string"
                }
            ]
        }
        ```

- **Récupérer tous les quizzes**
    ```http
    GET /api/quizzes
    ```
    - **Headers** :
        ```http
        Authorization: Bearer <token>
        ```

- **Récupérer un quiz par ID**
    ```http
    GET /api/quizzes/{id}
    ```
    - **Headers** :
        ```http
        Authorization: Bearer <token>
        ```

- **Supprimer un quiz**
    ```http
    DELETE /api/quizzes/{id}
    ```
    - **Headers** :
        ```http
        Authorization: Bearer <token>
        ```

Pour plus de détails sur les endpoints, veuillez consulter le fichier OpenAPI inclus dans le projet.

## Documentation

La documentation complète du projet est générée avec Typedoc et est disponible dans le dossier [docs](http://_vscodecontentref_/1). Pour générer la documentation, exécutez la commande suivante :
```sh
npm run doc