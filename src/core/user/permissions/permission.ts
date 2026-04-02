/**
 * Système de droits basé sur un bitmask.
 *
 * Chaque bit correspond à un droit :
 *   Bit 0 (valeur 1) → JOUEUR
 *   Bit 1 (valeur 2) → CHEF_EQUIPE
 *   Valeur 3 (0b11)  → tous les droits (admin)
 *
 * Exemples :
 *   permissions = 0  (0b00) → aucun droit
 *   permissions = 1  (0b01) → joueur
 *   permissions = 2  (0b10) → chef d'équipe
 *   permissions = 3  (0b11) → admin (tous les droits)
 */
export enum Permission {
  JOUEUR      = 0b01, // 1
  CHEF_EQUIPE = 0b10, // 2
}

/**
 * Vérifie si un user possède le droit requis via AND binaire.
 * Un admin (0b11) passe toutes les vérifications.
 */
export function hasPermission(userPermissions: number, required: Permission): boolean {
  return (userPermissions & required) === required;
}

/** Vérifie si un user possède TOUS les droits listés. */
export function hasAllPermissions(userPermissions: number, ...required: Permission[]): boolean {
  return required.every((p) => hasPermission(userPermissions, p));
}
