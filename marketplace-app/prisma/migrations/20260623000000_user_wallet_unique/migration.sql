-- Enforce one wallet per account (defense-in-depth behind the app-level check).
-- NULLs are allowed to repeat in Postgres, so accounts without a wallet are fine.
-- NOTE: if any two rows already share a non-null walletAddress this will fail;
-- de-duplicate before applying.
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
