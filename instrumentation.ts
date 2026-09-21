export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NODE_ENV !== "development"
  )
    return;

  const fs = await import("fs");
  const { execSync } = await import("child_process");
  const { Agent, setGlobalDispatcher } = await import("undici");
  const caRoot = execSync("mkcert -CAROOT").toString().trim();
  const ca = fs.readFileSync(`${caRoot}/rootCA.pem`);
  setGlobalDispatcher(new Agent({ connect: { ca } }));
}
