module.exports = (sequelize, DataTypes) => {
    const SubscriptionHistory = sequelize.define('SubscriptionHistory', {
      event_type: {
        type: DataTypes.ENUM(
          'creation',
          'upgrade',
          'downgrade',
          'renewal',
          'cancellation',
          'payment_failed',
          'suspension',
          'reactivation'
        ),
        allowNull: false
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
      },
      changed_by: {
        type: DataTypes.ENUM('user', 'admin', 'system'),
        allowNull: false
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true
      }
    }, {
      tableName: 'subscription_history',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['subscription_id']
        },
        {
          fields: ['created_at']
        }
      ]
    });
  
    SubscriptionHistory.associate = (models) => {
      SubscriptionHistory.belongsTo(models.Subscription, {
        foreignKey: 'subscription_id',
        onDelete: 'CASCADE'
      });
      
      SubscriptionHistory.belongsTo(models.User, {
        foreignKey: 'admin_id',
        as: 'Admin',
        onDelete: 'SET NULL'
      });
      
      SubscriptionHistory.belongsTo(models.Plan, {
        foreignKey: 'old_plan_id',
        as: 'OldPlan',
        onDelete: 'SET NULL'
      });
      
      SubscriptionHistory.belongsTo(models.Plan, {
        foreignKey: 'new_plan_id',
        as: 'NewPlan',
        onDelete: 'SET NULL'
      });
    };
  
    // Méthode pour enregistrer un événement
    SubscriptionHistory.recordEvent = async (
      subscriptionId,
      eventType,
      {
        oldPlanId = null,
        newPlanId = null,
        adminId = null,
        changedBy = 'system',
        metadata = {},
        ipAddress = null
      } = {}
    ) => {
      return await SubscriptionHistory.create({
        subscription_id: subscriptionId,
        event_type: eventType,
        old_plan_id: oldPlanId,
        new_plan_id: newPlanId,
        admin_id: adminId,
        changed_by: changedBy,
        metadata,
        ip_address: ipAddress
      });
    };
  
    return SubscriptionHistory;
  };