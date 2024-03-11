CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA auth;

CREATE TABLE auth.system_roles (
  id text PRIMARY KEY,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO
  auth.system_roles (id)
VALUES
  ('FIELD_AGENT'),
  ('REGISTRATION_AGENT'),
  ('LOCAL_REGISTRAR'),
  ('LOCAL_SYSTEM_ADMIN'),
  ('NATIONAL_SYSTEM_ADMIN'),
  ('PERFORMANCE_MANAGEMENT'),
  ('NATIONAL_REGISTRAR');

CREATE TABLE auth.scopes (id text PRIMARY KEY);

INSERT INTO
  auth.scopes (id)
VALUES
  ('demo'),
  ('declare'),
  ('register'),
  ('certify'),
  ('performance'),
  ('sysadmin'),
  ('validate'),
  ('natlsysadmin'),
  ('bypassratelimit'),
  ('teams'),
  ('config');

CREATE TABLE auth.user_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
);

CREATE TABLE auth.user_role_translations (
  user_role_id uuid REFERENCES auth.user_roles(id),
  language_code text NOT NULL REFERENCES config.languages(code),
  translation text NOT NULL
);

CREATE TABLE auth.system_roles_user_roles (
  system_role_id text REFERENCES auth.system_roles(id),
  scope_id text REFERENCES auth.scopes(id),
  PRIMARY KEY (system_role_id, scope_id)
);

CREATE TYPE user_status AS ENUM ('active', 'deactivated');

CREATE TABLE auth.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name jsonb NOT NULL,
  email text NOT NULL,
  mobile text NOT NULL,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  system_role text REFERENCES auth.system_roles(id),
  role uuid REFERENCES auth.user_roles(id),
  primary_office_id uuid REFERENCES config.locations(id),
  status user_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth.users_scopes (
  user_id uuid REFERENCES auth.users(id),
  scope_id text REFERENCES auth.scopes(id),
  PRIMARY KEY (user_id, scope_id)
);

-- CREATE TABLE auth.records (
--  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
--  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
--  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
--  created_by uuid NOT NULL REFERENCES users(id)
-- );
-- CREATE SCHEMA records;
-- CREATE TABLE locations ();
-- CREATE TABLE task ()
