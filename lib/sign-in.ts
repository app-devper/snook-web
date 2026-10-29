import { exchangeTicket, getSystem } from "@/lib/um-api";
import { removeToken, setSnookApiHost, setToken } from "@/lib/auth";

export const SYSTEM_CODE = "SNOOK";

/** Finishes signing in with a UM token for SNOOK: keeps it and where the Snook API lives. */
export async function startSnookSession(token: string): Promise<void> {
  setToken(token);
  try {
    const sys = await getSystem();
    if (sys.systemCode !== SYSTEM_CODE) throw new Error(`This sign-in is for ${sys.systemCode}, not ${SYSTEM_CODE}`);
    setSnookApiHost(sys.host);
  } catch (e) {
    removeToken();
    throw e;
  }
}

/**
 * Signs in with the one-time ticket UM put in the address when the user
 * opened Snook from UM (um-api ADR-0011); any earlier session here ends first.
 */
export async function continueFromUm(ticket: string): Promise<void> {
  removeToken();
  const res = await exchangeTicket(ticket);
  await startSnookSession(res.accessToken);
}
