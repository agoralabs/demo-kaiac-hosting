const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const RedirectRule = sequelize.define('RedirectRule', {
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Nom de la règle'
    },
    type: {
      type: DataTypes.ENUM('redirect', 'rewrite'),
      allowNull: false,
      comment: 'Type de règle: redirection ou réécriture'
    },
    source: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Chemin source à rediriger/réécrire (peut contenir des expressions régulières)'
    },
    destination: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Chemin de destination pour la redirection/réécriture'
    },
    status_code: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Code HTTP pour les redirections (301, 302, 303, 307, 308)'
    },
    rewrite_rule: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Règle de réécriture spécifique (format .htaccess ou nginx)'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Indique si la règle est active'
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      comment: 'Priorité d\'exécution de la règle (plus petit = plus prioritaire)'
    },
    website_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'websites',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'Site web associé à cette règle'
    }
  }, {
    tableName: 'redirect_rules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_redirect_rules_website',
        fields: ['website_id']
      },
      {
        name: 'idx_redirect_rules_priority',
        fields: ['priority']
      }
    ]
  });

  // Associations
  RedirectRule.associate = (models) => {
    RedirectRule.belongsTo(models.Website, {
      foreignKey: {
        name: 'website_id',
        allowNull: false
      },
      as: 'website'
    });
  };

  // Méthodes statiques
  RedirectRule.findByWebsite = async function(websiteId) {
    return await RedirectRule.findAll({
      where: { website_id: websiteId },
      order: [['priority', 'ASC'], ['created_at', 'ASC']]
    });
  };


  return RedirectRule;
};
