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
        onDelete: 'CASCADE',
        unique: true // Un paramètre par utilisateur
      });
    };
  
    // Méthode pour appliquer les paramètres par défaut
    AlertSettings.applyDefaults = async (userId) => {
      return await AlertSettings.create({ user_id: userId });
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