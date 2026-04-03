# 🛡️ Idempotence & Robustesse : Le Guide du Survivant Backend

Salut Kenan ! 👋 Deuxième round de notre audit. Après les race conditions, on s'attaque à un concept vital en production : **l'Idempotence**. Ou comment faire en sorte que "cliquer deux fois comme un sourd" ne casse pas le système.

---

## 🤔 1. C'est quoi l'idempotence ?
C'est la propriété qu'a une opération de produire le même résultat, qu'on l'appelle une fois ou dix fois. 
*   **Idempotent** : Éteindre la lumière (si elle est déjà éteinte, elle le reste).
*   **NON Idempotent** : Tirer une flèche (chaque tir consomme une flèche).

---

## 🔍 2. Audit de l'existant

### ✅ Le Gameplay : Idempotence Naturelle
Dans notre `PlayMoveUseCase`, on a cette garde :
```typescript
if (pos === 1 && match.player1Move !== null) throw new Error('Déjà joué !');
```
Grâce au mono-thread de Node.js, même si deux paquets "Pierre" arrivent en même temps, le premier passe et le second se mange une erreur 400. Le score ne sera jamais calculé deux fois. **C'est propre.**

### ⚠️ Stripe & Webhooks : Idempotence "Soft"
Actuellement, si Stripe nous renvoie le même succès de paiement :
1. On cherche l'user.
2. On met `subscriptionTier = 2`.
3. On sauvegarde.
C'est **idempotent sur l'état** (il reste PRO), mais c'est **inefficace** (on récrit en DB pour rien). 

### 🚨 Statistiques Globales : Le Danger (Corrigé !)
Avant, nos statistiques chargeaient l'objet, faisaient `total++` et sauvegardaient. C'était le chaos.
**La solution implémentée :** L'utilisation de `.increment()`. C'est une opération atomique SQL. Peu importe le nombre d'appels simultanés, la base de données gère la file d'attente.

---

## 🏆 3. Comment faire encore mieux ? (Le niveau "Pro")

Pour une idempotence parfaite (surtout pour les paiements), on devrait utiliser des **Clés d'Idempotence** :
1. Stripe nous envoie un `SessionID`.
2. On vérifie en base : "Est-ce que j'ai déjà traité ce `SessionID` ?".
3. Si oui -> On répond `200 OK` direct sans rien toucher.
4. Si non -> On traite, on enregistre l'ID, et on sauvegarde.

---

## 🧪 4. Résumé des protections ajoutées
-   **Atomic Increments** : Finies les stats qui disparaissent dans la nature.
-   **Optimistic Locking** : Même sur l'ELO, si deux transactions essaient de s'écraser, TypeORM lève le bouclier (`VersionColumn`).
-   **Validation de Double Coup** : Impossible de tricher en spammant le bouton "Envoyer".

**En résumé : Le backend est maintenant une forteresse.** 🏰💪
