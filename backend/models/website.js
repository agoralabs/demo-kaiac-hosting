const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Website = sequelize.define('Website', {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Le nom du site est requis'
        },
        len: {
          args: [2, 100],
          msg: 'Le nom doit contenir entre 2 et 100 caractères'
        }
      }
    },
    record: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    domain_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'domains',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    used_storage_mb: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    domain_folder: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    wp_db_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    wp_db_user: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    wp_db_password: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    php_version: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    wp_admin_user: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    wp_admin_user_pwd: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    wp_admin_user_app_pwd: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    wp_version: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_processing_site: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    last_deployed_at: {
      type: DataTypes.DATE
    },
    git_repo_url: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    git_branch: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    git_username: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    git_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    git_folder_path: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    environment: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    git_sync_status: {
      type: DataTypes.ENUM('pending', 'synced', 'error', 'syncing'),
      allowNull: false,
      defaultValue: 'pending'
    },
    git_sync_message: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    wp_zip_location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    wp_db_dump_location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    wp_source_domain: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    installation_method: {
      type: DataTypes.ENUM('standard', 'git', 'zip_and_sql', 'copy', 'push', 'maintenance', 'cache', 'restore'),
      allowNull: false,
      defaultValue: 'standard'
    },
    ftp_user: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ftp_pwd: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ftp_host: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ftp_port: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_lscache_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_maintenance_mode_enabled: {
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
    tableName: 'websites',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      afterCreate: async (website) => {
        // Mettre à jour l'utilisation du stockage
        await updateStorageUsage(website);
      },
      afterUpdate: async (website) => {
        // Mettre à jour si le stockage a changé
        if (website.changed('used_storage_mb')) {
          await updateStorageUsage(website);
        }
      }
    }
  });

  // Méthode pour mettre à jour l'utilisation globale
  const updateStorageUsage = async (website) => {
    const totalUsage = await Website.sum('used_storage_mb', {
      where: { 
        subscription_id: website.subscription_id,
        is_active: true
      }
    });

    await sequelize.models.StorageUsage.create({
      user_id: website.user_id,
      subscription_id: website.subscription_id,
      measured_at: new Date(),
      used_storage_mb: totalUsage
    });
  };

  // Associations
  Website.associate = (models) => {
    Website.belongsTo(models.User, {
      foreignKey: {
        name: 'user_id',
        allowNull: false
      },
      onDelete: 'CASCADE'
    });

    Website.belongsTo(models.Subscription, {
      foreignKey: {
        name: 'subscription_id',
        allowNull: false
      }
    });

    Website.belongsTo(models.Domain, {
      foreignKey: {
        name: 'domain_id',
        allowNull: false
      }
    });

  
    // Backups
    Website.hasMany(models.Backup, {
      foreignKey: 'website_id',
      as: 'backups'
    });

    Website.hasOne(models.BackupSettings, {
      foreignKey: 'website_id',
      as: 'backup_settings'
    });

  };


  // Méthodes d'instance
  Website.prototype.getStorageUsagePercentage = async function() {
    const subscription = await this.getSubscription();
    return Math.min(
      Math.round((this.used_storage_mb / subscription.Plan.included_storage_mb) * 100),
      100
    );
  };

  // Méthodes statiques
  Website.checkDomainAvailability = async (domain) => {
    const existing = await Website.findOne({
      where: {
        domain: {
          [Op.iLike]: domain
        }
      }
    });
    return !existing;
  };

  return Website;
};