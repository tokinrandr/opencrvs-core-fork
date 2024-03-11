CREATE SCHEMA config;

CREATE TABLE config.languages (
  code text PRIMARY KEY,
  is_default boolean DEFAULT false
);

CREATE TYPE location_status AS enum ('active', 'deactivated');

CREATE TABLE config.administrative_regions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id uuid REFERENCES config.administrative_regions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE config.administrative_regions_translations (
  administrative_structure_id uuid REFERENCES config.administrative_regions(id),
  language_code text REFERENCES config.languages(code),
  translation text NOT NULL
);

CREATE TYPE location_type AS enum ('HEALTH_FACILITY', 'CRVS_OFFICE');

CREATE TABLE config.locations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  administrative_region_id uuid NOT NULL REFERENCES config.administrative_regions(id),
  location_type location_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
