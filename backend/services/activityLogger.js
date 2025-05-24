const { User, UserActivity } = require('../models');

class ActivityLogger {
  /**
   * Enregistre une activité utilisateur
   * @param {Object} params
   * @param {Number} params.user_id - ID de l'utilisateur
   * @param {String} params.method - Type d'action
   * @param {String} params.path - Type d'action
   * @param {String} [params.target] - Cible de l'action
   * @param {Number} [params.target_id] - ID de la cible
   * @param {Object} [params.details] - Détails supplémentaires
   * @param {String} params.ip_address - Adresse IP
   * @param {String} [params.user_agent] - User-Agent
   * @param {String} [params.status] - Statut (success/failed/pending)
   * @param {String} [params.error_message] - Message d'erreur
   */
  static async logActivity(params) {
    try {
      const activity = await UserActivity.create({
        user_id: params.user_id,
        method: params.method,
        path: params.path,
        target: params.target,
        target_id: params.target_id,
        details: params.details,
        ip_address: params.ip_address,
        user_agent: params.user_agent,
        status: params.status || 'success',
        error_message: params.error_message
      });

      return activity;
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Logger l'erreur dans un système externe si nécessaire
    }
  }

  /**
   * Récupère les activités d'un utilisateur
   * @param {Number} userId - ID de l'utilisateur
   * @param {Object} [options] - Options de pagination/filtrage
   * @param {Number} [options.limit=50] - Nombre maximum d'activités
   * @param {Number} [options.page=1] - Page à retourner
   * @param {String} [options.method] - Filtrer par method
   * @param {String} [options.path] - Filtrer par path
   * @param {Date} [options.startDate] - Date de début
   * @param {Date} [options.endDate] - Date de fin
   */
  static async getUserActivities(userId, options = {}) {
    const limit = options.limit || 50;
    const page = options.page || 1;
    const offset = (page - 1) * limit;

    const where = { user_id: userId };

    if (options.method) {
      where.method = options.method;
    }

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.$gte = options.startDate;
      if (options.endDate) where.createdAt.$lte = options.endDate;
    }

    const { count, rows } = await UserActivity.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset,
      limit,
      include: [{
        model: User,
        attributes: ['id', 'firstname', 'email']
      }]
    });

    return {
      activities: rows,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit),
        limit
      }
    };
  }
}

module.exports = ActivityLogger;