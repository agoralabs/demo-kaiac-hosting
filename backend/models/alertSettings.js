module.exports = (sequelize, DataTypes) => {
    const AlertSettings = sequelize.define('AlertSettings', {
      storage_threshold: {
        type: DataTypes.INTEGER, // en %
        defaultValue: 80,
        validate: {
          min: 1,
          max: 100
        }
      },
      before_renewal: {
        type: DataTypes.INTEGER, // en jours
        defaultValue: 7,
        validate: {
          min: 1,
          max: 30
        }
      },
      payment_reminder: {
        type: DataTypes.INTEGER, // en jours avant échéance
        defaultValue: 3,
        validate: {
          min: 1,
          max: 30
        }
      },
      notify_by_email: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      notify_in_app: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      notify_by_sms: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      mute_all: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      category: {
      type: DataTypes.ENUM('subscription', 'account', 'platform', 'updates', 'offers'),
      allowNull: true
      },
      label: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    }, {
      tableName: 'alert_settings',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  
    AlertSettings.associate = (models) => {
      AlertSettings.belongsTo(models.User, {
        foreignKey: 'user_id',
        onDelete: 'CASCADE'
      });
    };
  
    // Méthode pour appliquer les paramètres par défaut
    AlertSettings.applyDefaults = async (userId) => {
      const setting1 = await AlertSettings.create({ 
        user_id: userId,
        category: 'subscription',
        label: 'Abonnements et paiements',
        description: 'Notifications concernant vos abonnements, factures, paiements et renouvellements.'
      });

      const setting2 = await AlertSettings.create({ 
        user_id: userId,
        category: 'account',
        label: 'Problèmes de compte',
        description: 'Notifications concernant les problèmes de sécurité, connexions suspectes ou problèmes avec votre compte.'
      });

      const setting3 = await AlertSettings.create({ 
        user_id: userId,
        category: 'platform',
        label: 'Perturbations de la plateforme',
        description: 'Notifications concernant les interruptions de service, maintenance planifiée ou problèmes techniques.'
      });

      const setting4 = await AlertSettings.create({ 
        user_id: userId,
        category: 'updates',
        label: 'Mises à jour',
        description: 'Notifications concernant les nouvelles fonctionnalités, améliorations et mises à jour de la plateforme.'
      });

      const setting5 = await AlertSettings.create({ 
        user_id: userId,
        category: 'offers',
        label: 'Offres spéciales',
        description: 'Notifications concernant les promotions, remises et offres spéciales.'
      });

      return [setting1, setting2, setting3, setting4, setting5];
    };

    // Méthode pour mettre à jour les settings à partir d'un tableau de settings
    AlertSettings.updateFromSettings = async (userId, settings) => {
      for (const setting of settings) {
        await AlertSettings.update(setting, {
          where: {
            user_id: userId,
            category: setting.category
          }
        });
      }
    };
  
    // Méthode pour vérifier si une alerte doit être envoyée
    AlertSettings.prototype.shouldNotify = function(type) {
      if (this.mute_all) return false;
      
      switch(type) {
        case 'storage':
          return this.notify_storage;
        case 'payment':
          return this.notify_payment;
        default:
          return this.notify_in_app;
      }
    };
  
    return AlertSettings;
  };