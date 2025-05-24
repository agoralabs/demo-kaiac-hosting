Pour permettre à Redis d'accepter des connexions distantes, vous devez modifier sa configuration. Voici les étapes à suivre :

### 1. **Modifier le fichier de configuration Redis**
Ouvrez le fichier `redis.conf` (généralement situé dans `/etc/redis/redis.conf` ou `/etc/redis.conf`).

Cherchez et modifiez les directives suivantes :

```ini
# Écouter sur toutes les interfaces réseau (par défaut, Redis n'écoute que sur 127.0.0.1)
bind 0.0.0.0

# Désactiver le mode protégé (pour autoriser les connexions distantes)
protected-mode no
```

### 2. **Configurer le pare-feu (si nécessaire)**
Si un pare-feu (comme `ufw` ou `iptables`) est activé, autorisez le port Redis (par défaut `6379`) :

#### **Avec `ufw` (Ubuntu)**
```sh
sudo ufw allow 6379
```

#### **Avec `iptables`**
```sh
sudo iptables -A INPUT -p tcp --dport 6379 -j ACCEPT
```

### 3. **Redémarrer Redis**
Appliquez les changements en redémarrant Redis :

```sh
sudo systemctl restart redis-server  # Sur systemd (Ubuntu/Debian/CentOS)
# ou
sudo service redis restart          # Sur les anciennes versions
```

### 4. **Vérifier l'écoute des connexions**
Vérifiez que Redis écoute bien sur toutes les interfaces :

```sh
ss -tulnp | grep 6379
# ou
netstat -tulnp | grep 6379
```

Le résultat devrait montrer `0.0.0.0:6379` ou `*:6379`.

### 5. **Se connecter à Redis depuis une machine distante**
Depuis un autre ordinateur, essayez :

```sh
redis-cli -h <IP_DU_SERVEUR_REDIS> -p 6379
```

### **⚠ Sécurité importante ⚠**
- **Protégez Redis avec un mot de passe** (`requirepass` dans `redis.conf`).
- **Utilisez un VPN ou un tunnel SSH** pour sécuriser l'accès.
- **Restreignez les IP autorisées** avec un pare-feu (`iptables -A INPUT -p tcp --dport 6379 -s <IP_AUTORISÉE> -j ACCEPT`).

### **Alternative : Tunnel SSH (plus sécurisé)**
Si vous ne voulez pas exposer Redis directement :
```sh
ssh -L 6379:localhost:6379 utilisateur@serveur_redis
```
Puis connectez-vous en local :
```sh
redis-cli -h 127.0.0.1 -p 6379
```

Avez-vous besoin d'aide pour une configuration spécifique (comme Redis sous Docker ou sur un cloud) ? 🚀