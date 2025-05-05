module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notification', {
      title: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM(
          'storage_alert',
          'payment',
          'subscription',
          'maintenance',
          'announcement',
          'order_cancellation'
        ),
        allowNull: false
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium'
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      tableName: 'notifications',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['is_read'] },
        { fields: ['created_at'] }
      ],
      hooks: {
        beforeCreate: (notification) => {
          if (!notification.expires_at) {
            // Expire après 30 jours par défaut
            notification.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          }
        }
      }
    });
  
    Notification.associate = (models) => {
      Notification.belongsTo(models.User, {
        foreignKey: 'user_id',
        onDelete: 'CASCADE'
      });
    };
  
    // Méthode pour marquer comme lue
    Notification.prototype.markAsRead = function() {
      return this.update({ is_read: true });
    };
  
    // Méthode statique pour les notifications système
    Notification.sendSystemNotification = async (userIds, { title, message, type, priority = 'medium' }) => {
      return await Notification.bulkCreate(
        userIds.map(user_id => ({
          user_id,
          title,
          message,
          type,
          priority,
          metadata: { is_system: true }
        }))
      );
    };
  
    return Notification;
  };