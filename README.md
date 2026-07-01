# Rijmt op Loos

Een mini-website over meneer Loos met:
1. een random woord dat rijmt op "Loos";
2. een random oneliner van Loos;
3. een gedicht voor zijn speculoosje;
4. reviews en suggesties die iedereen kan achterlaten en zien.

Een gekozen woord/oneliner komt de eerstvolgende 20 beurten niet meer terug.

## Lokaal draaien

```bash
npm install
npm run dev
```

Open daarna http://localhost:4321

De reviews en suggesties werken lokaal niet zonder KV (zie hieronder), je krijgt dan een foutmeldinkje in de lijst. Dat is normaal.

## Deployen op Cloudflare

Dit is een statische site met twee kleine server-functies (in `functions/api`) voor de reviews en suggesties.

**Via GitHub:**
1. Zet deze map in een GitHub repo.
2. Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git.
3. Build command: `npm run build`, Output directory: `dist`.
4. Save and Deploy.

**Direct uploaden:**
1. `npm install && npm run build`
2. Cloudflare dashboard > upload de `dist` map.

Let op: bij "direct uploaden" moet je ook de map `functions` mee uploaden, anders werkt de reviews/suggesties-knop niet. Bij deployen via GitHub gebeurt dit automatisch.

## Reviews en suggesties instellen (eenmalig)

De reviews en suggesties worden gedeeld opgeslagen zodat iedereen dezelfde lijst ziet, via een gratis Cloudflare KV namespace. Dit moet je één keer instellen:

1. Ga in het Cloudflare dashboard naar je Pages-project.
2. Ga naar Settings > Functions > KV namespace bindings.
3. Maak een nieuwe KV namespace aan, bijvoorbeeld met de naam `loos-kv`.
4. Voeg een binding toe met variabelenaam `LOOS_KV`, gekoppeld aan die namespace.
5. Herdeploy de site (Deployments > laatste deployment > Retry deployment volstaat).

Wil je liever met `wrangler` werken? Vul dan de namespace-id in bij `wrangler.toml`, die kun je opvragen met:

```bash
npx wrangler kv namespace create LOOS_KV
```

Zonder deze stap blijft de rest van de site gewoon werken, alleen de reviews en suggesties tonen dan een foutmelding.

## Inhoud aanpassen

Bovenaan in `src/pages/index.astro` staan de lijsten `woorden` en `oneliners`.

