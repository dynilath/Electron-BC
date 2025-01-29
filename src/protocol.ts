import { protocol, shell, WindowOpenHandlerResponse } from "electron";
import { readFileSync } from "fs";
import path from "path";
import { showPromptLoadurl } from "./main/Prompts";

export function setupProtocol() {
  protocol.handle("ebc", async (request) => {
    const url = request.url.substring(6);
    const filePath = path.join(__dirname, url);
    try {
      const fileContent = readFileSync(filePath, "utf-8");
      return new Response(fileContent, {
        status: 200,
        headers: { "Content-Type": "application/javascript" },
      });
    } catch (error) {
      return new Response("File not found", { status: 404 });
    }
  });
}

export function windowOpenRequest(url: string): WindowOpenHandlerResponse {
  if (url === "about:blank") {
    return { action: "allow" };
  }

  if (url.endsWith(".user.js")) {
    showPromptLoadurl(url);
    return { action: "deny" };
  }

  shell.openExternal(url);
  return { action: "deny" };
}
