import { net, protocol, shell, WindowOpenHandlerResponse } from "electron";
import { readFileSync } from "fs";
import path from "path";
import { showPromptLoadurl } from "./main/Prompts";
import { requestBCAsset } from "./caching/cache";

interface ProtocolSetting {
  urlPrefix: string;
  version: string;
}

async function requestAssetResponse(
  url: string,
  version: string,
  contentType: "image/png" | "text/plain"
) {
  const asset = await requestBCAsset(url, version);
  return new Response(asset, {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": contentType,
      "Content-Length": asset.length.toString(),
    },
  });
}

export function setupProtocol(bcStatus: ProtocolSetting) {
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

  protocol.handle("https", async (request) => {
    if (request.url.startsWith(bcStatus.urlPrefix)) {
      if (request.url.endsWith(".png")) {
        return requestAssetResponse(request.url, bcStatus.version, "image/png");
      } else if (request.url.endsWith(".txt") || request.url.endsWith(".csv")) {
        return requestAssetResponse(
          request.url,
          bcStatus.version,
          "text/plain"
        );
      }
    }
    return net.fetch(request, { bypassCustomProtocolHandlers: true });
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
