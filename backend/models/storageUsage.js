module.exports = (sequelize, DataTypes) => {
    const StorageUsage = sequelize.define('StorageUsage', {
      used_storage_mb: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      measured_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      threshold_exceeded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      subscription_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'subscriptions',
            key: 'id'
          }
        }
    }, {
      tableName: 'storage_usage',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['subscription_id']
        },
        {
          fields: ['measured_at']
        }
      ],
      hooks: {
        beforeCreate: async (usageRecord) => {
          // Vérifier si le seuil est dépassé
          const subscription = await sequelize.models.Subscription.findByPk(usageRecord.subscription_id, {
            include: [{ model: sequelize.models.Plan }]
          });
          
          if (subscription?.Plan) {
            usageRecord.threshold_exceeded = usageRecord.used_storage_mb > subscription.Plan.included_storage_mb;
          }
        }
      }
    });
  
    StorageUsage.associate = (models) => {      
      StorageUsage.belongsTo(models.Subscription, {
        foreignKey: 'subscription_id',
        onDelete: 'CASCADE'
      });
    };
  
    // Méthode pour obtenir l'utilisation actuelle
    StorageUsage.getCurrentUsage = async function(subscription_id) {
      return await this.findOne({
        where: { subscription_id: subscription_id },
        order: [['measured_at', 'DESC']],
        include: [{
          model: sequelize.models.Subscription,
          include: [sequelize.models.Plan]
        }]
      });
    };
  
    // Méthode pour créer un enregistrement avec calcul automatique
    StorageUsage.recordUsage = async function(subscriptionId) {
      const websites = await sequelize.models.Website.findAll({
        where: { 
          subscription_id: subscriptionId 
        },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('used_storage_mb')), 'total_used']
        ],
        raw: true
      });
  
      const totalUsed = websites[0]?.total_used || 0;
  
      return await this.create({
        subscription_id: subscriptionId,
        used_storage_mb: totalUsed
      });
    };
  
    return StorageUsage;
  };