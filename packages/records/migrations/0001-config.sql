CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA config;

CREATE TABLE config.languages (
  code text PRIMARY KEY,
  is_default boolean DEFAULT false
);

-- allow only one default language
CREATE UNIQUE INDEX idx_unique_default_language ON config.languages (is_default)
WHERE
  is_default = true;

CREATE TYPE location_status AS enum ('active', 'deactivated');

CREATE TABLE config.administrative_regions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id uuid REFERENCES config.administrative_regions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE config.administrative_regions_translations (
  administrative_region_id uuid REFERENCES config.administrative_regions(id),
  language_code text REFERENCES config.languages(code),
  translation text NOT NULL
);

CREATE TABLE config.health_facilities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  administrative_region_id uuid NOT NULL REFERENCES config.administrative_regions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE config.crvs_offices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  administrative_region_id uuid NOT NULL REFERENCES config.administrative_regions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
