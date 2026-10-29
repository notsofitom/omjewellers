# OM Jewellers

A separate OM Jewellers copy of the jewellery storefront and owner dashboard. It contains the same application pages, local catalogue images, five featured selections, and a snapshot of the nine publicly visible active listings. It has no Git history, local database, original `.env`, owner password, GSTIN, saved bills, or customer enquiries.

## Open in VS Code

Open `D:\OMjewellers` in VS Code.

## Run locally

1. Install Node.js 22 or newer.
2. Copy `.env.example` to `.env` and set the values for OM Jewellers. Keep `.env` private.
3. In the VS Code terminal, run `npm ci`.
4. Generate the local SQLite client and database: `npx prisma generate` then `npx prisma migrate deploy --config prisma.config.ts`.
5. Start with `npm run dev` and open `http://localhost:3000`.

## Deploy to Render without Git

Render's no-Git path runs a prebuilt Docker image from a container registry. The Dockerfile builds the app, runs the PostgreSQL migrations at startup, seeds only the public catalogue snapshot into an empty database, and listens on port `10000`.

1. Install Docker Desktop and sign in to Docker Hub. Create a **private** `om-jewellers` image repository.
2. Build the image with OM Jewellers' public details: `docker build --build-arg NEXT_PUBLIC_SHOP_EMAIL=omub22@gmail.com --build-arg NEXT_PUBLIC_SHOP_WHATSAPP_NUMBER=918878498130 --build-arg "NEXT_PUBLIC_SHOP_CITY=Sarafa Bazar, Katni" -t YOUR_DOCKERHUB_NAME/om-jewellers:1 .`
3. Publish it: `docker push YOUR_DOCKERHUB_NAME/om-jewellers:1`.
4. In the other Render account, create a Web Service with **Existing Image**, enter the private image URL, add its Docker Hub pull credential, and name the service `om-jewellers`.
5. Create a separate PostgreSQL project for OM Jewellers (for example, on Neon's Free plan) and set `DATABASE_PROVIDER=postgresql` and its `DATABASE_URL` in Render. Do not point it at the original shop's database. Render's free Postgres database expires after 30 days, so use a persistent database for saved bills and products.
6. Set `AUTH_SECRET` to a new random value of at least 32 characters. Generate a fresh owner password hash locally with `npm ci` and `node scripts/generate-owner-password-hash.mjs`; type the new password into the hidden prompt and save the printed hash as `OWNER_PASSWORD_HASH` in Render. Never send the password to anyone.
7. Set `SHOP_ENQUIRY_EMAIL=omub22@gmail.com`. Add new Cloudinary, Gemini, and Resend settings if you want those features enabled.
8. Deploy the image. The startup command runs migrations and imports the public products once if the database has no products.

The storefront email, WhatsApp number, and city are baked into the image during build. Pass the shown build arguments again for future image builds. Never copy the original `.env`, its owner password hash, GSTIN, saved bills, or customer enquiries into this project.
