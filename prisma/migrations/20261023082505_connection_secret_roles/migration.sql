-- Name each secret env var by its role instead of its position in a list, so
-- readers never depend on order. Rows that are already objects are left alone.

UPDATE "Connection"
SET "secretEnvVars" = jsonb_build_object('token', "secretEnvVars"->>0)
WHERE "provider" = 'META' AND jsonb_typeof("secretEnvVars") = 'array';

UPDATE "Connection"
SET "secretEnvVars" = jsonb_build_object('propertyId', "secretEnvVars"->>0)
WHERE "provider" = 'GA4' AND jsonb_typeof("secretEnvVars") = 'array';

UPDATE "Connection"
SET "secretEnvVars" = jsonb_build_object('apiKey', "secretEnvVars"->>0)
WHERE "provider" = 'KLAVIYO' AND jsonb_typeof("secretEnvVars") = 'array';

UPDATE "Connection"
SET "secretEnvVars" = jsonb_build_object(
  'url', "secretEnvVars"->>0,
  'key', "secretEnvVars"->>1,
  'secret', "secretEnvVars"->>2
)
WHERE "provider" = 'WOOCOMMERCE' AND jsonb_typeof("secretEnvVars") = 'array';

UPDATE "Connection"
SET "secretEnvVars" = jsonb_build_object(
  'url', "secretEnvVars"->>0,
  'clientId', "secretEnvVars"->>1,
  'clientSecret', "secretEnvVars"->>2
)
WHERE "provider" = 'SHOPIFY' AND jsonb_typeof("secretEnvVars") = 'array';

UPDATE "Connection"
SET "secretEnvVars" = jsonb_build_object(
  'clientId', "secretEnvVars"->>0,
  'clientSecret', "secretEnvVars"->>1,
  'refreshToken', "secretEnvVars"->>2,
  'loginCustomerId', "secretEnvVars"->>3
)
WHERE "provider" = 'GOOGLE_ADS' AND jsonb_typeof("secretEnvVars") = 'array';
