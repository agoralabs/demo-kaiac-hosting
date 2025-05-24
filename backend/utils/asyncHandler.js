/**
 * Wrapper pour les fonctions asynchrones dans les routes Express
 * Évite d'avoir à écrire try/catch dans chaque route
 * 
 * @param {Function} fn - Fonction asynchrone à exécuter
 * @returns {Function} Middleware Express avec gestion d'erreurs
 */
const asyncHandler = (fn) => {
  return function(req, res, next) {
    // Wrap in a Promise and catch any errors
    Promise.resolve(fn(req, res, next))
      .catch((error) => {
        console.log('AsyncHandler caught error:', error.message);
        next(error);
      });
  };
};

module.exports = asyncHandler;
