const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Backup = sequelize.define('Backup', {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Sauvegarde manuelle'
    },
    type: {
      type: DataTypes.ENUM('full', 'database', 'files'),
      allowNull: false,
      defaultValue: 'full'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'restoring'),
      allowNull: false,
      defaultValue: 'pending'
    },
    size_mb: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    is_automatic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    restore_point: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    wp_version: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'backups',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      afterCreate: async (backup) => {
        // Mettre à jour la taille du site si c'est une sauvegarde complète
        if (backup.type === 'full' && backup.status === 'completed') {
          await updateWebsiteStorage(backup);
        }
      },
      afterUpdate: async (backup) => {
        // Si le statut passe à COMPLETED, mettre à jour la taille
        if (backup.changed('status') && backup.status === 'completed' && backup.type === 'full') {
          await updateWebsiteStorage(backup);
        }
      }
    }
  });

  // Mise à jour de la taille du site
  const updateWebsiteStorage = async (backup) => {
    if (backup.size_mb) {
      const website = await backup.getWebsite();
      await website.update({
        used_storage_mb: sequelize.literal(`used_storage_mb + ${backup.size_mb}`)
      });
    }
  };

  // Associations
  Backup.associate = (models) => {
    Backup.belongsTo(models.Website, {
      foreignKey: {
        name: 'website_id',
        allowNull: false
      },
      onDelete: 'CASCADE'
    });

    Backup.belongsTo(models.User, {
      foreignKey: {
        name: 'user_id',
        allowNull: false
      }
    });
  };

  // Méthodes statiques
  Backup.cleanupOldBackups = async (websiteId, retentionDays = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    await Backup.destroy({
      where: {
        website_id: websiteId,
        created_at: { [Op.lt]: cutoffDate },
        restore_point: false
      }
    });
  };

  return Backup;
};
