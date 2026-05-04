# Configuration: Rôle "Charge d'Étude" pour Interface Technique

## 📋 Résumé des Changements Frontend

Le système a été configuré pour supporter le rôle **"Charge d'Étude"** avec accès dédié à l'interface d'examen technique. Voici ce qui a été mis en place :

### Fichiers Créés
1. **`src/pages/ChargeEtudeLoginPage.js`** - Page de connexion pour charge d'étude
2. **`src/pages/charge-etude/ChargeEtudeDashboard.js`** - Tableau de bord charge d'étude avec interface technique

### Fichiers Modifiés
1. **`src/App.js`** - Ajout des routes :
   - `/charge-etude-login` → ChargeEtudeLoginPage
   - `/charge-etude/dashboard` → ChargeEtudeDashboard

2. **`src/pages/LoginPage.js`** - Ajout du lien vers page de connexion charge d'étude

3. **`src/pages/AdminloginPage.js`** - Ajout du lien vers page de connexion charge d'étude

---

## 🔧 Configuration Backend Requise

### 1️⃣ Mise à Jour de la Base de Données

**Ajouter "charge-etude" ou "charge d'étude" au type ENUM des rôles** :

```sql
-- Option 1 : Si possible de recréer le type
ALTER TYPE public.enum_users_role ADD VALUE 'charge-etude' BEFORE 'client';

-- OU

-- Option 2 : Via migration
CREATE TYPE public.enum_users_role_new AS ENUM ('admin', 'charge-etude', 'client');

ALTER TABLE public.users 
  ALTER COLUMN role TYPE public.enum_users_role_new 
  USING role::text::public.enum_users_role_new;

DROP TYPE public.enum_users_role;
ALTER TYPE public.enum_users_role_new RENAME TO enum_users_role;
```

**Mettre à jour la contrainte CHECK** :

```sql
ALTER TABLE public.users DROP CONSTRAINT users_role_check;

ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'charge-etude', 'client'));
```

### 2️⃣ Créer Utilisateur Test (Optionnel)

```sql
INSERT INTO public.users (username, email, password_hash, role, company_name, created_at)
VALUES (
  'charge_etude_test',
  'chargedetude@ancs.tn',
  '$2b$10$...',  -- Hash bcrypt d'un mot de passe
  'charge-etude',
  'ANCS',
  NOW()
);
```

### 3️⃣ Vérifier l'API d'Authentification

L'endpoint `/auth/login` doit :
- Accepter `username` OU `email`
- Retourner le rôle de l'utilisateur
- Supporter le rôle `"charge-etude"` ou `"charge d'étude"`

**Exemple de réponse** :

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 3,
    "username": "charge_etude_test",
    "email": "chargedetude@ancs.tn",
    "role": "charge-etude"
  }
}
```

---

## 🚀 Accès aux Interfaces

### Connexion Client (Public)
- **URL** : http://localhost:3000/
- **Accès** : Utilisateurs avec rôle `"client"`
- **Destination après login** : `/client/dashboard`

### Connexion Administrateur (Sécurisée)
- **URL** : http://localhost:3000/secure-access
- **Accès** : Utilisateurs avec rôle `"admin"`
- **Destination après login** : `/admin/dashboard`

### Connexion Charge d'Étude (Nouvelle)
- **URL** : http://localhost:3000/charge-etude-login
- **Accès** : Utilisateurs avec rôle `"charge-etude"`
- **Destination après login** : `/charge-etude/dashboard`
- **Contenu** : Interface d'examen technique des audits

---

## 📝 Notes Importantes

1. **Vérification de Rôle** : Le frontend vérifie que le rôle contient (insensible à la casse) :
   - `"charge d'étude"` OU
   - `"charge-etude"`

2. **Isolation des Rôles** : Chaque rôle est isolé à sa propre interface et ne peut pas accéder à celle d'autres rôles.

3. **Interface Technique** : Accessible uniquement via le tableau de bord charge d'étude (`/charge-etude/dashboard`)

4. **Authentification** : Utilise JWT avec token stocké dans `localStorage`

---

## ✅ Checklist d'Implémentation

- [ ] Mise à jour du type ENUM dans la base de données
- [ ] Mise à jour de la contrainte CHECK
- [ ] Création d'au moins un utilisateur test avec rôle `charge-etude`
- [ ] Test de connexion sur `/charge-etude-login`
- [ ] Vérification que la redirection vers `/charge-etude/dashboard` fonctionne
- [ ] Vérification que l'interface technique s'affiche correctement
- [ ] Test de déconnexion

---

## 🔗 Routes Disponibles

| Route | Rôle | Composant | Description |
|-------|------|-----------|-------------|
| `/` | Tous | LoginPage | Connexion client |
| `/register` | Public | RegisterPage | Inscription |
| `/secure-access` | Admin | AdminLoginPage | Connexion admin |
| `/charge-etude-login` | Charge d'Étude | ChargeEtudeLoginPage | Connexion charge d'étude |
| `/client/dashboard` | Client | AuditForm | Tableau de bord client |
| `/admin/dashboard` | Admin | AdminDashboard | Tableau de bord admin |
| `/charge-etude/dashboard` | Charge d'Étude | ChargeEtudeDashboard | Tableau de bord charge d'étude |
| `/technical-review` | - | TechnicalReviewInterface | Interface technique (accessible via charge d'étude) |

---

## 🆘 Troubleshooting

**Problème** : "Accès réservé aux Chargés d'Étude"
- **Solution** : Vérifier que l'utilisateur a le rôle `"charge-etude"` en base de données

**Problème** : Redirection vers `/` après connexion
- **Solution** : Vérifier que le JWT est valide et que l'utilisateur a le bon rôle

**Problème** : Page blanche après connexion
- **Solution** : Vérifier la console du navigateur pour les erreurs, vérifier que TechnicalReviewInterface se charge correctement

---

## 📞 Support

Pour questions : contactez l'équipe de développement ANCS
