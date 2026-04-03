# 🕵️‍♂️ Rapport d'Audit : "Le Bug Fantôme" (Race Conditions)

Salut Kenan ! 👋 Voici l'analyse du plus grand braquage jamais tenté sur mon backend Chifoumi. Accroche-toi, on va parler de **Race Conditions**, cette maladie qui fait disparaître les données plus vite qu'un magicien qui a raté son tour.

---

## 🧐 1. L'Audit : Le scénario catastrophe
Imagine que je joue un match épique. Je suis en "Essai Gratuit". Au même moment, parce que je suis un champion, j'achète un **Skin Ultra-Rare** sur Stripe.

**Ce qui se passe dans les coulisses (C'est moche) :**
1.  **Match** : "Tiens, l'utilisateur X vient de finir. Il a 3 essais. Je vais lui en enlever un." (Charge l'objet User : 3 essais, 0 skins).
2.  **Stripe** : "Achat réussi ! L'utilisateur X a acheté le Skin #42." (Charge l'objet User : 3 essais, 0 skins).
3.  **Stripe** : Ajoute le skin et sauvegarde. **User en DB : 3 essais, Skin #42**. ✅
4.  **Match** : Enlève un essai (3-1=2) et sauvegarde son vieil objet User chargé au point 1. **User en DB : 2 essais, 0 skins**. 😱

**RÉSULTAT :** Le skin que j'ai payé avec mon vrai argent a DISPARU car le processus du match a écrasé la sauvegarde de Stripe avec ses vieilles données.

---

## 🧪 2. Théories de lutte contre le crime
On a trois grandes écoles pour régler ce bazar :

### A. Le Verrouillage Pessimiste (The Hulk 🥊)
On verrouille la ligne en base de données : "Personne ne touche à cet utilisateur tant que j'ai pas fini !".
-   **Pour** : Impossible de se rater.
-   **Contre** : Si beaucoup de gens jouent, ça crée des bouchons (deadlocks) et l'app devient lente.

### B. Le Verrouillage Optimiste (The Detective 🔍)
On ajoute une colonne `version`. À chaque sauvegarde, on vérifie si la version en base est la même que celle qu'on a lue. Si elle a changé, ça veut dire que quelqu'un est passé entre-temps.
-   **Pour** : Très rapide, pas de ralentissements.
-   **Contre** : Il faut gérer l'erreur si ça échoue (ex: réessayer la sauvegarde).

### C. La Mise à jour Atomique (The Sniper 🎯)
Au lieu de charger l'objet entier, on dit juste à la base : `UPDATE users SET trials = trials - 1 WHERE id = 'victor'`.
-   **Pour** : La base gère le calcul elle-même, aucun risque de chevauchement.
-   **Contre** : Ça ne marche que pour des calculs simples (pas pour ajouter un skin dans une liste complexe).

---

## 🏆 3. La Décision Finale : L'approche hybride
Pour ce projet, j'ai choisi de combiner **Optimistic Locking** (le Détective) et **Atomic Updates** (le Sniper).

1.  **Armor Plating** : J'ai ajouté `@VersionColumn` à l'entité User. Si Stripe et le Match essaient de sauvegarder en même temps, l'un des deux va échouer au lieu de tout casser.
2.  **Surgical Strike** : Pour le compteur d'essais, j'utilise une requête atomique `decrement()`. Plus besoin de charger l'utilisateur pour lui enlever un match !

---

## 💻 4. L'implémentation
-   **User Entity** : Ajout de `version: number` avec le décorateur magique.
-   **Repository** : Création de `decrementTrialMatches` pour une précision chirurgicale.
-   **Gateway** : Nettoyage du code pour arrêter de charger/sauvegarder inutilement les profils.

**Code propre, données sauves. C'est ça le renforcement backend !** 🚀⛓️
