// External model execution is disabled by the founder's explicit AI policy.
// CEO work runs through the connected ChatGPT/Codex coordinator and /api/ceo.
export async function POST(){return Response.json({error:'Other AI providers are disabled. Use Ask CEO for the ChatGPT/Codex coordinator. Enabling another AI requires your explicit request.'},{status:403,headers:{'Cache-Control':'private, no-store'}})}
