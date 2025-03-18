/*
Rules:
- Each migration is represented by a separate SQL file.
- The file name follows the format YYYYMMDDHHMMSS_migration_name.sql, where YYYYMMDDHHMMSS is the timestamp of the migration and migration_name is a descriptive name for the migration.
- The SQL statements for the migration are written in the corresponding SQL file.

This SQL script creates tables, defines row-level security policies, functions, triggers, and grants permissions for a database schema.
The script performs the following actions:
- Creates tables: profiles, tasks
- Creates functions: is_admin, is_user, handle_new_user, handle_updated_user
- Defines row-level security policies for the tables
- Creates triggers: handle_updated_at, on_auth_user_created, on_auth_user_updated
- Grants permissions to roles: postgres, anon, authenticated, service_role
*/
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET default_tablespace = '';
SET default_table_access_method = "heap";

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "public";

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

----- DEFINE TABLES -----

-- Profiles Table
CREATE TABLE IF NOT EXISTS "public"."profiles" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "email" character varying NOT NULL,
  "confirmed_at" timestamp with time zone,
  "email_confirmed_at" timestamp with time zone,
  "last_sign_in_at" timestamp with time zone,
  "role" character varying NOT NULL,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "deleted_at" timestamp with time zone
);

ALTER TABLE "public"."profiles" OWNER TO "postgres";
ALTER TABLE ONLY "public"."profiles"
  ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

-- Task Table --
CREATE TABLE IF NOT EXISTS "public"."tasks" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "title" character varying NOT NULL,
  "description" character varying,
  "status" character varying NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  "user_id" "uuid" NOT NULL,
  "parent_id" "uuid",
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "deleted_at" timestamp with time zone
);

ALTER TABLE "public"."tasks" OWNER TO "postgres";
ALTER TABLE ONLY "public"."tasks"
  ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."tasks"
  ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY "public"."tasks"
  ADD CONSTRAINT "tasks_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."tasks"("id") ON UPDATE CASCADE ON DELETE CASCADE;

-- Table Indexes
CREATE INDEX "user_email_idx" ON "public"."profiles" ("email");
CREATE INDEX "tasks_user_id_idx" ON "public"."tasks" ("user_id");
CREATE INDEX "tasks_parent_id_idx" ON "public"."tasks" ("parent_id");

-- Table Constraints --

ALTER TABLE "public"."profiles" ADD CONSTRAINT "email_unique" UNIQUE ("email");

----- DEFINE FUNCTIONS -----
/**
 * Function: is_admin
 * Description: This function checks if the user is an admin.
 * Returns: BOOLEAN - true if the user is an admin, false otherwise.
 */
CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS BOOLEAN
  LANGUAGE SQL
  AS $$
    SELECT ((((auth.jwt())::json -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text)
  $$;
ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";

/*
* Checks if the user is a user.
*
* @return Returns true if the user is a user, otherwise false.
*/
CREATE OR REPLACE FUNCTION "public"."is_user"() RETURNS BOOLEAN
  LANGUAGE SQL
  AS $$
    SELECT ((((auth.jwt())::json -> 'user_metadata'::text) ->> 'role'::text) = 'user'::text)
  $$;
ALTER FUNCTION "public"."is_user"() OWNER TO "postgres";

-- Function: public.handle_new_user()
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
  LANGUAGE "plpgsql" SECURITY DEFINER
  AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    created_at,
    updated_at,
    email,
    role
  )
  VALUES (
    new.id,
    new.created_at,
    new.updated_at,
    new.email,
    new.raw_user_meta_data ->> 'role'
  );
  RETURN new;
END;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

-- Function: public.handle_updated_user()
CREATE OR REPLACE FUNCTION "public"."handle_updated_user"() RETURNS "trigger"
  LANGUAGE "plpgsql" SECURITY DEFINER
  AS $$
BEGIN
  UPDATE public.profiles
  SET
    email = new.email,
    role = new.raw_user_meta_data ->> 'role',
    confirmed_at =
      CASE
        WHEN new.confirmed_at IS NOT NULL THEN new.confirmed_at
        ELSE NULL
      END,
    email_confirmed_at =
      CASE
        WHEN new.email_confirmed_at IS NOT NULL THEN new.email_confirmed_at
        ELSE NULL
      END,
    updated_at =
      CASE
        WHEN new.updated_at IS NOT NULL THEN new.updated_at
        ELSE NULL
      END,
    last_sign_in_at =
      CASE
        WHEN new.last_sign_in_at IS NOT NULL THEN new.last_sign_in_at
        ELSE NULL
      END
  WHERE id = new.id;

  RETURN new;
END;
$$;

ALTER FUNCTION "public"."handle_updated_user"() OWNER TO "postgres";

----- DEFINE RLS -----
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read data
CREATE POLICY "all_users_can_read_tasks" ON "public"."tasks"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "all_users_can_read_profiles" ON "public"."profiles"
FOR SELECT
TO authenticated
USING (true);

-- Only admin can insert tasks --
CREATE POLICY "only_admin_can_insert" ON "public"."tasks"
FOR INSERT
TO authenticated
WITH CHECK ("public"."is_admin"());

-- Only admin can update tasks --
CREATE POLICY "only_admin_can_update" ON "public"."tasks"
FOR UPDATE
TO authenticated
USING ("public"."is_admin"());

-- Only admin can delete tasks --
CREATE POLICY "only_admin_can_delete" ON "public"."tasks"
FOR DELETE
TO authenticated
USING ("public"."is_admin"());

---- DEFINE TRIGGERS ----
CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."profiles"
FOR EACH ROW
EXECUTE FUNCTION "public"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users"
FOR EACH ROW
EXECUTE FUNCTION "public"."handle_new_user"();

CREATE OR REPLACE TRIGGER "on_auth_user_updated" AFTER UPDATE ON "auth"."users"
FOR EACH ROW
EXECUTE FUNCTION "public"."handle_updated_user"();

----- ADD PERMISSIONS -----
-- Schema
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

-- Function
GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_updated_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_user"() TO "service_role";

GRANT ALL ON FUNCTION "public"."moddatetime"() TO "postgres";
GRANT ALL ON FUNCTION "public"."moddatetime"() TO "anon";
GRANT ALL ON FUNCTION "public"."moddatetime"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."moddatetime"() TO "service_role";

-- Table
GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";

GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;