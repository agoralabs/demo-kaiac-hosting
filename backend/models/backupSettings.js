module.exports = (sequelize, DataTypes) => {
    const BackupSettings = sequelize.define('BackupSettings', {
      frequency: {
        type: DataTypes.ENUM('hourly', 'daily', 'weekly', 'monthly', 'none'),
        allowNull: false,
        defaultValue: 'weekly'
      },
      retention_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
        validate: {
          min: 1,
          max: 365
        }
      },
      max_backups: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1
        }
      },
      include_database: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      include_files: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      backup_time: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: '02:00:00'
      },
      day_of_week: {
        type: DataTypes.INTEGER, // 0-6 (dimanche-samedi)
        allowNull: true,
        validate: {
          min: 0,
          max: 6
        }
      },
      day_of_month: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 28
        }
      },
      last_run_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      next_run_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      notify_on_failure: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      notify_email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true
        }
      }
    }, {
      tableName: 'backup_settings',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeSave: (settings) => {
          // Calculer la prochaine date d'exécution
          if (settings.changed('frequency') || settings.changed('backup_time')) {
            settings.next_run_at = calculateNextRun(settings);
          }
        }
      }
    });
  
    // Calcul de la prochaine date d'exécution
    const calculateNextRun = (settings) => {
      const now = new Date();
      const nextRun = new Date();
      const [hours, minutes] = settings.backup_time.split(':').map(Number);
  
      nextRun.setHours(hours, minutes, 0, 0);
  
      switch (settings.frequency) {
        case 'hourly':
          if (nextRun <= now) nextRun.setHours(nextRun.getHours() + 1);;
          break;
        case 'daily':
          if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + ((7 - nextRun.getDay() + settings.day_of_week) % 7 || 7));
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1, settings.day_of_month);
          break;
        default:
          return null;
      }
  
      return nextRun;
    };
  
    // Associations
    BackupSettings.associate = (models) => {
      BackupSettings.belongsTo(models.Website, {
        foreignKey: {
          name: 'website_id',
          allowNull: false,
          unique: true
        },
        onDelete: 'CASCADE'
      });
    };
  
    return BackupSettings;
  };
