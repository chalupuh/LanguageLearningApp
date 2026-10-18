declare module "cloudflare:workers" {
  export const env: {
    DB: import("../worker-configuration").D1Database;
    BUCKET?: import("../worker-configuration").R2Bucket;
  };
}
