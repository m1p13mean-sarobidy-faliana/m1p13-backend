import { defineConfig } from "@kubb/core";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginZod } from "@kubb/plugin-zod";
import { pluginOas } from "@kubb/plugin-oas";

export default defineConfig({
  root: ".",
  input: {
    path: "../docs/api.yml",
  },
  output: {
    path: "./gen",
    clean: true,
  },
  plugins: [
    pluginOas(),
    pluginZod({
      output: {
        path: "./zod", // Répertoire où les schémas Zod seront générés
      },
      group: { type: "tag" }, // Regroupement par tag
      coercion: true, // Active la coercition des types
      unknownType: "any", // Type pour les valeurs inconnues
      dateType: "date", // Type pour les dates
    }),
    pluginTs(),
  ],
});
