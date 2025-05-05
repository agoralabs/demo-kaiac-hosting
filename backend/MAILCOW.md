# Test delete domain command

curl -X POST https://mail.skyscaledev.com/api/v1/delete/domain \
  -H "X-API-Key: C28D4F-2ABA7C-D8581D-EDCC97-11692B" \
  -H "Content-Type: application/json" \
  -d '{"domain":"kaiac.io"}'

# Test create mailbox

curl -X POST "https://mail.skyscaledev.com/api/v1/add/mailbox" \
  -H "X-API-Key: C28D4F-2ABA7C-D8581D-EDCC97-11692B" \
  -H "Content-Type: application/json" \
  -d '{"local_part":"joseph","domain":"kaiac.io","password":"123456789","password2":"123456789","active":1,"name":"joseph","quota":3072,"force_pw_update":1,"tls_enforce_in":1,"tls_enforce_out":1,"description":"Créé via AWS Lambda"}'

## Tous les paramètres de création de la mailbox
{"force_pw_update":["0","1"],"sogo_access":["0","1"],"protocol_access":["0","imap","pop3","smtp","sieve"],"authsource":"mailcow","local_part":"joseph","name":"Joseph","domain":"kaiac.io","password":"91,IVeRmU,_","password2":"91,IVeRmU,_","tags":"","quota":"3072","quarantine_notification":"hourly","quarantine_category":"reject","tls_enforce_in":"1","tls_enforce_out":"1","acl":["spam_alias","tls_policy","spam_score","spam_policy","delimiter_action","eas_reset","pushover","quarantine","quarantine_attachments","quarantine_notification","quarantine_category","app_passwds","pw_reset"],"rl_value":"","rl_frame":"s","active":"1"}


# Générer la clé d'API

Aller dans Système > Configuration et Déplier le volet API
https://mail.skyscaledev.com/admin/system

Autoriser le CIDR 0.0.0.0/0

Activer l'API