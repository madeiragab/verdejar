-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LightNeed" AS ENUM ('SOL_PLENO', 'MEIA_SOMBRA', 'SOMBRA');

-- CreateEnum
CREATE TYPE "WaterNeed" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "ToxicityLevel" AS ENUM ('NENHUMA', 'BAIXA', 'MODERADA', 'ALTA', 'DESCONHECIDA');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('SUBMITTED', 'RESUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "uf" CHAR(2) NOT NULL,
    "ibge_code" INTEGER NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "region" VARCHAR(20) NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("uf")
);

-- CreateTable
CREATE TABLE "municipalities" (
    "ibge_code" INTEGER NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "state_uf" CHAR(2) NOT NULL,

    CONSTRAINT "municipalities_pkey" PRIMARY KEY ("ibge_code")
);

-- CreateTable
CREATE TABLE "biomes" (
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "description" TEXT,

    CONSTRAINT "biomes_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "species" (
    "id" UUID NOT NULL,
    "scientific_name" VARCHAR(120) NOT NULL,
    "family" VARCHAR(80),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plant_records" (
    "id" UUID NOT NULL,
    "species_id" UUID NOT NULL,
    "municipality_code" INTEGER NOT NULL,
    "biome_code" VARCHAR(20) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "description" TEXT,
    "climate" VARCHAR(200),
    "light" "LightNeed" NOT NULL,
    "water" "WaterNeed" NOT NULL,
    "medicinal_use" TEXT,
    "toxicity_level" "ToxicityLevel" NOT NULL DEFAULT 'DESCONHECIDA',
    "toxicity_notes" TEXT,
    "curiosities" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'PENDING',
    "show_contributor" BOOLEAN NOT NULL DEFAULT false,
    "contributor_id" UUID,
    "search_text" TEXT NOT NULL DEFAULT '',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plant_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "popular_names" (
    "id" UUID NOT NULL,
    "record_id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "position" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "popular_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" UUID NOT NULL,
    "record_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "credit" VARCHAR(200),
    "position" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" UUID NOT NULL,
    "record_id" UUID NOT NULL,
    "citation" VARCHAR(500) NOT NULL,
    "url" VARCHAR(500),
    "position" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "record_id" UUID NOT NULL,
    "actor_id" UUID,
    "action" "ReviewAction" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_sources" (
    "id" VARCHAR(40) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "feed_url" TEXT NOT NULL,
    "site_url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "news_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_items" (
    "id" UUID NOT NULL,
    "source_id" VARCHAR(40) NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "summary" TEXT,
    "image_url" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "states_ibge_code_key" ON "states"("ibge_code");

-- CreateIndex
CREATE INDEX "municipalities_state_uf_name_idx" ON "municipalities"("state_uf", "name");

-- CreateIndex
CREATE UNIQUE INDEX "species_scientific_name_key" ON "species"("scientific_name");

-- CreateIndex
CREATE INDEX "plant_records_status_municipality_code_idx" ON "plant_records"("status", "municipality_code");

-- CreateIndex
CREATE INDEX "plant_records_status_biome_code_idx" ON "plant_records"("status", "biome_code");

-- CreateIndex
CREATE INDEX "plant_records_species_id_idx" ON "plant_records"("species_id");

-- CreateIndex
CREATE INDEX "plant_records_contributor_id_idx" ON "plant_records"("contributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "popular_names_record_id_name_key" ON "popular_names"("record_id", "name");

-- CreateIndex
CREATE INDEX "photos_record_id_idx" ON "photos"("record_id");

-- CreateIndex
CREATE INDEX "sources_record_id_idx" ON "sources"("record_id");

-- CreateIndex
CREATE INDEX "reviews_record_id_created_at_idx" ON "reviews"("record_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "news_items_link_key" ON "news_items"("link");

-- CreateIndex
CREATE INDEX "news_items_published_at_idx" ON "news_items"("published_at");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipalities" ADD CONSTRAINT "municipalities_state_uf_fkey" FOREIGN KEY ("state_uf") REFERENCES "states"("uf") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_records" ADD CONSTRAINT "plant_records_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_records" ADD CONSTRAINT "plant_records_municipality_code_fkey" FOREIGN KEY ("municipality_code") REFERENCES "municipalities"("ibge_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_records" ADD CONSTRAINT "plant_records_biome_code_fkey" FOREIGN KEY ("biome_code") REFERENCES "biomes"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_records" ADD CONSTRAINT "plant_records_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "popular_names" ADD CONSTRAINT "popular_names_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "plant_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "plant_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "plant_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "plant_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_items" ADD CONSTRAINT "news_items_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "news_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
