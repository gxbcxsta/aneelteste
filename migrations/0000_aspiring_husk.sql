CREATE TABLE "cpf_restituicoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"cpf" varchar(11) NOT NULL,
	"valor_restituicao" numeric(10, 2) NOT NULL,
	"data_criacao" text NOT NULL,
	CONSTRAINT "cpf_restituicoes_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
